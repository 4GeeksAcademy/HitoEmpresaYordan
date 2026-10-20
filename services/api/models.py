from datetime import date, datetime, timezone
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

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


class Supplier(SupplierBase):
    model_config = ConfigDict(use_enum_values=True)

    id: int
    updated_at: datetime = Field(default_factory=utc_now)
