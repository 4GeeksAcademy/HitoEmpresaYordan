import json
import os
from datetime import datetime
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen

from pydantic import ValidationError

from models import CandidateNoteCreate, CandidateRecordCreate


BASE_URL = os.getenv(
    "TRACKER_API_BASE_URL",
    "https://playground.4geeks.com/tracker/api/v1",
).rstrip("/")
TIMEOUT_SECONDS = float(os.getenv("TRACKER_API_TIMEOUT_SECONDS", "15"))
PAGE_SIZE = 100
RECORD_FIELDS = tuple(CandidateRecordCreate.model_fields)
REMOTE_RECORD_FIELDS = (
    "full_name",
    "email",
    "phone",
    "position",
    "linkedin_url",
    "cv_url",
    "experience_years",
)


class ExternalTrackerError(Exception):
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


def _request(path: str, method: str = "GET", payload: dict[str, object] | None = None) -> object:
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = Request(
        f"{BASE_URL}/{path.lstrip('/')}",
        data=body,
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Nexova-candidate-sync/1.0",
        },
        method=method,
    )
    try:
        with urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            if response.status == 204:
                return None
            try:
                return json.load(response)
            except (UnicodeError, json.JSONDecodeError) as error:
                raise ExternalTrackerError("El servicio externo devolvió una respuesta no válida.") from error
    except HTTPError as error:
        raise ExternalTrackerError(
            f"El servicio externo respondió HTTP {error.code}.", error.code
        ) from error
    except (URLError, TimeoutError, OSError) as error:
        raise ExternalTrackerError(
            f"No se pudo conectar con el servicio externo ({type(error).__name__})."
        ) from error


def _unwrap_record(payload: object) -> dict[str, object]:
    if isinstance(payload, dict) and isinstance(payload.get("data"), dict):
        payload = payload["data"]
    if not isinstance(payload, dict):
        raise ExternalTrackerError("El servicio externo devolvió una candidatura no válida.")
    return payload


def _validate_record(record: dict[str, object]) -> str:
    external_id = record.get("id")
    if not isinstance(external_id, str) or not external_id:
        raise ExternalTrackerError("El servicio externo devolvió una candidatura sin ID válido.")
    try:
        CandidateRecordCreate.model_validate(
            {field: record[field] for field in RECORD_FIELDS if field in record}
        )
    except (KeyError, ValidationError) as error:
        raise ExternalTrackerError("El servicio externo devolvió una candidatura con datos no válidos.") from error

    if "notes" in record:
        notes = record["notes"]
        if not isinstance(notes, list):
            raise ExternalTrackerError("El servicio externo devolvió notas con formato no válido.")
        note_ids: set[str] = set()
        for note in notes:
            if not isinstance(note, dict):
                raise ExternalTrackerError("El servicio externo devolvió una nota no válida.")
            note_id = note.get("id")
            if (
                not isinstance(note_id, str)
                or not note_id
                or str(note.get("record_id")) != external_id
                or not isinstance(note.get("created_at"), str)
            ):
                raise ExternalTrackerError("El servicio externo devolvió una nota sin referencias válidas.")
            try:
                CandidateNoteCreate.model_validate({"content": note.get("content")})
                datetime.fromisoformat(note["created_at"].replace("Z", "+00:00"))
            except (ValidationError, ValueError) as error:
                raise ExternalTrackerError("El servicio externo devolvió una nota con datos no válidos.") from error
            if note_id in note_ids:
                raise ExternalTrackerError("El servicio externo devolvió IDs de nota duplicados.")
            note_ids.add(note_id)
    return external_id


