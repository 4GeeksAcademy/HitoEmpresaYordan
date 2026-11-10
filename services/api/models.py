from datetime import date, datetime, timezone
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from sqlmodel import Field as SQLField, SQLModel

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class Country(str, Enum):
    SPAIN = "Spain"
    USA = "USA"


class Currency(str, Enum):
    EUR = "EUR"
    USD = "USD"


class SupplierStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"


class SupplierCategory(str, Enum):
    JOB_BOARDS = "job_boards"
    ATS_SOFTWARE = "ats_software"
    ASSESSMENT_TOOLS = "assessment_tools"
    TRAINING_PLATFORMS = "training_platforms"
    PAYROLL_AND_HR_SOFTWARE = "payroll_and_hr_software"
    VIDEO_INTERVIEW = "video_interview"
    BACKGROUND_CHECK = "background_check"
    OFFICE_AND_FACILITIES = "office_and_facilities"
    IT_AND_SOFTWARE_LICENSES = "it_and_software_licenses"


COUNTRY_CURRENCY = {Country.SPAIN: Currency.EUR, Country.USA: Currency.USD}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def check_country_currency(country: Optional[Country], currency: Optional[Currency]) -> None:
    if country is None or currency is None:
        return
    # Supplier usa use_enum_values, así que pueden llegar como str
    country, currency = Country(country), Currency(currency)
    if COUNTRY_CURRENCY[country] != currency:
        raise ValueError(
            f"currency '{currency.value}' no es válida para country '{country.value}'; "
            f"se esperaba '{COUNTRY_CURRENCY[country].value}'"
        )


class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    country: Country
    categories: List[SupplierCategory] = Field(..., min_length=1)
    monthly_rate: float = Field(..., gt=0)
    currency: Currency
    status: SupplierStatus
    contract_renewal_date: Optional[date] = None
    contact_email: Optional[str] = Field(None, max_length=254, pattern=EMAIL_PATTERN)
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_currency(self):
        check_country_currency(self.country, self.currency)
        return self


class SupplierCreate(SupplierBase):
    # extra="forbid" rechaza con 422 campos del sistema como id o updated_at
    model_config = ConfigDict(extra="forbid")


class SupplierUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    country: Optional[Country] = None
    categories: Optional[List[SupplierCategory]] = Field(None, min_length=1)
    monthly_rate: Optional[float] = Field(None, gt=0)
    currency: Optional[Currency] = None
    status: Optional[SupplierStatus] = None
    contract_renewal_date: Optional[date] = None
    contact_email: Optional[str] = Field(None, max_length=254, pattern=EMAIL_PATTERN)
    notes: Optional[str] = None

    # Solo valida si llegan ambos; la API debe revalidar el registro fusionado con Supplier.
    @model_validator(mode="after")
    def validate_currency(self):
        check_country_currency(self.country, self.currency)
        return self


class SupplierRateUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    monthly_rate: float = Field(..., gt=0)


class SupplierStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: SupplierStatus


class CandidateRecordFields(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=200)
    email: str = Field(..., max_length=254, pattern=EMAIL_PATTERN)
    phone: str = Field(..., max_length=50)
    position: str = Field(..., min_length=1, max_length=200)
    linkedin_url: Optional[str] = Field("", max_length=2048)
    cv_url: Optional[str] = Field("", max_length=2048)
    experience_years: float = Field(0, ge=0)
    status: str = Field("pending", min_length=1, max_length=50)
    stage: str = Field("screening", min_length=1, max_length=50)
    applied_at: datetime = Field(default_factory=utc_now)


class CandidateRecordCreate(CandidateRecordFields):
    model_config = ConfigDict(extra="forbid")


class CandidateRecordListRead(BaseModel):
    """Schema ligero para listado de candidaturas. Sin linkedin_url, cv_url ni notas."""

    model_config = ConfigDict(extra="forbid")

    id: str | int
    full_name: str
    email: str
    phone: str
    position: str
    experience_years: float
    status: str
    stage: str
    applied_at: datetime
    external_id: Optional[str] = None


