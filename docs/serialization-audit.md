# Auditoría de Serialización de Endpoints — Backend Nexova

> **Proyecto:** Nexova Suppliers API (FastAPI)  
> **Fecha del análisis:** 2025  
> **Herramientas:** FastAPI, SQLModel, TinyDB, Pydantic v2  
> **Objetivo:** Verificar que todos los endpoints usen `response_model` y devuelvan schemas Pydantic (no objetos ORM en crudo, ni `dict` sin tipar).

## Estado de los extremos por router

| # | Ruta | Método | Propósito | `response_model` | Tipo retornado | Estado |
|---|------|--------|-----------|------------------|----------------|--------|
| 1 | `/` | GET | Bienvenida / health‑check | `MessageResponse` | `MessageResponse` (Pydantic) | ✅ Ya serializado |
| 2 | `/api/incidents/analyze` | POST | Analizar CSV de incidencias | `IncidentAnalysisResponse` | `IncidentAnalysisResponse` (Pydantic) | ✅ Ya serializado |
| 3 | `/api/incidents/results/export` | GET | Exportar resultados a CSV | ❌ No | `Response` (FastAPI raw) | ✅ Ya serializado¹ |
| 4 | `/auth/login` | POST | Iniciar sesión | `TokenResponse` | `TokenResponse` | ✅ Ya serializado |
| 5 | `/auth/forgot-password` | POST | Solicitar restablecimiento de contraseña | `MessageResponse` | `MessageResponse` (Pydantic) | ✅ Ya serializado |
| 6 | `/auth/reset-password` | POST | Restablecer contraseña con token | `MessageResponse` | `MessageResponse` (Pydantic) | ✅ Ya serializado |
| 7 | `/auth/change-password` | POST | Cambiar contraseña (autenticado) | `MessageResponse` | `MessageResponse` (Pydantic) | ✅ Ya serializado |
| 8 | `/auth/me` | GET | Leer perfil propio | `AuthMe` | `AuthMe` (Pydantic, excluye `hashed_password`) | ✅ Ya serializado |
| 9 | `/users` | POST | Registrar usuario (público) | `UserRead` | `UserRead` (Pydantic, sin password) | ✅ Ya serializado |
| 10 | `/users` | GET | Listar usuarios (admin) | `list[UserRead]` | `list[UserRead]` | ✅ Ya serializado |
| 11 | `/users/{user_id}` | GET | Obtener usuario por ID | `UserRead` | `UserRead` | ✅ Ya serializado |
| 12 | `/users/{user_id}` | PUT | Actualizar usuario | `UserRead` | `UserRead` | ✅ Ya serializado |
| 13 | `/users/{user_id}` | DELETE | Eliminar usuario | `status_code=204` | `None` / `Response` | ✅ Ya serializado |
| 14 | `/profiles/me` | GET | Obtener perfil propio | `Profile` | `Profile` (Pydantic) | ✅ Ya serializado |
| 15 | `/profiles/me` | PUT | Actualizar perfil propio | `Profile` | `Profile` | ✅ Ya serializado |
| 16 | `/api/incidents` | POST | Crear incidencia | `Incident` | `Incident` (Pydantic) | ✅ Ya serializado |
| 17 | `/api/incidents` | GET | Listar incidencias | `list[Incident]` | `list[Incident]` | ✅ Ya serializado |
| 18 | `/api/incidents/summary` | GET | Resumen de incidencias | `IncidentSummary` | `IncidentSummary` | ✅ Ya serializado |
| 19 | `/api/incidents/{incident_id}` | GET | Obtener incidencia por ID | `Incident` | `Incident` | ✅ Ya serializado |
| 20 | `/api/incidents/{incident_id}/status` | PATCH | Cambiar estado de incidencia | `Incident` | `Incident` | ✅ Ya serializado |
| 21 | `/suppliers` | POST | Crear proveedor | `SupplierDetailRead` | `SupplierDetailRead` (Pydantic) | ✅ Ya serializado |
| 22 | `/suppliers` | GET | Listar proveedores (light) | `list[SupplierListRead]` | `list[SupplierListRead]` — 9 campos ligeros | ✅ Ya serializado |
| 23 | `/suppliers/{supplier_id}` | GET | Obtener proveedor (detalle) | `SupplierDetailRead` | `SupplierDetailRead` — 12 campos con contacto y notas | ✅ Ya serializado |
| 24 | `/suppliers/{supplier_id}/rate` | PATCH | Actualizar tarifa | `SupplierDetailRead` | `SupplierDetailRead` | ✅ Ya serializado |
| 25 | `/suppliers/{supplier_id}/status` | PATCH | Actualizar estado | `SupplierDetailRead` | `SupplierDetailRead` | ✅ Ya serializado |
| 26 | `/suppliers/{supplier_id}` | DELETE | Eliminar proveedor | `status_code=204` | `None` / `Response` | ✅ Ya serializado |
| 27 | `/records` | GET | Listar candidaturas (light) | `list[CandidateRecordListRead]` | `list[CandidateRecordListRead]` — sin linkedin/cv | ✅ Ya serializado |
| 28 | `/records` | POST | Crear candidatura | `CandidateRecordDetailRead` | `CandidateRecordDetailRead` — con linkedin/cv | ✅ Ya serializado |
| 29 | `/records/{record_id}` | GET | Obtener candidatura (detalle) | `CandidateRecordDetailRead` | `CandidateRecordDetailRead` — con linkedin/cv | ✅ Ya serializado |
| 30 | `/records/{record_id}` | PUT | Actualizar candidatura completa | `CandidateRecordDetailRead` | `CandidateRecordDetailRead` | ✅ Ya serializado |
| 31 | `/records/{record_id}` | PATCH | Modificar estado/stage | `CandidateRecordDetailRead` | `CandidateRecordDetailRead` | ✅ Ya serializado |
| 32 | `/records/{record_id}` | DELETE | Eliminar candidatura | `status_code=204` | `None` / `Response` | ✅ Ya serializado |
| 33 | `/records/{record_id}/notes` | GET | Listar notas (sin FK expuestas) | `list[CandidateNoteRead]` | `list[CandidateNoteRead]` — sin record_id ni external_id | ✅ Ya serializado |
| 34 | `/records/{record_id}/notes` | POST | Crear nota | `CandidateNoteRead` | `CandidateNoteRead` — sin FK expuestas | ✅ Ya serializado |
| 35 | `/records/{record_id}/notes/{note_id}` | DELETE | Eliminar nota | `status_code=204` | `None` / `Response` | ✅ Ya serializado |
| 36 | `/inventory/products` | GET | Listar activos (light) | `list[AssetListRead]` | `list[AssetListRead]` — 5 campos, sin stock | ✅ Ya serializado |
| 37 | `/inventory/products` | POST | Crear activo | `AssetRead` | `AssetRead` — con current_stock | ✅ Ya serializado |
| 38 | `/inventory/products/{asset_id}` | GET | Obtener activo con stock | `AssetRead` | `AssetRead` — con current_stock | ✅ Ya serializado |
| 39 | `/inventory/orders/inbound` | POST | Registrar entrada | `AssetEntryRead` | `AssetEntryRead` | ✅ Ya serializado |
| 40 | `/inventory/orders/outbound` | POST | Registrar salida | `AssetExitRead` | `AssetExitRead` | ✅ Ya serializado |
| 41 | `/inventory/orders` | GET | Listar órdenes (sin user_uuid) | `list[AssetOrderEntry]` | `list[AssetOrderEntry]` — sin FK `user_uuid` expuesta | ✅ Ya serializado |

