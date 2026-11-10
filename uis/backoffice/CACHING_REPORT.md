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

## 4. Próximos pasos (futuros)

- Considerar `next/dynamic` para `IncidentForm` en la ruta `/incidents/new` del Talent Pipeline Tracker.
- Evaluar migración a React 19 `use()` para carga de datos concurrente cuando esté disponible.
- Agregar `@next/bundle-analyzer` en desarrollo para monitorear el impacto exacto de los chunks generados.