class CandidateRecordDetailRead(CandidateRecordListRead):
    """Schema completo para detalle de candidatura. Incluye URLs opcionales."""

    linkedin_url: Optional[str] = ""
    cv_url: Optional[str] = ""


class CandidateRecord(CandidateRecordFields):
    """Modelo completo ORM para almacenamiento en tracker externo. Extra permitido."""

    model_config = ConfigDict(extra="allow")

    id: str | int
    external_id: Optional[str] = None


class CandidateRecordPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Optional[str] = Field(None, min_length=1, max_length=50)
    stage: Optional[str] = Field(None, min_length=1, max_length=50)

    @model_validator(mode="after")
    def require_changes(self):
        if not self.model_fields_set or any(
            getattr(self, field) is None for field in self.model_fields_set
        ):
            raise ValueError("Debe enviarse status o stage")
        return self


class CandidateNoteCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str = Field(..., min_length=1, max_length=10000)
    created_by: Optional[str] = Field(None, max_length=254)


class CandidateNoteRead(BaseModel):
    """Schema de response para notas de candidatura. Sin external_id ni record_id interno."""

    model_config = ConfigDict(extra="forbid")

    id: str | int
    content: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None


class CandidateNote(BaseModel):
    """Modelo completo ORM para nota en tracker externo. Extra permitido."""

    model_config = ConfigDict(extra="allow")

    id: str | int
    record_id: str | int
    content: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None
    external_id: Optional[str] = None


class SupplierListRead(BaseModel):
    """Schema ligero para listado de proveedores (GET /suppliers)."""

    model_config = ConfigDict(extra="forbid")

    id: int
    name: str
    country: Country
    categories: List[SupplierCategory]
    monthly_rate: float
    currency: Currency
    status: SupplierStatus
    contract_renewal_date: Optional[date] = None


class SupplierDetailRead(SupplierListRead):
    """Schema completo para detalle de un proveedor (GET /suppliers/{id})."""

    contact_email: Optional[str] = None
    notes: Optional[str] = None
    updated_at: datetime


class Supplier(SupplierBase):
    """Modelo completo ORM para almacenamiento en TinyDB."""

    model_config = ConfigDict(use_enum_values=True)

    id: int
    updated_at: datetime = Field(default_factory=utc_now)


class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"


def _validate_password_bytes(value: str) -> str:
    if len(value.encode("utf-8")) > 72:
        raise ValueError("La contrasena no puede superar 72 bytes")
    return value


class UserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(..., max_length=254, pattern=EMAIL_PATTERN)
    password: str = Field(..., min_length=8)
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=500)

    @field_validator("password")
    @classmethod
    def validate_password_bytes(cls, value: str) -> str:
        return _validate_password_bytes(value)


class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: Optional[str] = Field(None, max_length=254, pattern=EMAIL_PATTERN)
    password: Optional[str] = Field(None, min_length=8)
    role: Optional[UserRole] = None

    @field_validator("password")
    @classmethod
    def validate_password_bytes(cls, value: Optional[str]) -> Optional[str]:
        return _validate_password_bytes(value) if value is not None else None

    @model_validator(mode="after")
    def reject_explicit_nulls(self):
        if any(getattr(self, field) is None for field in self.model_fields_set):
            raise ValueError("Los campos enviados no pueden ser null")
        return self


class User(BaseModel):
    id: int
    email: str = Field(..., max_length=254, pattern=EMAIL_PATTERN)
    hashed_password: str
    is_active: bool
    role: UserRole
    created_at: datetime = Field(default_factory=utc_now)


class UserRead(BaseModel):
    id: int
    email: str
    is_active: bool
    role: UserRole
    created_at: datetime


class ProfileCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user_id: int
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=500)


class Profile(BaseModel):
    id: int
    user_id: int
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=500)


