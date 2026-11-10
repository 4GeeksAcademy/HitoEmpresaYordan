# Estrategia de Pruebas — API de Autenticación (AUTH-088)

> **Ticket:** AUTH-088 — Suite de tests para la API de autenticación
> **Proyecto:** Nexova Suppliers API
> **Fecha:** 2026-11-10

---

## 1. Endpoints a cubrir

La API de autenticación expone los siguientes endpoints definidos en `services/api/auth.py` y `services/api/users.py`:

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| POST | `/auth/login` | ❌ No | Inicio de sesión (email + password) → JWT |
| POST | `/auth/forgot-password` | ❌ No | Solicitar restablecimiento de contraseña |
| POST | `/auth/reset-password` | ❌ No | Restablecer contraseña con token |
| POST | `/auth/change-password` | ✅ JWT | Cambiar contraseña (requiere actual) |
| GET | `/auth/me` | ✅ JWT | Obtener usuario actual + perfil |
| POST | `/users` | ❌ No | Registrar nuevo usuario |
| GET | `/users` | ✅ JWT (admin) | Listar todos los usuarios |
| GET | `/users/{id}` | ✅ JWT (propietario o admin) | Obtener usuario por ID |
| PUT | `/users/{id}` | ✅ JWT (propietario o admin) | Actualizar usuario |
| DELETE | `/users/{id}` | ✅ JWT (propietario o admin) | Eliminar usuario |

---

## 2. Casos de prueba planificados

### 2.1 POST `/users` — Registro de usuario

#### Camino feliz
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-REG-01 | Registrar usuario con datos válidos | `{"email": "a@b.com", "password": "12345678", "name": "Alice"}` | `201`, devuelve `UserRead` sin `hashed_password` |
| TC-REG-02 | Registrar usuario sin campos opcionales | Solo `email` + `password` | `201`, `name` = `null` |

#### Casos límite
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-REG-03 | Email duplicado | Mismo email que TC-REG-01 | `409`, `"Ya existe una cuenta con ese correo electronico"` |
| TC-REG-04 | Email con formato inválido | `"email": "invalido"` | `422`, error de validación |
| TC-REG-05 | Password menor de 8 caracteres | `"password": "1234567"` | `422`, error de validación |
| TC-REG-06 | Password de exactamente 72 bytes | 72 caracteres ASCII | `201` |
| TC-REG-07 | Password de más de 72 bytes | 73 caracteres ASCII | `422`, `"La contrasena no puede superar 72 bytes"` |
| TC-REG-08 | Email vacío | `"email": ""` | `422` |
| TC-REG-09 | Password vacío | `"password": ""` | `422` (min_length=8) |
| TC-REG-10 | Campos extra no permitidos | Incluir `"role": "admin"` | `422` (extra="forbid") |
| TC-REG-11 | Email con espacios alrededor | `"email": "  a@b.com  "` | `201`, email almacenado como `"a@b.com"` |

#### Modos de fallo
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-REG-12 | Base de datos no disponible | Simular fallo en TinyDB | `500`, error interno |
| TC-REG-13 | Payload no es JSON | Enviar texto plano | `422` |

---

### 2.2 POST `/auth/login` — Inicio de sesión

#### Camino feliz
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-LOG-01 | Login con credenciales válidas | `username` (email) + `password` correctos | `200`, devuelve `access_token` + `token_type: "bearer"` |
| TC-LOG-02 | Login y el token contiene sub válido | Decodificar token | `sub` = id del usuario, `exp` futuro |

#### Casos límite
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-LOG-03 | Login con email inexistente | Email no registrado | `401`, `"Credenciales invalidas"` |
| TC-LOG-04 | Login con contraseña incorrecta | Email existente + password erróneo | `401`, `"Credenciales invalidas"` |
| TC-LOG-05 | Login con email vacío | `username: ""` | `422` |
| TC-LOG-06 | Login con password vacío | Password omitido | `422` |
| TC-LOG-07 | Usuario inactivo intenta login | `is_active = false` | `401`, `"Credenciales invalidas"` |

