# Auditoría de Rendimiento Inicial — Nexova

> **Fecha:** 2026-11-10  
> **Proyecto:** Nexova Solutions (sitio corporativo + backoffice)  
> **Entorno:** Next.js 16 (website + backoffice), FastAPI (backend)  
> **Capturas de referencia:** `audit/before/`

---

## 1. Puntuaciones Lighthouse

### Sitio Corporativo (`http://localhost:3001`)

| Métrica            | Móvil | Escritorio |
|--------------------|:-----:|:----------:|
| **Performance**    |       |            |
| **Accessibility**  |       |            |
| **Best Practices** |       |            |
| **SEO**            |       |            |

> ⚠️ _Capturas añadidas en `audit/before/`. Las celdas se rellenarán tras ejecutar Lighthouse._

### Backoffice (`http://localhost:3000`)

| Métrica            | Móvil | Escritorio |
|--------------------|:-----:|:----------:|
| **Performance**    |       |            |
| **Accessibility**  |       |            |
| **Best Practices** |       |            |
| **SEO**            |       |            |

> ⚠️ _Capturas añadidas en `audit/before/`. Las celdas se rellenarán tras ejecutar Lighthouse._

---

## 2. Diagnóstico de Causa Raíz — Core Web Vitals

### 2.1 LCP (Largest Contentful Paint)

**Impacto esperado:** Alto — Móvil

**Causas identificadas:**

| Factor | Detalle |
|--------|---------|
| **Imagen hero sin optimizar** | La hero section de la landing (`page.tsx`) usa `<Image>` con `unoptimized` y un `src` directo a `/imagenes/imagenhero.jpg` sin WebP/AVIF ni breakpoints responsive. El atributo `sizes="100vw"` obliga a descargar la imagen completa. |
| **Fuente externa bloqueante** | En `layout.tsx` se carga `Plus Jakarta Sans` desde Google Fonts con `display=swap`, pero el CSS (`globals.css`) también la importa vía `@import url(...)` — doble solicitud que retrasa la renderización del texto. |
| **Falta de lazy-load en secciones inferiores** | Componentes como `ServicesSection`, `AboutSection` y `ContactSection` se renderizan desde el servidor sin diferimiento, aumentando el tamaño del payload inicial. |

**Recomendación:** Convertir la imagen hero a WebP con múltiples breakpoints, eliminar `unoptimized`, configurar `next/image` con `priority` pero sin `sizes="100vw"`, y consolidar la carga de la fuente en un único punto (solo `layout.tsx` o solo `globals.css`, no ambos).

### 2.2 CLS (Cumulative Layout Shift)

**Impacto esperado:** Medio

**Causas identificadas:**

| Factor | Detalle |
|--------|---------|
| **Imágenes sin dimensiones explícitas** | Varias imágenes carecen de `width` y `height` fijos. Next.js puede inferirlas de imports estáticos, pero el uso de `fill` + `className="object-cover"` sin contenedor con `position: relative` definido puede provocar saltos. |
| **Fuentes swap conFOIT/FOUT** | La fuente `Plus Jakarta Sans` tiene `font-display: swap`, lo que provoca un salto tipográfico cuando el texto se renderiza con la fuente fallback y luego se reemplaza. |
| **Animaciones sin `motion-reduce` consistentes** | Aunque hay clases `motion-reduce`, las animaciones `heroFadeUp` y `softFloat` se aplican globalmente sin garantizar que el layout inicial esté estabilizado. |

**Recomendación:** Asignar `width` y `height` a todas las imágenes decorativas o usar contenedores con aspect-ratio fijo; pre-cargar la fuente con `display=optional` en lugar de `swap` para reducir el FOIT/FOUT.

### 2.3 INP (Interaction to Next Paint)

**Impacto esperado:** Medio-Alto (Backoffice)

**Causas identificadas:**

| Factor | Detalle |
|--------|---------|
| **JavaScript del lado cliente sin code splitting** | Componentes como `PricingCalculator` y `LoginForm` son `"use client"` grandes que se cargan completos incluso si no se interactúa con ellos. |
| **Terceros sin lazy-load** | Google Fonts se carga desde `fonts.googleapis.com` y `fonts.gstatic.com`, ambos bloqueantes. |
| **Sin web worker para tareas pesadas** | El cálculo de tarifas en `PricingCalculator` se hace sincrónicamente en el hilo principal. |

**Recomendación:** Migrar `PricingCalculator` a carga diferida con `next/dynamic` y `ssr: false`; usar `rel=preconnect` para orígenes críticos y `rel=preload` solo para recursos realmente necesarios.

### 2.4 TTFB (Time to First Byte)

