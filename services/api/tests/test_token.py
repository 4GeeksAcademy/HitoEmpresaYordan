"""Tests para GET /auth/me — Validación de tokens JWT.

Cubre:
- Camino feliz: token válido devuelve perfil completo.
- Casos límite: token ausente, malformado, expirado, firmado con otra clave,
  token de password reset, sub no numérico, usuario inactivo, sin sub, sin exp.
- Modos de fallo: Bearer vacío.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from jose import jwt


# ── Happy path ────────────────────────────────────────────────────────


def test_me_with_valid_token(client: TestClient, auth_header: dict, registered_user: dict) -> None:
    """TC-ME-01: Token válido → 200 con id, email, role, profile."""
    resp = client.get("/auth/me", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == registered_user["id"]
    assert data["email"] == registered_user["email"]
    assert data["role"] == "user"
    assert data["is_active"] is True
    assert "profile" in data
    assert "hashed_password" not in data


def test_me_profile_without_optional_data(client: TestClient) -> None:
    """TC-ME-02: Usuario sin nombre/telefono → profile con campos null."""
    # Registramos usuario SIN nombre para probar campos opcionales
    resp_reg = client.post("/users", json={
        "email": "noname@example.com", "password": "12345678",
    })
    assert resp_reg.status_code == 201

    # Login
    resp_login = client.post("/auth/login", data={
        "username": "noname@example.com", "password": "12345678",
    })
    assert resp_login.status_code == 200
    token = resp_login.json()["access_token"]

    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    profile = resp.json()["profile"]
    assert profile["name"] is None
    assert profile["phone"] is None
    assert profile["address"] is None


# ── Edge cases ────────────────────────────────────────────────────────


def test_me_no_token(client: TestClient) -> None:
    """TC-ME-03: Sin header Authorization → 401."""
    resp = client.get("/auth/me")
    assert resp.status_code == 401
    assert "Token de autenticacion invalido o ausente" in resp.json()["detail"]


def test_me_malformed_token(client: TestClient) -> None:
    """TC-ME-04: Token que no es un JWT → 401."""
    resp = client.get("/auth/me", headers={"Authorization": "Bearer abc123"})
    assert resp.status_code == 401


def test_me_expired_token(client: TestClient) -> None:
    """TC-ME-05: Token con exp en el pasado → 401."""
    from auth import SECRET_KEY, ALGORITHM
    expired = jwt.encode(
        {"sub": "1", "exp": datetime.now(timezone.utc) - timedelta(hours=1)},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {expired}"})
    assert resp.status_code == 401


def test_me_wrong_signature(client: TestClient) -> None:
    """TC-ME-06: Token firmado con clave diferente → 401."""
    wrong_token = jwt.encode(
        {"sub": "1", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
        "wrong-secret",
        algorithm="HS256",
    )
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {wrong_token}"})
    assert resp.status_code == 401


def test_me_password_reset_token_rejected(client: TestClient) -> None:
    """TC-ME-07: Token con purpose=password_reset → 401 (rechazado explícitamente)."""
    from auth import SECRET_KEY, ALGORITHM
    reset_token = jwt.encode(
        {
            "sub": "1",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            "jti": "some-id",
            "purpose": "password_reset",
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {reset_token}"})
    assert resp.status_code == 401


def test_me_non_numeric_sub(client: TestClient) -> None:
    """TC-ME-08: Token con sub no numérico → 401."""
    from auth import SECRET_KEY, ALGORITHM
    token = jwt.encode(
        {"sub": "not-a-number", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401


def test_me_inactive_user_token(
    client: TestClient, registered_user: dict, auth_token: str,
) -> None:
    """TC-ME-09: Token de usuario que fue desactivado → 401."""
    from database import users_table, db_lock
    with db_lock:
        users_table.update({"is_active": False}, doc_ids=[registered_user["id"]])

    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {auth_token}"})
    assert resp.status_code == 401


def test_me_token_without_sub(client: TestClient) -> None:
    """TC-ME-10: Token sin claim sub → 401 (require_sub=True)."""
    from auth import SECRET_KEY, ALGORITHM
    token = jwt.encode(
        {"exp": datetime.now(timezone.utc) + timedelta(hours=1)},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401


def test_me_token_without_exp(client: TestClient) -> None:
    """TC-ME-11: Token sin exp → 401 (require_exp=True)."""
    from auth import SECRET_KEY, ALGORITHM
    token = jwt.encode({"sub": "1"}, SECRET_KEY, algorithm=ALGORITHM)
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401


# ── Failure modes ─────────────────────────────────────────────────────


def test_me_bearer_empty_string(client: TestClient) -> None:
    """TC-ME-12: Header 'Authorization: Bearer ' (token vacío) → 401."""
    resp = client.get("/auth/me", headers={"Authorization": "Bearer "})
    assert resp.status_code == 401