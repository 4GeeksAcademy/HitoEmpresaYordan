from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path
from nexova_shared import (
    Incident,
    IncidentBranch,
    IncidentCategory,
    IncidentCreate,
    IncidentOrigin,
    IncidentStatus,
    validate_status_transition,
)
from pydantic import BaseModel, ConfigDict
from tinydb import Query
from tinydb.table import Document

from cache import cached, invalidate, store
from auth import get_current_user
from database import db_lock, incidents_table


router = APIRouter(
    prefix="/api/incidents",
    tags=["incidents"],
    dependencies=[Depends(get_current_user)],
)

IncidentId = Annotated[int, Path(gt=0)]


class IncidentStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: IncidentStatus


class IncidentSummary(BaseModel):
    total: int
    by_status: dict[IncidentStatus, int]
    by_category: dict[IncidentCategory, int]
    by_origin: dict[IncidentOrigin, int]
    by_branch: dict[IncidentBranch, int]


def to_incident(document: Document) -> Incident:
    return Incident(id=document.doc_id, **document)


def get_or_404(incident_id: int) -> Document:
    document = incidents_table.get(doc_id=incident_id)
    if document is None:
        raise HTTPException(status_code=404, detail=f"Incidencia {incident_id} no encontrada")
    return document


@router.post("", response_model=Incident, status_code=201)
def create_incident(payload: IncidentCreate) -> Incident:
    now = datetime.now(timezone.utc)
    data = {
        **payload.model_dump(mode="json"),
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }
    with db_lock:
        incident_id = incidents_table.insert(data)
    invalidate("incidents:summary")
    return Incident(id=incident_id, **data)


@router.get("", response_model=list[Incident])
def list_incidents(
    status: IncidentStatus | None = None,
    origin: IncidentOrigin | None = None,
    branch: IncidentBranch | None = None,
    category: IncidentCategory | None = None,
) -> list[Incident]:
    query = Query()
    condition = query.noop()
    for name, value in {"status": status, "origin": origin, "branch": branch, "category": category}.items():
        if value is not None:
            condition &= query[name] == value.value
    with db_lock:
        documents = incidents_table.search(condition)
    return [to_incident(document) for document in documents]


@router.get("/summary", response_model=IncidentSummary)
def summarize_incidents() -> IncidentSummary:
    cache_key = "incidents:summary"
    cached_result = cached(cache_key)
    if cached_result is not None:
        return IncidentSummary(**cached_result)

    with db_lock:
        incidents = [to_incident(document) for document in incidents_table.all()]
    summary = IncidentSummary(
        total=len(incidents),
        by_status={value: 0 for value in IncidentStatus},
        by_category={value: 0 for value in IncidentCategory},
        by_origin={value: 0 for value in IncidentOrigin},
        by_branch={value: 0 for value in IncidentBranch},
    )
    for incident in incidents:
        summary.by_status[incident.status] += 1
        summary.by_category[incident.category] += 1
        summary.by_origin[incident.origin] += 1
        summary.by_branch[incident.branch] += 1
    store(cache_key, summary.model_dump(mode="json"))
    return summary


@router.get("/{incident_id}", response_model=Incident)
def get_incident(incident_id: IncidentId) -> Incident:
    with db_lock:
        return to_incident(get_or_404(incident_id))


@router.patch("/{incident_id}/status", response_model=Incident)
def update_incident_status(incident_id: IncidentId, payload: IncidentStatusUpdate) -> Incident:
    with db_lock:
        document = get_or_404(incident_id)
        incident = to_incident(document)
        try:
            target = validate_status_transition(incident.status, payload.status)
        except ValueError as error:
            raise HTTPException(
                status_code=400,
                detail="No se puede cambiar al estado indicado desde el estado actual.",
            ) from error
        updated = incident.model_copy(update={
            "status": target,
            "updated_at": datetime.now(timezone.utc),
        })
        validated = Incident.model_validate(updated.model_dump())
        incidents_table.update(
            validated.model_dump(mode="json", exclude={"id"}), doc_ids=[incident_id],
        )
    invalidate("incidents:summary")
    return validated