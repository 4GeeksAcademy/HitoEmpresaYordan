from collections.abc import Generator
from os import getenv
from pathlib import Path
from threading import Lock
from typing import Optional

from dotenv import load_dotenv
from sqlmodel import Session, create_engine
from tinydb import TinyDB

load_dotenv(Path(__file__).with_name(".env"))

# ──────────────────────────────────────────────
# TinyDB — Autenticación, usuarios y perfiles
# ──────────────────────────────────────────────

DB_PATH = Path(__file__).resolve().parent / "data" / "db.json"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

db = TinyDB(DB_PATH, create_dirs=True, indent=2, ensure_ascii=False)
incidents_table = db.table("incidents")
suppliers_table = db.table("suppliers")
records_table = db.table("records")
record_notes_table = db.table("record_notes")
users_table = db.table("users")
profiles_table = db.table("profiles")

# TinyDB no es thread-safe y FastAPI ejecuta los endpoints síncronos en un pool de hilos
db_lock = Lock()

# ──────────────────────────────────────────────
# SQLModel / PostgreSQL — Datos transaccionales (Supabase)
# ──────────────────────────────────────────────

DATABASE_URL: Optional[str] = None
_engine = None


def _get_engine():
    """Retorna el engine de SQLModel, inicializándolo la primera vez."""
    global _engine, DATABASE_URL
    if _engine is None:
        url = DATABASE_URL or getenv("DATABASE_URL", "")
        if not url:
            raise RuntimeError(
                "DATABASE_URL no está configurada. "
                "Define la variable de entorno en el archivo .env"
            )
        DATABASE_URL = url
        _engine = create_engine(url, pool_pre_ping=True)
    return _engine


def get_db() -> Generator[Session, None, None]:
    """Dependencia FastAPI que provee una sesión de SQLModel por petición.

    Uso en rutas:
        from database import get_db
        from sqlmodel import Session, select

        @router.get("/items")
        def list_items(db: Session = Depends(get_db)):
            return db.exec(select(Item)).all()

    La sesión se cierra automáticamente al finalizar la petición
    gracias al context manager y FastAPI.
    """
    with Session(_get_engine()) as session:
        yield session