#### Modos de fallo
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-LOG-08 | Content-Type incorrecto | Enviar JSON en vez de form-data | `422` |
| TC-LOG-09 | JWT_SECRET no configurado | Variable de entorno ausente | `RuntimeError` al arrancar |

---

### 2.3 GET `/auth/me` — Perfil actual

#### Camino feliz
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-ME-01 | Obtener perfil con token válido | Header `Authorization: Bearer <token>` | `200`, devuelve `AuthMe` con `id`, `email`, `role`, `profile` |
| TC-ME-02 | Perfil sin datos adicionales | Usuario sin `name`/`phone`/`address` | `200`, `profile` con campos `null` |

#### Casos límite
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-ME-03 | Token ausente | Sin header Authorization | `401`, `"Token de autenticacion invalido o ausente"` |
| TC-ME-04 | Token malformado | `"Bearer abc123"` (no es JWT) | `401` |
| TC-ME-05 | Token expirado | JWT con `exp` en el pasado | `401` |
| TC-ME-06 | Token firmado con otra clave | JWT firmado con `wrong-secret` | `401` |
| TC-ME-07 | Token de restablecimiento de contraseña | JWT con `purpose: "password_reset"` | `401` (rechazado explícitamente) |
| TC-ME-08 | Token con `sub` no numérico | `sub: "not-a-number"` | `401` |
| TC-ME-09 | Token de usuario eliminado / inactivo | Usuario existe pero `is_active = false` | `401` |
| TC-ME-10 | Token sin `sub` | Payload JWT sin `sub` | `401` |
| TC-ME-11 | Token sin `exp` | JWT sin fecha de expiración | `401` (require_exp=True) |

#### Modos de fallo
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-ME-12 | Bearer sin token | `"Authorization: Bearer "` (vacío) | `401` |

---

### 2.4 POST `/auth/forgot-password` — Solicitar restablecimiento

#### Camino feliz
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-FP-01 | Solicitar reset para email existente | Email de usuario registrado | `200`, `{"message": "Si la cuenta existe, recibiras un enlace..."}` |
| TC-FP-02 | Solicitar reset para email inexistente | Email no registrado | `200`, mismo mensaje (seguridad: no revelar existencia) |

#### Casos límite
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-FP-03 | Email con formato inválido | `"email": "invalido"` | `422` |
| TC-FP-04 | Email vacío | `"email": ""` | `422` |
| TC-FP-05 | Campos extra | Incluir `"extra": true` | `422` (extra="forbid") |
| TC-FP-06 | Usuario inactivo solicita reset | `is_active = false` | `200`, mismo mensaje (sin email enviado) |

#### Modos de fallo
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-FP-07 | Resend API caída | Simular timeout en `mailer.py` | El background task falla silenciosamente, respuesta `200` |
| TC-FP-08 | Variables de entorno de email ausentes | Sin `RESEND_API_KEY` | El background task loggea error, respuesta `200` |

---

### 2.5 POST `/auth/reset-password` — Restablecer contraseña

#### Camino feliz
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-RP-01 | Reset con token válido y nueva contraseña | Token JWT de reset + `new_password` | `200`, `{"message": "Contrasena restablecida"}` |
| TC-RP-02 | Login con nueva contraseña tras reset | `username` + nueva password | `200`, login exitoso |
| TC-RP-03 | Token de reset es monouso | Intentar usar mismo token dos veces | Primer uso `200`, segundo `400` |

