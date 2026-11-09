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
from external_tracker import ExternalTrackerError
from record_services import (
    create_record,
    create_record_note,
    delete_record,
    delete_record_note,
    get_record,
    list_record_notes,
    list_records,
    patch_record,
    update_record,
)

router = APIRouter(prefix="/records", tags=["records"])


def _raise_external_error(error: ExternalTrackerError) -> None:
    if error.status_code == 404:
        status_code = status.HTTP_404_NOT_FOUND
        detail = "Candidatura o nota no encontrada en el servicio externo."
    elif error.status_code == 422:
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
        detail = "El servicio externo rechazó los datos de la candidatura o nota."
    elif error.status_code in {400, 409}:
        status_code = status.HTTP_409_CONFLICT
        detail = "La operación entra en conflicto con el estado remoto actual."
    else:
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        detail = "No se pudo confirmar la operación con el servicio externo; no se modificaron los datos locales."
    raise HTTPException(status_code=status_code, detail=detail) from error


def get_record_or_404(record_id: str) -> CandidateRecord:
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
    try:
        return create_record(payload)
    except ExternalTrackerError as error:
        _raise_external_error(error)


@router.get("/{record_id}", response_model=CandidateRecord)
def get_record_by_id(
    record_id: str,
    current_user: User = Depends(get_current_user),
) -> CandidateRecord:
    try:
        return get_record_or_404(record_id)
    except ExternalTrackerError as error:
        _raise_external_error(error)


@router.put("/{record_id}", response_model=CandidateRecord)
def put_record(
    record_id: str,
    payload: CandidateRecordCreate,
    current_user: User = Depends(get_current_user),
) -> CandidateRecord:
    try:
        record = update_record(record_id, payload)
    except ExternalTrackerError as error:
        _raise_external_error(error)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidatura no encontrada",
        )
    return record


@router.patch("/{record_id}", response_model=CandidateRecord)
def patch_record_by_id(
    record_id: str,
    payload: CandidateRecordPatch,
    current_user: User = Depends(get_current_user),
) -> CandidateRecord:
    try:
        record = patch_record(record_id, payload)
    except ExternalTrackerError as error:
        _raise_external_error(error)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidatura no encontrada",
        )
    return record


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_record(
    record_id: str,
    current_user: User = Depends(get_current_user),
) -> Response:
    try:
        deleted = delete_record(record_id)
    except ExternalTrackerError as error:
        _raise_external_error(error)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidatura no encontrada",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{record_id}/notes", response_model=list[CandidateNote])
def get_record_notes(
    record_id: str,
    current_user: User = Depends(get_current_user),
) -> list[CandidateNote]:
    try:
        notes = list_record_notes(record_id)
    except ExternalTrackerError as error:
        _raise_external_error(error)
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
    record_id: str,
    payload: CandidateNoteCreate,
    current_user: User = Depends(get_current_user),
) -> CandidateNote:
    try:
        note = create_record_note(record_id, payload, current_user.email)
    except ExternalTrackerError as error:
        _raise_external_error(error)
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidatura no encontrada",
        )
    return note


@router.delete("/{record_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_record_note(
    record_id: str,
    note_id: str,
    current_user: User = Depends(get_current_user),
) -> Response:
    try:
        deleted = delete_record_note(record_id, note_id)
    except ExternalTrackerError as error:
        _raise_external_error(error)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nota no encontrada",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)