from fastapi import FastAPI

from auth import router as auth_router
from profiles import router as profiles_router
from routes.suppliers import router as suppliers_router
from users import router as users_router

app = FastAPI(title="Nexova Suppliers API", version="0.1.0")
app.include_router(suppliers_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(profiles_router)


@app.get("/")
def welcome() -> dict[str, str]:
	return {"message": "Bienvenido a la API de Nexova"}
