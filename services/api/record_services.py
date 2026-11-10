from functools import wraps
from threading import Lock
from datetime import datetime, timezone
from typing import Callable, Optional, ParamSpec, TypeVar

from tinydb import Query
from tinydb.table import Document

import external_tracker
from database import db_lock, record_notes_table, records_table
from external_tracker import ExternalTrackerError
from models import (
    CandidateNote,
    CandidateNoteCreate,
    CandidateRecord,
    CandidateRecordCreate,
    CandidateRecordPatch,
    utc_now,
)

P = ParamSpec("P")
R = TypeVar("R")
_external_sync_lock = Lock()


def _serialize_external_operation(function: Callable[P, R]) -> Callable[P, R]:
    @wraps(function)
    def wrapped(*args: P.args, **kwargs: P.kwargs) -> R:
        with _external_sync_lock:
            return function(*args, **kwargs)

    return wrapped


def _record_by_external_id(external_id: str) -> Optional[Document]:
    matches = records_table.search(Query().external_id == external_id)
    if len(matches) > 1:
        raise RuntimeError("TinyDB contiene IDs externos duplicados")
    return matches[0] if matches else None


def _get_record_document(record_id: int | str) -> Optional[Document]:
    external_id = str(record_id)
    document = _record_by_external_id(external_id)
    if document is not None:
        return document if not document.get("is_deleted") else None
    if external_id.isdecimal():
        document = records_table.get(doc_id=int(external_id))
        if document is not None and not document.get("is_deleted"):
            return document
    return None


def _to_record(doc: Document) -> CandidateRecord:
    data = dict(doc)
    external_id = data.get("external_id")
    data.pop("id", None)
    data.pop("is_deleted", None)
    data.pop("deleted_at", None)
    return CandidateRecord(id=external_id or doc.doc_id, **data)


def _to_note(doc: Document) -> CandidateNote:
    data = dict(doc)
    external_id = data.pop("external_id", None)
    external_record_id = data.pop("external_record_id", None)
    data.pop("id", None)
    data.pop("is_deleted", None)
    data.pop("deleted_at", None)
    record_id = data.get("record_id")
    if external_record_id is None and record_id is not None:
        parent = records_table.get(doc_id=record_id)
        if parent is not None:
            external_record_id = parent.get("external_id")
    data["record_id"] = external_record_id or record_id
    return CandidateNote(id=external_id or doc.doc_id, **data)


def _persist_remote_record(record: dict[str, object]) -> CandidateRecord:
    external_id = record.get("id")
    if not isinstance(external_id, str) or not external_id:
        raise ExternalTrackerError("El servicio externo confirmó una respuesta sin ID válido.")
    stored = dict(record)
    stored["id"] = external_id
    stored["external_id"] = external_id
    stored["is_deleted"] = False
    stored["deleted_at"] = None

    with db_lock:
        existing = _record_by_external_id(external_id)
        if existing is not None:
            if "notes" not in stored and existing.get("notes") is not None:
                stored["notes"] = existing["notes"]
            records_table.update(stored, doc_ids=[existing.doc_id])
            local_id = existing.doc_id
        else:
            local_id = records_table.insert(stored)
        document = records_table.get(doc_id=local_id)
        if document is None:
            raise RuntimeError("La candidatura confirmada no se pudo persistir en TinyDB")
        if isinstance(record.get("notes"), list):
            _persist_remote_notes(local_id, external_id, record["notes"])
    return _to_record(document)


