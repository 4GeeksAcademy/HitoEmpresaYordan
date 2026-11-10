"""Tests para POST /auth/reset-password — Restablecer contraseña con token.

Cubre:
- Camino feliz: token válido → 200, login con nueva contraseña, monouso.
- Casos límite: token malformado, expirado, purpose incorrecto, sin jti,
  password < 8 / > 72 bytes, firma incorrecta, usuario inactivo,
  reset tras cambio manual de contraseña.
- Modos de fallo: token vacío.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from jose import jwt


def _make_reset_token(user_id: int, secret: str = None, **overrides) -> str:
    """Genera un token de password reset para tests."""
    from auth import SECRET_KEY as DEFAULT_SECRET, ALGORITHM

    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
        "jti": "test-token-id-123",
        "purpose": "password_reset",
    }
    payload.update(overrides)
    return jwt.encode(payload, secret or DEFAULT_SECRET, algorithm=ALGORITHM)


# ── Happy path ────────────────────────────────────────────────────────


def test_reset_password_valid_token(client: TestClient, registered_user: dict) -> None:
    """TC-RP-01: Reset con token válido → 200."""
    # Primero solicitar forgot-password para que se almacene el reset
    client.post("/auth/forgot-password", json={"email": registered_user["email"]})

    # El token real se genera en background; lo creamos manualmente
    from auth import SECRET_KEY, ALGORITHM
    from services import get_user_by_id, register_password_reset
    import secrets
    from datetime import timezone as tz

    user = get_user_by_id(registered_user["id"])
    token_id = secrets.token_urlsafe(32)
    expires_at = int((datetime.now(tz.utc) + timedelta(minutes=30)).timestamp())
    token = jwt.encode(
        {"sub": str(user.id), "exp": expires_at, "jti": token_id, "purpose": "password_reset"},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    register_password_reset(user, token_id, expires_at)

    resp = client.post("/auth/reset-password", json={
        "token": token,
        "new_password": "NewPass123!",
    })
    assert resp.status_code == 200
    assert resp.json()["message"] == "Contrasena restablecida"


def test_reset_password_login_with_new_password(
    client: TestClient, registered_user: dict,
) -> None:
    """TC-RP-02: Login con nueva contraseña tras reset → 200."""
    # Mismo setup que test_reset_password_valid_token
    from auth import SECRET_KEY, ALGORITHM
    from services import get_user_by_id, register_password_reset
    import secrets
    from datetime import timezone as tz

    user = get_user_by_id(registered_user["id"])
    token_id = secrets.token_urlsafe(32)
    expires_at = int((datetime.now(tz.utc) + timedelta(minutes=30)).timestamp())
    reset_token = jwt.encode(
        {"sub": str(user.id), "exp": expires_at, "jti": token_id, "purpose": "password_reset"},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    register_password_reset(user, token_id, expires_at)

    new_password = "NewPass456!"
    client.post("/auth/reset-password", json={"token": reset_token, "new_password": new_password})

    resp = client.post("/auth/login", data={
        "username": registered_user["email"],
        "password": new_password,
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_reset_password_single_use(client: TestClient, registered_user: dict) -> None:
    """TC-RP-03: Token monouso — segundo uso → 400."""
    from auth import SECRET_KEY, ALGORITHM
    from services import get_user_by_id, register_password_reset
    import secrets
    from datetime import timezone as tz

    user = get_user_by_id(registered_user["id"])
    token_id = secrets.token_urlsafe(32)
    expires_at = int((datetime.now(tz.utc) + timedelta(minutes=30)).timestamp())
    reset_token = jwt.encode(
        {"sub": str(user.id), "exp": expires_at, "jti": token_id, "purpose": "password_reset"},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    register_password_reset(user, token_id, expires_at)

    # Primer uso → 200
    first = client.post("/auth/reset-password", json={
        "token": reset_token, "new_password": "NewPass789!",
    })
    assert first.status_code == 200

    # Segundo uso → 400
    second = client.post("/auth/reset-password", json={
        "token": reset_token, "new_password": "AnotherPass1",
    })
    assert second.status_code == 400


# ── Edge cases ────────────────────────────────────────────────────────


def test_reset_password_malformed_token(client: TestClient) -> None:
    """TC-RP-04: Token que no es un JWT → 400."""
    resp = client.post("/auth/reset-password", json={
        "token": "no-es-un-jwt",
        "new_password": "NewPass123!",
    })
    assert resp.status_code == 400


def test_reset_password_expired_token(client: TestClient, registered_user: dict) -> None:
    """TC-RP-05: Token expirado → 400."""
    token = _make_reset_token(
        registered_user["id"],
        exp=datetime.now(timezone.utc) - timedelta(hours=1),
    )
    resp = client.post("/auth/reset-password", json={
        "token": token, "new_password": "NewPass123!",
    })
    assert resp.status_code == 400


def test_reset_password_wrong_purpose(client: TestClient, registered_user: dict) -> None:
    """TC-RP-06: Token de auth usado como reset → 400."""
    from auth import SECRET_KEY, ALGORITHM
    auth_token = jwt.encode(
        {"sub": str(registered_user["id"]),
         "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
        SECRET_KEY, algorithm=ALGORITHM,
    )
    resp = client.post("/auth/reset-password", json={
        "token": auth_token, "new_password": "NewPass123!",
    })
    assert resp.status_code == 400


def test_reset_password_without_jti(client: TestClient, registered_user: dict) -> None:
    """TC-RP-07: Token reset sin claim jti → 400 (require_jti=True)."""
    token = _make_reset_token(registered_user["id"], jti=None)
    # Quitar jti del payload
    from auth import SECRET_KEY, ALGORITHM
    token = jwt.encode(
        {"sub": str(registered_user["id"]),
         "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
         "purpose": "password_reset"},
        SECRET_KEY, algorithm=ALGORITHM,
    )
    resp = client.post("/auth/reset-password", json={
        "token": token, "new_password": "NewPass123!",
    })
    assert resp.status_code == 400


def test_reset_password_new_password_too_short(client: TestClient) -> None:
    """TC-RP-08: Nueva contraseña < 8 caracteres → 422."""
    resp = client.post("/auth/reset-password", json={
        "token": "un-token-cualquiera",
        "new_password": "1234567",
    })
    assert resp.status_code == 422


def test_reset_password_new_password_over_72_bytes(client: TestClient) -> None:
    """TC-RP-09: Nueva contraseña > 72 bytes → 422."""
    resp = client.post("/auth/reset-password", json={
        "token": "un-token-cualquiera",
        "new_password": "a" * 73,
    })
    assert resp.status_code == 422


def test_reset_password_wrong_signature(client: TestClient, registered_user: dict) -> None:
    """TC-RP-10: Token firmado con clave diferente → 400."""
    token = _make_reset_token(registered_user["id"], secret="wrong-secret")
    resp = client.post("/auth/reset-password", json={
        "token": token, "new_password": "NewPass123!",
    })
    assert resp.status_code == 400


def test_reset_password_inactive_user(client: TestClient, registered_user: dict) -> None:
    """TC-RP-11: Usuario inactivo intenta reset → 400."""
    from auth import SECRET_KEY, ALGORITHM
    from services import get_user_by_id, register_password_reset
    import secrets
    from datetime import timezone as tz

    user = get_user_by_id(registered_user["id"])
    token_id = secrets.token_urlsafe(32)
    expires_at = int((datetime.now(tz.utc) + timedelta(minutes=30)).timestamp())
    reset_token = jwt.encode(
        {"sub": str(user.id), "exp": expires_at, "jti": token_id, "purpose": "password_reset"},
        SECRET_KEY, algorithm=ALGORITHM,
    )
    register_password_reset(user, token_id, expires_at)

    # Desactivar usuario
    from database import users_table, db_lock
    with db_lock:
        users_table.update({"is_active": False}, doc_ids=[registered_user["id"]])

    resp = client.post("/auth/reset-password", json={
        "token": reset_token, "new_password": "NewPass123!",
    })
    assert resp.status_code == 400


def test_reset_password_after_manual_change(
    client: TestClient, registered_user: dict, auth_header: dict,
) -> None:
    """TC-RP-12: Reset token generado antes de change-password → 400 (password_hash cambió)."""
    from auth import SECRET_KEY, ALGORITHM
    from services import get_user_by_id, register_password_reset
    import secrets
    from datetime import timezone as tz

    user = get_user_by_id(registered_user["id"])
    token_id = secrets.token_urlsafe(32)
    expires_at = int((datetime.now(tz.utc) + timedelta(minutes=30)).timestamp())
    reset_token = jwt.encode(
        {"sub": str(user.id), "exp": expires_at, "jti": token_id, "purpose": "password_reset"},
        SECRET_KEY, algorithm=ALGORITHM,
    )
    register_password_reset(user, token_id, expires_at)

    # Cambiar contraseña manualmente
    client.post("/auth/change-password", json={
        "current_password": registered_user["password"],
        "new_password": "ManualChange1",
    }, headers=auth_header)

    # Intentar usar el token de reset anterior → debe fallar
    resp = client.post("/auth/reset-password", json={
        "token": reset_token, "new_password": "ShouldNotWork1",
    })
    assert resp.status_code == 400


# ── Failure modes ─────────────────────────────────────────────────────


def test_reset_password_empty_token(client: TestClient) -> None:
    """TC-RP-13: Token vacío → 400 (falla al decodificar como JWT)."""
    resp = client.post("/auth/reset-password", json={"token": "", "new_password": "NewPass123!"})
    assert resp.status_code == 400