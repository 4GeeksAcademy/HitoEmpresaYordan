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
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Abre `http://localhost:3000` e inicia sesión con una cuenta del backend local.
El Tracker usa el proxy local `/backend` tanto para autenticación como para
candidaturas; los tokens locales no se envían a la API de 4Geeks. La importación
inicial desde 4Geeks se realiza una sola vez con
`scripts/import_4geeks_candidates.py`; después, el backend local es la fuente
persistente y el Tracker no necesita que la API externa esté disponible.

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

El panel principal incluye un resumen independiente que consulta
`GET /api/incidents/summary` mediante el mismo proxy autenticado. Muestra el
total y los conteos por estado, categoría, origen y sede con barras proporcionales;
la fuente «Registros reales» mantiene todas las categorías visibles con valor cero
cuando la base está vacía. La fuente «Referencia del briefing» muestra los conteos
históricos esperados, identificados como referencia y no como incidencias importadas.
Valida la estructura, los conteos y la coherencia de los totales antes de mostrarlos.

La consulta de métricas no bloquea la carga ni los controles de candidaturas.
Mientras espera muestra carga; tras 5 segundos avisa de la demora y tras 20 segundos
cancela la petición y ofrece reintento. Los errores de red, API o formato solo
afectan al resumen. Al abandonar la página, cancela la petición y sus temporizadores.

## Catálogos Oficiales

Los catálogos de incidencias se extraen del documento de empresa cuyo nombre real
es `company-BRIEFIING`. Se mantienen en
`packages/shared/src/nexova_shared/incident_catalog.json`, compartido con Python.
Las sedes muestran exactamente sus nombres oficiales. Categorías, estados y
orígenes muestran los códigos del briefing, sin traducciones abreviadas inventadas;
sus descripciones literales aparecen bajo los selectores del registro y como
información asociada en listado y métricas. `remote` conserva su nombre completo
y sigue siendo una sede distinta de `central` y `valencia_operations`.

Los conteos esperados del seed (96 incidencias) se muestran en el resumen del
inicio y de `/incidents` mediante «Referencia del briefing»: 27 `open`, 56
`resolved`, 13 `discarded`; 49 `technical_failure`, 35 `process_error` y 12
`client_complaint`. El origen `customer` y la sede `central` suman 96 cada uno,
según las reglas de importación del briefing; los demás valores quedan en cero.
La referencia se muestra mientras se consulta la API y cuando no hay registros.
Con datos reales disponibles, la selección automática usa la API; el usuario
puede alternar ambas fuentes en cualquier momento. Las cifras de referencia no
se insertan en la base ni generan filas ficticias en el listado. Los filtros del
listado se aplican exclusivamente a registros reales, no a estos agregados.
