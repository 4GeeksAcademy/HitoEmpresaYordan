from fastapi import APIRouter, Depends, HTTPException, Response, status

from auth import get_current_user
from models import (
    CandidateNote,
    CandidateNoteCreate,
    CandidateRecord,
    CandidateRecordCreate,
    CandidateRecordPatch,
    User,
)
from record_services import (
    create_record,
    create_record_note,
    delete_record_note,
    get_record,
    list_record_notes,
    list_records,
    patch_record,
    update_record,
)

router = APIRouter(prefix="/records", tags=["records"])


def get_record_or_404(record_id: int) -> CandidateRecord:
    record = get_record(record_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidatura no encontrada",
        )
    return record


@router.get("", response_model=list[CandidateRecord])
def get_records(current_user: User = Depends(get_current_user)) -> list[CandidateRecord]:
    return list_records()


@router.post("", response_model=CandidateRecord, status_code=status.HTTP_201_CREATED)
def post_record(
    payload: CandidateRecordCreate,
    current_user: User = Depends(get_current_user),
) -> CandidateRecord:
    return create_record(payload)


@router.get("/{record_id}", response_model=CandidateRecord)
def get_record_by_id(
    record_id: int,
    current_user: User = Depends(get_current_user),
) -> CandidateRecord:
    return get_record_or_404(record_id)


@router.put("/{record_id}", response_model=CandidateRecord)
def put_record(
    record_id: int,
    payload: CandidateRecordCreate,
    current_user: User = Depends(get_current_user),
) -> CandidateRecord:
    record = update_record(record_id, payload)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidatura no encontrada",
        )
    return record


@router.patch("/{record_id}", response_model=CandidateRecord)
def patch_record_by_id(
    record_id: int,
    payload: CandidateRecordPatch,
    current_user: User = Depends(get_current_user),
) -> CandidateRecord:
    record = patch_record(record_id, payload)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidatura no encontrada",
        )
    return record


@router.get("/{record_id}/notes", response_model=list[CandidateNote])
def get_record_notes(
    record_id: int,
    current_user: User = Depends(get_current_user),
) -> list[CandidateNote]:
    notes = list_record_notes(record_id)
    if notes is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidatura no encontrada",
        )
    return notes


@router.post(
    "/{record_id}/notes",
    response_model=CandidateNote,
    status_code=status.HTTP_201_CREATED,
)
def post_record_note(
    record_id: int,
    payload: CandidateNoteCreate,
    current_user: User = Depends(get_current_user),
) -> CandidateNote:
    note = create_record_note(record_id, payload, current_user.email)
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidatura no encontrada",
        )
    return note


@router.delete("/{record_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_record_note(
    record_id: int,
    note_id: int,
    current_user: User = Depends(get_current_user),
) -> Response:
    if not delete_record_note(record_id, note_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nota no encontrada",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)