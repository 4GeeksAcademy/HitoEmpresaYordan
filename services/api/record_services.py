from typing import Optional

from tinydb import Query
from tinydb.table import Document

from database import db_lock, record_notes_table, records_table
from models import (
    CandidateNote,
    CandidateNoteCreate,
    CandidateRecord,
    CandidateRecordCreate,
    CandidateRecordPatch,
    utc_now,
)


def _to_record(doc: Document) -> CandidateRecord:
    return CandidateRecord(id=doc.doc_id, **doc)


def _to_note(doc: Document) -> CandidateNote:
    return CandidateNote(id=doc.doc_id, **doc)


def list_records() -> list[CandidateRecord]:
    with db_lock:
        docs = records_table.all()
    return [_to_record(doc) for doc in docs]


def get_record(record_id: int) -> Optional[CandidateRecord]:
    with db_lock:
        doc = records_table.get(doc_id=record_id)
    return _to_record(doc) if doc is not None else None


def create_record(payload: CandidateRecordCreate) -> CandidateRecord:
    data = payload.model_dump(mode="json")
    with db_lock:
        record_id = records_table.insert(data)
    return CandidateRecord(id=record_id, **data)


def update_record(record_id: int, payload: CandidateRecordCreate) -> Optional[CandidateRecord]:
    data = payload.model_dump(mode="json")
    with db_lock:
        if records_table.get(doc_id=record_id) is None:
            return None
        records_table.update(data, doc_ids=[record_id])
        doc = records_table.get(doc_id=record_id)
    return _to_record(doc)


def patch_record(
    record_id: int, payload: CandidateRecordPatch
) -> Optional[CandidateRecord]:
    changes = payload.model_dump(exclude_unset=True)
    with db_lock:
        if records_table.get(doc_id=record_id) is None:
            return None
        records_table.update(changes, doc_ids=[record_id])
        doc = records_table.get(doc_id=record_id)
    return _to_record(doc)


def list_record_notes(record_id: int) -> Optional[list[CandidateNote]]:
    with db_lock:
        if records_table.get(doc_id=record_id) is None:
            return None
        docs = record_notes_table.search(Query().record_id == record_id)
    return [_to_note(doc) for doc in docs]


def create_record_note(
    record_id: int, payload: CandidateNoteCreate, created_by: str
) -> Optional[CandidateNote]:
    data = {
        "record_id": record_id,
        "content": payload.content,
        "created_at": utc_now().isoformat(),
        "updated_at": None,
        "created_by": created_by,
    }
    with db_lock:
        if records_table.get(doc_id=record_id) is None:
            return None
        note_id = record_notes_table.insert(data)
    return CandidateNote(id=note_id, **data)


def delete_record_note(record_id: int, note_id: int) -> bool:
    with db_lock:
        note = record_notes_table.get(doc_id=note_id)
        if note is None or note.get("record_id") != record_id:
            return False
        record_notes_table.remove(doc_ids=[note_id])
    return True