from pathlib import Path
from threading import Lock

from tinydb import TinyDB

# Ruta absoluta para que el archivo sea el mismo sin importar desde dónde se arranque el servidor o el seed
DB_PATH = Path(__file__).resolve().parent / "data" / "suppliers.json"

db = TinyDB(DB_PATH, create_dirs=True, indent=2, ensure_ascii=False)
suppliers_table = db.table("suppliers")

# TinyDB no es thread-safe y FastAPI ejecuta los endpoints síncronos en un pool de hilos
db_lock = Lock()