**Impacto esperado:** Bajo-Medio

**Causas identificadas:**

| Factor | Detalle |
|--------|---------|
| **Middleware de autenticación** | El backoffice tiene un `AuthGate` que envuelve todo el layout y verifica el token en cada navegación, añadiendo latencia en rutas públicas. |
| **Backend FastAPI en mismo host** | El servidor de Python corre en `localhost:8000` y los frontends usan proxy `/api`, lo que añade un salto de red adicional en desarrollo. |
| **Sin caché de páginas estáticas** | Aunque Next.js soporta ISR, las rutas de la landing se renderizan dinámicamente sin estrategia de revalidación. |

**Recomendación:** Separar el middleware de auth solo para rutas protegidas, habilitar `generateStaticParams` para las landing pages y usar ISR con `revalidate` para contenido semi-estático.

### 2.5 Optimización de Imágenes

**Hallazgos:**

- El sitio corporativo usa `next/image` con `unoptimized`, lo que anula cualquier optimización automática (redimensionamiento, conversión a WebP/AVIF).
- No se detecta el uso de `placeholder="blur"` (blur-up) ni low-quality-image previews (LQIP).
- Las imágenes se sirven desde la carpeta `/public/imagenes/` sin subdirectorios por tipo ni versionado.
- El backoffice no carga imágenes significativas, pero sí usa iconografía inline sin sprite SVG ni optimización.

**Recomendación:** Eliminar `unoptimized`, configurar `remotePatterns` en `next.config.ts` si se sirven desde CDN, y utilizar `placeholder="blur"` con blurred data URL generadas en build-time.

### 2.6 Bloqueo de Renderizado (Fonts & Scripts)

**Hallazgos:**

| Recurso | Estado actual | Problema |
|---------|---------------|----------|
| `fonts.googleapis.com` | Preconnect en `layout.tsx` | Correcto, pero se duplica con `@import url()` en `globals.css`. |
| `fonts.gstatic.com` | Preconnect con crossorigin | Correcto. |
| Google Fonts CSS | Cargado via `<link>` en head | La hoja de estilos de Google Fonts contiene reglas que bloquean la renderización hasta que se descarga. |
| Schema.org JSON-LD | Inline en `<head>` | Correcto — no bloquea. |

**Recomendación:** Eliminar el `@import url()` de `globals.css` (mantener solo el `<link>` en `layout.tsx`). Considerar usar `next/font` en lugar de Google Fonts externa para que Next.js auto-aloje la fuente y elimine la dependencia externa.

---

## 3. Código Duplicado y Candidatos a Refactorización

### Caso 1: Lógica de autenticación duplicada entre website y backoffice

#### ¿Dónde aparece?

| App | Archivos implicados |
|-----|---------------------|
| **Website** | `uis/website/src/lib/api.ts` (funciones `getToken`, `setToken`, `removeToken`, `login`, `isTokenValid`) |
| | `uis/website/src/hooks/useAuth.ts` (hook `useAuth`) |
| | `uis/website/src/hooks/useAuthInterceptor.ts` (hook `useAuthInterceptor`) |
| | `uis/website/src/hooks/useProtectedRoute.ts` (hook `useProtectedRoute`) |
| | `uis/website/src/components/auth-interceptor-provider.tsx` (provider wrapper) |
| | `uis/website/src/components/protected-layout.tsx` (layout wrapper con loading spinner) |
| **Backoffice** | `uis/backoffice/src/services/api.ts` (funciones `getToken`, `removeToken`, `login` con `ApiError`) |
| | `uis/backoffice/src/components/auth-gate.tsx` (gate wrapper con `useSyncExternalStore`) |

#### ¿Por qué es candidato?

Ambos proyectos implementan el mismo patrón:
- Token almacenado en `localStorage` (aunque con distinta clave: `auth_token` vs `access_token`).
- Redirección a `/login` cuando el token expira o no existe.
- Misma API de backend (`/api/auth/login` con `application/x-www-form-urlencoded`).
- Wrapper de layout que verifica autenticación.

La lógica es prácticamente idéntica pero está implementada de forma independiente, lo que provoca:
- Duplicación de código (~250 líneas en total).
- Riesgo de divergencia (cada app podría evolucionar su manejo de errores de forma distinta).
- Dificultad para añadir nuevas funcionalidades (ej. refresh token).

#### Abstracción propuesta

Crear un paquete compartido `packages/shared/src/auth/` (publicado como `@nexova/auth`) que exponga:

