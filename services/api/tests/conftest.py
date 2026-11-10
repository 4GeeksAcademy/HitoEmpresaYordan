"""Fixtures compartidos para la batería de tests de autenticación.

Usa una base de datos TinyDB en memoria (archivo temporal) para no
contaminar la base de datos real ``services/api/data/db.json``.
"""

from __future__ import annotations

import json
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from passlib.hash import bcrypt


@pytest.fixture(autouse=True)
def _reset_db() -> Generator[None, None, None]:
    """Limpia todas las tablas de TinyDB antes y después de cada test.

    Como cada módulo importa las tablas desde ``database``, y esas son
    referencias a objetos Python vivos, limpiar las tablas directamente
    es suficiente para que cada test arranque con DB vacía sin necesidad
    de recargar módulos ni arriesgar la DB real.
    """
    from tinydb import TinyDB
    import database

    # Guardar referencia a las tablas originales
    tables = list(database.db.tables())

    for table_name in tables:
        database.db.drop_table(table_name)

    yield

    for table_name in list(database.db.tables()):
        database.db.drop_table(table_name)


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Cliente de pruebas de FastAPI contra la aplicación real."""
    from main import app

    with TestClient(app) as c:
        yield c


# ── Fixtures de datos ─────────────────────────────────────────────────


@pytest.fixture
def register_payload() -> dict:
    """Payload válido para registrar un usuario nuevo."""
    return {"email": "alice@example.com", "password": "SecurePass1", "name": "Alice"}


@pytest.fixture
def registered_user(client: TestClient, register_payload: dict) -> dict:
    """Registra un usuario y devuelve un dict con id, email, password."""
    resp = client.post("/users", json=register_payload)
    assert resp.status_code == 201, f"Registro falló: {resp.json()}"
    data = resp.json()
    return {"id": data["id"], "email": data["email"], "password": register_payload["password"]}


@pytest.fixture
def auth_token(client: TestClient, registered_user: dict) -> str:
    """Devuelve un token JWT válido para el usuario registrado."""
    resp = client.post("/auth/login", data={
        "username": registered_user["email"],
        "password": registered_user["password"],
    })
    assert resp.status_code == 200, f"Login falló: {resp.json()}"
    return resp.json()["access_token"]


@pytest.fixture
def auth_header(auth_token: str) -> dict[str, str]:
    """Header de autorización con token JWT válido."""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def admin_user(client: TestClient) -> dict:
    """Crea un usuario administrador directamente en la base de datos temporal."""
    from database import users_table
    from models import utc_now

    email = "admin@nexova.com"
    password = "AdminPass123"
    user_id = users_table.insert({
        "email": email,
        "hashed_password": bcrypt.hash(password),
        "is_active": True,
        "role": "admin",
        "created_at": utc_now().isoformat(),
    })
    resp = client.post("/auth/login", data={"username": email, "password": password})
    assert resp.status_code == 200, f"Login admin falló: {resp.json()}"
    return {
        "id": user_id,
        "email": email,
        "password": password,
        "token": resp.json()["access_token"],
    }


@pytest.fixture
def second_user(client: TestClient) -> dict:
    """Registra un segundo usuario (no admin)."""
    payload = {"email": "bob@example.com", "password": "BobPass123", "name": "Bob"}
    resp = client.post("/users", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    return {"id": data["id"], "email": data["email"], "password": payload["password"]}