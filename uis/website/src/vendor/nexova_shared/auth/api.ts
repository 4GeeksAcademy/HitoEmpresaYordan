/**
 * @nexova/auth — API cliente de autenticación compartida
 *
 * Funciones de token (localStorage), login contra FastAPI y clases de error.
 * Compatible con website (auth_token) y backoffice (access_token + auth_token).
 */

const TOKEN_KEYS = ["access_token", "auth_token"] as const;

// ---------------------------------------------------------------------------
// Errores
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

/** Obtiene el token JWT de localStorage (cualquier clave conocida). */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  for (const key of TOKEN_KEYS) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }
  return null;
}

/** Guarda el token JWT en localStorage con la clave principal. */
export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("access_token", token);
  window.localStorage.setItem("auth_token", token);
}

/** Elimina el token JWT de todas las claves conocidas. */
export function removeToken(): void {
  if (typeof window === "undefined") return;
  for (const key of TOKEN_KEYS) {
    window.localStorage.removeItem(key);
  }
  window.dispatchEvent(new Event("nexova:auth-change"));
  window.dispatchEvent(new Event("auth:logout"));
}

/** Comprueba si existe un token. */
export function isTokenValid(): boolean {
  return getToken() !== null;
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

const API_BASE = "/api";

interface ValidationIssue {
  loc?: (string | number)[];
  msg?: string;
}

function formatDetail(detail: unknown, status: number): string {
  if (status === 0)
    return "No se pudo conectar con el servicio. Comprueba tu conexión e inténtalo de nuevo.";
  if (status >= 500)
    return "El servicio no pudo completar la solicitud. Inténtalo de nuevo más tarde.";
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    return (detail as ValidationIssue[])
      .map((issue) => {
        const field = (issue?.loc ?? []).filter((part) => part !== "body").join(".");
        const message = typeof issue?.msg === "string" ? issue.msg : "Revisa este campo";
        return field ? `${field}: ${message}` : message;
      })
      .join(" · ");
  }
  if (status === 401) return "Tu sesión no es válida. Inicia sesión de nuevo.";
  if (status === 403) return "No tienes permiso para realizar esta acción.";
  if (status === 404) return "El recurso solicitado ya no está disponible.";
  if (status === 409) return "El cambio entra en conflicto con los datos actuales.";
  if (status === 400 || status === 422) return "Revisa los datos e inténtalo de nuevo.";
  return "No se pudo completar la solicitud. Inténtalo de nuevo.";
}

async function readResponseBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    if (response.ok) {
      throw new ApiError(
        "El servicio devolvió una respuesta no válida. Inténtalo de nuevo.",
        response.status,
      );
    }
    return null;
  }
}

function responseObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * Inicia sesión contra /api/auth/login con credenciales email/password.
 * Almacena el token automáticamente en localStorage en caso de éxito.
 *
 * Compatibilidad: acepta tanto un objeto `{ email, password }` (website)
 * como dos strings independientes `(email, password)` (backoffice).
 */
export async function login(
  emailOrPayload: string | { email: string; password: string },
  password?: string,
): Promise<void> {
  const email =
    typeof emailOrPayload === "string" ? emailOrPayload : emailOrPayload.email;
  const pwd =
    typeof emailOrPayload === "string"
      ? password!
      : emailOrPayload.password;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: email, password: pwd }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError(
      "No se pudo conectar con el servicio. Comprueba tu conexión e inténtalo de nuevo.",
      0,
    );
  }

  const body = responseObject(await readResponseBody(response));
  if (!response.ok) {
    throw new ApiError(formatDetail(body?.detail, response.status), response.status);
  }

  const accessToken = body?.access_token;
  if (typeof accessToken !== "string" || !accessToken) {
    throw new ApiError("La API no devolvió un token válido.", response.status);
  }

  setToken(accessToken);
}

// ---------------------------------------------------------------------------
// Auth header helper (para peticiones autenticadas)
// ---------------------------------------------------------------------------

/** Obtiene las cabeceras de autorización Bearer. Lanza si no hay token. */
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) {
    throw new ApiError("Inicia sesión para continuar.", 401);
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}