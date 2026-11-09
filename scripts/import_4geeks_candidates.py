import argparse
import json
import os
import shutil
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from pydantic import ValidationError
from tinydb import Query, TinyDB

from models import CandidateNoteCreate, CandidateRecordCreate


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATABASE = ROOT / "services/api/data/db.json"
SOURCE_URL = "https://playground.4geeks.com/tracker/api/v1/records"
EXPECTED_RECORDS = 100
PAGE_SIZE = 100
RECORD_FIELDS = tuple(CandidateRecordCreate.model_fields)


class ImportFailure(Exception):
    pass


def fetch_candidates() -> list[dict[str, object]]:
    candidates: list[dict[str, object]] = []
    expected_total: int | None = None
    page = 1

    while expected_total is None or len(candidates) < expected_total:
        query = urlencode({"page": page, "limit": PAGE_SIZE})
        request = Request(
            f"{SOURCE_URL}?{query}",
            headers={"Accept": "application/json", "User-Agent": "Nexova-candidate-import/1.0"},
        )
        try:
            with urlopen(request, timeout=20) as response:
                payload = json.load(response)
        except (HTTPError, URLError, TimeoutError, OSError, json.JSONDecodeError) as error:
            raise ImportFailure(
                f"No se pudieron recuperar candidaturas de 4Geeks ({type(error).__name__})."
            ) from error

        if not isinstance(payload, dict) or not isinstance(payload.get("data"), list):
            raise ImportFailure("La API de 4Geeks devolvio una respuesta inesperada.")
        total = payload.get("total")
        batch = payload["data"]
        if not isinstance(total, int) or isinstance(total, bool) or total != EXPECTED_RECORDS:
            raise ImportFailure(
                f"Se esperaban {EXPECTED_RECORDS} candidaturas; la API informa {total!r}."
            )
        if expected_total is not None and total != expected_total:
            raise ImportFailure("El total de candidaturas cambio durante la descarga.")
        expected_total = total
        if not batch:
            raise ImportFailure("La API devolvio una pagina vacia antes de completar la descarga.")
        if not all(isinstance(record, dict) for record in batch):
            raise ImportFailure("La API devolvio una candidatura con formato no valido.")
        candidates.extend(batch)
        page += 1

    if len(candidates) != EXPECTED_RECORDS:
        raise ImportFailure(f"Se recuperaron {len(candidates)} candidaturas, no {EXPECTED_RECORDS}.")

    external_ids = [record.get("id") for record in candidates]
    if any(not isinstance(external_id, str) or not external_id for external_id in external_ids):
        raise ImportFailure("Todas las candidaturas deben tener un ID externo string no vacio.")
    if len(set(external_ids)) != EXPECTED_RECORDS:
        raise ImportFailure("La descarga contiene IDs de candidatura duplicados.")

    seen_note_ids: set[tuple[str, str]] = set()
    for candidate in candidates:
        try:
            CandidateRecordCreate.model_validate(
                {field: candidate[field] for field in RECORD_FIELDS if field in candidate}
            )
        except (KeyError, ValidationError) as error:
            raise ImportFailure("Una candidatura contiene campos requeridos no validos.") from error

        notes = candidate.get("notes", [])
        if not isinstance(notes, list):
            raise ImportFailure("Una candidatura contiene notas con formato no valido.")
        for note in notes:
            if not isinstance(note, dict):
                raise ImportFailure("La API devolvio una nota con formato no valido.")
            note_id = note.get("id")
            note_record_id = note.get("record_id")
            if (
                not isinstance(note_id, str)
                or not note_id
                or note_record_id != candidate["id"]
                or not isinstance(note.get("created_at"), str)
            ):
                raise ImportFailure("Una nota no tiene ID, fecha o candidatura de origen validos.")
            try:
                CandidateNoteCreate.model_validate({"content": note.get("content")})
                datetime.fromisoformat(note["created_at"].replace("Z", "+00:00"))
            except (ValidationError, ValueError) as error:
                raise ImportFailure("Una nota contiene campos requeridos no validos.") from error
            note_key = (str(candidate["id"]), note_id)
            if note_key in seen_note_ids:
                raise ImportFailure("La descarga contiene IDs de nota duplicados.")
            seen_note_ids.add(note_key)

    return candidates


def create_backup(database_path: Path) -> Path:
    if not database_path.is_file():
        raise ImportFailure("No existe la TinyDB actual; no se importara sin una copia de seguridad.")
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
    backup_path = database_path.with_name(f"{database_path.name}.backup-{timestamp}")
    if backup_path.exists():
        raise ImportFailure("Ya existe una copia con la fecha actual; no se sobrescribira.")
    try:
        shutil.copy2(database_path, backup_path)
        os.chmod(backup_path, 0o600)
        if backup_path.read_bytes() != database_path.read_bytes():
            raise ImportFailure("La copia de seguridad no coincide con la base original.")
    except OSError as error:
        raise ImportFailure(f"No se pudo crear la copia de seguridad ({type(error).__name__}).") from error
    return backup_path