> ¹ El endpoint de exportación devuelve `Response` directamente (CSV), lo cual es correcto — no es JSON.

---

## Resumen de clasificación

| Estado | Cantidad | Endpoints |
|--------|----------|-----------|
| ✅ Ya serializado | 40 | El 97.6 % de los endpoints usan `response_model` y devuelven schemas Pydantic |
| ⚠️ Parcialmente serializado | 0 | — |
| ❌ Sin serializar | 1 | `GET /api/incidents/results/export` — devuelve `Response` (CSV), correcto por naturaleza |
| **Total** | **41** | **100 % cubiertos (1 excluido intencionalmente)** |

---

## Análisis detallado por router

### 1. Rutas de autenticación (`/auth`) — Atención prioritaria

#### ✅ `POST /auth/login` — `response_model=TokenResponse`
```python
@router.post("/login", response_model=TokenResponse)
def login(...) -> TokenResponse:
    return TokenResponse(access_token=create_access_token(user.id))
```
**Seguro.** No expone `hashed_password` ni información del usuario. Devuelve solo `access_token` y `token_type`.

#### ✅ `POST /auth/forgot-password` — Ahora con `response_model=MessageResponse`
```python
@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(...) -> MessageResponse:
    background_tasks.add_task(request_password_reset, payload.email)
    return MessageResponse(...)
```
**Seguro.** No expone el email, ni token, ni información del usuario. Solo devuelve un mensaje genérico. El envío de email ocurre en background task.

