import { getAuthorizationHeader, logout } from "@/src/services/auth-session";

export interface RegisterUserInput {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  address?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type?: string;
}

export interface AccountProfile {
  id: number;
  user_id: number;
  name: string | null;
  phone: string | null;
  address: string | null;
}

export interface CurrentAccount {
  email: string;
  profile: AccountProfile | null;
}

export interface UpdateAccountProfileInput {
  name: string | null;
  phone: string | null;
  address: string | null;
}

export class AuthenticationApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown
  ) {
    super(message);
    this.name = "AuthenticationApiError";
  }
}

function getApiBaseUrl(): string {
  const apiBaseUrl = process.env.NEXT_PUBLIC_AUTH_API_URL?.replace(/\/$/, "");

  if (!apiBaseUrl) {
    throw new AuthenticationApiError("No se pudo conectar con el servicio. Inténtalo más tarde.", 0, null);
  }

  return apiBaseUrl;
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

function getResponseMessage(status: number): string {
  if (status === 0) return "No se pudo conectar con el servicio. Comprueba tu conexión e inténtalo de nuevo.";
  if (status === 400) return "No se pudo completar la solicitud. Revisa los datos e inténtalo de nuevo.";
  if (status === 401) return "Credenciales no válidas o sesión expirada. Vuelve a intentarlo.";
  if (status === 403) return "No tienes permiso para realizar esta acción.";
  if (status === 404) return "El recurso solicitado ya no está disponible.";
  if (status === 409) return "Ya existe una cuenta con esos datos.";
  if (status === 422) return "Revisa los datos indicados e inténtalo de nuevo.";
  if (status >= 500) return "El servicio no pudo completar la solicitud. Inténtalo de nuevo más tarde.";
  return "No se pudo completar la solicitud. Inténtalo de nuevo.";
}

async function request<T>(
  path: string,
  init: RequestInit,
  requiresAuth = false
): Promise<T> {
  const headers = new Headers(init.headers);
  if (requiresAuth) {
    for (const [name, value] of Object.entries(getAuthorizationHeader())) {
      headers.set(name, value);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new AuthenticationApiError(getResponseMessage(0), 0, null);
  }

  let body: unknown;
  try {
    body = await readResponseBody(response);
  } catch {
    throw new AuthenticationApiError("El servicio devolvió una respuesta no válida. Inténtalo de nuevo.", response.status, null);
  }

  if (!response.ok) {
    if (requiresAuth && response.status === 401) logout();
    throw new AuthenticationApiError(
      getResponseMessage(response.status),
      response.status,
      body
    );
  }

  return body as T;
}

export function registerUser(input: RegisterUserInput): Promise<unknown> {
  return request("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function requestPasswordReset(email: string): Promise<unknown> {
  return request("/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, newPassword: string): Promise<unknown> {
  return request("/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}

export function changePassword(currentPassword: string, newPassword: string): Promise<unknown> {
  return request("/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  }, true);
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const body = await request<Partial<LoginResponse>>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: email, password }),
  });

  if (typeof body?.access_token !== "string" || body.access_token.length === 0) {
    throw new Error("La API no devolvió un token de acceso válido.");
  }

  return body as LoginResponse;
}

export function getCurrentAccount(): Promise<CurrentAccount> {
  return request("/auth/me", {
    method: "GET",
  }, true);
}

export function updateAccountProfile(
  profile: UpdateAccountProfileInput
): Promise<AccountProfile> {
  return request("/profiles/me", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profile),
  }, true);
}