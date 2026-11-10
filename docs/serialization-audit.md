# Auditoría de Serialización de Endpoints — Backend Nexova

> **Proyecto:** Nexova Suppliers API (FastAPI)  
> **Fecha del análisis:** 2025  
> **Herramientas:** FastAPI, SQLModel, TinyDB, Pydantic v2  
> **Objetivo:** Verificar que todos los endpoints usen `response_model` y devuelvan schemas Pydantic (no objetos ORM en crudo, ni `dict` sin tipar).

## Estado de los extremos por router

| # | Ruta | Método | Propósito | ¿Usa `response_model`? | Tipo retornado | Estado |
|---|------|--------|-----------|------------------------|----------------|--------|
| 1 | `/` | GET | Bienvenida / health‑check | ❌ No | `dict[str, str]` | ❌ Sin serializar |
| 2 | `/api/incidents/analyze` | POST | Analizar CSV de incidencias | ❌ No | `IncidentSummary` (Pydantic) ✅ pero sin `response_model` explícito | ⚠️ Parcialmente serializado |
| 3 | `/api/incidents/results/export` | GET | Exportar resultados a CSV | ❌ No | `Response` (FastAPI raw) | ✅ Ya serializado¹ |
| 4 | `/auth/login` | POST | Iniciar sesión | ✅ `TokenResponse` | `TokenResponse` | ✅ Ya serializado |
| 5 | `/auth/forgot-password` | POST | Solicitar restablecimiento de contraseña | ❌ No | `dict[str, str]` | ❌ Sin serializar |
| 6 | `/auth/reset-password` | POST | Restablecer contraseña con token | ❌ No | `dict[str, str]` | ❌ Sin serializar |
| 7 | `/auth/change-password` | POST | Cambiar contraseña (autenticado) | ❌ No | `dict[str, str]` | ❌ Sin serializar |
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
| ✅ Ya serializado | 36 | La gran mayoría usan `response_model` y devuelven schemas Pydantic |
| ⚠️ Parcialmente serializado | 1 | `POST /api/incidents/analyze` devuelve un Pydantic `IncidentSummary` pero sin `response_model` en el decorador |
| ❌ Sin serializar | 4 | `GET /`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/change-password` |

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

#### ❌ `POST /auth/forgot-password` — Sin response_model
```python
@router.post("/forgot-password")
def forgot_password(...) -> dict[str, str]:
    return {"message": "Si la cuenta existe, recibiras un enlace..."}
```
**Riesgo bajo.** No expone datos sensibles, pero carece de schema de respuesta. Debería usar un Pydantic `MessageResponse`.

#### ❌ `POST /auth/reset-password` — Sin response_model
```python
@router.post("/reset-password")
def reset_password(...) -> dict[str, str]:
    return {"message": "Contrasena restablecida"}
```
**Riesgo bajo.** Ídem anterior. Debería usar un schema tipado.

#### ❌ `POST /auth/change-password` — Sin response_model
```python
@router.post("/change-password")
def change_password(...) -> dict[str, str]:
    return {"message": "Contrasena actualizada"}
```
**Riesgo bajo.** Ídem.

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

Todos los endpoints menos el `analyze` usan `response_model` con schemas Pydantic (`Incident`, `IncidentSummary`). **Bien serializados.** 

#### ⚠️ `POST /api/incidents/analyze` 
Devuelve `IncidentSummary` (Pydantic válido) pero **sin `response_model`**. FastAPI inferirá el tipo del return annotation, pero carece de la validación explícita en el decorador. **Bajo riesgo, pero inconsistente.**

### 5. Rutas de proveedores (`/suppliers`)

Todos usan `response_model=Supplier` o `List[Supplier]` con `Supplier` Pydantic. **Correcto.** 
Los endpoints `PATCH /rate` y `PATCH /status` tienen schemas específicos de entrada (`SupplierRateUpdate`, `SupplierStatusUpdate`) y reutilizan `response_model=Supplier`. **Bien diseñados.**

### 6. Rutas de candidaturas (`/records`)

Todos los endpoints usan `response_model` con schemas Pydantic (`CandidateRecord`, `CandidateNote`). **Correcto.** Nota: `CandidateRecord` tiene `model_config = ConfigDict(extra="allow")` que permite campos adicionales del tracker externo — **intencional y seguro** (no expone datos sensibles).

### 7. Rutas de inventario (`/inventory`)

Todos los endpoints usan `response_model` con schemas Pydantic (`AssetRead`, `AssetEntryRead`, `AssetExitRead`, `AssetOrderEntry`). **Correcto.** El inventario usa SQLModel como ORM pero convierte explícitamente a schemas Pydantic mediante helpers `_asset_to_read` y `model_validate`. **Nunca filtra objetos ORM en crudo.**

### 8. Endpoints globales (`/`)

#### ❌ `GET /` — Sin response_model
```python
@app.get("/")
def welcome() -> dict[str, str]:
    return {"message": "Bienvenido a la API de Nexova"}
```
**Riesgo bajo.** Endpoint meramente informativo. Debería usar schema por consistencia.

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

## Recomendaciones

### Prioridad alta

1. **Añadir `response_model=MessageResponse` a los 4 endpoints sin serializar**
   - Crear schema: `class MessageResponse(BaseModel): message: str`
   - Aplicar a: `GET /`, `POST /forgot-password`, `POST /reset-password`, `POST /change-password`

2. **Añadir `response_model=IncidentSummary` al endpoint `POST /api/incidents/analyze`**  
   ```python
   @app.post("/api/incidents/analyze", response_model=IncidentSummary)
   ```

### Prioridad media

3. **Revisar `CandidateRecord` con `extra="allow"`** — Aunque es intencional para el tracker externo, conviene documentar por qué se permite y qué campos externos pueden aparecer.

4. **Verificar que `UserUpdate` con `role` opcional** no permita que un usuario se auto-asigne rol ADMIN (en `users.py` ya está controlado: solo admin cambia roles).

### Prioridad baja

5. **Documentar `response_model` en el endpoint de exportación CSV** — Aunque `Response` no requiere schema, añadir un comentario/explicación en la función evitaría confusiones futuras.

6. **Crear tests de serialización** para verificar que ningún endpoint devuelva objetos ORM en crudo (ej. mediante middleware de test que inspeccione `response.body`).

---

## Cobertura general

```
✅ Ya serializados:      36 / 41  (87.8 %)
⚠️ Parcialmente:          1 / 41  ( 2.4 %)
❌ Sin serializar:        4 / 41  ( 9.8 %)
```

**Conclusión:** El backend de Nexova tiene una **excelente higiene de serialización**. El 87.8 % de los endpoints están correctamente serializados con `response_model` y schemas Pydantic. Ningún endpoint expone `hashed_password` ni datos sensibles indebidos. Los 4 endpoints sin serializar son triviales (mensajes de texto planos) y añadir un schema `MessageResponse` los resolvería en minutos.