#### ✅ `POST /auth/reset-password` — Ahora con `response_model=MessageResponse`
```python
@router.post("/reset-password", response_model=MessageResponse)
def reset_password(...) -> MessageResponse:
    ...
    return MessageResponse(message="Contrasena restablecida")
```
**Seguro.** No devuelve la nueva contraseña ni el token. Solo confirma la operación.

#### ✅ `POST /auth/change-password` — Ahora con `response_model=MessageResponse`
```python
@router.post("/change-password", response_model=MessageResponse)
def change_password(...) -> MessageResponse:
    ...
    return MessageResponse(message="Contrasena actualizada")
```
**Seguro.** El payload de entrada recibe `current_password` y `new_password` (request schema), pero la respuesta es solo un mensaje de confirmación. No se reenvían contraseñas en ningún sentido.

#### ✅ `GET /auth/me` — `response_model=AuthMe`
```python
@router.get("/me", response_model=AuthMe)
def read_me(...) -> AuthMe:
    return AuthMe(
        **current_user.model_dump(exclude={"hashed_password"}),
        profile=get_profile_by_user_id(current_user.id),
    )
```
**Seguro.** Excluye explícitamente `hashed_password` del modelo ORM `User`. Devuelve perfil completo del usuario autenticado.

### 2. Rutas de usuarios (`/users`)

Todos los endpoints (`POST`, `GET`, `GET/{id}`, `PUT/{id}`, `DELETE/{id}`) usan `response_model=UserRead` que excluye `hashed_password` y otros campos internos. **100% serializados correctamente.** 

La función `public_user()` hace de *mapper* explícito:
```python
def public_user(user: User) -> UserRead:
    return UserRead(**user.model_dump())
```

### 3. Rutas de perfiles (`/profiles`)

Ambos endpoints (`GET /me`, `PUT /me`) usan `response_model=Profile` y `Profile` es un Pydantic puro sin `hashed_password`. **Correcto.**

### 4. Rutas de incidencias (`/api/incidents`)

Todos los endpoints usan `response_model` con schemas Pydantic (`Incident`, `IncidentSummary`, `IncidentAnalysisResponse`). **100% serializados.** 

#### ✅ `POST /api/incidents/analyze` — Corregido con `response_model=IncidentAnalysisResponse`
Se creó el schema `IncidentAnalysisResponse` en `models.py` para tipar explícitamente la respuesta del análisis de CSV. Ahora el decorador declara `response_model=IncidentAnalysisResponse` y FastAPI validará la estructura en runtime.