#### Casos límite
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-RP-04 | Token malformado | `"token": "no-es-un-jwt"` | `400`, `"Token de recuperacion invalido..."` |
| TC-RP-05 | Token expirado | JWT reset con `exp` pasado | `400` |
| TC-RP-06 | Token con `purpose` incorrecto | JWT de auth normal usado como reset | `400` |
| TC-RP-07 | Token sin `jti` (token_id) | JWT sin claim `jti` | `400` |
| TC-RP-08 | Nueva contraseña menor de 8 caracteres | `"new_password": "1234567"` | `422` |
| TC-RP-09 | Nueva contraseña más de 72 bytes | 73 caracteres ASCII | `422` |
| TC-RP-10 | Token firmado con clave diferente | JWT con `wrong-secret` | `400` |
| TC-RP-11 | Usuario inactivo intenta reset | Token válido, usuario inactivo | `400` |
| TC-RP-12 | Reset tras cambio de contraseña manual | Token generado antes de change-password | `400` (password_hash cambió) |

#### Modos de fallo
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-RP-13 | Token vacío | `"token": ""` | `400` o `422` |

---

### 2.6 POST `/auth/change-password` — Cambiar contraseña

#### Camino feliz
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-CP-01 | Cambio con contraseña actual correcta | `current_password` + `new_password` válidos | `200`, `{"message": "Contrasena actualizada"}` |
| TC-CP-02 | Login con nueva contraseña tras cambio | `username` + nueva password | `200`, login exitoso |

#### Casos límite
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-CP-03 | Contraseña actual incorrecta | `current_password` erróneo | `400`, `"La contrasena actual es incorrecta"` |
| TC-CP-04 | Token JWT ausente | Sin header Authorization | `401` |
| TC-CP-05 | Nueva contraseña menor de 8 caracteres | `"new_password": "1234567"` | `422` |
| TC-CP-06 | Nueva contraseña más de 72 bytes | 73 caracteres ASCII | `422` |
| TC-CP-07 | Usuario inactivo intenta cambio | JWT válido, usuario `is_active=false` | `401` |
| TC-CP-08 | Cambio de contraseña invalida el reset pendiente | Tras cambiar password, el token de reset anterior falla | Ver TC-RP-12 |

#### Modos de fallo
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-CP-09 | Token expirado en change-password | JWT de auth expirado | `401` |

---

### 2.7 GET `/users/{id}` — Obtener usuario por ID

#### Camino feliz
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-USR-GET-01 | Admin obtiene otro usuario | Token admin + user_id válido | `200`, `UserRead` sin `hashed_password` |
| TC-USR-GET-02 | Usuario obtiene su propio perfil | Token del propio usuario + su ID | `200` |

#### Casos límite
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-USR-GET-03 | Usuario no admin obtiene otro usuario | Token user + ID de otro | `403`, `"Permiso denegado"` |
| TC-USR-GET-04 | ID de usuario inexistente | ID que no existe en DB | `404` |
| TC-USR-GET-05 | Token ausente | Sin header Authorization | `401` |

---

### 2.8 PUT / DELETE `/users/{id}` — Actualizar y eliminar usuario

#### Camino feliz
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-USR-PUT-01 | Usuario actualiza su propio email | Token propio + nuevo email | `200`, email actualizado |
| TC-USR-PUT-02 | Admin cambia rol de otro usuario | Token admin + `role: "manager"` | `200`, rol actualizado |
| TC-USR-DEL-01 | Usuario se elimina a sí mismo | Token propio | `204` |
| TC-USR-DEL-02 | Admin elimina otro usuario | Token admin | `204` |

#### Casos límite
| ID | Escenario | Entrada esperada | Resultado esperado |
|----|-----------|------------------|--------------------|
| TC-USR-PUT-03 | Usuario no admin intenta cambiar rol | Token user + `role: "admin"` | `403`, `"Solo admin puede cambiar roles"` |
| TC-USR-PUT-04 | Email duplicado en update | Mismo email que otro usuario | `409` |
| TC-USR-PUT-05 | Enviar `null` explícito | `{"email": null}` | `422` (reject_explicit_nulls) |
| TC-USR-DEL-03 | Eliminar usuario inexistente | ID no existente | `404` |
| TC-USR-DEL-04 | Usuario no admin elimina otro | Token user + ID de otro | `403` |

