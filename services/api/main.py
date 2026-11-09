from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth import router as auth_router
from profiles import router as profiles_router
from routes.incidents import router as incidents_router
from routes.records import router as records_router
from routes.suppliers import router as suppliers_router
from users import router as users_router

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


@app.get("/")
def welcome() -> dict[str, str]:
	return {"message": "Bienvenido a la API de Nexova"}
