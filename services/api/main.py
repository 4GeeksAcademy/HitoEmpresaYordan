import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from auth import router as auth_router
from profiles import router as profiles_router
from routes.incidents import router as incidents_router
from routes.records import router as records_router
from routes.suppliers import router as suppliers_router
from users import router as users_router

logger = logging.getLogger(__name__)

app = FastAPI(title="Nexova Suppliers API", version="0.1.0")
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
