# Estado y próximos pasos

Actualizado: 2026-11-09.

## Contexto del proyecto

- Nexova ofrece tres líneas de servicio: búsqueda ejecutiva y de mandos medios, outsourcing de soporte al cliente y formación corporativa. `CONTEXT.md` es la fuente canónica para tarifas, términos de pago, SLA, excepciones y aprobaciones.
- El monorepo incluye el sitio `uis/website`, el Backoffice `uis/backoffice`, una aplicación Next.js de seguimiento de talento y servicios FastAPI. `uis/website/` es una aplicación Next.js 16.3.8 con landing corporativa, componentes reutilizables y calculadora orientativa de los tres servicios.
- `uis/backoffice/` es una aplicación estática que conserva el análisis de CSV y presenta un resumen de condiciones de servicio y SLA. Usa la API existente; no se añadió un backend aparte.
- `services/api/` ofrece análisis y exportación de CSV de incidentes mediante `POST /api/incidents/analyze` y `GET /api/incidents/results/export`. La lógica compartida está en `shared/incident_analysis.py`; el resultado más reciente se conserva en memoria del proceso, no en almacenamiento persistente.
- `docs/ARCHITECTURE_PROPOSAL.md` propone una arquitectura de backend modular monolítica. Es orientación, no una descripción de implementación concluida.
- La documentación de raíz todavía conserva referencias a la plantilla original y no está completamente alineada con Nexova.

## Autenticación: estado comprobable en código

### Frontends

- `uis/website/` incluye login, registro, dashboard, perfil y protección de rutas privadas. El cliente llama a login y registro, guarda el token en `localStorage`, envía `Authorization: Bearer <token>` en solicitudes protegidas y procesa respuestas 401 mediante `handleProtectedResponse`.
- `uis/backoffice/` incluye formulario de login, `AuthGate` que restringe las páginas salvo `/login`, cliente de proveedores con encabezado Bearer y limpieza del estado/redirección ante 401.
- En ambos frontends, JavaScript puede leer el JWT guardado en `localStorage`, lo que implica riesgo ante XSS.

### FastAPI

- `services/api/main.py` monta los routers de autenticación, usuarios, perfiles y proveedores.
- `services/api/auth.py` define `POST /auth/login` con formulario OAuth2 y emisión de JWT, además de `GET /auth/me` protegido con Bearer.
- `services/api/users.py` define `POST /users`; `services/api/profiles.py` define `GET /profiles/me` y `PUT /profiles/me`.
- `services/api/user_services.py` persiste usuarios y perfiles en TinyDB y hashea contraseñas con bcrypt.
- La existencia de handlers y contratos frontend no demuestra que los flujos estén integrados y probados contra FastAPI en ejecución.

## Validaciones registradas

- ESLint enfocado en `uis/backoffice/src/components/app-nav.tsx` y `login-form.tsx` terminó sin errores; las clases Tailwind correspondientes quedaron separadas correctamente.
- El build de `uis/website` terminó correctamente con `API_URL` temporal. La URL de prueba quedó en `.next/routes-manifest.json`, un artefacto ignorado; no debe usarse como configuración de despliegue.
- ESLint enfocado en `uis/website/src/app/login/page.tsx` terminó sin errores. El `npm run lint` completo de website no se ha repetido después de esa corrección.
- En validaciones anteriores, `npm run build` y `npm run lint` del website terminaron correctamente y `npm audit --omit=dev` informó cero vulnerabilidades. Un smoke test local obtuvo HTTP 200 en `/` del website y del backoffice, y en los activos de imagen/favicon del website. Estos resultados no sustituyen una validación actual.
- Para pruebas locales, el website se inicia con `cd uis/website && npm run dev`; el Backoffice puede servirse con `python3 -m http.server 5500 --bind 0.0.0.0 --directory uis/backoffice`. El puerto 5500 coincide con los orígenes CORS locales declarados por la API. No se afirma que esos servidores sigan activos.
- No hay registrada una prueba end-to-end reciente que ejecute la autenticación de los frontends contra FastAPI.

## Próximos pasos

1. Validar contra FastAPI en ejecución el ciclo de registro, login, `GET /auth/me` y lectura/actualización del perfil desde los clientes correspondientes; cubrir credenciales inválidas, token ausente o expirado, usuario duplicado y errores de validación con pruebas enfocadas.
2. Confirmar `API_URL`, `NEXT_PUBLIC_API_URL` y la configuración JWT del entorno de despliegue, sin guardar secretos en el repositorio. Evaluar TinyDB y el almacenamiento del JWT para producción; no dar por implementados refresh tokens, cookies `httpOnly` ni protecciones CSRF sin verificarlos en cliente y servidor.
3. Definir el canal de contacto y el flujo de recepción de solicitudes antes de añadir formularios comerciales o persistencia; esos datos no están especificados en `CONTEXT.md`.
4. Definir contratos de datos para headhunting, soporte y formación sin asumir un esquema de persistencia, y añadir pruebas de validación, reglas comerciales y contratos de API al ampliar esos flujos.
5. Alinear la documentación de raíz con Nexova y retirar referencias heredadas solo después de verificar qué archivos siguen vigentes.
6. Diseñar controles de privacidad, acceso, persistencia, despliegue y observabilidad antes de usar datos reales de clientes o llevar los flujos a producción.
7. Antes de organizar commits, revisar el estado de trabajo y seleccionar explícitamente los archivos que correspondan.

Mantener esta página alineada con el código y las validaciones ejecutadas. No registrar secretos ni datos personales de clientes o candidatos.