def merge_candidates(database_path: Path, candidates: list[dict[str, object]]) -> tuple[int, int, Path]:
    backup_path = create_backup(database_path)
    database_path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(
        prefix=f".{database_path.name}.import-",
        suffix=".tmp",
        dir=database_path.parent,
    )
    os.close(descriptor)
    temporary_path = Path(temporary_name)

    try:
        shutil.copy2(database_path, temporary_path)
        imported = 0
        imported_notes = 0
        external_to_local_id: dict[str, int] = {}
        candidate_query = Query()
        note_query = Query()

        with TinyDB(temporary_path, create_dirs=True, indent=2, ensure_ascii=False) as database:
            records = database.table("records")
            notes_table = database.table("record_notes")
            for candidate in candidates:
                external_id = str(candidate["id"])
                matches = records.search(candidate_query.external_id == external_id)
                if len(matches) > 1:
                    raise ImportFailure("La TinyDB ya contiene candidaturas duplicadas por ID externo.")
                if matches:
                    record_document = matches[0]
                    local_id = record_document.doc_id
                else:
                    stored_candidate = dict(candidate)
                    stored_candidate["external_id"] = external_id
                    local_id = records.insert(stored_candidate)
                    imported += 1
                external_to_local_id[external_id] = local_id

                for note in candidate.get("notes", []):
                    note_id = str(note["id"])
                    note_matches = notes_table.search(
                        (note_query.external_id == note_id)
                        & (note_query.external_record_id == external_id)
                    )
                    if len(note_matches) > 1:
                        raise ImportFailure("La TinyDB ya contiene notas duplicadas por ID externo.")
                    if note_matches:
                        continue
                    stored_note = dict(note)
                    stored_note["external_id"] = note_id
                    stored_note["external_record_id"] = external_id
                    stored_note["record_id"] = local_id
                    stored_note["updated_at"] = None
                    stored_note["created_by"] = None
                    notes_table.insert(stored_note)
                    imported_notes += 1

            stored_external_ids = {
                document.get("external_id")
                for document in records.all()
                if document.get("external_id") is not None
            }
            expected_ids = {str(candidate["id"]) for candidate in candidates}
            if not expected_ids.issubset(stored_external_ids):
                raise ImportFailure("La verificacion posterior detecto candidaturas faltantes.")
            if len(stored_external_ids & expected_ids) != EXPECTED_RECORDS:
                raise ImportFailure("La verificacion posterior detecto IDs de candidatura duplicados.")

            for candidate in candidates:
                external_id = str(candidate["id"])
                local_id = external_to_local_id[external_id]
                expected_note_ids = {
                    str(note["id"]) for note in candidate.get("notes", [])
                }
                stored_note_ids = {
                    document.get("external_id")
                    for document in notes_table.search(note_query.external_record_id == external_id)
                }
                if not expected_note_ids.issubset(stored_note_ids):
                    raise ImportFailure("La verificacion posterior detecto notas faltantes.")
                if records.get(doc_id=local_id) is None:
                    raise ImportFailure("La verificacion posterior detecto un registro no persistido.")

        os.replace(temporary_path, database_path)
        return imported, imported_notes, backup_path
    except ImportFailure:
        raise
    except (OSError, ValueError, TypeError, KeyError) as error:
        raise ImportFailure(f"No se pudo completar la importacion ({type(error).__name__}).") from error
    finally:
        temporary_path.unlink(missing_ok=True)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Importa candidaturas de 4Geeks sin sobrescribir datos locales.")
    parser.add_argument("--db", type=Path, default=DEFAULT_DATABASE, help="Ruta de la TinyDB local")
    parser.add_argument(
        "--confirm-backend-stopped",
        action="store_true",
        help="Confirma que el backend esta detenido durante la sustitucion atomica de TinyDB",
    )
    args = parser.parse_args(argv)
    if not args.confirm_backend_stopped:
        print("Deten el backend y vuelve a ejecutar con --confirm-backend-stopped.", file=sys.stderr)
        return 1

    try:
        candidates = fetch_candidates()
        imported, imported_notes, backup_path = merge_candidates(args.db, candidates)
    except ImportFailure as error:
        print(f"Importacion interrumpida: {error}", file=sys.stderr)
        return 1
    except OSError as error:
        print(
            f"Importacion interrumpida por un fallo de lectura/escritura ({type(error).__name__}).",
            file=sys.stderr,
        )
        return 1

    print(
        f"Importacion verificada: {len(candidates)} candidaturas, "
        f"{len({str(candidate['id']) for candidate in candidates})} IDs unicos, "
        f"{imported} candidaturas nuevas y {imported_notes} notas importadas."
    )
    print(f"Copia de seguridad creada: {backup_path.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())