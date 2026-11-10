"""Tests para el endpoint POST /auth/login — Inicio de sesión.

Cubre:
- Camino feliz: credenciales válidas, token decodificable con sub y exp.
- Casos límite: email inexistente, password incorrecta, campos vacíos,
  usuario inactivo.
- Modos de fallo: content-type incorrecto, campos ausentes.
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi.testclient import TestClient
from jose import jwt


# ── Happy path ────────────────────────────────────────────────────────


def test_login_valid_credentials(client: TestClient, registered_user: dict) -> None:
    """TC-LOG-01: Login con credenciales válidas → 200 + token."""
    resp = client.post("/auth/login", data={
        "username": registered_user["email"],
        "password": registered_user["password"],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_token_has_valid_sub_and_exp(client: TestClient, registered_user: dict) -> None:
    """TC-LOG-02: El token contiene 'sub' (id) y 'exp' futuro."""
    resp = client.post("/auth/login", data={
        "username": registered_user["email"],
        "password": registered_user["password"],
    })
    assert resp.status_code == 200
    token = resp.json()["access_token"]

    from auth import SECRET_KEY, ALGORITHM
    claims = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert claims["sub"] == str(registered_user["id"])
    assert claims["exp"] > datetime.now(timezone.utc).timestamp()


# ── Edge cases ────────────────────────────────────────────────────────


def test_login_nonexistent_email(client: TestClient) -> None:
    """TC-LOG-03: Email no registrado → 401."""
    resp = client.post("/auth/login", data={
        "username": "noexisto@example.com",
        "password": "SomePass123",
    })
    assert resp.status_code == 401
    assert "Credenciales invalidas" in resp.json()["detail"]


def test_login_wrong_password(client: TestClient, registered_user: dict) -> None:
    """TC-LOG-04: Email correcto + password incorrecto → 401."""
    resp = client.post("/auth/login", data={
        "username": registered_user["email"],
        "password": "WrongPassword1",
    })
    assert resp.status_code == 401
    assert "Credenciales invalidas" in resp.json()["detail"]


def test_login_empty_username(client: TestClient) -> None:
    """TC-LOG-05: Email vacío → 422."""
    resp = client.post("/auth/login", data={"username": "", "password": "SomePass123"})
    assert resp.status_code == 422


def test_login_empty_password(client: TestClient, registered_user: dict) -> None:
    """TC-LOG-06: Password vacío → 422."""
    resp = client.post("/auth/login", data={
        "username": registered_user["email"],
        "password": "",
    })
    assert resp.status_code == 422


def test_login_inactive_user(client: TestClient, registered_user: dict) -> None:
    """TC-LOG-07: Usuario inactivo → 401 (mismo mensaje que credenciales inválidas)."""
    # Marcar usuario como inactivo directamente en la DB
    from database import users_table, db_lock
    with db_lock:
        users_table.update({"is_active": False}, doc_ids=[registered_user["id"]])

    resp = client.post("/auth/login", data={
        "username": registered_user["email"],
        "password": registered_user["password"],
    })
    assert resp.status_code == 401
    assert "Credenciales invalidas" in resp.json()["detail"]


# ── Failure modes ─────────────────────────────────────────────────────


def test_login_wrong_content_type(client: TestClient, registered_user: dict) -> None:
    """TC-LOG-08: Enviar JSON en vez de form-data → 422."""
    resp = client.post("/auth/login", json={
        "username": registered_user["email"],
        "password": registered_user["password"],
    })
    assert resp.status_code == 422


def test_login_missing_username_field(client: TestClient) -> None:
    """Solo password, sin username → 422."""
    resp = client.post("/auth/login", data={"password": "SomePass123"})
    assert resp.status_code == 422