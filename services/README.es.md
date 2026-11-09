# Carpeta `services`

Esta carpeta contiene **todos los servicios backend** (APIs y workers en segundo plano) relacionados con la compañía para el proyecto transversal de AI Engineering.

Cada subcarpeta dentro de `services/` debe corresponder a **un servicio concreto** (por ejemplo `admin-api`, `data-processor-worker`) e incluir su propia documentación técnica y funcional.

- **Propósito principal**: centralizar toda la lógica backend, APIs y consumidores de colas que dan soporte a los casos de uso de la compañía.
- **Recomendación**: documenta en este archivo (o en sub-READMEs) los servicios que vayas añadiendo, su objetivo, tecnología usada y cómo ejecutarlos.

## Recuperacion de contrasena (AUTH-03)

La API en `services/api` utiliza Resend mediante HTTPS, sin dependencias adicionales.
Configura estas variables en el entorno del servidor (o en su `.env` local, nunca versionado):

- `JWT_SECRET`: secreto de firma JWT ya utilizado por la autenticacion.
- `RESEND_API_KEY`: clave privada de Resend, obtenida exclusivamente del entorno.
- `RESEND_FROM_EMAIL`: remitente de un dominio verificado en Resend.
- `APP_BASE_URL`: URL publica del frontend, sin parametros ni fragmentos; usar HTTPS en produccion.

`POST /auth/forgot-password` recibe `{ "email": "persona@example.com" }` y responde
200 con el mismo mensaje para cuentas existentes y desconocidas. El envio se realiza
en segundo plano; los errores del proveedor no cambian la respuesta ni registran secretos.
El correo contiene un enlace `/reset-password?token=...` que caduca en 30 minutos.

`POST /auth/reset-password` recibe `{ "token": "...", "new_password": "..." }`.
Rechaza con 400 los tokens invalidos, caducados o ya utilizados. Solo es valido el
ultimo enlace solicitado; su estado se guarda en TinyDB y se consume junto con la
actualizacion de contrasena bajo el bloqueo compartido.

`POST /auth/change-password` requiere `Authorization: Bearer <access_token>` y
recibe `{ "current_password": "...", "new_password": "..." }`. Una contrasena actual
incorrecta produce 400; una sesion invalida o ausente produce 401. Ambos cambios
guardan un hash bcrypt e invalidan la recuperacion pendiente. Las contrasenas nuevas
deben tener al menos 8 caracteres y no superar los 72 bytes admitidos por bcrypt.

El frontend debe implementar la pagina `/reset-password`; estos endpoints solo
cubren el backend. TinyDB y su bloqueo son de un unico proceso: ejecutar con un solo
worker. Para varios procesos, migrar la actualizacion y el consumo a una transaccion
en una base de datos que soporte concurrencia multiproceso.
