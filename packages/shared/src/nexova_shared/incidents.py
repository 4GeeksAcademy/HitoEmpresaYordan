import csv
import logging
from collections.abc import Iterator, Mapping
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from types import MappingProxyType
from typing import Any

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, ValidationError, field_validator, model_validator


class IncidentStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    DISCARDED = "discarded"


class IncidentCategory(str, Enum):
    TECHNICAL_FAILURE = "technical_failure"
    PROCESS_ERROR = "process_error"
    CLIENT_COMPLAINT = "client_complaint"
    CANDIDATE_ISSUE = "candidate_issue"
    STAFF_ISSUE = "staff_issue"
    SLA_BREACH = "sla_breach"
    DATA_QUALITY = "data_quality"
    OTHER = "other"


class IncidentBranch(str, Enum):
    CENTRAL = "central"
    VALENCIA_OPERATIONS = "valencia_operations"
    MIAMI_OFFICE = "miami_office"
    REMOTE = "remote"


class IncidentOrigin(str, Enum):
    CUSTOMER = "customer"
    BRANCH = "branch"
    INTERNAL = "internal"


BRANCH_LABELS = MappingProxyType({
    IncidentBranch.CENTRAL: "Central — Sede Valencia",
    IncidentBranch.VALENCIA_OPERATIONS: "Valencia — Operaciones",
    IncidentBranch.MIAMI_OFFICE: "Miami Office",
    IncidentBranch.REMOTE: "Remoto (empleado sin sede fija)",
})

CSV_STATUS_MAP = MappingProxyType({
    "OPEN": IncidentStatus.OPEN,
    "CLOSED": IncidentStatus.RESOLVED,
    "DISCARDED": IncidentStatus.DISCARDED,
})

CSV_CATEGORY_MAP = MappingProxyType({
    "TECHNICAL": IncidentCategory.TECHNICAL_FAILURE,
    "BILLING": IncidentCategory.PROCESS_ERROR,
    "ACCESS": IncidentCategory.TECHNICAL_FAILURE,
    "HR_QUERY": IncidentCategory.PROCESS_ERROR,
    "COMPLAINT": IncidentCategory.CLIENT_COMPLAINT,
})

STATUS_TRANSITIONS = MappingProxyType({
    IncidentStatus.OPEN: frozenset({IncidentStatus.IN_PROGRESS, IncidentStatus.DISCARDED}),
    IncidentStatus.IN_PROGRESS: frozenset({IncidentStatus.RESOLVED, IncidentStatus.DISCARDED}),
    IncidentStatus.RESOLVED: frozenset(),
    IncidentStatus.DISCARDED: frozenset(),
})


def validate_status_transition(current: IncidentStatus | str, target: IncidentStatus | str) -> IncidentStatus:
    current, target = IncidentStatus(current), IncidentStatus(target)
    if target not in STATUS_TRANSITIONS[current]:
        raise ValueError(f"Invalid status transition: {current.value} -> {target.value}")
    return target


class IncidentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1)
    category: IncidentCategory
    origin: IncidentOrigin
    branch: IncidentBranch = IncidentBranch.CENTRAL
    status: IncidentStatus = IncidentStatus.OPEN

    @field_validator("title")
    @classmethod
    def require_nonblank_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Title must not be blank")
        return value

    @field_validator("description")
    @classmethod
    def require_nonblank_description(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Description must not be blank")
        return value


class Incident(IncidentCreate):
    id: int = Field(gt=0)
    created_at: AwareDatetime
    updated_at: AwareDatetime

    @model_validator(mode="after")
    def require_ordered_timestamps(self):
        if self.updated_at < self.created_at:
            raise ValueError("updated_at must not precede created_at")
        return self


def validate_incident(data: Mapping[str, Any]) -> IncidentCreate:
    return IncidentCreate.model_validate(data)


class CsvIncidentRow(BaseModel):
    ticket_id: str | None = None
    description: str
    date: str = Field(pattern=r"^[0-9]{4}-[0-9]{2}-[0-9]{2}$")
    status: str
    category: str

    @field_validator("ticket_id")
    @classmethod
    def normalize_ticket_id(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None

    @field_validator("date")
    @classmethod
    def require_calendar_date(cls, value: str) -> str:
        datetime.strptime(value, "%Y-%m-%d")
        return value

    @field_validator("status")
    @classmethod
    def require_mapped_status(cls, value: str) -> str:
        if value not in CSV_STATUS_MAP:
            raise ValueError(f"Unmapped CSV status: {value}")
        return value

    @field_validator("category")
    @classmethod
    def require_mapped_category(cls, value: str) -> str:
        if value not in CSV_CATEGORY_MAP:
            raise ValueError(f"Unmapped CSV category: {value}")
        return value

    @field_validator("description")
    @classmethod
    def require_seed_title(cls, value: str) -> str:
        if not value[:120].strip():
            raise ValueError("CSV description produces an empty title")
        return value


class IncidentSeed(IncidentCreate):
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="after")
    def require_seed_timestamps(self):
        if self.created_at.tzinfo is None or self.created_at.utcoffset() is None:
            raise ValueError("Seed timestamps must be timezone-aware")
        if self.updated_at != self.created_at:
            raise ValueError("Seed updated_at must equal created_at")
        return self


class CsvIncidentImport(BaseModel):
    incident: IncidentSeed
    deduplication_key: tuple[str, ...]


def transform_csv_incident(data: Mapping[str, Any]) -> CsvIncidentImport:
    row = CsvIncidentRow.model_validate(data)
    created_at = datetime.strptime(row.date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    incident = IncidentSeed(
        title=row.description[:120].strip(),
        description=row.description,
        category=CSV_CATEGORY_MAP[row.category],
        status=CSV_STATUS_MAP[row.status],
        origin=IncidentOrigin.CUSTOMER,
        branch=IncidentBranch.CENTRAL,
        created_at=created_at,
        updated_at=created_at,
    )
    key = (("ticket_id", row.ticket_id) if row.ticket_id else
           ("title_created_at", incident.title, created_at.isoformat()))
    return CsvIncidentImport(incident=incident, deduplication_key=key)


def iter_csv_incidents(
    path: str | Path,
    *,
    seen_keys: set[tuple[str, ...]] | None = None,
    logger: logging.Logger | None = None,
) -> Iterator[CsvIncidentImport]:
    seen = seen_keys if seen_keys is not None else set()
    log = logger if logger is not None else logging.getLogger(__name__)
    with Path(path).open(encoding="utf-8-sig", newline="") as source:
        for line_number, row in enumerate(csv.DictReader(source), start=2):
            try:
                result = transform_csv_incident(row)
            except (ValidationError, ValueError) as error:
                log.warning("Skipping CSV row %s: %s", line_number, error)
                continue
            if result.deduplication_key in seen:
                continue
            seen.add(result.deduplication_key)
            yield result