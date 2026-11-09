from datetime import date, datetime, timezone
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

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
    linkedin_url: str = Field("", max_length=2048)
    cv_url: str = Field("", max_length=2048)
    experience_years: float = Field(0, ge=0)
    status: str = Field("pending", min_length=1, max_length=50)
    stage: str = Field("screening", min_length=1, max_length=50)
    applied_at: datetime = Field(default_factory=utc_now)


class CandidateRecordCreate(CandidateRecordFields):
    model_config = ConfigDict(extra="forbid")


class CandidateRecord(CandidateRecordFields):
    id: int


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


class CandidateNote(BaseModel):
    id: int
    record_id: int
    content: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None


class Supplier(SupplierBase):
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
