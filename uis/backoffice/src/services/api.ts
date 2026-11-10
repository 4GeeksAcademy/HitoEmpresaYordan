import type {
  Supplier,
  SupplierCreateInput,
  SupplierFilters,
  SupplierStatus,
} from "@/src/types/supplier";
import {
  ApiError,
  getToken,
  removeToken,
} from "@nexova/auth";

// Re-exportamos para compatibilidad con imports existentes
export { ApiError, getToken, removeToken } from "@nexova/auth";

const API_BASE = "/api";

interface ValidationIssue {
  loc?: (string | number)[];
  msg?: string;
}

// FastAPI devuelve `detail` como string (404) o como lista de errores de Pydantic (422)
function formatDetail(detail: unknown, status: number): string {
  if (status === 0) return "No se pudo conectar con el servicio. Comprueba tu conexión e inténtalo de nuevo.";
  if (status >= 500) return "El servicio no pudo completar la solicitud. Inténtalo de nuevo más tarde.";
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
      throw new ApiError("El servicio devolvió una respuesta no válida. Inténtalo de nuevo.", response.status);
    }
    return null;
  }
}

function responseObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  if (!token) {
    if (typeof window !== "undefined") window.location.replace("/login");
    throw new ApiError("Inicia sesión para continuar.", 401);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError("No se pudo conectar con el servicio. Comprueba tu conexión e inténtalo de nuevo.", 0);
  }

  if (response.status === 204) return undefined as T;

  const body = await readResponseBody(response);
  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
      if (typeof window !== "undefined") window.location.replace("/login");
    }
    throw new ApiError(formatDetail(responseObject(body)?.detail, response.status), response.status);
  }
  return body as T;
}

export function listSuppliers(filters: SupplierFilters, signal?: AbortSignal) {
  const params = new URLSearchParams();
  if (filters.country) params.set("country", filters.country);
  if (filters.category) params.set("category", filters.category);
  const query = params.toString();
  return request<Supplier[]>(`/suppliers${query ? `?${query}` : ""}`, { signal });
}

export function createSupplier(input: SupplierCreateInput) {
  return request<Supplier>("/suppliers", { method: "POST", body: JSON.stringify(input) });
}

export function updateSupplierRate(id: number, monthlyRate: number) {
  return request<Supplier>(`/suppliers/${id}/rate`, {
    method: "PATCH",
    body: JSON.stringify({ monthly_rate: monthlyRate }),
  });
}

export function updateSupplierStatus(id: number, status: SupplierStatus) {
  return request<Supplier>(`/suppliers/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
