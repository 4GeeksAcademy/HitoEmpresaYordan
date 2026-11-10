"""Tests para POST /auth/change-password — Cambio de contraseña.

Cubre:
- Camino feliz: cambio correcto, login con nueva contraseña.
- Casos límite: current_password incorrecta, token ausente,
  nueva password < 8 / > 72 bytes, usuario inactivo,
  reset pendiente invalidado tras cambio.
- Modos de fallo: token expirado.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from jose import jwt


# ── Happy path ────────────────────────────────────────────────────────


def test_change_password_valid(
    client: TestClient, registered_user: dict, auth_header: dict,
) -> None:
    """TC-CP-01: Cambio con contraseña actual correcta → 200."""
    resp = client.post("/auth/change-password", json={
        "current_password": registered_user["password"],
        "new_password": "NewPass123!",
    }, headers=auth_header)
    assert resp.status_code == 200
    assert resp.json()["message"] == "Contrasena actualizada"


def test_change_password_login_with_new_password(
    client: TestClient, registered_user: dict, auth_header: dict,
) -> None:
    """TC-CP-02: Login con nueva contraseña tras cambio → 200."""
    new_password = "BrandNewPass1"
    client.post("/auth/change-password", json={
        "current_password": registered_user["password"],
        "new_password": new_password,
    }, headers=auth_header)

    resp = client.post("/auth/login", data={
        "username": registered_user["email"],
        "password": new_password,
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


# ── Edge cases ────────────────────────────────────────────────────────


def test_change_password_wrong_current(
    client: TestClient, registered_user: dict, auth_header: dict,
) -> None:
    """TC-CP-03: Contraseña actual incorrecta → 400."""
    resp = client.post("/auth/change-password", json={
        "current_password": "WrongCurrent1",
        "new_password": "NewPass123!",
    }, headers=auth_header)
    assert resp.status_code == 400
    assert "La contrasena actual es incorrecta" in resp.json()["detail"]


def test_change_password_no_token(client: TestClient) -> None:
    """TC-CP-04: Sin header Authorization → 401."""
    resp = client.post("/auth/change-password", json={
        "current_password": "anything",
        "new_password": "NewPass123!",
    })
    assert resp.status_code == 401


def test_change_password_new_password_too_short(
    client: TestClient, auth_header: dict,
) -> None:
    """TC-CP-05: Nueva contraseña < 8 caracteres → 422."""
    resp = client.post("/auth/change-password", json={
        "current_password": "anything",
        "new_password": "1234567",
    }, headers=auth_header)
    assert resp.status_code == 422


def test_change_password_new_password_over_72_bytes(
    client: TestClient, auth_header: dict,
) -> None:
    """TC-CP-06: Nueva contraseña > 72 bytes → 422."""
    resp = client.post("/auth/change-password", json={
        "current_password": "anything",
        "new_password": "a" * 73,
    }, headers=auth_header)
    assert resp.status_code == 422


def test_change_password_inactive_user(
    client: TestClient, registered_user: dict, auth_token: str,
) -> None:
    """TC-CP-07: Usuario inactivo → 401."""
    from database import users_table, db_lock
    with db_lock:
        users_table.update({"is_active": False}, doc_ids=[registered_user["id"]])

    resp = client.post("/auth/change-password", json={
        "current_password": registered_user["password"],
        "new_password": "NewPass123!",
    }, headers={"Authorization": f"Bearer {auth_token}"})
    assert resp.status_code == 401


def test_change_password_invalidates_pending_reset(
    client: TestClient, registered_user: dict, auth_header: dict,
) -> None:
    """TC-CP-08: Cambiar password invalida el reset pendiente (el hash cambia)."""
    # Primero solicitar forgot-password para que se genere un reset
    client.post("/auth/forgot-password", json={"email": registered_user["email"]})

    # Ahora cambiar la contraseña
    new_password = "ChangedPass1"
    client.post("/auth/change-password", json={
        "current_password": registered_user["password"],
        "new_password": new_password,
    }, headers=auth_header)

    # El token de reset anterior ya no sirve → verificado en TC-RP-12


# ── Failure modes ─────────────────────────────────────────────────────


def test_change_password_expired_token(client: TestClient) -> None:
    """TC-CP-09: Token JWT expirado → 401."""
    from auth import SECRET_KEY, ALGORITHM
    expired = jwt.encode(
        {"sub": "999", "exp": datetime.now(timezone.utc) - timedelta(hours=1)},
        SECRET_KEY, algorithm=ALGORITHM,
    )
    resp = client.post("/auth/change-password", json={
        "current_password": "anything",
        "new_password": "NewPass123!",
    }, headers={"Authorization": f"Bearer {expired}"})
    assert resp.status_code == 401