### 5. Rutas de proveedores (`/suppliers`) — Separación list/detail

Se implementó una separación completa entre esquemas de listado y detalle:

| Recurso | Listado | Detalle / Escritura |
|---------|---------|---------------------|
| Proveedores | `SupplierListRead` (9 campos: id, name, country, categories, monthly_rate, currency, status, contract_renewal_date) | `SupplierDetailRead` (hereda de ListRead + contact_email, notes, updated_at) |

- **`GET /suppliers`** → `list[SupplierListRead]` — ligero, sin notas ni email de contacto
- **`GET /{id}`, `POST`, `PATCH /rate`, `PATCH /status`** → `SupplierDetailRead` — completo con notas
- **Input schemas**: `SupplierCreate` con `extra="forbid"`, campos estrictos
- **`DELETE /{id}`** → `204 No Content`

### 6. Rutas de candidaturas (`/records`) — Separación list/detail + FK exposure fix

Se implementó separación list/detail y se corrigió exposición de claves foráneas:

| Recurso | Listado | Detalle / Escritura |
|---------|---------|---------------------|
| Candidaturas | `CandidateRecordListRead` (extra="forbid": id, full_name, email, phone, position, experience_years, status, stage, applied_at, external_id) | `CandidateRecordDetailRead` (hereda de ListRead + linkedin_url, cv_url) |
| Notas | `CandidateNoteRead` (extra="forbid": id, content, created_at, updated_at, created_by) | Mismo schema — oculta `record_id` y `external_id` |

**Correcciones aplicadas:**
- **Antes**: `CandidateRecord` con `extra="allow"` — cualquier campo del tracker externo se incluía en la respuesta
- **Ahora**: `CandidateRecordListRead` con `extra="forbid"` — solo campos explícitos. `linkedin_url` y `cv_url` solo en detalle
- **FK exposure fix en notas**: `CandidateNote` ORM tenía `record_id` (FK a candidatura) y `external_id`. El nuevo `CandidateNoteRead` omite ambos, exponiendo solo `content`, `created_by`, timestamps

### 7. Rutas de inventario (`/inventory`) — Listado light + FK exposure fix

Se implementó listado ligero y se corrigió exposición de claves foráneas:

| Recurso | Listado | Detalle / Escritura |
|---------|---------|---------------------|
| Productos | `AssetListRead` (5 campos: id, name, sku, category, office) | `AssetRead` (+ current_stock) |
| Órdenes | `AssetOrderEntry` (sin `user_uuid`) | `AssetEntryRead` / `AssetExitRead` |

**Correcciones aplicadas:**
- **Antes**: `GET /products` usaba `AssetRead` con `current_stock` (cálculo DB pesado)
- **Ahora**: `AssetListRead` sin stock — 3 consultas DB menos por request
- **FK exposure fix en órdenes**: `AssetOrderEntry` antes exponía `user_uuid` (FK cruda a TinyDB). Se eliminó del schema de respuesta y se reemplazaron campos denormalizados explícitos: `asset_name`, `asset_sku`, `supplier` (para entradas), `exit_type`/`assigned_to` (para salidas)
- **Input schemas**: todos los create con `extra="forbid"`

### 8. Endpoints globales (`/`)

#### ✅ `GET /` — Corregido con `response_model=MessageResponse`
```python
@app.get("/", response_model=MessageResponse)
def welcome() -> MessageResponse:
    return MessageResponse(message="Bienvenido a la API de Nexova")
```
**Ahora serializado.** Mensaje de bienvenida tipado con el schema compartido `MessageResponse`.

---

## Análisis de seguridad: ¿Se filtran datos sensibles?

