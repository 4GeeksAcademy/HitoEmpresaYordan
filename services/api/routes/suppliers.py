from typing import List, Optional

from fastapi import APIRouter, HTTPException, Response, status
from tinydb import Query
from tinydb.table import Document

from database import db_lock, suppliers_table
from models import (
    Country,
    Supplier,
    SupplierCategory,
    SupplierCreate,
    SupplierRateUpdate,
    SupplierStatusUpdate,
    utc_now,
)

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


def to_supplier(doc: Document) -> Supplier:
    return Supplier(id=doc.doc_id, **doc)


def get_or_404(supplier_id: int) -> Document:
    doc = suppliers_table.get(doc_id=supplier_id)
    if doc is None:
        raise HTTPException(status_code=404, detail=f"Proveedor {supplier_id} no encontrado")
    return doc


@router.post("", response_model=Supplier, status_code=status.HTTP_201_CREATED)
def create_supplier(payload: SupplierCreate) -> Supplier:
    data = {**payload.model_dump(mode="json"), "updated_at": utc_now().isoformat()}
    with db_lock:
        supplier_id = suppliers_table.insert(data)
    return Supplier(id=supplier_id, **data)


@router.get("", response_model=List[Supplier])
def list_suppliers(
    country: Optional[Country] = None,
    category: Optional[SupplierCategory] = None,
) -> List[Supplier]:
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
    return [to_supplier(doc) for doc in docs]


@router.get("/{supplier_id}", response_model=Supplier)
def get_supplier(supplier_id: int) -> Supplier:
    with db_lock:
        doc = get_or_404(supplier_id)
    return to_supplier(doc)


@router.patch("/{supplier_id}/rate", response_model=Supplier)
def update_rate(supplier_id: int, payload: SupplierRateUpdate) -> Supplier:
    with db_lock:
        get_or_404(supplier_id)
        suppliers_table.update(
            {"monthly_rate": payload.monthly_rate, "updated_at": utc_now().isoformat()},
            doc_ids=[supplier_id],
        )
        doc = suppliers_table.get(doc_id=supplier_id)
    return to_supplier(doc)


@router.patch("/{supplier_id}/status", response_model=Supplier)
def update_status(supplier_id: int, payload: SupplierStatusUpdate) -> Supplier:
    # Según el BRIEFING, updated_at solo refleja cambios de tarifa
    with db_lock:
        get_or_404(supplier_id)
        suppliers_table.update({"status": payload.status.value}, doc_ids=[supplier_id])
        doc = suppliers_table.get(doc_id=supplier_id)
    return to_supplier(doc)


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(supplier_id: int) -> Response:
    with db_lock:
        get_or_404(supplier_id)
        suppliers_table.remove(doc_ids=[supplier_id])
    return Response(status_code=status.HTTP_204_NO_CONTENT)