---

## 3. Cómo ejecutar las pruebas

### 3.1 Prerrequisitos

```bash
# Asegurarse de que la API tiene las dependencias instaladas
cd services/api
uv sync
```

### 3.2 Ejecutar todos los tests

```bash
cd services/api
uv run pytest -v --tb=short
```

### 3.3 Ejecutar con cobertura

```bash
cd services/api
uv run pytest -v --tb=short --cov=auth --cov=models --cov=services --cov=users --cov=security --cov-report=term --cov-report=html
```

Para abrir el reporte HTML:

```bash
# En Linux / codespace
open services/api/htmlcov/index.html
# o
xdg-open services/api/htmlcov/index.html
```

### 3.4 Ejecutar un test específico

```bash
# Por archivo
uv run pytest tests/test_auth.py -v --tb=long

# Por nombre de test
uv run pytest -v -k "test_login_happy_path"

# Por endpoint
uv run pytest -v -k "login"
```

### 3.5 Fixture `test_app` — TestClient con base de datos temporal

Todos los tests usarán un `TestClient` de FastAPI con una base de datos TinyDB en memoria (archivo temporal) para no contaminar la base de datos real. La estructura propuesta del conftest:

```python
# services/api/tests/conftest.py

import json
import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture(autouse=True)
def _use_temp_db(tmp_path, monkeypatch):
    """Redirige TinyDB a un archivo temporal para cada test."""
    temp_db = tmp_path / "test_db.json"
    temp_db.write_text(json.dumps({"_default": {}}))
    monkeypatch.setattr("database.DB_PATH", temp_db)
    # Recargar módulos que importan database para que usen la nueva ruta
    import importlib
    import database
    importlib.reload(database)
    import services
    importlib.reload(services)
    import auth
    importlib.reload(auth)
    import users
    importlib.reload(users)
    import profiles
    importlib.reload(profiles)
    import main
    importlib.reload(main)
    yield

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def registered_user(client):
    """Crea y devuelve un usuario registrado."""
    payload = {"email": "test@example.com", "password": "TestPass123"}
    resp = client.post("/users", json=payload)
    assert resp.status_code == 201
    return {"id": resp.json()["id"], "email": payload["email"], "password": payload["password"]}

@pytest.fixture
def auth_token(client, registered_user):
    """Devuelve un token JWT válido."""
    resp = client.post("/auth/login", data={"username": registered_user["email"], "password": registered_user["password"]})
    assert resp.status_code == 200
    return resp.json()["access_token"]

@pytest.fixture
def auth_header(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}

@pytest.fixture
def admin_user(client):
    """Crea un usuario admin directamente en la tabla de usuarios."""
    # Se inserta manualmente en la base de datos temporal
    from database import users_table
    from passlib.hash import bcrypt
    from models import utc_now
    user_id = users_table.insert({
        "email": "admin@nexova.com",
        "hashed_password": bcrypt.hash("AdminPass123"),
        "is_active": True,
        "role": "admin",
        "created_at": utc_now().isoformat(),
    })
    # Login manual
    resp = client.post("/auth/login", data={"username": "admin@nexova.com", "password": "AdminPass123"})
    assert resp.status_code == 200
    return {"id": user_id, "email": "admin@nexova.com", "token": resp.json()["access_token"]}
```

### 3.6 Dependencias de test

Añadir a `services/api/pyproject.toml`:

```toml
[project.optional-dependencies]
test = [
    "pytest>=8.0",
    "pytest-cov>=5.0",
    "httpx>=0.27",
]
```

Ejecutar:

```bash
cd services/api
uv sync --group test
```

O si se prefiere instalar directamente:

```bash
cd services/api
uv pip install pytest pytest-cov httpx
```

---

## 4. Flujo asistido por IA — Bugs y hallazgos documentados

> Esta sección se completa durante la ejecución de la batería de pruebas.

