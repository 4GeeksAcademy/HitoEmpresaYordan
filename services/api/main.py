import io
import logging
import re
import sys
from pathlib import Path
from typing import List, Optional, Tuple

API_DIRECTORY = Path(__file__).resolve().parent
PROJECT_ROOT = API_DIRECTORY.parents[1]
for import_path in (API_DIRECTORY, PROJECT_ROOT):
    if str(import_path) not in sys.path:
        sys.path.insert(0, str(import_path))

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from auth import router as auth_router
from profiles import router as profiles_router
from routes.incidents import router as incidents_router
from routes.records import router as records_router
from routes.suppliers import router as suppliers_router
from database import init_db
from shared.incident_analysis import (
    CSVFormatError,
    analyze_csv,
    build_report,
    build_summary,
    metrics_to_csv,
)
from users import router as users_router

logger = logging.getLogger(__name__)

app = FastAPI(title="Nexova Suppliers API", version="0.1.0")
latest_metrics: Optional[List[Tuple[str, str]]] = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(suppliers_router)
app.include_router(incidents_router)
app.include_router(records_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(profiles_router)


@app.on_event("startup")
def on_startup():
    """Inicializa las tablas de SQLModel en Supabase al arrancar la aplicación."""
    try:
        init_db()
        logger.info("Tablas de inventario creadas/verificadas en Supabase")
    except RuntimeError as e:
        logger.warning("Supabase no disponible: %s", e)


@app.exception_handler(RequestValidationError)
async def handle_validation_error(request: Request, error: RequestValidationError) -> JSONResponse:
    details = [
        {
            "loc": [str(part) for part in item.get("loc", ())],
            "msg": item.get("msg", "Dato no válido"),
            "type": item.get("type", "validation_error"),
        }
        for item in error.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={"detail": details, "message": "La solicitud contiene datos no válidos."},
    )


@app.exception_handler(HTTPException)
async def handle_http_error(request: Request, error: HTTPException) -> JSONResponse:
    detail = error.detail if isinstance(error.detail, str) else "No se pudo completar la solicitud."
    return JSONResponse(
        status_code=error.status_code,
        content={"detail": detail},
        headers=error.headers,
    )


@app.middleware("http")
async def handle_unexpected_error(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as error:
        logger.error("Error interno de API (%s)", type(error).__name__)
        return JSONResponse(
            status_code=500,
            content={"detail": "Error interno del servidor. Inténtalo de nuevo más tarde."},
        )


@app.get("/")
def welcome() -> dict[str, str]:
	return {"message": "Bienvenido a la API de Nexova"}


def _safe_upload_filename(filename: Optional[str]) -> str:
    basename = (filename or "upload.csv").replace("\\", "/").rsplit("/", 1)[-1]
    if "@" in basename:
        return "[nombre redactado]"
    return re.sub(r"[\r\n\t]", "_", basename)


@app.post("/api/incidents/analyze")
async def analyze_incidents(file: UploadFile = File(...)):
    global latest_metrics
    content = await file.read()
    print(
        "[Nexova] Archivo recibido: {} ({} bytes)".format(
            _safe_upload_filename(file.filename), len(content)
        ),
        flush=True,
    )
    if not content or not content.strip():
        raise HTTPException(status_code=400, detail="The uploaded CSV file is empty.")

    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="The uploaded file must be a UTF-8 CSV.")

    try:
        result = analyze_csv(io.StringIO(text, newline=""))
    except CSVFormatError as error:
        raise HTTPException(status_code=400, detail=str(error))

    report_lines, metrics = build_report(result)
    latest_metrics = metrics
    for line in report_lines:
        print("[Nexova] {}".format(line), flush=True)
    if result.total_records == 100:
        print("[Nexova] Análisis de las 100 filas completado correctamente.", flush=True)
    else:
        print(
            "[Nexova] Análisis completado correctamente: {} filas procesadas.".format(
                result.total_records
            ),
            flush=True,
        )
    return build_summary(result)


@app.get("/api/incidents/results/export")
async def export_latest_results():
    if latest_metrics is None:
        raise HTTPException(status_code=404, detail="No analysis has been run yet.")
    return Response(
        content=metrics_to_csv(latest_metrics),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="results.csv"'},
    )
