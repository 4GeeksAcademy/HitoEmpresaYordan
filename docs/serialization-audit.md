# Auditoría de Serialización de Endpoints — Backend Nexova

> **Proyecto:** Nexova Suppliers API (FastAPI)  
> **Fecha del análisis:** 2025  
> **Herramientas:** FastAPI, SQLModel, TinyDB, Pydantic v2  
> **Objetivo:** Verificar que todos los endpoints usen `response_model` y devuelvan schemas Pydantic (no objetos ORM en crudo, ni `dict` sin tipar).

## Estado de los extremos por router

| # | Ruta | Método | Propósito | ¿Usa `response_model`? | Tipo retornado | Estado |
|---|------|--------|-----------|------------------------|----------------|--------|
| 1 | `/` | GET | Bienvenida / health‑check | ✅ `MessageResponse` | `MessageResponse` (Pydantic) | ✅ Ya serializado |
| 2 | `/api/incidents/analyze` | POST | Analizar CSV de incidencias | ✅ `IncidentAnalysisResponse` | `IncidentAnalysisResponse` (Pydantic) | ✅ Ya serializado |
| 3 | `/api/incidents/results/export` | GET | Exportar resultados a CSV | ❌ No | `Response` (FastAPI raw) | ✅ Ya serializado¹ |
| 4 | `/auth/login` | POST | Iniciar sesión | ✅ `TokenResponse` | `TokenResponse` | ✅ Ya serializado |
| 5 | `/auth/forgot-password` | POST | Solicitar restablecimiento de contraseña | ✅ `MessageResponse` | `MessageResponse` (Pydantic) | ✅ Ya serializado |
| 6 | `/auth/reset-password` | POST | Restablecer contraseña con token | ✅ `MessageResponse` | `MessageResponse` (Pydantic) | ✅ Ya serializado |
| 7 | `/auth/change-password` | POST | Cambiar contraseña (autenticado) | ✅ `MessageResponse` | `MessageResponse` (Pydantic) | ✅ Ya serializado |
| 8 | `/auth/me` | GET | Leer perfil propio | ✅ `AuthMe` | `AuthMe` (Pydantic, excluye `hashed_password`) | ✅ Ya serializado |
| 9 | `/users` | POST | Registrar usuario (público) | ✅ `UserRead` | `UserRead` (Pydantic, sin password) | ✅ Ya serializado |
| 10 | `/users` | GET | Listar usuarios (admin) | ✅ `list[UserRead]` | `list[UserRead]` | ✅ Ya serializado |
| 11 | `/users/{user_id}` | GET | Obtener usuario por ID | ✅ `UserRead` | `UserRead` | ✅ Ya serializado |
| 12 | `/users/{user_id}` | PUT | Actualizar usuario | ✅ `UserRead` | `UserRead` | ✅ Ya serializado |
| 13 | `/users/{user_id}` | DELETE | Eliminar usuario | ✅ `status_code=204` | `None` / `Response` | ✅ Ya serializado |
| 14 | `/profiles/me` | GET | Obtener perfil propio | ✅ `Profile` | `Profile` (Pydantic) | ✅ Ya serializado |
| 15 | `/profiles/me` | PUT | Actualizar perfil propio | ✅ `Profile` | `Profile` | ✅ Ya serializado |
| 16 | `/api/incidents` | POST | Crear incidencia | ✅ `Incident` | `Incident` (Pydantic) | ✅ Ya serializado |
| 17 | `/api/incidents` | GET | Listar incidencias | ✅ `list[Incident]` | `list[Incident]` | ✅ Ya serializado |
| 18 | `/api/incidents/summary` | GET | Resumen de incidencias | ✅ `IncidentSummary` | `IncidentSummary` | ✅ Ya serializado |
| 19 | `/api/incidents/{incident_id}` | GET | Obtener incidencia por ID | ✅ `Incident` | `Incident` | ✅ Ya serializado |
| 20 | `/api/incidents/{incident_id}/status` | PATCH | Cambiar estado de incidencia | ✅ `Incident` | `Incident` | ✅ Ya serializado |
| 21 | `/suppliers` | POST | Crear proveedor | ✅ `Supplier` | `Supplier` (Pydantic) | ✅ Ya serializado |
| 22 | `/suppliers` | GET | Listar proveedores | ✅ `List[Supplier]` | `List[Supplier]` | ✅ Ya serializado |
| 23 | `/suppliers/{supplier_id}` | GET | Obtener proveedor | ✅ `Supplier` | `Supplier` | ✅ Ya serializado |
| 24 | `/suppliers/{supplier_id}/rate` | PATCH | Actualizar tarifa | ✅ `Supplier` | `Supplier` | ✅ Ya serializado |
| 25 | `/suppliers/{supplier_id}/status` | PATCH | Actualizar estado | ✅ `Supplier` | `Supplier` | ✅ Ya serializado |
| 26 | `/suppliers/{supplier_id}` | DELETE | Eliminar proveedor | ✅ `status_code=204` | `None` / `Response` | ✅ Ya serializado |
| 27 | `/records` | GET | Listar candidaturas | ✅ `list[CandidateRecord]` | `list[CandidateRecord]` | ✅ Ya serializado |
| 28 | `/records` | POST | Crear candidatura | ✅ `CandidateRecord` | `CandidateRecord` | ✅ Ya serializado |
| 29 | `/records/{record_id}` | GET | Obtener candidatura | ✅ `CandidateRecord` | `CandidateRecord` | ✅ Ya serializado |
| 30 | `/records/{record_id}` | PUT | Actualizar candidatura | ✅ `CandidateRecord` | `CandidateRecord` | ✅ Ya serializado |
| 31 | `/records/{record_id}` | PATCH | Modificar estado/stage de candidatura | ✅ `CandidateRecord` | `CandidateRecord` | ✅ Ya serializado |
| 32 | `/records/{record_id}` | DELETE | Eliminar candidatura | ✅ `status_code=204` | `None` / `Response` | ✅ Ya serializado |
| 33 | `/records/{record_id}/notes` | GET | Listar notas de candidatura | ✅ `list[CandidateNote]` | `list[CandidateNote]` | ✅ Ya serializado |
| 34 | `/records/{record_id}/notes` | POST | Crear nota en candidatura | ✅ `CandidateNote` | `CandidateNote` | ✅ Ya serializado |
| 35 | `/records/{record_id}/notes/{note_id}` | DELETE | Eliminar nota de candidatura | ✅ `status_code=204` | `None` / `Response` | ✅ Ya serializado |
| 36 | `/inventory/products` | GET | Listar activos con stock | ✅ `List[AssetRead]` | `List[AssetRead]` | ✅ Ya serializado |
| 37 | `/inventory/products` | POST | Crear activo | ✅ `AssetRead` | `AssetRead` | ✅ Ya serializado |
| 38 | `/inventory/products/{asset_id}` | GET | Obtener activo con stock | ✅ `AssetRead` | `AssetRead` | ✅ Ya serializado |
| 39 | `/inventory/orders/inbound` | POST | Registrar entrada de inventario | ✅ `AssetEntryRead` | `AssetEntryRead` | ✅ Ya serializado |
| 40 | `/inventory/orders/outbound` | POST | Registrar salida de inventario | ✅ `AssetExitRead` | `AssetExitRead` | ✅ Ya serializado |
| 41 | `/inventory/orders` | GET | Listar todas las órdenes | ✅ `List[AssetOrderEntry]` | `List[AssetOrderEntry]` | ✅ Ya serializado |