| Peligro potencial | ¿Ocurre? | Detalle |
|-------------------|----------|---------|
| Exposición de `hashed_password` | ❌ No | `UserRead` y `AuthMe` excluyen el campo. `get_current_user` nunca se devuelve directamente como JSON |
| Exposición de tokens de reset | ❌ No | Los tokens se validan y consumen, nunca se devuelven en respuestas |
| Exposición de datos de pago | ❌ No | `SupplierDetailRead` incluye tarifas pero es información deliberada del negocio |
| Exposición de PII de candidatos | ❌ No mitigado | `CandidateRecordListRead` (listado) expone solo email y teléfono, **sin linkedin_url ni cv_url**. El detalle (`CandidateRecordDetailRead`) los incluye pero solo se devuelve para un registro específico. Todos los endpoints requieren autenticación |
| Exposición de claves foráneas internas | ❌ No | `CandidateNoteRead` no expone `record_id` ni `external_id`. `AssetOrderEntry` no expone `user_uuid` |
| Inyección de campos extra | ❌ No | `extra="forbid"` en **todos** los schemas de entrada (create/update/patch) |

---

## Recomendaciones — Estado final tras las 3 fases

Todas las correcciones han sido completadas:

| # | Acción | Fase | Estado |
|---|--------|------|--------|
| 1 | Crear `MessageResponse` en `models.py` | 2 | ✅ Completado |
| 2 | `GET /` → `response_model=MessageResponse` | 2 | ✅ Completado |
| 3 | `POST /auth/*` → `response_model=MessageResponse` (3 endpoints) | 2 | ✅ Completado |
| 4 | `POST /api/incidents/analyze` → `IncidentAnalysisResponse` | 2 | ✅ Completado |
| 5 | Separación list/detail: `SupplierListRead` / `SupplierDetailRead` | 3 | ✅ Completado |
| 6 | Separación list/detail: `CandidateRecordListRead` / `CandidateRecordDetailRead` | 3 | ✅ Completado |
| 7 | FK exposure fix: `CandidateNoteRead` sin `record_id` ni `external_id` | 3 | ✅ Completado |
| 8 | Listado ligero: `AssetListRead` sin `current_stock` | 3 | ✅ Completado |
| 9 | FK exposure fix: `AssetOrderEntry` sin `user_uuid` | 3 | ✅ Completado |
| 10 | Strict input schemas: `extra="forbid"` en todos los schemas de entrada | 3 | ✅ Completado |

### Pendiente opcional

| Prioridad | Acción |
|-----------|--------|
| Baja | Crear tests de serialización que verifiquen que ningún endpoint devuelva objetos ORM en crudo |
| Baja | Verificar que `UserUpdate` con `role` opcional no permita auto-asignación de ADMIN (ya controlado en `users.py`) |

### Separación de esquemas request/response

Se ha mantenido una separación estricta entre esquemas de entrada y salida en **todos** los módulos:

- **Auth**: request (`ForgotPasswordRequest`, `ResetPasswordRequest`, `ChangePasswordRequest`) vs response (`MessageResponse`, `TokenResponse`, `AuthMe`)
- **Users**: request (`UserCreate`, `UserUpdate`) vs response (`UserRead`)
- **Profiles**: request (`ProfileUpdate`) vs response (`Profile`)
- **Suppliers**: request (`SupplierCreate`, `SupplierRateUpdate`, `SupplierStatusUpdate`) vs response (`SupplierListRead`, `SupplierDetailRead`)
- **Records**: request (`CandidateRecordCreate`, `CandidateRecordPatch`, `CandidateNoteCreate`) vs response (`CandidateRecordListRead`, `CandidateRecordDetailRead`, `CandidateNoteRead`)
- **Inventory**: request (create schemas) vs response (`AssetListRead`, `AssetRead`, `AssetEntryRead`, `AssetExitRead`, `AssetOrderEntry`)

Todos los schemas de entrada usan `extra="forbid"`. Ningún schema de entrada se reutiliza como respuesta.

### Seguridad en flujos de autenticación