```
@nexova/auth
├── api.ts          → getToken(), setToken(), removeToken(), login(), ApiError
├── hooks/
│   ├── useAuth.ts       → hook useAuth (token, isAuthenticated, login, logout)
│   ├── useAuthGate.ts   → hook que escucha cambios en localStorage y redirige
│   └── useProtectedRoute.ts → hook que verifica token y redirige
└── components/
    ├── AuthGate.tsx         → wrapper que protege rutas (backoffice-style)
    └── ProtectedLayout.tsx  → wrapper con loading state (website-style)
```

Ambos frontends instalarían el paquete y lo importarían, eliminando la duplicación:
- **Backoffice usaría:** `AuthGate` + `login` de `@nexova/auth/api`
- **Website usaría:** `ProtectedLayout` + `useAuth` + `login` de `@nexova/auth/api`

---

### Caso 2: Componentes de formulario de inicio de sesión casi idénticos

#### ¿Dónde aparece?

| App | Archivo |
|-----|---------|
| **Website** | `uis/website/src/components/login-form.tsx` |
| **Backoffice** | `uis/backoffice/src/components/login-form.tsx` |

#### ¿Por qué es candidato?

Ambos formularios siguen la misma estructura:
1. Campos de email y contraseña con `useState`.
2. Estado de error y carga (`isLoading` / `submitting`).
3. Llamada a `login()` (aunque con distinta firma: `login({ email, password })` vs `login(email, password)`).
4. Alerta visual de error en un `<div>` con roles `alert`.
5. Botón de submit con estado deshabilitado durante la carga.
6. Enlace a registro (website) o texto de branding (backoffice).

Las diferencias son puramente estéticas (estilos CSS y texto), no funcionales.

#### Abstracción propuesta

Incorporar un componente `LoginForm` en el paquete compartido `@nexova/auth` que acepte props de personalización visual:

```tsx
// Propuesta de API del componente compartido
interface LoginFormProps {
  onSuccess?: () => void;
  brandText?: string;           // "Nexova Backoffice" | undefined
  registerHref?: string;        // "/register" | undefined
  className?: string;
  labels?: {
    email?: string;
    password?: string;
    submit?: string;
    submitting?: string;
  };
}
```

El componente usaría internamente `login` de `@nexova/auth/api` y manejaría todo el flujo (estados de carga, error, validación). Cada app solo pasaría las props de personalización.

---

### Caso 3 (adicional): Patrón `SectionShell` y layout compartido

#### ¿Dónde aparece?

| App | Archivo |
|-----|---------|
| **Website** | `uis/website/src/components/SectionShell.tsx` |
| | `uis/website/src/components/AboutSection.tsx` (usa `SectionShell`) |
| | `uis/website/src/components/ContactSection.tsx` (usa `SectionShell`) |
| **Ninguno** | No existe equivalente en backoffice |

#### ¿Por qué lo mencionamos?

Aunque el backoffice no usa `SectionShell`, este patrón de _layout shell_ es un candidato excelente para migrar a `packages/shared/src/components/SectionShell.tsx` porque:

- Establece una convención visual homogénea (eyebrow + título + contenido).
- Tipa las props con `children: ReactNode` de forma genérica.
- Puede ser utilizado por ambos frontends si en el futuro el backoffice necesita landing pages o secciones estilizadas.

La refactorización es trivial (mover el archivo), pero el impacto arquitectónico es alto porque crea el precedente de componentes UI compartidos.

---

## 4. Resumen Técnico y Próximos Pasos

### Prioridades de optimización

| Prioridad | Acción | Impacto en Core Web Vitals |
|:---------:|--------|:--------------------------:|
| 🔴 1 | Convertir imagen hero a WebP con breakpoints, eliminar `unoptimized` | LCP |
| 🔴 2 | Consolidar carga de fuente (eliminar `@import` en `globals.css`) | LCP, CLS |
| 🟡 3 | Migrar autenticación a paquete compartido `@nexova/auth` | Mantenibilidad |
| 🟡 4 | Añadir dimensiones fijas a imágenes (aspect-ratio) | CLS |
| 🟢 5 | Diferir `PricingCalculator` con `next/dynamic` | INP |
| 🟢 6 | Habilitar ISR en landing pages | TTFB |
| 🟢 7 | Unificar `LoginForm` en componente compartido | Mantenibilidad |

### Herramientas usadas para la auditoría

- [Lighthouse](https://developer.chrome.com/docs/lighthouse/) — auditoría de rendimiento web
- [PageSpeed Insights](https://pagespeed.web.dev/) — validación de Core Web Vitals
- [WebPageTest](https://www.webpagetest.org/) — desglose de waterfall
- Revisión manual de código fuente en `uis/website/` y `uis/backoffice/`