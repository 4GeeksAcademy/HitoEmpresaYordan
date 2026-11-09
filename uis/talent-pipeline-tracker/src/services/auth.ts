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
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

  if (!apiBaseUrl) {
    throw new Error("Falta configurar NEXT_PUBLIC_API_URL para conectar con la API.");
  }

  return apiBaseUrl;
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  const text = await response.text();
  return text || null;
}

function getResponseMessage(body: unknown, fallback: string): string {
  if (typeof body === "string" && body.trim()) return body;
  if (!body || typeof body !== "object") return fallback;

  const detail = (body as Record<string, unknown>).detail;
  if (typeof detail === "string") return detail;
  if (typeof (body as Record<string, unknown>).message === "string") {
    return (body as Record<string, string>).message;
  }

  return fallback;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, init);
  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new AuthenticationApiError(
      getResponseMessage(body, "No se pudo completar la solicitud."),
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

function getAuthorizationHeader(): Record<string, string> {
  const accessToken = window.localStorage.getItem("access_token");

  if (!accessToken) {
    throw new Error("Tu sesión no está activa. Inicia sesión para continuar.");
  }

  return { Authorization: `Bearer ${accessToken}` };
}

export function getCurrentAccount(): Promise<CurrentAccount> {
  return request("/auth/me", {
    method: "GET",
    headers: getAuthorizationHeader(),
  });
}

export function updateAccountProfile(
  profile: UpdateAccountProfileInput
): Promise<AccountProfile> {
  return request("/profiles/me", {
    method: "PUT",
    headers: {
      ...getAuthorizationHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profile),
  });
}