def _persist_remote_notes(
    local_record_id: int,
    external_record_id: str,
    notes: list[object],
) -> None:
    query = Query()
    active_note_ids: set[str] = set()
    for note in notes:
        if not isinstance(note, dict):
            raise ExternalTrackerError("El servicio externo devolvió una nota no válida.")
        external_note_id = note.get("id")
        if not isinstance(external_note_id, str) or not external_note_id:
            raise ExternalTrackerError("El servicio externo devolvió una nota sin ID válido.")
        active_note_ids.add(external_note_id)
        matches = record_notes_table.search(
            (query.external_id == external_note_id)
            & (query.external_record_id == external_record_id)
        )
        if len(matches) > 1:
            raise RuntimeError("TinyDB contiene IDs externos de nota duplicados")
        stored_note = dict(note)
        stored_note.update({
            "external_id": external_note_id,
            "external_record_id": external_record_id,
            "record_id": local_record_id,
            "is_deleted": False,
            "deleted_at": None,
        })
        if matches:
            record_notes_table.update(stored_note, doc_ids=[matches[0].doc_id])
        else:
            record_notes_table.insert(stored_note)

    for document in record_notes_table.search(query.external_record_id == external_record_id):
        if document.get("external_id") not in active_note_ids and not document.get("is_deleted"):
            record_notes_table.update(
                {"is_deleted": True, "deleted_at": utc_now().isoformat()},
                doc_ids=[document.doc_id],
            )


def _sync_snapshot(records: list[dict[str, object]]) -> None:
    external_ids = [record.get("id") for record in records]
    if any(not isinstance(value, str) or not value for value in external_ids):
        raise ExternalTrackerError("El snapshot remoto contiene IDs no válidos.")
    if len(set(external_ids)) != len(external_ids):
        raise ExternalTrackerError("El snapshot remoto contiene IDs duplicados.")
    remote_ids = set(external_ids)

    with db_lock:
        local_ids = {
            document.get("external_id")
            for document in records_table.all()
            if document.get("external_id") is not None
        }
    for record in records:
        _persist_remote_record(record)

    with db_lock:
        for document in records_table.all():
            external_id = document.get("external_id")
            if external_id in local_ids and external_id not in remote_ids and not document.get("is_deleted"):
                records_table.update(
                    {"is_deleted": True, "deleted_at": utc_now().isoformat()},
                    doc_ids=[document.doc_id],
                )


def _list_local_records() -> list[CandidateRecord]:
    with db_lock:
        documents = [document for document in records_table.all() if not document.get("is_deleted")]
    return [_to_record(document) for document in documents]


@_serialize_external_operation
def list_records() -> list[CandidateRecord]:
    try:
        snapshot = external_tracker.fetch_records()
        _sync_snapshot(snapshot)
    except ExternalTrackerError:
        return _list_local_records()
    return _list_local_records()


@_serialize_external_operation
def get_record(record_id: int | str) -> Optional[CandidateRecord]:
    external_id = str(record_id)
    try:
        remote_record = external_tracker.fetch_record(external_id)
    except ExternalTrackerError as error:
        if error.status_code == 404:
            with db_lock:
                document = _record_by_external_id(external_id)
                if document is not None:
                    records_table.update(
                        {"is_deleted": True, "deleted_at": utc_now().isoformat()},
                        doc_ids=[document.doc_id],
                    )
            return None
        with db_lock:
            document = _get_record_document(record_id)
        if document is None:
            raise
        return _to_record(document)
    return _persist_remote_record(remote_record)


@_serialize_external_operation
def create_record(payload: CandidateRecordCreate) -> CandidateRecord:
    remote_record = external_tracker.create_record(payload)
    return _persist_remote_record(remote_record)


@_serialize_external_operation
def update_record(
    record_id: int | str,
    payload: CandidateRecordCreate,
) -> Optional[CandidateRecord]:
    try:
        remote_record = external_tracker.update_record(str(record_id), payload)
    except ExternalTrackerError as error:
        if error.status_code == 404:
            return None
        raise
    return _persist_remote_record(remote_record)


@_serialize_external_operation
def patch_record(
    record_id: int | str,
    payload: CandidateRecordPatch,
) -> Optional[CandidateRecord]:
    changes = payload.model_dump(exclude_unset=True)
    try:
        remote_record = external_tracker.patch_record(str(record_id), changes)
    except ExternalTrackerError as error:
        if error.status_code == 404:
            return None
        raise
    return _persist_remote_record(remote_record)


