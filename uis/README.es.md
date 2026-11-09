# Carpeta `uis`

Esta carpeta contiene **todas las interfaces de usuario** relacionadas con la compañía para el proyecto transversal de AI Engineering (por ejemplo: aplicaciones web, dashboards internos, portales de clientes, apps de Streamlit/Gradio, etc.).

Cada subcarpeta dentro de `uis/` debe corresponder a **una interfaz de usuario concreta** (por ejemplo `website`, `backoffice`) e incluir su propia documentación técnica y funcional.

- **Propósito principal**: centralizar en un único lugar todas las aplicaciones frontend que dan soporte a los casos de uso de la compañía.
- **Recomendación**: documenta en este archivo (o en sub-READMEs) las aplicaciones que vayas añadiendo, su objetivo, tecnología usada y cómo ejecutarlas.

## Gestión de incidencias

La aplicación principal está en `talent-pipeline-tracker`. El menú del panel
incluye el listado `/incidents` y el registro `/incidents/new`.

Para trabajar con autenticación e incidencias del backend local, inicia primero
la API desde la raíz del repositorio:

```sh
uv run --package nexova-suppliers-api uvicorn main:app --app-dir services/api --host 0.0.0.0 --port 8000
```

En otra terminal, inicia el frontend:

```sh
cd uis/talent-pipeline-tracker
NEXT_PUBLIC_API_URL=/backend npm run dev -- --hostname 0.0.0.0 --port 3000
```

Abre `http://localhost:3000` e inicia sesión con una cuenta del backend local.
Los tokens del servicio remoto de candidatos no deben utilizarse para autenticar
peticiones contra otra API. `NEXT_PUBLIC_API_URL=/backend` permite que el login
y los demás consumidores usen el mismo backend durante esta sesión de desarrollo;
no modifica la configuración remota existente en los archivos de entorno.

Las peticiones de incidencias usan siempre `/backend/api/incidents`, con el token
de la sesión existente. El proxy Next.js apunta por defecto a
`http://127.0.0.1:8000`. Puedes cambiar su destino con `INCIDENTS_API_URL` al
arrancar Next.js; esta variable es de servidor y no debe contener credenciales.

El registro incluye los seis campos editables, sede obligatoria y metadatos de
solo lectura. Tras guardar, muestra confirmación y limpia los campos editables.
Los errores de validación se asocian a los controles; si falla el envío, conserva
los datos introducidos. El listado incluye los cuatro filtros, carga, vacío,
errores con reintento y cambio de estado por fila. Los cambios fallidos revierten
al valor anterior; los estados finales no se pueden editar. Durante un cambio
de estado se bloquean los filtros para evitar que una recarga sustituya la fila
pendiente. Los tipos y catálogos TypeScript están en `packages/shared/types/incidents.ts`.
