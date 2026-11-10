"""Router de inventario — Gestión de activos, entradas y salidas.

Todos los endpoints están agrupados bajo el prefijo /inventory.
Usa SQLModel (Supabase) para datos transaccionales y TinyDB para autenticación.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, func, select

from auth import get_current_user
from database import get_db
from models import Asset, AssetEntry, AssetExit
from schemas import (
    AssetCreate,
    AssetEntryCreate,
    AssetEntryRead,
    AssetExitCreate,
    AssetExitRead,
    AssetListRead,
    AssetOrderEntry,
    AssetRead,
)

router = APIRouter(prefix="/inventory", tags=["inventory"])


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────


def _compute_current_stock(db: Session, asset_id: int) -> int:
    """Calcula el stock actual de un activo como SUM(entries) - SUM(exits)."""
    total_entries = db.exec(
        select(func.coalesce(func.sum(AssetEntry.quantity), 0)).where(
            AssetEntry.asset_id == asset_id
        )
    ).one()
    total_exits = db.exec(
        select(func.coalesce(func.sum(AssetExit.quantity), 0)).where(
            AssetExit.asset_id == asset_id
        )
    ).one()
    return int(total_entries) - int(total_exits)


def _asset_to_read(asset: Asset, db: Session) -> AssetRead:
    """Convierte un Asset ORM a AssetRead con current_stock calculado."""
    return AssetRead(
        id=asset.id,
        name=asset.name,
        sku=asset.sku,
        category=asset.category,
        office=asset.office,
        current_stock=_compute_current_stock(db, asset.id),
    )


def _get_asset_or_404(db: Session, asset_id: int) -> Asset:
    """Obtiene un activo por ID o lanza HTTP 404."""
    asset = db.get(Asset, asset_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset with id {asset_id} not found",
        )
    return asset


# ──────────────────────────────────────────────
# Endpoints — Products / Assets
# ──────────────────────────────────────────────


@router.get("/products", response_model=List[AssetListRead])
def list_products(db: Session = Depends(get_db)):
    """Lista todos los activos (sin stock calculado para evitar over-fetching)."""
    assets = db.exec(select(Asset)).all()
    return [AssetListRead.model_validate(asset) for asset in assets]


@router.post("/products", response_model=AssetRead, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: AssetCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Crea un nuevo activo (requiere autenticación). Stock inicial = 0."""
    # Verificar que el SKU no exista ya
    existing = db.exec(select(Asset).where(Asset.sku == payload.sku)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un activo con el SKU '{payload.sku}'",
        )
    asset = Asset(
        name=payload.name,
        sku=payload.sku,
        category=payload.category,
        office=payload.office,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return _asset_to_read(asset, db)


@router.get("/products/{asset_id}", response_model=AssetRead)
def get_product(asset_id: int, db: Session = Depends(get_db)):
    """Obtiene un activo por ID con su stock actual calculado."""
    asset = _get_asset_or_404(db, asset_id)
    return _asset_to_read(asset, db)


# ──────────────────────────────────────────────
# Endpoints — Orders (Inbound / Outbound)
# ──────────────────────────────────────────────


@router.post("/orders/inbound", response_model=AssetEntryRead, status_code=status.HTTP_201_CREATED)
def create_inbound_order(
    payload: AssetEntryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Registra una entrada de inventario (compra o entrega recibida).

    Requiere autenticación. Incrementa el stock del activo.
    """
    # Validar que el activo exista
    _get_asset_or_404(db, payload.asset_id)

    entry = AssetEntry(
        asset_id=payload.asset_id,
        quantity=payload.quantity,
        supplier=payload.supplier,
        office=payload.office,
        user_uuid=payload.user_uuid,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return AssetEntryRead.model_validate(entry)


@router.post("/orders/outbound", response_model=AssetExitRead, status_code=status.HTTP_201_CREATED)
def create_outbound_order(
    payload: AssetExitCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Registra una salida de inventario (asignación o consumo).

    Requiere autenticación. Valida que el stock sea suficiente ANTES de crear
    la transacción. Rechaza con HTTP 400 si el stock disponible es insuficiente.
    """
    # Validar que el activo exista
    asset = _get_asset_or_404(db, payload.asset_id)

    # Calcular stock actual
    current_stock = _compute_current_stock(db, payload.asset_id)

    # Validación estricta de stock suficiente
    if payload.quantity > current_stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Insufficient stock for asset '{asset.name}'. "
                f"Available: {current_stock}, requested: {payload.quantity}."
            ),
        )

    exit_record = AssetExit(
        asset_id=payload.asset_id,
        quantity=payload.quantity,
        exit_type=payload.exit_type,
        assigned_to=payload.assigned_to,
        office=payload.office,
        user_uuid=payload.user_uuid,
    )
    db.add(exit_record)
    db.commit()
    db.refresh(exit_record)
    return AssetExitRead.model_validate(exit_record)


@router.get("/orders", response_model=List[AssetOrderEntry])
def list_orders(db: Session = Depends(get_db)):
    """Lista todas las órdenes (entradas y salidas) con datos del activo."""
    entries = db.exec(
        select(AssetEntry, Asset.name, Asset.sku).join(
            Asset, AssetEntry.asset_id == Asset.id
        )
    ).all()

    exits = db.exec(
        select(AssetExit, Asset.name, Asset.sku).join(
            Asset, AssetExit.asset_id == Asset.id
        )
    ).all()

    result: List[AssetOrderEntry] = []

    for entry_row, asset_name, asset_sku in entries:
        result.append(
            AssetOrderEntry(
                id=entry_row.id,
                order_type="entry",
                asset_id=entry_row.asset_id,
                asset_name=asset_name,
                asset_sku=asset_sku,
                quantity=entry_row.quantity,
                office=entry_row.office,
                created_at=entry_row.created_at,
                supplier=entry_row.supplier,
                exit_type=None,
                assigned_to=None,
            )
        )

    for exit_row, asset_name, asset_sku in exits:
        result.append(
            AssetOrderEntry(
                id=exit_row.id,
                order_type="exit",
                asset_id=exit_row.asset_id,
                asset_name=asset_name,
                asset_sku=asset_sku,
                quantity=exit_row.quantity,
                office=exit_row.office,
                created_at=exit_row.created_at,
                supplier=None,
                exit_type=exit_row.exit_type,
                assigned_to=exit_row.assigned_to,
            )
        )

    # Ordenar por created_at descendente (más recientes primero)
    result.sort(key=lambda o: o.created_at, reverse=True)
    return result