def fetch_records() -> list[dict[str, object]]:
    records: list[dict[str, object]] = []
    external_ids: set[str] = set()
    expected_total: int | None = None
    page = 1
    while expected_total is None or len(records) < expected_total:
        query = urlencode({"page": page, "limit": PAGE_SIZE})
        payload = _request(f"records?{query}")
        if not isinstance(payload, dict) or not isinstance(payload.get("data"), list):
            raise ExternalTrackerError("El listado externo de candidaturas no tiene un formato válido.")
        total = payload.get("total")
        batch = payload["data"]
        if not isinstance(total, int) or isinstance(total, bool) or total < 0:
            raise ExternalTrackerError("El servicio externo no informó un total válido de candidaturas.")
        if expected_total is not None and total != expected_total:
            raise ExternalTrackerError("El total remoto cambió durante la sincronización.")
        expected_total = total
        if not batch and len(records) < expected_total:
            raise ExternalTrackerError("El servicio externo devolvió una página incompleta.")
        for candidate in batch:
            if not isinstance(candidate, dict):
                raise ExternalTrackerError("El listado externo contiene una candidatura no válida.")
            external_id = _validate_record(candidate)
            if external_id in external_ids:
                raise ExternalTrackerError("El listado externo contiene IDs de candidatura duplicados.")
            external_ids.add(external_id)
            records.append(candidate)
        if len(records) > expected_total:
            raise ExternalTrackerError("El listado externo excede el total anunciado.")
        page += 1

    if len(records) != expected_total:
        raise ExternalTrackerError("No se pudo descargar el listado remoto completo.")
    return records


def fetch_record(external_id: str) -> dict[str, object]:
    record = _unwrap_record(_request(f"records/{quote(external_id, safe='')}") )
    returned_id = _validate_record(record)
    if returned_id != external_id:
        raise ExternalTrackerError("El servicio externo devolvió un ID distinto al solicitado.")
    return record


def fetch_notes(external_id: str) -> list[dict[str, object]]:
    payload = _request(f"records/{quote(external_id, safe='')}/notes")
    if isinstance(payload, dict) and isinstance(payload.get("data"), list):
        payload = payload["data"]
    if not isinstance(payload, list):
        raise ExternalTrackerError("El servicio externo devolvió una lista de notas no válida.")
    note_ids: set[str] = set()
    for note in payload:
        if (
            not isinstance(note, dict)
            or not isinstance(note.get("id"), str)
            or not note["id"]
            or str(note.get("record_id")) != external_id
            or not isinstance(note.get("created_at"), str)
        ):
            raise ExternalTrackerError("El servicio externo devolvió una nota no válida.")
        try:
            CandidateNoteCreate.model_validate({"content": note.get("content")})
            datetime.fromisoformat(note["created_at"].replace("Z", "+00:00"))
        except (ValidationError, ValueError) as error:
            raise ExternalTrackerError("El servicio externo devolvió una nota con datos no válidos.") from error
        if note["id"] in note_ids:
            raise ExternalTrackerError("El servicio externo devolvió IDs de nota duplicados.")
        note_ids.add(note["id"])
    return payload


def create_record(payload: CandidateRecordCreate) -> dict[str, object]:
    record_payload = payload.model_dump(mode="json", include=set(REMOTE_RECORD_FIELDS))
    record = _unwrap_record(_request("records", "POST", record_payload))
    _validate_record(record)
    return record


def update_record(external_id: str, payload: CandidateRecordCreate) -> dict[str, object]:
    record_payload = payload.model_dump(mode="json", include=set(REMOTE_RECORD_FIELDS))
    record = _unwrap_record(
        _request(f"records/{quote(external_id, safe='')}", "PUT", record_payload)
    )
    returned_id = _validate_record(record)
    if returned_id != external_id:
        raise ExternalTrackerError("El servicio externo devolvió un ID distinto al actualizado.")
    return record


def patch_record(external_id: str, payload: dict[str, str]) -> dict[str, object]:
    record = _unwrap_record(
        _request(f"records/{quote(external_id, safe='')}", "PATCH", payload)
    )
    returned_id = _validate_record(record)
    if returned_id != external_id:
        raise ExternalTrackerError("El servicio externo devolvió un ID distinto al actualizado.")
    return record


def delete_record(external_id: str) -> None:
    _request(f"records/{quote(external_id, safe='')}", "DELETE")


def create_note(external_id: str, payload: CandidateNoteCreate) -> dict[str, object]:
    result = _request(
        f"records/{quote(external_id, safe='')}/notes",
        "POST",
        {"content": payload.content},
    )
    if isinstance(result, dict) and isinstance(result.get("data"), dict):
        result = result["data"]
    if not isinstance(result, dict) or not isinstance(result.get("id"), str):
        raise ExternalTrackerError("El servicio externo devolvió una nota no válida.")
    if str(result.get("record_id")) != external_id:
        raise ExternalTrackerError("La nota remota está vinculada a otra candidatura.")
    return result


def delete_note(external_id: str, note_id: str) -> None:
    _request(
        f"records/{quote(external_id, safe='')}/notes/{quote(note_id, safe='')}",
        "DELETE",
    )