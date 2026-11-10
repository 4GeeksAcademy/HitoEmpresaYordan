import { getAuthHeaders, getToken, removeToken, setToken, isTokenValid } from "@nexova/auth";
import { ApiError } from "@nexova/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// ---------------------------------------------------------------------------
// Tipos específicos del website (no compartidos con backoffice)
// ---------------------------------------------------------------------------

export interface RegisterPayload {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
}

export type UserRole = "admin" | "manager" | "user";

export interface UserProfile {
  id: number;
  email: string;
  is_active: boolean;
  role: UserRole;
  created_at: string;
  name: string | null;
  phone: string | null;
  address: string | null;
}

export interface ProfileResponse {
  id: number;
  user_id: number;
  name: string | null;
  phone: string | null;
  address: string | null;
}

export interface UpdateProfilePayload {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface AuthMeResponse
  extends Omit<UserProfile, "name" | "phone" | "address"> {
  profile: ProfileResponse | null;
}

// ---------------------------------------------------------------------------
// Helpers de peticiones autenticadas
// ---------------------------------------------------------------------------

async function handleProtectedResponse<T>(
  response: Response,
): Promise<T> {
  if (response.status === 401) {
    removeToken();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:logout"));
    }
    throw new ApiError("Sesión expirada. Inicia sesión de nuevo.", 401);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.detail ||
        `Error en la petición (status ${response.status})`,
    );
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

export async function register(payload: RegisterPayload): Promise<void> {
  const name = [payload.first_name, payload.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  const user = {
    email: payload.email,
    password: payload.password,
    ...(name ? { name } : {}),
    ...(payload.phone ? { phone: payload.phone } : {}),
    ...(payload.address ? { address: payload.address } : {}),
  };
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.detail || `Registro fallido (status ${response.status})`,
    );
  }
}

// ---------------------------------------------------------------------------
// Profile (getCurrentUser / updateProfile)
// ---------------------------------------------------------------------------

export async function getCurrentUser(): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const body = await handleProtectedResponse<AuthMeResponse>(response);
  return {
    id: body.id,
    email: body.email,
    is_active: body.is_active,
    role: body.role,
    created_at: body.created_at,
    name: body.profile?.name ?? null,
    phone: body.profile?.phone ?? null,
    address: body.profile?.address ?? null,
  };
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<ProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/profiles/me`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleProtectedResponse<ProfileResponse>(response);
}

// Re-exportamos para compatibilidad con imports existentes
export { getToken, setToken, removeToken, isTokenValid } from "@nexova/auth";