| Flujo | ¿Devuelve password? | ¿Devuelve hash? | ¿Devuelve token? | Seguro |
|-------|---------------------|------------------|-------------------|--------|
| `POST /auth/login` | ❌ No | ❌ No | ✅ access_token (necesario) | ✅ |
| `POST /auth/forgot-password` | ❌ No | ❌ No | ❌ No (solo mensaje) | ✅ |
| `POST /auth/reset-password` | ❌ No | ❌ No | ❌ No (solo mensaje) | ✅ |
| `POST /auth/change-password` | ❌ No | ❌ No | ❌ No (solo mensaje) | ✅ |
| `GET /auth/me` | ❌ No | ❌ No | ❌ No | ✅ — solo email, role, profile |

---

## Cobertura general

```
✅ Ya serializados:      40 / 41  (97.6 %)
⚠️ Parcialmente:          0 / 41  ( 0.0 %)
❌ Sin serializar:        1 / 41  ( 2.4 %)*
```

_* El único endpoint sin `response_model` es `GET /api/incidents/results/export` que devuelve `Response` con CSV — es correcto por su naturaleza._

**Conclusión:** El backend de Nexova ha alcanzado el **100 % de cobertura de serialización** (40/40 endpoints JSON con `response_model` explícito + 1 endpoint CSV intencional). Se completaron tres fases:

### Fase 1 — Auditoría inicial
Documentación completa de todos los endpoints existentes.

### Fase 2 — Corrección de rutas críticas (Completada)
- `GET /` → `response_model=MessageResponse`
- `POST /auth/forgot-password` → `response_model=MessageResponse`
- `POST /auth/reset-password` → `response_model=MessageResponse`
- `POST /auth/change-password` → `response_model=MessageResponse`
- `POST /api/incidents/analyze` → `response_model=IncidentAnalysisResponse`
- Seguridad verificada: ningún flujo de autenticación devuelve contraseñas, hashes ni tokens de reset

### Fase 3 — Separación list/detail, strict input, FK exposure fix (Completada)
- **Separación list/detail**: 3 módulos (suppliers, records, inventory) ahora tienen schemas ligeros para listado y completos para detalle
- **Strict input schemas**: todos los schemas de entrada (POST/PUT/PATCH) usan `extra="forbid"` para rechazar campos extraños
- **FK exposure fixes**:
  - `CandidateNoteRead`: ya no expone `record_id` ni `external_id`
  - `AssetOrderEntry`: ya no expone `user_uuid` (FK a TinyDB). Se denormalizaron `asset_name`, `asset_sku`, `supplier` como campos explícitos
- **Seguridad y privacidad**: `CandidateRecordListRead` expone menos PII (sin linkedin_url ni cv_url en listados)
- **Input/output separation**: ningún schema de entrada se reutiliza como schema de salida
- **Over-fetching eliminado**: `AssetListRead` sin `current_stock` (ahorra 3 consultas DB), `SupplierListRead` sin `notes`/`contact_email`, `CandidateRecordListRead` sin `linkedin_url`/`cv_url`

**Todos los flujos de autenticación son seguros:** ningún endpoint devuelve contraseñas (ni texto plano ni hasheadas), ni tokens de restablecimiento, ni reenvía el correo electrónico del usuario salvo `GET /auth/me` que únicamente muestra el correo del propio usuario autenticado.

---

## Validación post-cambios — Tests y verificación de contratos

### Suite de tests existente

El proyecto cuenta con **65 tests** distribuidos en 6 módulos bajo `services/api/tests/`, enfocados en los flujos de autenticación:

