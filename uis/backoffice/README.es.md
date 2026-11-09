# Backoffice de Nexova

Interfaz estática independiente para consultar condiciones operativas y analizar archivos CSV de incidencias. El análisis usa la API existente en `services/api/`; este directorio no implementa ni duplica el backend.

Desde la raíz del monorepo, inicia el servidor compatible con los orígenes CORS locales de la API:

```bash
python3 -m http.server 5500 --bind 0.0.0.0 --directory uis/backoffice
```

Abre `http://localhost:5500/`. El analizador CSV requiere que la API esté disponible en la URL configurada en el metadato `nexova-api-base-url` de `index.html`.