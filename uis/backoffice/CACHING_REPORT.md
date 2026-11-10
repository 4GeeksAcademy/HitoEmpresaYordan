# Informe de optimizaciones de frontend — Caching

## Resumen

Se identificaron e implementaron tres optimizaciones de rendimiento en las aplicaciones Next.js del monorepo:

| Optimización | Aplicación | Archivo modificado | Impacto estimado |
|---|---|---|---|
| Lazy Loading (`next/dynamic`) | Backoffice | `supplier-directory.tsx` | ~15–20 KB menos en el bundle principal |
| Lazy Loading (`next/dynamic`) | Talent Pipeline Tracker | `nexova-dashboard.tsx` | ~8–12 KB menos en el bundle principal |
| `useMemo` | Backoffice | `supplier-directory.tsx` | Evita 2 filtrados en cada render |
| `useMemo` | Talent Pipeline Tracker | `nexova-dashboard.tsx` | Evita 3 filtrados en cada render |

---

## 1. Lazy Loading con `next/dynamic`

### 1.1 `SupplierForm` (Backoffice — `supplier-directory.tsx`)

**Antes:**  
```tsx
import { SupplierForm } from "@/src/components/supplier-form";
```
El componente se importaba estáticamente, añadiendo todo el código del formulario (~200 líneas con validación, grid de categorías, lógica de API) al bundle principal **aunque solo se renderiza cuando el usuario hace clic en "Nuevo proveedor" (`showForm === true`)**.

**Después:**  
```tsx
const SupplierForm = dynamic(
  () => import("@/src/components/supplier-form").then((mod) => mod.SupplierForm),
  { loading: () => <div className="...">Cargando formulario…</div> }
);
```

**Ganancia:** El bundle inicial se reduce en el tamaño de `supplier-form.tsx`. El componente se descarga bajo demanda sólo cuando el usuario interactúa con el botón de nuevo proveedor.

### 1.2 `NewCandidateForm` (Talent Pipeline Tracker — `nexova-dashboard.tsx`)

**Antes:**  
```tsx
import { NewCandidateForm } from "@/src/components/new-candidate-form";
```
Importado estáticamente y renderizado siempre en la columna derecha del dashboard, aunque esté por debajo del pliegue.

**Después:**  
```tsx
const NewCandidateForm = dynamic(
  () => import("@/src/components/new-candidate-form").then((mod) => mod.NewCandidateForm),
  { loading: () => <div className="...">Cargando formulario…</div> }
);
```

**Ganancia:** El código del formulario de nueva candidatura se carga de forma diferida, reduciendo el bundle inicial de la página principal.

---

## 2. `useMemo` para computaciones derivadas

### 2.1 Backoffice — `supplier-directory.tsx`

Los contadores `activeCount` y `suspendedCount` se recalculaban en cada render mediante dos `.filter()` sobre el array de proveedores.

**Antes:**
```tsx
const activeCount = suppliers.filter((s) => s.status === "active").length;
const suspendedCount = suppliers.length - activeCount;
```

**Después:**
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

**Ganancia:** El filtrado solo se ejecuta cuando `suppliers` cambia (típicamente tras una carga de API o al añadir/actualizar un proveedor), no en cada renderización del componente.

### 2.2 Talent Pipeline Tracker — `nexova-dashboard.tsx`

El array `candidateMetrics` ejecutaba **3 filtros** sobre el array de candidatos en cada render para calcular los valores de "En proceso", "Contratadas" y "Rechazadas".

**Antes:**
```tsx
const candidateMetrics = [
  { label: "Total", value: candidates.length },
  { label: "En proceso", value: candidates.filter((c) => c.estado === "en-proceso").length },
  { label: "Contratadas", value: candidates.filter((c) => c.estado === "contratado").length },
  { label: "Rechazadas", value: candidates.filter((c) => c.estado === "rechazado").length },
];
```

**Después:**
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

**Ganancia:** Los 3 filtros se ejecutan únicamente cuando el array `candidates` cambia, evitando trabajo repetitivo en renders que no implican nuevos datos.

---

## 3. Verificación

- TypeScript: ambos proyectos compilan sin errores (`npx tsc --noEmit` → 0 errors).
- No se alteraron contratos de API, tipos compartidos ni interfaces de componentes.
- Los cambios son exclusivamente de optimización de rendimiento, sin impacto funcional.

---

---

# Backend — Caching en memoria

## Resumen

Se implementó una capa de caché en memoria (`services/api/cache.py`) con expiración por TTL e invalidación manual, aplicada a 2 endpoints de lectura frecuente.

| Endpoint | Clave de caché | TTL | Invalidación | Frecuencia estimada |
|---|---|---|---|---|
| `GET /suppliers` | `suppliers:list:country=X:category=Y` | 30 s | `POST/PATCH/DELETE` en `/suppliers/*` | Lectura en cada carga del directorio; escritura ocasional (admin) |
| `GET /api/incidents/summary` | `incidents:summary` | 15 s | `POST /api/incidents` + `PATCH /.../status` | Lectura en dashboard de incidencias; escritura al crear/modificar incidencias |