> ¹ El endpoint de exportación devuelve `Response` directamente (CSV), lo cual es correcto — no es JSON.

---

## Resumen de clasificación

| Estado | Cantidad | Endpoints |
|--------|----------|-----------|
| ✅ Ya serializado | 40 | El 97.6 % de los endpoints usan `response_model` y devuelven schemas Pydantic |
| ⚠️ Parcialmente serializado | 0 | — |
| ❌ Sin serializar | 1 | `GET /api/incidents/results/export` — devuelve `Response` (CSV), correcto por naturaleza |

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

### 5. Rutas de proveedores (`/suppliers`)

Todos usan `response_model=Supplier` o `List[Supplier]` con `Supplier` Pydantic. **Correcto.** 
Los endpoints `PATCH /rate` y `PATCH /status` tienen schemas específicos de entrada (`SupplierRateUpdate`, `SupplierStatusUpdate`) y reutilizan `response_model=Supplier`. **Bien diseñados.**

### 6. Rutas de candidaturas (`/records`)

Todos los endpoints usan `response_model` con schemas Pydantic (`CandidateRecord`, `CandidateNote`). **Correcto.** Nota: `CandidateRecord` tiene `model_config = ConfigDict(extra="allow")` que permite campos adicionales del tracker externo — **intencional y seguro** (no expone datos sensibles).

