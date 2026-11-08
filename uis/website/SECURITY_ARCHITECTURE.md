# Arquitectura de Protección de Rutas y Seguridad de Autenticación

## Descripción General

El mecanismo de protección de rutas implementado proporciona:
- **Validación de autenticación** en todas las rutas privadas
- **Manejo automático de tokens JWT** en todas las llamadas a API
- **Interceptor de errores 401** para limpiar tokens y redirigir a login
- **Website público completamente abierto** sin verificaciones de autenticación

## Archivos Clave

### 1. **src/lib/api.ts** - Gestión de API y Tokens
- `getToken()` / `setToken()` / `removeToken()`: Manejo de localStorage
- `getAuthHeader()`: Añade automáticamente `Authorization: Bearer <token>` a headers
- `handleProtectedResponse()`: Intercepta 401 y dispara evento `auth:logout`
- `getCurrentUser()`: Llama a `GET /auth/me` con autenticación
- `updateProfile()`: Llama a `PUT /profiles/me` con autenticación

**Manejo de 401:**
```typescript
// Para una respuesta procesada mediante handleProtectedResponse():
// 1. Limpia el token de localStorage
// 2. Dispara evento global 'auth:logout'
// 3. Lanza UnauthorizedError
```

`handleProtectedResponse()` se utiliza actualmente para las respuestas de `getCurrentUser()` y `updateProfile()`. Las llamadas de `login()` y `register()` gestionan sus errores por separado y no pasan por este mecanismo global.

### 2. **src/hooks/useAuth.ts** - Hook de Autenticación
Proporciona métodos:
- `token`: obtiene el token actual
- `isAuthenticated`: verifica si hay token válido
- `login(token)`: almacena un nuevo token
- `logout()`: limpia el token
- `clearAuth()`: alias de logout

### 3. **src/hooks/useProtectedRoute.ts** - Protección de Rutas
Hook simple que redirige a `/login` si no hay token

### 4. **src/hooks/useAuthInterceptor.ts** - Interceptor Global
Escucha eventos `auth:logout` y redirige a `/login`
Se instancia en el layout raíz a través de `AuthInterceptorProvider`

### 5. **src/components/protected-layout.tsx** - Wrapper de Componentes
- Valida que exista token
- Redirecciona a `/login` si no
- Muestra loading state mientras verifica
- Envuelve todo componente privado

### 6. **src/components/auth-interceptor-provider.tsx** - Proveedor Global
Envuelve la app completa en el layout raíz para activar el interceptor

## Rutas y Protección

### Rutas Públicas (SIN protección)
```
/                  - Homepage (website público)
/login             - Página de login (redirecciona a /dashboard si ya autenticado)
/register          - Página de registro (redirecciona a /dashboard si ya autenticado)
```

### Rutas Privadas (CON protección)
```
/dashboard         - Panel principal autenticado
/account/profile   - Gestión de perfil de usuario
```

**Características de protección:**
- Validan presencia de token en localStorage
- Redirigen a `/login` si falta el token
- Muestran loading state durante verificación
- Todos los imports usan `ProtectedLayout`

## Flujos de Autenticación

### Flujo de Login
```
1. Usuario ingresa credenciales
2. LoginForm → login() → POST /auth/login
3. Respuesta incluye token JWT
4. setToken(token) → localStorage
5. Redirige a /dashboard
6. ProtectedLayout valida token ✓
7. Dashboard se renderiza
```

### Flujo de Logout
```
1. Usuario hace click en "Logout"
2. logout() → removeToken()
3. router.push('/login')
4. Token limpiado de localStorage
5. Sesión terminada
```

### Flujo de 401 (Sesión Expirada)
```
1. Cliente hace GET /auth/me
2. API devuelve 401 Unauthorized
3. handleProtectedResponse() intercepta
4. removeToken() limpia localStorage
5. Dispara evento 'auth:logout'
6. useAuthInterceptor() escucha evento
7. router.push('/login')
8. Usuario redirigido a login automáticamente
```

### Flujo de Acceso a Ruta Privada sin Token
```
1. Usuario visita /dashboard sin token
2. useEffect en ProtectedLayout se ejecuta
3. getToken() devuelve null
4. router.push('/login')
5. Login page se renderiza
```

## Headers de Autenticación

Todas las peticiones protegidas incluyen automáticamente:
```
Authorization: Bearer <token>
Content-Type: application/json
```

Ejemplo:
```typescript
// Sin necesidad de especificar manualmente
const user = await getCurrentUser(); // Header agregado automáticamente
const updated = await updateProfile(data); // Header agregado automáticamente
```

## Gestión de Errores API

### Casos de Error Manejados
- **401 Unauthorized**: Token expirado → logout automático
- **400-500 errors**: Mensaje de error enviado al usuario
- **Network errors**: Capturados y mostrados como errores genéricos

### Ejemplo de Manejo
```typescript
try {
  const profile = await getCurrentUser();
  // Si devuelve 401, automáticamente:
  // 1. Token limpiado
  // 2. Evento 'auth:logout' disparado
  // 3. UnauthorizedError lanzado
} catch (err) {
  if (err instanceof UnauthorizedError) {
    // Ya fue manejado automáticamente
  } else {
    // Mostrar error al usuario
  }
}
```

## Consideraciones de Seguridad

✅ **Implementado:**
- Token almacenado en localStorage (accesible a JavaScript)
- Validación en cliente (primera línea de defensa)
- Manejo de 401 automático
- Limpieza de token en logout

⚠️ **Importante:**
- localStorage NO es tan seguro como httpOnly cookies
- El servidor DEBE validar TODOS los tokens
- Para máxima seguridad, usar httpOnly cookies en producción
- Implementar CSRF protection en servidor
- Validar origen en CORS

## Testing

Para probar la protección:

```bash
# 1. Acceder a /dashboard sin autenticación
# Resultado: Redirige a /login

# 2. Login, luego limpiar token manualmente
localStorage.removeItem('auth_token');
# Resultado: Página se renderiza pero con acceso restringido

# 3. Hacer request con token expirado
# Resultado: 401 automáticamente limpia token y redirige

# 4. Acceder a /login estando autenticado
# Resultado: Redirige a /dashboard
```

## Integración Futura

Para producción:
1. Implementar httpOnly cookies en backend
2. Agregar CSRF tokens
3. Implementar refresh token rotation
4. Añadir rate limiting en endpoints auth
5. Implementar 2FA/MFA
6. Auditoring de acceso
