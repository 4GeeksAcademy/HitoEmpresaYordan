from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status
from tinydb import Query
from tinydb.table import Document

from auth import get_current_user
from cache import cached, invalidate, store
from database import db_lock, suppliers_table
from models import (
    Country,
    Supplier,
    SupplierCategory,
    SupplierCreate,
    SupplierDetailRead,
    SupplierListRead,
    SupplierRateUpdate,
    SupplierStatusUpdate,
    utc_now,
)

router = APIRouter(
    prefix="/suppliers",
    tags=["suppliers"],
)


def to_supplier(doc: Document) -> Supplier:
    return Supplier(id=doc.doc_id, **doc)


def get_or_404(supplier_id: int) -> Document:
    doc = suppliers_table.get(doc_id=supplier_id)
    if doc is None:
        raise HTTPException(status_code=404, detail=f"Proveedor {supplier_id} no encontrado")
    return doc


@router.post("", response_model=SupplierDetailRead, status_code=status.HTTP_201_CREATED)
def create_supplier(
    payload: SupplierCreate,
    current_user: dict = Depends(get_current_user),
) -> SupplierDetailRead:
    data = {**payload.model_dump(mode="json"), "updated_at": utc_now().isoformat()}
    with db_lock:
        supplier_id = suppliers_table.insert(data)
    supplier = Supplier(id=supplier_id, **data)
    invalidate("suppliers:list")
    return SupplierDetailRead.model_validate(supplier)


@router.get("", response_model=List[SupplierListRead])
def list_suppliers(
    country: Optional[Country] = None,
    category: Optional[SupplierCategory] = None,
    current_user: dict = Depends(get_current_user),
) -> List[SupplierListRead]:
    # Construir clave de caché con los filtros aplicados
    cache_key = f"suppliers:list:country={country or ''}:category={category or ''}"
    cached_result = cached(cache_key)
    if cached_result is not None:
        return cached_result

    q = Query()
    conditions = []
    if country is not None:
        conditions.append(q.country == country.value)
    if category is not None:
        conditions.append(q.categories.any([category.value]))

    with db_lock:
        if conditions:
            cond = conditions[0]
            for extra in conditions[1:]:
                cond &= extra
            docs = suppliers_table.search(cond)
        else:
            docs = suppliers_table.all()
    result = [SupplierListRead.model_validate(to_supplier(doc)) for doc in docs]
    store(cache_key, result)
    return result


@router.get("/{supplier_id}", response_model=SupplierDetailRead)
def get_supplier(
    supplier_id: int,
    current_user: dict = Depends(get_current_user),
) -> SupplierDetailRead:
    with db_lock:
        doc = get_or_404(supplier_id)
    supplier = to_supplier(doc)
    return SupplierDetailRead.model_validate(supplier)


@router.patch("/{supplier_id}/rate", response_model=SupplierDetailRead)
def update_rate(
    supplier_id: int,
    payload: SupplierRateUpdate,
    current_user: dict = Depends(get_current_user),
) -> SupplierDetailRead:
    with db_lock:
        get_or_404(supplier_id)
        suppliers_table.update(
            {"monthly_rate": payload.monthly_rate, "updated_at": utc_now().isoformat()},
            doc_ids=[supplier_id],
        )
        doc = suppliers_table.get(doc_id=supplier_id)
    invalidate("suppliers:list")
    return SupplierDetailRead.model_validate(to_supplier(doc))


@router.patch("/{supplier_id}/status", response_model=SupplierDetailRead)
def update_status(
    supplier_id: int,
    payload: SupplierStatusUpdate,
    current_user: dict = Depends(get_current_user),
) -> SupplierDetailRead:
    # Según el BRIEFING, updated_at solo refleja cambios de tarifa
    with db_lock:
        get_or_404(supplier_id)
        suppliers_table.update({"status": payload.status.value}, doc_ids=[supplier_id])
        doc = suppliers_table.get(doc_id=supplier_id)
    invalidate("suppliers:list")
    return SupplierDetailRead.model_validate(to_supplier(doc))


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    supplier_id: int,
    current_user: dict = Depends(get_current_user),
) -> Response:
    with db_lock:
        get_or_404(supplier_id)
        suppliers_table.remove(doc_ids=[supplier_id])
    invalidate("suppliers:list")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