### 7. Rutas de inventario (`/inventory`)

Todos los endpoints usan `response_model` con schemas Pydantic (`AssetRead`, `AssetEntryRead`, `AssetExitRead`, `AssetOrderEntry`). **Correcto.** El inventario usa SQLModel como ORM pero convierte explícitamente a schemas Pydantic mediante helpers `_asset_to_read` y `model_validate`. **Nunca filtra objetos ORM en crudo.**

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
| Exposición de datos de pago | ❌ No | `Supplier` incluye tarifas pero es información deliberada del negocio |
| Exposición de PII de candidatos | ⚠️ Parcial | `CandidateRecord` expone email, teléfono, linkedin_url, cv_url — datos personales. Revisar si el acceso está correctamente autenticado (sí, todos los endpoints requieren `get_current_user`) |
| Inyección de campos extra | ❌ No | `extra="forbid"` en la mayoría de schemas de entrada |

---

## Recomendaciones — Estado actual tras la corrección

Todas las correcciones de prioridad alta y el ⚠️ parcial han sido completadas en esta iteración:

| # | Acción | Estado |
|---|--------|--------|
| 1 | Crear `MessageResponse` en `models.py` | ✅ Completado |
| 2 | `GET /` → `response_model=MessageResponse` | ✅ Completado |
| 3 | `POST /auth/forgot-password` → `response_model=MessageResponse` | ✅ Completado |
| 4 | `POST /auth/reset-password` → `response_model=MessageResponse` | ✅ Completado |
| 5 | `POST /auth/change-password` → `response_model=MessageResponse` | ✅ Completado |
| 6 | `POST /api/incidents/analyze` → crear `IncidentAnalysisResponse` y usar `response_model` | ✅ Completado |

### Prioridades restantes (media/baja)

| Prioridad | Acción |
|-----------|--------|
| Media | Revisar `CandidateRecord` con `extra="allow"` — aunque es intencional, documentar por qué |
| Media | Verificar que `UserUpdate` con `role` opcional no permita auto-asignación de ADMIN (ya controlado en `users.py`) |
| Baja | Documentar que `GET /api/incidents/results/export` devuelve `Response` (CSV) intencionalmente |
| Baja | Crear tests de serialización que verifiquen que ningún endpoint devuelva objetos ORM en crudo |

### Separación de esquemas request/response

Se ha mantenido una separación estricta entre esquemas de entrada y salida:

- **Request schemas** (entrada): `UserCreate`, `ForgotPasswordRequest`, `ResetPasswordRequest`, `ChangePasswordRequest` — todos con `extra="forbid"` para rechazar campos extraños.
- **Response schemas** (salida): `MessageResponse`, `TokenResponse`, `AuthMe`, `UserRead` — ninguno contiene campos de contraseña.
- Los schemas de entrada **no se reutilizan** como respuesta. La respuesta es siempre un schema diferente adaptado a lo que el cliente necesita ver.

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

**Conclusión:** El backend de Nexova ha pasado del 87.8 % al **97.6 % de endpoints serializados**. Se crearon dos nuevos schemas (`MessageResponse` e `IncidentAnalysisResponse`) y se actualizaron 5 decoradores de rutas. Todos los flujos de autenticación son seguros: ningún endpoint devuelve contraseñas (ni texto plano ni hasheadas), ni tokens de restablecimiento, ni reenvía el correo electrónico del usuario salvo `GET /auth/me` que únicamente muestra el correo del propio usuario autenticado.