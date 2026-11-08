# Estado y próximos pasos

Actualizado: 2026-11-08.

## Repositorio

- Rama actual: `feature/auth-api`.
- El working tree no está limpio: contiene archivos modificados y sin seguimiento en varios proyectos. No asumir que los cambios están staged ni listos para commit; revisar `git status --short --untracked-files=all` antes de preparar commits.
- El monorepo contiene servicios FastAPI, una aplicación de seguimiento de talento, el sitio `uis/website` y el Backoffice `uis/backoffice`.

## Autenticación: estado comprobable en código

### Frontends

- `uis/website`: tiene login, registro, dashboard, perfil y protección de las rutas privadas. El cliente llama a login y registro, guarda el token en `localStorage`, envía `Authorization: Bearer <token>` en las llamadas protegidas y maneja respuestas 401 procesadas por `handleProtectedResponse`.
- `uis/backoffice`: tiene formulario de login, `AuthGate` para restringir las páginas salvo `/login`, cliente de proveedores con header Bearer y limpieza/redirección ante 401.
- En ambos frontends, guardar el JWT en `localStorage` implica que JavaScript puede leerlo y que existe riesgo ante XSS.

### Backend

- `services/api/main.py` monta los routers de autenticación, usuarios, perfiles y proveedores.
- `services/api/auth.py` define `POST /auth/login` con formulario OAuth2, emisión de JWT y `GET /auth/me` protegido con Bearer.
- `services/api/users.py` define `POST /users`; `services/api/profiles.py` define `GET /profiles/me` y `PUT /profiles/me`.
- `services/api/user_services.py` persiste usuarios y perfiles en TinyDB, hashea contraseñas con bcrypt y ofrece las operaciones usadas por esos handlers.
- Los handlers y los contratos frontend existen en el código inspeccionado, pero esto no demuestra por sí solo que los flujos estén integrados y probados contra un backend en ejecución.

## Validación reciente

- ESLint enfocado en `uis/backoffice/src/components/app-nav.tsx` y `login-form.tsx` terminó sin errores. Las clases Tailwind solicitadas ya están separadas correctamente en el contenido actual.
- El build de `uis/website` terminó correctamente con `API_URL` temporal. La URL de prueba quedó en `.next/routes-manifest.json`, artefacto ignorado por Git; no debe usarse como configuración de despliegue.
- ESLint enfocado en `uis/website/src/app/login/page.tsx` terminó sin errores. El `npm run lint` completo de website no se ha repetido después de esa corrección.
- No se ha registrado una prueba end-to-end reciente que ejecute los flujos de autenticación del frontend contra FastAPI.

## Próximos pasos

1. Validar contra FastAPI en ejecución el ciclo registro → login → `GET /auth/me` → lectura y actualización del perfil, desde los clientes que usan esos flujos.
2. Comprobar respuestas para credenciales inválidas, token ausente/expirado, usuario duplicado y errores de validación; añadir o actualizar pruebas automatizadas donde corresponda.
3. Confirmar `API_URL`, `NEXT_PUBLIC_API_URL` y la configuración JWT del entorno de despliegue, sin guardar secretos en el repositorio.
4. Evaluar TinyDB y el almacenamiento actual de JWT para producción. Refresh tokens, cookies httpOnly y protecciones CSRF no se deben considerar implementados hasta verificarlos en cliente y servidor.
5. Revisar el estado completo del working tree y seleccionar explícitamente los archivos antes de organizar commits.

Mantener esta página alineada con el código y las validaciones ejecutadas. No registrar secretos ni datos personales.