class UserLogin(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(..., max_length=254, pattern=EMAIL_PATTERN)
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(..., max_length=254, pattern=EMAIL_PATTERN)


class NewPasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    new_password: str = Field(..., min_length=8, max_length=72)

    @field_validator("new_password")
    @classmethod
    def validate_password_bytes(cls, value: str) -> str:
        return _validate_password_bytes(value)


class ResetPasswordRequest(NewPasswordRequest):
    token: str = Field(..., max_length=4096)


class ChangePasswordRequest(NewPasswordRequest):
    current_password: str


class AuthMe(UserRead):
    profile: Optional[Profile] = None


class MessageResponse(BaseModel):
    """Respuesta genérica con un mensaje descriptivo."""

    message: str = Field(..., examples=["Operación completada correctamente"])


class IncidentAnalysisResponse(BaseModel):
    """Respuesta del análisis de CSV de incidencias (POST /api/incidents/analyze)."""

    model_config = ConfigDict(extra="forbid")

    total_records: int
    valid_records: int
    invalid_records: int
    invalid_breakdown: dict[str, int] = Field(
        default_factory=dict,
        description="Desglose de motivos de invalidez (encoding, corrupted, incomplete, unknown)",
    )
    breakdown_by_category: dict[str, int] = Field(
        default_factory=dict,
        description="Conteo por categoría (technical, billing, account, feature_request, other)",
    )
    breakdown_by_status: dict[str, int] = Field(
        default_factory=dict,
        description="Conteo por estado (OPEN, IN_PROGRESS, CLOSED)",
    )
    satisfaction_index: dict[str, object] = Field(
        default_factory=dict,
        description="Índice de satisfacción (scored_closed_tickets, closed_tickets, average, score_distribution)",
    )


# ──────────────────────────────────────────────
# SQLModel ORM — Inventario (Supabase / PostgreSQL)
# ──────────────────────────────────────────────


class Asset(SQLModel, table=True):
    """Activo físico o material gestionado por Nexova (equivalente a Product)."""

    __tablename__ = "assets"

    id: Optional[int] = SQLField(default=None, primary_key=True)
    name: str = SQLField(min_length=1, max_length=200)
    sku: str = SQLField(unique=True, min_length=1, max_length=50, index=True)
    category: str = SQLField(min_length=1, max_length=50)  # "hardware", "peripherals", "office_supplies", "training_materials"
    office: str = SQLField(min_length=1, max_length=50)     # "Valencia" o "Miami"


class AssetEntry(SQLModel, table=True):
    """Entrada de inventario — compra o entrega recibida por Nexova (equivalente a InboundOrder)."""

    __tablename__ = "asset_entries"

    id: Optional[int] = SQLField(default=None, primary_key=True)
    asset_id: int = SQLField(foreign_key="assets.id", index=True)
    quantity: int = SQLField(ge=1)
    supplier: str = SQLField(min_length=1, max_length=200)
    office: str = SQLField(min_length=1, max_length=50)  # "Valencia" o "Miami"
    created_at: datetime = SQLField(default_factory=lambda: datetime.now(timezone.utc))
    user_uuid: str = SQLField(min_length=1, max_length=128)


class AssetExit(SQLModel, table=True):
    """Salida de inventario — asignación a empleado o evento de consumo (equivalente a OutboundOrder)."""

    __tablename__ = "asset_exits"

    id: Optional[int] = SQLField(default=None, primary_key=True)
    asset_id: int = SQLField(foreign_key="assets.id", index=True)
    quantity: int = SQLField(ge=1)
    exit_type: str = SQLField(min_length=1, max_length=20)  # "allocation" o "consumption"
    assigned_to: Optional[str] = SQLField(default=None, max_length=200)
    office: str = SQLField(min_length=1, max_length=50)  # "Valencia" o "Miami"
    created_at: datetime = SQLField(default_factory=lambda: datetime.now(timezone.utc))
    user_uuid: str = SQLField(min_length=1, max_length=128)