@_serialize_external_operation
def delete_record(record_id: int | str) -> bool:
    external_id = str(record_id)
    remote_missing = False
    try:
        external_tracker.delete_record(external_id)
    except ExternalTrackerError as error:
        if error.status_code == 404:
            remote_missing = True
        else:
            raise

    with db_lock:
        document = _record_by_external_id(external_id)
        if document is None and external_id.isdecimal():
            document = records_table.get(doc_id=int(external_id))
        if document is None:
            return remote_missing
        timestamp = utc_now().isoformat()
        records_table.update({"is_deleted": True, "deleted_at": timestamp}, doc_ids=[document.doc_id])
        record_notes_table.update(
            {"is_deleted": True, "deleted_at": timestamp},
            Query().record_id == document.doc_id,
        )
    return True


@_serialize_external_operation
def list_record_notes(record_id: int | str) -> Optional[list[CandidateNote]]:
    with db_lock:
        record = _get_record_document(record_id)
    if record is None:
        try:
            record = _persist_remote_record(external_tracker.fetch_record(str(record_id)))
        except ExternalTrackerError as error:
            if error.status_code == 404:
                return None
            raise
        with db_lock:
            record = _get_record_document(record_id)
    if record is None:
        return None

    external_id = str(record.get("external_id", record_id))
    try:
        remote_notes = external_tracker.fetch_notes(external_id)
    except ExternalTrackerError:
        with db_lock:
            documents = record_notes_table.search(Query().record_id == record.doc_id)
            documents = [document for document in documents if not document.get("is_deleted")]
        return [_to_note(document) for document in documents]

    with db_lock:
        _persist_remote_notes(record.doc_id, external_id, remote_notes)
        documents = record_notes_table.search(Query().record_id == record.doc_id)
        documents = [document for document in documents if not document.get("is_deleted")]
    return [_to_note(document) for document in documents]


@_serialize_external_operation
def create_record_note(
    record_id: int | str,
    payload: CandidateNoteCreate,
    created_by: str,
) -> Optional[CandidateNote]:
    with db_lock:
        record = _get_record_document(record_id)
    if record is None:
        return None
    external_id = str(record.get("external_id", record_id))
    remote_note = external_tracker.create_note(external_id, payload)
    external_note_id = remote_note.get("id")
    if not isinstance(external_note_id, str) or not external_note_id:
        raise ExternalTrackerError("El servicio externo confirmó una nota sin ID válido.")

    note = dict(remote_note)
    note.update({
        "external_id": external_note_id,
        "external_record_id": external_id,
        "record_id": record.doc_id,
        "created_by": created_by,
        "is_deleted": False,
        "deleted_at": None,
    })
    with db_lock:
        matches = record_notes_table.search(
            (Query().external_id == external_note_id)
            & (Query().external_record_id == external_id)
        )
        if matches:
            return _to_note(matches[0])
        note_id = record_notes_table.insert(note)
        document = record_notes_table.get(doc_id=note_id)
    return _to_note(document)


@_serialize_external_operation
def delete_record_note(record_id: int | str, note_id: int | str) -> bool:
    with db_lock:
        record = _get_record_document(record_id)
        if record is None:
            return False
        external_id = str(record.get("external_id", record_id))
        query = Query()
        note = record_notes_table.get(
            (query.record_id == record.doc_id) & (query.external_id == str(note_id))
        )
        if note is None and str(note_id).isdecimal():
            legacy_note = record_notes_table.get(doc_id=int(note_id))
            if legacy_note is not None and legacy_note.get("record_id") == record.doc_id:
                note = legacy_note
        if note is None or note.get("is_deleted"):
            return False
        remote_note_id = str(note.get("external_id", note_id))

    try:
        external_tracker.delete_note(external_id, remote_note_id)
    except ExternalTrackerError as error:
        if error.status_code != 404:
            raise

    with db_lock:
        record_notes_table.update(
            {"is_deleted": True, "deleted_at": utc_now().isoformat()},
            doc_ids=[note.doc_id],
        )
    return True