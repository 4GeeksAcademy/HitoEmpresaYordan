"""Tests para el endpoint POST /users — Registro de usuario.

Cubre:
- Camino feliz: registro con datos válidos, con y sin campos opcionales.
- Casos límite: email duplicado, formato inválido, password < 8 / > 72 bytes,
  campos extra, email con espacios.
- Modos de fallo: payload no JSON, campos obligatorios ausentes.
"""

from __future__ import annotations

from fastapi.testclient import TestClient


# ── Happy path ────────────────────────────────────────────────────────


def test_register_with_all_fields(client: TestClient) -> None:
    """TC-REG-01: Registrar usuario con email, password y nombre."""
    payload = {"email": "a@b.com", "password": "12345678", "name": "Alice"}
    resp = client.post("/users", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "a@b.com"
    assert data["is_active"] is True
    assert data["role"] == "user"
    assert "hashed_password" not in data  # Nunca se expone
    assert "id" in data


def test_register_without_optional_fields(client: TestClient) -> None:
    """TC-REG-02: Registrar usuario solo con email y password."""
    payload = {"email": "b@c.com", "password": "12345678"}
    resp = client.post("/users", json=payload)
    assert resp.status_code == 201
    assert resp.json()["email"] == "b@c.com"


# ── Edge cases ────────────────────────────────────────────────────────


def test_register_duplicate_email(client: TestClient) -> None:
    """TC-REG-03: Email duplicado → 409."""
    payload = {"email": "dup@example.com", "password": "12345678"}
    resp1 = client.post("/users", json=payload)
    assert resp1.status_code == 201

    resp2 = client.post("/users", json=payload)
    assert resp2.status_code == 409
    assert "Ya existe" in resp2.json()["detail"]


def test_register_duplicate_email_case_insensitive(client: TestClient) -> None:
    """TC-REG-03b: Mismo email con mayúsculas → 409 (normalizado a lowercase)."""
    client.post("/users", json={"email": "Case@test.com", "password": "12345678"})
    resp = client.post("/users", json={"email": "CASE@test.com", "password": "12345678"})
    assert resp.status_code == 409


def test_register_invalid_email_format(client: TestClient) -> None:
    """TC-REG-04: Email sin formato válido → 422."""
    resp = client.post("/users", json={"email": "invalido", "password": "12345678"})
    assert resp.status_code == 422


def test_register_password_too_short(client: TestClient) -> None:
    """TC-REG-05: Password menor de 8 caracteres → 422."""
    resp = client.post("/users", json={"email": "x@y.com", "password": "1234567"})
    assert resp.status_code == 422


def test_register_password_exactly_72_bytes(client: TestClient) -> None:
    """TC-REG-06: Password de exactamente 72 bytes → 201."""
    password = "a" * 72
    resp = client.post("/users", json={"email": "max72@example.com", "password": password})
    assert resp.status_code == 201


def test_register_password_over_72_bytes(client: TestClient) -> None:
    """TC-REG-07: Password de más de 72 bytes → 422."""
    password = "a" * 73
    resp = client.post("/users", json={"email": "over72@example.com", "password": password})
    assert resp.status_code == 422


def test_register_empty_email(client: TestClient) -> None:
    """TC-REG-08: Email vacío → 422."""
    resp = client.post("/users", json={"email": "", "password": "12345678"})
    assert resp.status_code == 422


def test_register_empty_password(client: TestClient) -> None:
    """TC-REG-09: Password vacío → 422 (viola min_length=8)."""
    resp = client.post("/users", json={"email": "x@y.com", "password": ""})
    assert resp.status_code == 422


def test_register_extra_fields_forbidden(client: TestClient) -> None:
    """TC-REG-10: Campos extra no definidos → 422 (extra='forbid')."""
    resp = client.post("/users", json={
        "email": "x@y.com", "password": "12345678", "role": "admin",
    })
    assert resp.status_code == 422


def test_register_email_with_spaces(client: TestClient) -> None:
    """TC-REG-11: Email con espacios internos → 422 (el patrón EMAIL_PATTERN lo rechaza)."""
    resp = client.post("/users", json={
        "email": "  ALICE@EXAMPLE.COM  ", "password": "12345678",
    })
    # El email regex de Pydantic rechaza espacios incluso si hay strip antes
    assert resp.status_code == 422


# ── Failure modes ─────────────────────────────────────────────────────


def test_register_non_json_payload(client: TestClient) -> None:
    """TC-REG-13: Payload en texto plano → 422."""
    resp = client.post("/users", content="text plain", headers={"Content-Type": "text/plain"})
    assert resp.status_code == 422


def test_register_missing_required_fields(client: TestClient) -> None:
    """Campos obligatorios ausentes (solo email) → 422."""
    resp = client.post("/users", json={"email": "x@y.com"})
    assert resp.status_code == 422


def test_register_blank_name_fails_validation(client: TestClient) -> None:
    """Nombre vacío (min_length=1) → 422."""
    resp = client.post("/users", json={
        "email": "x@y.com", "password": "12345678", "name": "",
    })
    assert resp.status_code == 422