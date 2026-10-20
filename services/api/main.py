from fastapi import FastAPI

from routes.suppliers import router as suppliers_router

app = FastAPI(title="Nexova Suppliers API", version="0.1.0")
app.include_router(suppliers_router)