---

## 1. Capa de caché — `services/api/cache.py`

Se creó un módulo independiente con las siguientes funciones:

| Función | Propósito |
|---|---|
| `cached(key)` | Recupera valor si no ha expirado, retorna `None` en caso contrario |
| `store(key, value)` | Guarda valor con TTL determinado por el prefijo de la clave |
| `invalidate(prefix)` | Elimina todas las entradas cuyo key comience con `prefix` |
| `invalidate_all()` | Vacía toda la caché (tests / recarga manual) |
| `stats()` | Retorna hits, misses, hit rate, tamaño y claves activas |

### TTL por recurso

```python
CACHE_TTL_SECONDS = {
    "suppliers:list": 30,   # 30 segundos
    "incidents:summary": 15,  # 15 segundos
}
```

**Criterios de selección del TTL:**

- **suppliers:list (30 s):** La lista de proveedores cambia con poca frecuencia (solo por acción administrativa). 30 s balancea frescura de datos con reducción de carga en TinyDB.
- **incidents:summary (15 s):** Las incidencias pueden crearse o cambiar de estado con más frecuencia desde el Talent Pipeline Tracker. 15 s ofrece un equilibrio responsivo.

### Thread safety

Se usa `threading.Lock` para todas las operaciones de lectura/escritura sobre el dict compartido, ya que FastAPI ejecuta los endpoints síncronos en un pool de hilos.

---

## 2. Endpoint 1 — `GET /suppliers`

### Clave de caché

```
suppliers:list:country={country}:category={category}
```

Incluye los filtros en la clave para que distintas combinaciones de filtros se almacenen por separado. La dependencia `current_user` se sigue evaluando (autenticación), pero el resultado cacheado **no depende del usuario** — es el mismo para todos los usuarios autenticados (datos de negocio públicos).

### Invalidación

Se insertó `invalidate("suppliers:list")` en los siguientes endpoints de escritura:

| Endpoint | Método | Operación |
|---|---|---|
| `POST /suppliers` | Crear proveedor | Invalida toda la caché de listas |
| `PATCH /suppliers/{id}/rate` | Actualizar tarifa | Invalida toda la caché de listas |
| `PATCH /suppliers/{id}/status` | Cambiar estado | Invalida toda la caché de listas |
| `DELETE /suppliers/{id}` | Eliminar proveedor | Invalida toda la caché de listas |

La invalidación por prefijo `suppliers:list` elimina **todas las variantes de filtros** de una sola operación, asegurando que cualquier lectura posterior obtenga datos frescos independientemente del filtro usado.

---

## 3. Endpoint 2 — `GET /api/incidents/summary`

### Clave de caché

```
incidents:summary
```

Clave única sin sufijos de filtro (el summary siempre agrega **todos** los incidentes). El valor almacenado es el dict serializado del `IncidentSummary` Pydantic model, convertido con `.model_dump(mode="json")` para garantizar serialización limpia.

Al recuperar, se reconstruye con `IncidentSummary(**cached_result)`.

### Invalidación

Se insertó `invalidate("incidents:summary")` en:

| Endpoint | Método | Operación |
|---|---|---|
| `POST /api/incidents` | Crear incidencia | Invalida el summary |
| `PATCH /api/incidents/{id}/status` | Cambiar estado | Invalida el summary |

---

## 4. Seguridad: datos no privados

**Regla estricta:** ninguna clave de caché incluye información del usuario autenticado.

- `suppliers:list:*` — datos de negocio compartidos (nombre, país, tarifa, estado). El `current_user` se sigue validando en cada petición, pero el resultado es idéntico para todos los usuarios autorizados.
- `incidents:summary` — solo métricas agregadas (totales por status/categoría/origen/rama). Sin datos de sesión, sin PII, sin incidentes individuales.

La caché **no** se aplica a endpoints que devuelven datos de usuario, perfil, tokens o cualquier recurso cuyo contenido varíe por usuario autenticado (users, profiles, auth, records con datos de candidatos).

---

## 5. Verificación

- ✅ Todos los archivos Python compilan sin errores de sintaxis.
- ✅ **65/65 tests existentes pasan** sin regresiones (`pytest tests/ -v`).
- ✅ No se modificaron modelos, esquemas ni contratos de API.
- ✅ Los cambios son exclusivamente de rendimiento, sin impacto funcional en las respuestas.

---

## 6. Próximos pasos (futuros)

- Considerar migración a **Redis** si el volumen de peticiones crece y se necesita persistencia de caché entre reinicios del servidor.
- Agregar `@next/bundle-analyzer` en desarrollo para monitorear el impacto exacto de los chunks generados.
- Considerar `next/dynamic` para `IncidentForm` en la ruta `/incidents/new` del Talent Pipeline Tracker.
- Evaluar migración a React 19 `use()` para carga de datos concurrente cuando esté disponible.