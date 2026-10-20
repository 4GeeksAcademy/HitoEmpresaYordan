import type {
  Supplier,
  SupplierCreateInput,
  SupplierFilters,
  SupplierStatus,
} from "@/src/types/supplier";

const API_BASE = "/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface ValidationIssue {
  loc?: (string | number)[];
  msg?: string;
}

// FastAPI devuelve `detail` como string (404) o como lista de errores de Pydantic (422)
function formatDetail(detail: unknown, status: number): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return (detail as ValidationIssue[])
      .map((issue) => {
        const field = (issue.loc ?? []).filter((part) => part !== "body").join(".");
        return field ? `${field}: ${issue.msg}` : String(issue.msg);
      })
      .join(" · ");
  }
  return `Error ${status} en la petición`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("No se pudo conectar con la API de proveedores", 0);
  }

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(formatDetail(body?.detail, response.status), response.status);
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
