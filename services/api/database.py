from pathlib import Path
from threading import Lock

from tinydb import TinyDB

# Ruta absoluta para que el archivo sea el mismo sin importar desde dónde se arranque el servidor o el seed
DB_PATH = Path(__file__).resolve().parent / "data" / "db.json"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

db = TinyDB(DB_PATH, create_dirs=True, indent=2, ensure_ascii=False)
suppliers_table = db.table("suppliers")
records_table = db.table("records")
record_notes_table = db.table("record_notes")
users_table = db.table("users")
profiles_table = db.table("profiles")

# TinyDB no es thread-safe y FastAPI ejecuta los endpoints síncronos en un pool de hilos
db_lock = Lock()
