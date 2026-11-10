"""Schemas Pydantic de request/response para el módulo de inventario.

Estos esquemas son completamente independientes de los modelos ORM
(SQLModel) definidos en models.py. Ningún endpoint devuelve instancias
de SQLModel directamente; siempre se convierten a estos schemas Pydantic.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


# ──────────────────────────────────────────────
# Asset (equivalente a Product)
# ──────────────────────────────────────────────


class AssetCreate(BaseModel):
    """Schema de request para crear un nuevo activo (POST /inventory/products)."""

    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=1, max_length=200, examples=["Portátil 14\" Business"])
    sku: str = Field(..., min_length=1, max_length=50, examples=["NXV-IT-001"])
    category: str = Field(
        ...,
        min_length=1,
        max_length=50,
        examples=["hardware"],
        description="hardware, peripherals, office_supplies, training_materials",
    )
    office: str = Field(
        ...,
        min_length=1,
        max_length=50,
        examples=["Valencia"],
        description='"Valencia" o "Miami"',
    )


class AssetUpdate(BaseModel):
    """Schema de request para actualizar parcialmente un activo."""

    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    sku: Optional[str] = Field(None, min_length=1, max_length=50)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    office: Optional[str] = Field(None, min_length=1, max_length=50)


class AssetListRead(BaseModel):
    """Schema ligero para listado de activos (GET /inventory/products). Sin stock calculado."""

    model_config = ConfigDict(extra="forbid")

    id: int
    name: str
    sku: str
    category: str
    office: str


class AssetRead(BaseModel):
    """Schema completo de response para detalle de un activo (GET /inventory/products/{id})."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sku: str
    category: str
    office: str
    current_stock: int = Field(
        ...,
        description="Stock actual calculado como SUM(entries) - SUM(exits)",
    )


# ──────────────────────────────────────────────
# AssetEntry / InboundOrder (entrada de inventario)
# ──────────────────────────────────────────────


class AssetEntryCreate(BaseModel):
    """Schema de request para registrar una entrada de activos (POST /inventory/orders/inbound)."""

    model_config = ConfigDict(extra="forbid")

    asset_id: int = Field(..., gt=0, description="ID del activo (FK a Asset)")
    quantity: int = Field(..., gt=0, description="Unidades recibidas")
    supplier: str = Field(..., min_length=1, max_length=200, examples=["TechDistrib Valencia S.L."])
    office: str = Field(
        ...,
        min_length=1,
        max_length=50,
        examples=["Valencia"],
        description='"Valencia" o "Miami"',
    )
    user_uuid: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="UUID del usuario de TinyDB que registró la entrada",
    )


class AssetEntryRead(BaseModel):
    """Schema de response para una entrada de inventario."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_id: int
    quantity: int
    supplier: str
    office: str
    created_at: datetime
    user_uuid: str


# ──────────────────────────────────────────────
# AssetExit / OutboundOrder (salida de inventario)
# ──────────────────────────────────────────────


class AssetExitCreate(BaseModel):
    """Schema de request para registrar una salida de activos (POST /inventory/orders/outbound).

    Validaciones:
    - Si exit_type es "allocation", assigned_to es obligatorio.
    - Si exit_type es "consumption", assigned_to debe ser nulo.
    """

    model_config = ConfigDict(extra="forbid")

    asset_id: int = Field(..., gt=0, description="ID del activo (FK a Asset)")
    quantity: int = Field(..., gt=0, description="Unidades asignadas o consumidas")
    exit_type: str = Field(
        ...,
        min_length=1,
        max_length=20,
        examples=["allocation"],
        description='"allocation" (asignación) o "consumption" (consumo)',
    )
    assigned_to: Optional[str] = Field(
        None,
        max_length=200,
        description="Nombre o ID del empleado (obligatorio si exit_type=allocation)",
    )
    office: str = Field(
        ...,
        min_length=1,
        max_length=50,
        examples=["Valencia"],
        description='"Valencia" o "Miami"',
    )
    user_uuid: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="UUID del usuario de TinyDB que registró la salida",
    )

    @model_validator(mode="after")
    def validate_exit_type_assigned_to(self):
        if self.exit_type == "allocation" and not self.assigned_to:
            raise ValueError(
                "assigned_to es obligatorio cuando exit_type es 'allocation'"
            )
        if self.exit_type == "consumption" and self.assigned_to is not None:
            raise ValueError(
                "assigned_to debe ser nulo cuando exit_type es 'consumption'"
            )
        return self


class AssetExitRead(BaseModel):
    """Schema de response para una salida de inventario."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_id: int
    quantity: int
    exit_type: str
    assigned_to: Optional[str] = None
    office: str
    created_at: datetime
    user_uuid: str


# ──────────────────────────────────────────────
# Órdenes combinadas (para GET /inventory/orders)
# ──────────────────────────────────────────────


class AssetOrderEntry(BaseModel):
    """Representa una fila individual dentro de la lista combinada de órdenes.

    La respuesta es una vista desnormalizada que incluye datos del activo
    (name, sku) para que el frontend no tenga que hacer llamadas adicionales.
    """

    model_config = ConfigDict(extra="forbid")

    id: int
    order_type: str = Field(
        ...,
        description='"entry" para AssetEntry, "exit" para AssetExit',
    )
    asset_id: int
    asset_name: str = Field(..., description="Nombre del activo (desnormalizado)")
    asset_sku: str = Field(..., description="SKU del activo (desnormalizado)")
    quantity: int
    office: str
    created_at: datetime
    supplier: Optional[str] = Field(None, description="Proveedor (solo entrada)")
    exit_type: Optional[str] = Field(None, description='"allocation" o "consumption" (solo salida)')
    assigned_to: Optional[str] = Field(None, description="Empleado asignado (solo salida)")
    user_uuid: str
    # Campos específicos de entrada
    supplier: Optional[str] = None
    # Campos específicos de salida
    exit_type: Optional[str] = None
    assigned_to: Optional[str] = None
    # Datos del activo asociado (join)
    asset_name: Optional[str] = None
    asset_sku: Optional[str] = None
