"""Tests para POST /auth/forgot-password — Solicitud de restablecimiento.

Cubre:
- Camino feliz: email existente → 200 (mismo mensaje que inexistente).
  Email inexistente → 200 (mismo mensaje por seguridad).
- Casos límite: email inválido, vacío, campos extra, usuario inactivo.
- Modos de fallo: (el task en background falla silenciosamente, la respuesta es 200).
"""

from __future__ import annotations

from fastapi.testclient import TestClient


SUCCESS_MSG = "Si la cuenta existe, recibiras un enlace para restablecer la contrasena"


# ── Happy path ────────────────────────────────────────────────────────


def test_forgot_password_existing_email(client: TestClient, registered_user: dict) -> None:
    """TC-FP-01: Email existente → 200 con mensaje genérico."""
    resp = client.post("/auth/forgot-password", json={"email": registered_user["email"]})
    assert resp.status_code == 200
    assert resp.json()["message"] == SUCCESS_MSG


def test_forgot_password_nonexistent_email(client: TestClient) -> None:
    """TC-FP-02: Email no registrado → 200 con el MISMO mensaje (seguridad)."""
    resp = client.post("/auth/forgot-password", json={"email": "noexisto@example.com"})
    assert resp.status_code == 200
    assert resp.json()["message"] == SUCCESS_MSG


# ── Edge cases ────────────────────────────────────────────────────────


def test_forgot_password_invalid_email(client: TestClient) -> None:
    """TC-FP-03: Email con formato inválido → 422."""
    resp = client.post("/auth/forgot-password", json={"email": "invalido"})
    assert resp.status_code == 422


def test_forgot_password_empty_email(client: TestClient) -> None:
    """TC-FP-04: Email vacío → 422."""
    resp = client.post("/auth/forgot-password", json={"email": ""})
    assert resp.status_code == 422


def test_forgot_password_extra_fields_forbidden(client: TestClient) -> None:
    """TC-FP-05: Campos extra → 422 (extra='forbid')."""
    resp = client.post("/auth/forgot-password", json={"email": "a@b.com", "extra": True})
    assert resp.status_code == 422


def test_forgot_password_inactive_user(client: TestClient, registered_user: dict) -> None:
    """TC-FP-06: Usuario inactivo → 200 (no se envía email, pero no se revela)."""
    from database import users_table, db_lock
    with db_lock:
        users_table.update({"is_active": False}, doc_ids=[registered_user["id"]])

    resp = client.post("/auth/forgot-password", json={"email": registered_user["email"]})
    assert resp.status_code == 200
    assert resp.json()["message"] == SUCCESS_MSG


# ── Failure modes ─────────────────────────────────────────────────────


def test_forgot_password_missing_email_field(client: TestClient) -> None:
    """Cuerpo sin campo email → 422."""
    resp = client.post("/auth/forgot-password", json={})
    assert resp.status_code == 422