### 4.1 Hallazgos identificados durante la revisión de código

| # | Archivo | Línea | Descripción | Severidad | Estado |
|---|---------|-------|-------------|-----------|--------|
| — | — | — | *(Pendiente de ejecutar tests)* | — | 🔍 Pendiente |

### 4.2 Bugs detectados por la IA

| # | Archivo | Línea | Descripción | Severidad | Estado |
|---|---------|-------|-------------|-----------|--------|
| — | — | — | *(Pendiente de ejecutar tests)* | — | 🔍 Pendiente |

### 4.3 Casos de esquina sugeridos por la IA

| # | Escenario | Fundamento | Estado |
|---|-----------|------------|--------|
| AI-01 | **Token de password reset usado como auth** → debe dar 401, no 200 | El middleware `get_current_user` rechaza explícitamente tokens con `purpose == "password_reset"` | ✅ Documentado (TC-ME-07) |
| AI-02 | **Contraseña > 72 bytes** → debe dar 422 por limitación de bcrypt | bcrypt trunca silenciosamente inputs > 72 bytes; la app lo valida explícitamente | ✅ Documentado (TC-REG-07, TC-RP-09) |
| AI-03 | **Email duplicado entre mayúsculas/minúsculas** → `"A@B.com"` vs `"a@b.com"` | `create_user` hace `strip().lower()` antes de comparar; el test debe verificar que el segundo registro da 409 | ✅ Documentado (TC-REG-03) |
| AI-04 | **Race condition en registro** → dos peticiones simultáneas con el mismo email | TinyDB no es thread-safe; el `db_lock` protege la escritura, pero el test debería verificar que el segundo hilo obtiene 409 | ⚠️ Pendiente de validar |
| AI-05 | **Reset token reutilizable tras cambio de contraseña manual** | `consume_password_reset` compara `password_hash` almacenado vs actual; si el usuario cambió la contraseña manualmente, el token de reset anterior queda invalidado | ✅ Documentado (TC-RP-12) |
| AI-06 | **forgot-password con usuario inactivo** → no debe enviar email ni almacenar token | `request_password_reset` retorna temprano si `is_active == False` | ✅ Documentado (TC-FP-06) |
| AI-07 | **Campos extra en payload** → todos los modelos usan `extra="forbid"` | FastAPI + Pydantic rechazan automáticamente campos no definidos | ✅ Documentado (TC-REG-10, TC-FP-05) |
| AI-08 | **Exposición de existencia de email en forgot-password** → mismo mensaje para email existente e inexistente | La respuesta es idéntica para ambos casos (seguridad por oscuridad) | ✅ Documentado (TC-FP-01, TC-FP-02) |

---

## 5. Estructura de archivos de test propuesta

```
services/api/tests/
├── conftest.py              # Fixtures: client, registered_user, auth_token, admin_user
├── test_auth_login.py       # Tests para POST /auth/login
├── test_auth_me.py          # Tests para GET /auth/me
├── test_auth_forgot_password.py  # Tests para POST /auth/forgot-password
├── test_auth_reset_password.py   # Tests para POST /auth/reset-password
├── test_auth_change_password.py  # Tests para POST /auth/change-password
├── test_users_register.py   # Tests para POST /users
├── test_users_crud.py       # Tests para GET/PUT/DELETE /users/{id}
└── __init__.py
```

---

## 6. Criterios de aceptación (Definition of Done)

- [ ] Todos los tests del **camino feliz** pasan
- [ ] Todos los tests de **casos límite** pasan
- [ ] Todos los tests de **modos de fallo** pasan
- [ ] Cobertura de código ≥ 90% en `auth.py`, `services.py`, `models.py`, `users.py`, `security.py`
- [ ] No hay fugas de información sensible en las respuestas de error
- [ ] Los tests se ejecutan contra una base de datos temporal (no contaminan `db.json`)
- [ ] Esta sección de hallazgos (punto 4) está completa con los bugs reales encontrados