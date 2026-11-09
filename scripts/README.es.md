# Carpeta `scripts`

Esta carpeta contiene **scripts auxiliares** del monorepo: automatizaciones de desarrollo, utilidades de mantenimiento, tareas repetitivas (setup, lint, migraciones, generación de datos, etc.) y tooling interno.

- **Propósito principal**: agrupar herramientas de soporte que no pertenecen a una app/agente/pipeline específico, pero facilitan el trabajo del equipo.
- **Recomendación**: documenta cada script (qué hace, parámetros, requisitos, ejemplos de uso) y procura que sean reproducibles (y seguros) en distintos entornos.

## Seed de incidencias

Desde la raíz del repositorio:

```sh
uv sync --package nexova-suppliers-api
uv run --package nexova-suppliers-api python scripts/seed_incidents.py /ruta/incidents-nexova.csv
```

Sin argumento CSV, busca `content/contexts/incidents-file-analysis/incidents-nexova.csv`
en el repositorio. El fichero histórico no está incluido actualmente.
Por defecto escribe en `services/api/data/db.json`, la misma base que utiliza la API.
Puedes seleccionar una base distinta con `--db /ruta/pruebas.json`.

El script reutiliza `nexova_shared` para validar y transformar cada fila. Inserta
los registros válidos en `incidents`, siempre con `origin="customer"` y
`branch="central"`. Al finalizar muestra los totales y el detalle de las filas
descartadas, con línea del CSV, `ticket_id` y motivo del error.

Las claves de deduplicación se guardan en la tabla auxiliar `incident_imports`:
se usa `ticket_id` o, cuando falta, la combinación de título y fecha UTC.
El identificador del CSV no se guarda dentro de la incidencia. Conserva ambas
tablas para mantener la idempotencia entre ejecuciones. Los duplicados se omiten;
no se actualizan registros importados anteriormente.

Ejecuta el seed de forma secuencial y con la API detenida: TinyDB no coordina
escrituras entre procesos. Las filas inválidas no impiden importar las válidas;
los errores de archivo, cabecera o sintaxis CSV interrumpen la ejecución con
código 1. Si la importación se interrumpe después de insertar algunas filas,
puedes volver a ejecutarla para continuar sin duplicar las ya registradas.
