from collections.abc import Generator
from os import getenv
from pathlib import Path
from threading import Lock
from typing import Optional

from dotenv import load_dotenv
from sqlmodel import SQLModel, Session, create_engine, select
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
        # Forzar el uso de psycopg2 (compatible con psycopg2-binary)
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
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


def init_db():
    """Crea todas las tablas definidas con SQLModel en la base de datos Supabase.

    Debe llamarse al iniciar la aplicación. Si Supabase no está disponible
    (por ejemplo en entornos de test o desarrollo local sin conexión),
    la función registra una advertencia y continúa sin fallar.
    """
    try:
        SQLModel.metadata.create_all(_get_engine())
    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning(
            "No se pudieron crear las tablas en Supabase: %s", exc
        )


def seed_inventory():
    """Inserta los datos semilla de inventario si la tabla de activos está vacía.

    Crea los Assets, AssetEntries y AssetExits definidos en el briefing.
    Es seguro ejecutarlo múltiples veces (usa comprobación de tabla vacía).
    Si Supabase no está disponible, registra una advertencia y continúa.
    """
    from datetime import datetime, timezone

    from models import Asset, AssetEntry, AssetExit

    try:
        engine = _get_engine()
    except RuntimeError:
        return  # Supabase no disponible, saltar seed

    try:
        with Session(engine) as session:
            # Solo sembrar si no hay activos todavía
            existing = session.exec(select(Asset).limit(1)).first()
            if existing is not None:
                return

            logger = logging.getLogger(__name__)

            # ── Assets ────────────────────────────────────────────────
            assets_data = [
                Asset(name='Portátil 14" Business', sku="NXV-IT-001", category="hardware", office="Valencia"),
                Asset(name='Portátil 14" Business', sku="NXV-IT-002", category="hardware", office="Miami"),
                Asset(name="Ratón ergonómico",       sku="NXV-PER-001", category="peripherals",     office="Valencia"),
                Asset(name="Hub USB-C",              sku="NXV-PER-002", category="peripherals",     office="Miami"),
                Asset(name="Resma de papel A4",      sku="NXV-OFF-001", category="office_supplies",  office="Valencia"),
                Asset(name="Cuaderno de formación en liderazgo", sku="NXV-TRN-001", category="training_materials", office="Valencia"),
            ]
            session.add_all(assets_data)
            session.commit()
            for a in assets_data:
                session.refresh(a)
            logger.info("Sembrados %d activos en Supabase", len(assets_data))

            # Mapa SKU → ID
            sku_to_id = {a.sku: a.id for a in assets_data}

            # ── AssetEntries ──────────────────────────────────────────
            now = datetime.now(timezone.utc)
            entries_data = [
                AssetEntry(
                    asset_id=sku_to_id["NXV-IT-001"], quantity=10,
                    supplier="TechDistrib Valencia S.L.", office="Valencia",
                    created_at=now, user_uuid="seed-system",
                ),
                AssetEntry(
                    asset_id=sku_to_id["NXV-IT-001"], quantity=5,
                    supplier="TechDistrib Valencia S.L.", office="Valencia",
                    created_at=now, user_uuid="seed-system",
                ),
                AssetEntry(
                    asset_id=sku_to_id["NXV-PER-001"], quantity=20,
                    supplier="TechDistrib Valencia S.L.", office="Valencia",
                    created_at=now, user_uuid="seed-system",
                ),
                AssetEntry(
                    asset_id=sku_to_id["NXV-OFF-001"], quantity=50,
                    supplier="Office Depot Miami", office="Valencia",
                    created_at=now, user_uuid="seed-system",
                ),
            ]
            session.add_all(entries_data)
            session.commit()
            logger.info("Sembradas %d entradas de inventario en Supabase", len(entries_data))

            # ── AssetExits ────────────────────────────────────────────
            exits_data = [
                AssetExit(
                    asset_id=sku_to_id["NXV-IT-001"], quantity=3,
                    exit_type="allocation", assigned_to="Ana López",
                    office="Valencia", created_at=now, user_uuid="seed-system",
                ),
                AssetExit(
                    asset_id=sku_to_id["NXV-PER-001"], quantity=5,
                    exit_type="allocation", assigned_to="Carlos Ruiz",
                    office="Valencia", created_at=now, user_uuid="seed-system",
                ),
                AssetExit(
                    asset_id=sku_to_id["NXV-OFF-001"], quantity=10,
                    exit_type="consumption", assigned_to=None,
                    office="Valencia", created_at=now, user_uuid="seed-system",
                ),
            ]
            session.add_all(exits_data)
            session.commit()
            logger.info("Sembradas %d salidas de inventario en Supabase", len(exits_data))
    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning(
            "No se pudieron sembrar datos de inventario: %s", exc
        )