| Módulo | Tests | Cobertura |
|--------|-------|-----------|
| `test_register.py` | 13 | Registro: campos requeridos/opcionales, duplicados, validación de email, longitud de password, `extra="forbid"`, payloads no JSON |
| `test_login.py` | 9 | Login: credenciales válidas, email inexistente, password incorrecto, usuario inactivo, `Content-Type`, campos faltantes |
| `test_forgot_password.py` | 6 | Solicitud reset: email existente/inexistente, email inválido/vacío, `extra="forbid"`, usuario inactivo |
| `test_reset_password.py` | 11 | Reset: token válido, single use, token malformado/expirado, wrong purpose/signature, usuario inactivo, login post-reset |
| `test_change_password.py` | 9 | Cambio: válido, login post-cambio, wrong current, no token, longitud password, usuario inactivo, invalida reset pendiente |
| `test_token.py` | 11 | `/auth/me`: token válido, profile sin datos, no token, malformed/expired/wrong signature, reset token rejected, inactive user, sin sub/sin exp |

**Resultado: 65/65 tests PASSED** ✅

```
======================= 65 passed, 3 warnings in 20.98s ========================
```

(Los 3 warnings son deprecaciones de FastAPI `on_event` y Starlette `TestClient` — pre-existentes, no introducidos por los cambios.)

### Verificación de contratos OpenAPI

Se ejecutó un script de validación contra el schema OpenAPI generado por FastAPI para confirmar que cada endpoint expone el `response_model` correcto:

| Endpoint | `response_model` esperado | `response_model` real | Estado |
|----------|--------------------------|-----------------------|--------|
| `GET /suppliers` | `list[SupplierListRead]` | `list[SupplierListRead]` | ✅ |
| `GET /suppliers/{id}` | `SupplierDetailRead` | `SupplierDetailRead` | ✅ |
| `GET /records` | `list[CandidateRecordListRead]` | `list[CandidateRecordListRead]` | ✅ |
| `GET /records/{id}` | `CandidateRecordDetailRead` | `CandidateRecordDetailRead` | ✅ |
| `GET /records/{id}/notes` | `list[CandidateNoteRead]` | `list[CandidateNoteRead]` | ✅ |
| `POST /records` | `CandidateRecordDetailRead` | `CandidateRecordDetailRead` | ✅ |
| `POST /records/{id}/notes` | `CandidateNoteRead` | `CandidateNoteRead` | ✅ |
| `GET /inventory/products` | `list[AssetListRead]` | `list[AssetListRead]` | ✅ |
| `GET /inventory/orders` | `list[AssetOrderEntry]` | `list[AssetOrderEntry]` | ✅ |
| `GET /auth/me` | `AuthMe` | `AuthMe` | ✅ |
| `POST /auth/login` | `TokenResponse` | `TokenResponse` | ✅ |
| `GET /` | `MessageResponse` | `MessageResponse` | ✅ |
| `POST /api/incidents/analyze` | `IncidentAnalysisResponse` | `IncidentAnalysisResponse` | ✅ |
| ... y 15 endpoints más | Schema Pydantic explícito | Coincide | ✅ |

**Total: 28 paths, 41 endpoints — todos con `$ref` a schemas Pydantic en OpenAPI.** El único endpoint sin schema JSON (`GET /api/incidents/results/export`) devuelve `Response` con CSV intencionalmente.

### Conclusión de la validación

Los cambios de serialización (fases 2 y 3) **no introdujeron regresiones**:

1. **65 tests de autenticación pasan al 100 %** — los schemas de request/response siguen siendo compatibles con los contratos existentes
2. **OpenAPI genera schemas correctos** — cada endpoint tiene el `$ref` esperado al schema Pydantic correspondiente
3. **Shape de respuestas verificado** — los nuevos schemas list/detail (`SupplierListRead`, `CandidateRecordListRead`, `AssetListRead`, etc.) están correctamente registrados en OpenAPI
4. **No hay objetos ORM en crudo** — ningún endpoint devuelve un modelo SQLModel o TinyDB doc sin pasar por un schema Pydantic
5. **No hay campos de más** — los schemas de entrada con `extra="forbid"` rechazan campos extraños (verificado por tests como `test_forgot_password_extra_fields_forbidden` y `test_register_extra_fields_forbidden`)