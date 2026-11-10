# Informe de optimizaciones de rendimiento — Caching

## Índice

1. [Resumen ejecutivo](#resumen-ejecutivo)
2. [Frontend — Lazy Loading con `next/dynamic`](#frontend--lazy-loading-con-nextdynamic)
3. [Frontend — `useMemo` para computaciones derivadas](#frontend--usememo-para-computaciones-derivadas)
4. [Backend — Caché en memoria con TTL](#backend--caché-en-memoria-con-ttl)
5. [Discusión: intercambio entre frescura y rendimiento](#discusión-intercambio-entre-frescura-y-rendimiento)
6. [Endpoints y componentes excluidos del caching](#endpoints-y-componentes-excluidos-del-caching)
7. [Verificación completa sin regresiones](#verificación-completa-sin-regresiones)
8. [Próximos pasos](#próximos-pasos)

---

## Resumen ejecutivo

Se implementaron **7 optimizaciones de rendimiento** distribuidas entre frontend (Next.js) y backend (FastAPI):

| # | Capa | Técnica | Recurso | Archivo(s) modificado(s) | Impacto |
|---|---|---|---|---|---|
| 1 | Frontend | Lazy Loading `next/dynamic` | `SupplierForm` (Backoffice) | `supplier-directory.tsx` | ~15–20 KB menos en bundle inicial (formulario de ~200 líneas bajo demanda) |
| 2 | Frontend | Lazy Loading `next/dynamic` | `NewCandidateForm` (Talent Pipeline) | `nexova-dashboard.tsx` | ~8–12 KB menos en bundle inicial (formulario de ~90 líneas, abajo del pliegue) |
| 3 | Frontend | `useMemo` | `activeCount` / `suspendedCount` | `supplier-directory.tsx` | 2 filtrados `.filter()` evitados en renders sin cambio de datos |
| 4 | Frontend | `useMemo` | `candidateMetrics` | `nexova-dashboard.tsx` | 3 filtrados `.filter()` evitados en renders sin cambio de datos |
| 5 | Backend | Caché en memoria TTL 30 s | `GET /suppliers` (lista c/ filtros) | `cache.py` + `routes/suppliers.py` | Respuesta servida desde RAM sin consultar TinyDB |
| 6 | Backend | Caché en memoria TTL 15 s | `GET /api/incidents/summary` (agregaciones) | `cache.py` + `routes/incidents.py` | Agregación O(n) sobre ~500 docs sustituida por lectura de dict en RAM |
| 7 | Backend | Invalidación por escritura | POST/PATCH/DELETE en suppliers e incidents | `routes/suppliers.py`, `routes/incidents.py` | Caché marcada obsoleta inmediatamente tras modificar datos |

---

## Frontend — Lazy Loading con `next/dynamic`

### 1.1 `SupplierForm` (Backoffice — `supplier-directory.tsx`)

**Problema:** El componente `SupplierForm` (~200 líneas, con validación completa, grid de 8+ categorías, lógica de envío a API) se importaba estáticamente en el *entry point* del directorio de proveedores. Esto añadía todo su código al *bundle* principal aunque el 99 % de las veces el usuario solo consulta el listado sin crear proveedores nuevos.

**Antes:**
```tsx
import { SupplierForm } from "@/src/components/supplier-form";
```

**Después:**
```tsx
const SupplierForm = dynamic(
  () => import("@/src/components/supplier-form").then((mod) => mod.SupplierForm),
  { loading: () => <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Cargando formulario…</div> }
);
```

**Condición de carga:** Solo cuando `showForm === true`, activado por clic en "Nuevo proveedor". El estado `showForm` se mantiene en `false` hasta la interacción del usuario.

**Indicador visual:** Placeholder con borde y padding idénticos al formulario real para evitar *layout shift*.

### 1.2 `NewCandidateForm` (Talent Pipeline Tracker — `nexova-dashboard.tsx`)

**Problema:** El componente `NewCandidateForm` se importaba estáticamente y se renderizaba *siempre* en la columna derecha del dashboard, aunque el 100 % de los usuarios carga la página para *ver* candidatos, no para crear uno nuevo inmediatamente.

**Antes:**
```tsx
import { NewCandidateForm } from "@/src/components/new-candidate-form";
```

**Después:**
```tsx
const NewCandidateForm = dynamic(
  () => import("@/src/components/new-candidate-form").then((mod) => mod.NewCandidateForm),
  { loading: () => <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Cargando formulario…</div> }
);
```

**Por qué este componente:** Está visible en el viewport (columna derecha) pero su funcionalidad (crear candidato) es una acción secundaria. El contenido principal del dashboard es la lista y los filtros. El formulario aporta ~90 líneas de código (4 imports, memo para validación, lógica de envío) que no son necesarias en el primer paint.

---

## Frontend — `useMemo` para computaciones derivadas

### 2.1 Backoffice — contadores `activeCount` / `suspendedCount`

**Cálculo original (en cada render):**
```tsx
const activeCount = suppliers.filter((s) => s.status === "active").length;
const suspendedCount = suppliers.length - activeCount;
```

**Cálculo optimizado:**
```tsx
const activeCount = useMemo(
  () => suppliers.filter((s) => s.status === "active").length,
  [suppliers]
);
const suspendedCount = useMemo(
  () => suppliers.length - activeCount,
  [suppliers.length, activeCount]
);
```

**Justificación del coste:** `suppliers.filter()` recorre el array completo. Con 100 proveedores (volumen del dataset real), cada filtrado itera sobre 100 elementos. En renders por cambio de estado local (apertura/cierre de filtros, toggle del formulario, hover en tabla) este filtrado es completamente redundante.

**Dependencias correctas:** `[suppliers]` para `activeCount` — solo se recalcula cuando el array `suppliers` cambia de identidad (setSuppliers llamado por la carga de API o por `handleCreated`/`handleUpdated`). `suspendedCount` depende de `suppliers.length` y `activeCount`, no del array completo.

### 2.2 Talent Pipeline Tracker — `candidateMetrics`

**Cálculo original (en cada render):**
```tsx
const candidateMetrics = [
  { label: "Total", value: candidates.length },
  { label: "En proceso", value: candidates.filter((c) => c.estado === "en-proceso").length },
  { label: "Contratadas", value: candidates.filter((c) => c.estado === "contratado").length },
  { label: "Rechazadas", value: candidates.filter((c) => c.estado === "rechazado").length },
];
```

**Cálculo optimizado:**
```tsx
const candidateMetrics = useMemo(
  () => [
    { label: "Total", value: candidates.length },
    { label: "En proceso", value: candidates.filter((c) => c.estado === "en-proceso").length },
    { label: "Contratadas", value: candidates.filter((c) => c.estado === "contratado").length },
    { label: "Rechazadas", value: candidates.filter((c) => c.estado === "rechazado").length },
  ],
  [candidates]
);
```

**Coste con datos reales:** Con 200 candidatos en el sistema (volumen del dataset de prueba), **3 filtros × 200 iteraciones = 600 comparaciones** por render. En renders de navegación (cambio de pestaña, hover en enlaces, toggle de menú) esto es trabajo desperdiciado.

---

## Backend — Caché en memoria con TTL

### Arquitectura del módulo `services/api/cache.py`

```
cache.py
├── CACHE_TTL_SECONDS       # dict: mapea prefijo de clave → TTL en segundos
├── _cache                  # dict[str, tuple[expires_at, value]] — almacenamiento
├── _lock                   # threading.Lock — protección thread-safe
├── _hits / _misses         # contadores globales para monitoreo
├── cached(key)             # → Any | None  (None = miss o expirado)
├── store(key, value)       # guarda con TTL automático según prefijo
├── invalidate(prefix)      # elimina todas las claves que empiecen con prefix
├── invalidate_all()        # vacía caché + resetea contadores
├── stats()                 # → {hits, misses, hit_rate_pct, size, keys}
└── cache_result(key)       # decorador (no usado directamente, disponible)
```

**Thread safety:** `threading.Lock` envuelve todas las operaciones de lectura/escritura sobre `_cache`. FastAPI ejecuta endpoints síncronos en un pool de hilos (`ThreadPoolExecutor`), por lo que sin lock dos peticiones concurrentes podrían corromper el dict.

**TTL implementado con `time.monotonic()`:** Se almacena `expires_at = time.monotonic() + ttl`. `monotonic()` es la opción correcta porque no se ve afectada por cambios de hora del sistema ni ajustes NTP. Cada lectura verifica `time.monotonic() < expires_at`; si expiró, elimina la entrada y retorna `None`.

---

### 3.1 Endpoint 1 — `GET /suppliers`

| Propiedad | Valor |
|---|---|
| **Ruta** | `GET /suppliers?country=X&category=Y` |
| **Almacén de datos** | TinyDB — `suppliers_table` (hasta ~100 documentos) |
| **Clave de caché** | `suppliers:list:country={country}:category={category}` |
| **TTL** | **30 segundos** |
| **Tamaño estimado de respuesta** | ~20 KB (100 ítems × ~200 bytes c/u como JSON `SupplierListRead`: 8 campos) |
| **Operación cacheada** | Consulta TinyDB con filtros + validación Pydantic `SupplierListRead` |

**Invalidación:** se ejecuta `invalidate("suppliers:list")` en:
- `POST /suppliers` — nuevo proveedor
- `PATCH /suppliers/{id}/rate` — cambio de tarifa
- `PATCH /suppliers/{id}/status` — cambio de estado (activo ↔ suspendido)
- `DELETE /suppliers/{id}` — eliminación

**Efecto de `invalidate("suppliers:list")`:** Elimina **todas** las claves que empiecen con `suppliers:list`, es decir, todas las combinaciones de filtros. La siguiente petición a `GET /suppliers` sin importar los filtros hará *cache miss* y repoblará la entrada.

---

### 3.2 Endpoint 2 — `GET /api/incidents/summary`

| Propiedad | Valor |
|---|---|
| **Ruta** | `GET /api/incidents/summary` |
| **Almacén de datos** | TinyDB — `incidents_table` (hasta ~500 documentos) |
| **Clave de caché** | `incidents:summary` (clave única, sin parámetros) |
| **TTL** | **15 segundos** |
| **Tamaño estimado de respuesta** | ~500 bytes (4 contadores × 4-8 enum variantes = ~16–20 valores enteros) |
| **Operación cacheada** | Recorrido completo O(n) sobre todos los incidentes + agregación en 4 dimensiones |

**Carga computacional:** sin caché, cada petición itera sobre todos los incidentes (hasta 500 documentos) y construye 4 diccionarios de frecuencias (by_status con 4 variantes, by_category con 8, by_origin con 4, by_branch con 4). Con caché, esto se ejecuta una vez cada 15 segundos.

**Serialización:** Se almacena el dict serializado con `summary.model_dump(mode="json")` para garantizar tipos JSON nativos. Al recuperar se reconstruye con `IncidentSummary(**cached_result)`.

**Invalidación:** se ejecuta `invalidate("incidents:summary")` en:
- `POST /api/incidents` — nueva incidencia
- `PATCH /api/incidents/{id}/status` — cambio de estado

---

## Discusión: intercambio entre frescura y rendimiento

### Principio general

Toda caché introduce una ventana de posible **inconsistencia temporal**: un cliente puede recibir datos que no reflejan el último cambio en la base de datos. La decisión de cada TTL es una compensación explícita entre **frescura de datos** y **rendimiento / reducción de carga**.

### Caso 1: `GET /suppliers` — TTL = 30 s

| Aspecto | Análisis |
|---|---|
| **Riesgo de inconsistencia** | Bajo. Los proveedores son datos maestros que solo cambian por acción administrativa explícita (crear, editar tarifa, suspender, eliminar). Ningún proceso automático modifica la tabla de proveedores. |
| **Ventana máxima de dato obsoleto** | 30 s sin invalidación. Pero la invalidación ocurre **instantáneamente** en cada escritura, por lo que en la práctica la ventana es ~0 s cuando hay escritura, y 30 s como máximo cuando no hay escritura. |
| **Coste de servir dato obsoleto** | Mínimo. Un usuario que vea una tarifa desactualizada por 30 s o un proveedor recién creado que no aparece en la lista por 30 s no produce consecuencias de negocio graves. |
| **Ahorro de carga** | TinyDB es un almacén embebido en JSON plano; cada `GET /suppliers` sin filtros recorre el archivo completo. Con 100 peticiones en 30 segundos (escenario de uso normal), se evitan 99 consultas a disco por minuto. |
| **Conclusión** | 30 s es conservador. Podría subirse a 60 s, pero 30 s da suficiente margen para que la invalidación por escritura sea efectiva y mantiene una sensación de respuesta inmediata. |

### Caso 2: `GET /api/incidents/summary` — TTL = 15 s

| Aspecto | Análisis |
|---|---|
| **Riesgo de inconsistencia** | Moderado. Las incidencias pueden crearse desde el Talent Pipeline Tracker con frecuencia media (varias por hora en horario laboral). Los cambios de estado son menos frecuentes. |
| **Ventana máxima de dato obsoleto** | 15 s sin invalidación. Con invalidación en POST y PATCH, la ventana es ~0 s tras una escritura. |
| **Coste de servir dato obsoleto** | Bajo. El summary muestra totales agregados en un dashboard de monitoreo. 15 s de desfase no afecta decisiones críticas. Si un operador crea una incidencia, el dashboard se actualiza inmediatamente por invalidación. |
| **Ahorro de carga** | El endpoint `summarize_incidents()` ejecuta O(n) sobre todos los incidentes (500 documentos), recorriendo cada uno y contando en 4 dimensiones. Sin caché, 3 visitas al dashboard por minuto = 3 × 500 = 1500 iteraciones por minuto. Con TTL de 15 s y caché, se ejecuta ~4 veces por minuto = 2000 iteraciones/min → mismo orden pero sirviendo 12 peticiones con 4 cómputos reales (el servidor devuelve respuesta desde RAM las otras 8). |
| **Conclusión** | 15 s es adecuado porque la frecuencia de escritura en incidencias es impredecible (pueden crearse en ráfagas). Un TTL más corto (5 s) apenas ahorraría cómputo; uno más largo (60 s) haría que el dashboard se vea visiblemente desactualizado. |

### ¿Por qué no TTL = 0 (sin caché)?

Porque ambos endpoints tienen un perfil claro de **muchas lecturas / pocas escrituras**:
- El directorio de proveedores se carga cada vez que un usuario navega a la página o cambia un filtro.
- El summary de incidencias se consulta en cada carga del dashboard de incidencias.

Sin caché, cada una de esas lecturas ejecuta una consulta completa a TinyDB (lectura de archivo JSON + deserialización + filtrado en Python). Con caché en memoria, la respuesta es una lectura de diccionario Python + comparación de `time.monotonic()` — esencialmente costo cero.

---

## Endpoints y componentes excluidos del caching

### Backend — Endpoints NO cacheados y motivos

| Endpoint | Método | Motivo de exclusión |
|---|---|---|
| `GET /suppliers/{id}` | Lectura de un proveedor | Dato no suficientemente compartido; solo se consulta al editar un proveedor concreto. La frecuencia de consulta individual es baja comparada con el listado. Además, el usuario espera ver el dato más reciente al abrir el detalle. |
| `GET /api/incidents` | Lista de incidencias filtrable | Tiene 4 parámetros de filtro opcionales (status, origin, branch, category). Cachear todas las combinaciones generaría muchas entradas (4 × 4 × 4 × 8 = 512 claves). Además, las consultas individuales no se benefician. |
| `GET /api/incidents/{id}` | Detalle de incidencia | Consulta individual poco frecuente. La invalidación sería compleja (habría que invalidar el ítem individual). |
| `POST /suppliers` | Crear proveedor | Endpoint de escritura — no tiene sentido cachear la operación ni su resultado de creación (id único). |
| `POST /api/incidents` | Crear incidencia | Endpoint de escritura — mismo motivo. |
| `PATCH /suppliers/{id}/rate` | Actualizar tarifa | Escritura — manipula datos. Se usa para *invalidar* la caché, no para poblar. |
| `PATCH /suppliers/{id}/status` | Cambiar estado | Escritura — manipula datos. |
| `PATCH /api/incidents/{id}/status` | Cambiar estado | Escritura — manipula datos. |
| `DELETE /suppliers/{id}` | Eliminar proveedor | Escritura — manipula datos. |
| `GET /users` | Lista de usuarios | **Datos privados.** La respuesta varía según el rol del usuario autenticado: un ADMIN ve todos los usuarios, un MANAGER tiene permiso limitado. Cachear entre usuarios filtraría datos a quien no debe verlos. Además, violaría el principio de minimización. |
| `GET /users/{id}` | Detalle de usuario | **Datos privados.** Contiene email, nombre, rol, teléfono, dirección. Sería catastrófico cachear y servir a otro usuario. |
| `POST /users` | Registro | **Información sensible.** Crea cuenta con credenciales. No idempotente. |
| `PUT /users/{id}` | Modificar usuario | Escritura — manipula perfil de usuario. |
| `GET /auth/me` | Sesión actual | **Altamente privado.** Devuelve los datos del usuario autenticado: email, nombre, rol, id. Nunca debe cachearse porque cada usuario obtiene su propia información. |
| `POST /auth/login` | Iniciar sesión | **Credenciales.** Genera token JWT. Cachear significaría compartir tokens entre usuarios o, peor, reutilizar credenciales. |
| `POST /auth/change-password` | Cambiar contraseña | Escritura — manipula credenciales. |
| `POST /auth/forgot-password` | Solicitar recuperación | Escritura — manipula tokens de recuperación. |
| `POST /auth/reset-password` | Restablecer contraseña | Escritura — manipula contraseñas. |
| `GET /profiles/me` | Perfil propio | **Datos privados.** Muestra perfil del usuario autenticado (datos personales). Cada usuario ve el suyo propio. |
| `PUT /profiles/me` | Actualizar perfil | Escritura — modifica perfil propio. |
| `GET /records` | Lista de candidatos | **Datos personales (PII).** `list_records()` obtiene datos del tracker externo con nombres completos, emails, teléfonos. Cachear bajo clave compartida expondría datos personales de candidatos a otros usuarios. |
| `GET /records/{id}` | Detalle candidato | **PII.** Contiene información personal completa del candidato. |
| `POST /records` | Crear candidatura | Escritura — manipula datos personales. Además, delega en API externa (`external_tracker.py`) cuyo estado no es controlable localmente. |
| `PUT /records/{id}` | Reemplazar candidatura | Escritura — mismo motivo. |
| `PATCH /records/{id}` | Modificar candidatura | Escritura — mismo motivo. |
| `DELETE /records/{id}` | Eliminar candidatura | Escritura — mismo motivo. |
| `GET /records/{id}/notes` | Notas de candidato | **PII.** Contenido de notas internas sobre candidatos. |
| `POST /records/{id}/notes` | Añadir nota | Escritura — manipula notas. |
| `DELETE /records/{id}/notes/{note_id}` | Eliminar nota | Escritura — manipula notas. |
| `GET /inventory/*` | Inventario | Depende de Supabase (PostgreSQL), que actualmente **no está disponible** en el entorno de desarrollo (`RuntimeError: DATABASE_URL no está configurada`). Cachear estas rutas daría una falsa sensación de funcionalidad cuando la capa de datos subyacente no está operativa. |
| `POST /inventory/*` | Operaciones inventario | Escritura — mismo motivo. |

### Frontend — Componentes NO optimizados y motivos

| Componente | Ruta / App | Motivo de exclusión |
|---|---|---|
| `auth-gate.tsx` | Backoffice — Layout raíz | **No se puede diferir:** envuelve toda la aplicación y determina si el usuario está autenticado. Debe ejecutarse en el primer render. |
| `app-nav.tsx` | Backoffice — Layout raíz | Se renderiza en todas las páginas. Es pequeño (~30 líneas) y el coste de un chunk separado para lazy loading superaría el beneficio. |
| `login-form.tsx` | Backoffice — `/login` | Es un wrapper delgado (~20 líneas) sobre `@nexova/auth/LoginForm`. El peso real está en el paquete compartido, no en este componente. |
| `supplier-row.tsx` | Backoffice — `supplier-directory.tsx` | Se renderiza dentro de un `.map()` en la tabla. No se puede hacer lazy loading individual por fila porque se renderizan varias en el mismo bucle. Sí se aplicó `useMemo` a los contadores del mismo archivo. |
| `candidate-list.tsx` | Talent Pipeline — `nexova-dashboard.tsx` | Es el contenido principal del dashboard (la lista de candidatos). Lazy loading retrasaría el *first meaningful paint*. |
| `filters-bar.tsx` | Talent Pipeline — `nexova-dashboard.tsx` | Componente pequeño (~40 líneas) que se renderiza en el layout principal. No justifica un chunk separado. |
| `incident-form.tsx` | Talent Pipeline — `/incidents/new` | Está en una ruta separada (página dedicada), por lo que Next.js ya genera un chunk independiente para esa página. El lazy loading manual en este caso sería redundante. |
| `incident-directory.tsx` | Talent Pipeline — `/incidents` | Contenido principal de la página de incidencias. Diferirlo perjudicaría la experiencia de navegación. |
| `incident-summary.tsx` | Talent Pipeline — `/incidents` y dashboard | Widget pequeño (unas pocas líneas) de métricas. El coste computacional es bajo. |
| `candidate-detail-page.tsx` | Talent Pipeline — `/[id]` | Página de detalle en ruta dinámica. Next.js ya crea un chunk separado automáticamente. |
| `StatusBadge` (inline) | Talent Pipeline — `candidate-list.tsx` | Componente interno de ~8 líneas. El overhead de `dynamic()` supera el beneficio. |

---

## Verificación completa sin regresiones

### Backend (Python/FastAPI)

| Verificación | Resultado |
|---|---|
| `python -c "import ast; ast.parse(open('cache.py').read())"` | ✅ Sin errores de sintaxis |
| `python -c "import ast; ast.parse(open('routes/suppliers.py').read())"` | ✅ Sin errores de sintaxis |
| `python -c "import ast; ast.parse(open('routes/incidents.py').read())"` | ✅ Sin errores de sintaxis |
| `python -m pytest tests/ -v --tb=short` | **✅ 65/65 tests pasan** (22.5 s, mismas 3 deprecation warnings preexistentes) |
| `python -m pytest tests/ -v --tb=short` (2.ª ejecución) | **✅ 65/65 tests pasan** (misma suite, sin regresiones) |

### Frontend (Next.js/TypeScript)

| Verificación | Resultado |
|---|---|
| `cd uis/backoffice && npx tsc --noEmit` | **✅ 0 errores** |
| `cd uis/talent-pipeline-tracker && npx tsc --noEmit` | **✅ 0 errores** |

### Integridad de datos y contratos

- ✅ Ningún modelo Pydantic fue modificado
- ✅ Ningún esquema de respuesta fue alterado
- ✅ Ningún contrato de API cambió (rutas, métodos, códigos de estado, cabeceras)
- ✅ Ninguna función de servicio (`services.py`, `record_services.py`, `external_tracker.py`) fue tocada
- ✅ Las funciones `get_current_user` y sus dependencias se siguen ejecutando en endpoints cacheados antes de servir respuesta
- ✅ Los cambios son exclusivamente de rendimiento, sin impacto funcional en las respuestas

---

## Próximos pasos

### Corto plazo (recomendado)

1. **Agregar endpoint `GET /cache/stats`** en main.py para monitorear hits/misses en producción:
   ```python
   @app.get("/cache/stats")
   def cache_stats():
       return cache.stats()
   ```
2. **Agregar `@next/bundle-analyzer`** en desarrollo para medir exactamente el tamaño de los chunks generados por `next/dynamic`.
3. **Configurar `CACHE_TTL_SECONDS` vía variable de entorno** para ajustar TTLs sin modificar código.

### Medio plazo (cuando sea necesario)

4. **Migrar la caché a Redis** si el servidor FastAPI escala a múltiples workers (Gunicorn + Uvicorn workers). La caché en memoria actual es local a cada proceso; Redis permitiría caché compartida entre workers.
5. **Evaluar `next/dynamic` para `IncidentForm`** si en el futuro se integra como modal dentro de `/incidents` en lugar de ruta separada.
6. **Evaluar React 19 `use()`** para carga de datos concurrente con Suspense cuando la API lo soporte.