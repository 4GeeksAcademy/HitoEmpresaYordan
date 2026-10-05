# Contexto técnico

## Estado técnico observado

- El repositorio es un monorepo con aplicaciones y documentación distribuidas en `uis/`, `services/`, `shared/`, `packages/`, `agents/`, `skills/` y otras carpetas de plantilla. No hay un `package.json` ni un runner de workspace en la raíz, según la documentación del repositorio.
- La web pública principal se desarrolla en `uis/website/`, una app Next.js 16.3.8 con App Router y su propio `package.json`; la ruta `/` es una página corporativa y su calculadora de tarifas es interactiva en cliente. El HTML de raíz (`index.html` y `application.html`) sigue existiendo como entrega anterior y no es fuente de verdad de negocio.
- `uis/backoffice/` es una aplicación estática independiente de HTML, CSS y JavaScript. Presenta condiciones operativas y conserva la carga, el análisis y la exportación de CSV.
- `uis/talent-pipeline-tracker/` es una aplicación Next.js con App Router: Next.js 16.2.10, React 19.2.4, TypeScript 5, Tailwind CSS 4 y ESLint 9. Sus scripts locales son `dev`, `build`, `start` y `lint`.
- `services/api/` contiene una API FastAPI para analizar CSV de incidentes y exportar el último resultado. Las dependencias declaradas son FastAPI, `python-multipart` y Uvicorn; la lógica de análisis está en `shared/incident_analysis.py`.
- La API valida CSV UTF-8, recibe archivos en `POST /api/incidents/analyze` y expone `GET /api/incidents/results/export`. El resultado más reciente se mantiene en memoria de proceso (`latest_metrics`); no se observa persistencia de base de datos en esta implementación.
- `packages/shared/` declara `@repo/shared-types`, pero su tipo actual es genérico y la metadata no configura scripts de workspace en la raíz.

## Arquitectura documentada

`docs/ARCHITECTURE_PROPOSAL.md` propone para el backend una arquitectura de monolito modular por capas con un enfoque ligero de Domain-Driven Design sobre FastAPI. La propuesta menciona módulos como `ai_agents`, `content` y `analytics`, y contempla configuración, API, modelos, esquemas, servicios y pruebas. Es una propuesta, no evidencia de que esa estructura esté ya implementada.

## Restricciones y decisiones de trabajo

- Antes de cambiar código de Next.js, leer la guía correspondiente de la versión instalada en `node_modules/next/dist/docs/`; `uis/talent-pipeline-tracker/AGENTS.md` advierte que esta versión incluye cambios incompatibles con convenciones antiguas.
- No asumir una base de datos, persistencia duradera, runner raíz, despliegue común ni contratos de API fuera de lo que esté implementado o documentado.
- La API actual solo declara orígenes CORS locales en el puerto 5500 y un origen de Codespaces concreto. Para que el backoffice local use esa API sin cambiar su política CORS, servirlo desde `http://localhost:5500` o `http://127.0.0.1:5500`. Añadir orígenes o cambiar métodos debe corresponder a una necesidad de integración verificada.
- Los datos de análisis CSV se guardan en memoria del proceso y no sobreviven a un reinicio. No presentar este comportamiento como almacenamiento persistente ni ampliar el uso de datos sensibles sin diseñar controles adecuados.
- Mantener separados los hechos comprobados, las propuestas arquitectónicas y las decisiones futuras. Confirmar con el responsable del proyecto cualquier decisión que cambie contratos, datos, tarifas o compromisos comerciales.
- Seguir la herramienta y las dependencias ya usadas en cada subproyecto; no asumir que instalar dependencias o ejecutar comandos desde la raíz afecta a todos los paquetes.