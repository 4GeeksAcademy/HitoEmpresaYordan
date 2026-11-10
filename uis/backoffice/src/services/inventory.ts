/**
 * Módulo de integración con la API de inventario de Nexova.
 *
 * Centraliza todas las peticiones a los endpoints /inventory y reutiliza
 * las funciones de autenticación (getToken, ApiError) definidas en api.ts.
 */

import { ApiError, getToken } from "@/src/services/api";

const API_BASE = "/api";
const TOKEN_KEY = "access_token";

// ── Tipos compartidos ─────────────────────────────────────────────

export interface Asset {
  id: number;
  name: string;
  sku: string;
  category: string;
  office: string;
  current_stock: number;
}

export interface AssetEntryRead {
  id: number;
  asset_id: number;
  quantity: number;
  supplier: string;
  office: string;
  created_at: string;
  user_uuid: string;
}

export interface AssetExitRead {
  id: number;
  asset_id: number;
  quantity: number;
  exit_type: "allocation" | "consumption";
  assigned_to: string | null;
  office: string;
  created_at: string;
  user_uuid: string;
}

export interface AssetOrderEntry {
  id: number;
  order_type: "entry" | "exit";
  asset_id: number;
  quantity: number;
  office: string;
  created_at: string;
  user_uuid: string;
  supplier: string | null;
  exit_type: string | null;
  assigned_to: string | null;
  asset_name: string | null;
  asset_sku: string | null;
}

export interface CreateInboundPayload {
  asset_id: number;
  quantity: number;
  supplier: string;
  office: string;
  user_uuid: string;
}

export interface CreateOutboundPayload {
  asset_id: number;
  quantity: number;
  exit_type: "allocation" | "consumption";
  assigned_to: string | null;
  office: string;
  user_uuid: string;
}

// ── Utilidad privada ──────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) {
    throw new ApiError("Inicia sesión para continuar.", 401);
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    if (response.ok) {
      throw new ApiError(
        "El servicio devolvió una respuesta no válida. Inténtalo de nuevo.",
        response.status,
      );
    }
    body = null;
  }

  if (!response.ok) {
    // 401 → redirigir al login
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(TOKEN_KEY);
        window.location.replace("/login");
      }
    }

    const detail =
      body && typeof body === "object" && "detail" in (body as Record<string, unknown>)
        ? (body as Record<string, unknown>).detail
        : null;

    const message = formatDetail(detail, response.status);
    throw new ApiError(message, response.status);
  }

  return body as T;
}

function formatDetail(detail: unknown, status: number): string {
  if (status === 0) {
    return "No se pudo conectar con el servicio. Comprueba tu conexión e inténtalo de nuevo.";
  }
  if (status >= 500) {
    return "El servicio no pudo completar la solicitud. Inténtalo de nuevo más tarde.";
  }
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    return (detail as { loc?: (string | number)[]; msg?: string }[])
      .map((issue) => {
        const field = (issue.loc ?? []).filter((part) => part !== "body").join(".");
        const message = typeof issue.msg === "string" ? issue.msg : "Revisa este campo";
        return field ? `${field}: ${message}` : message;
      })
      .join(" · ");
  }
  if (status === 401) return "Tu sesión no es válida. Inicia sesión de nuevo.";
  if (status === 403) return "No tienes permiso para realizar esta acción.";
  if (status === 404) return "El recurso solicitado ya no está disponible.";
  if (status === 409) return "El cambio entra en conflicto con los datos actuales.";
  if (status === 400) return "Revisa los datos e inténtalo de nuevo.";
  if (status === 422) return "Revisa los datos e inténtalo de nuevo.";
  return "No se pudo completar la solicitud. Inténtalo de nuevo.";
}

// ── Funciones exportadas ──────────────────────────────────────────

/**
 * Obtiene la lista de todos los productos/activos con su stock actual calculado.
 */
export async function getProducts(signal?: AbortSignal): Promise<Asset[]> {
  const response = await fetch(`${API_BASE}/inventory/products`, { signal });
  return handleResponse<Asset[]>(response);
}

/**
 * Obtiene un producto/activo por su ID con su stock actual calculado.
 */
export async function getProductById(
  id: number,
  signal?: AbortSignal,
): Promise<Asset> {
  const response = await fetch(`${API_BASE}/inventory/products/${id}`, { signal });
  return handleResponse<Asset>(response);
}

/**
 * Registra una orden de entrada (inbound) — compra o entrega recibida.
 * Requiere autenticación.
 */
export async function createInboundOrder(
  payload: CreateInboundPayload,
  signal?: AbortSignal,
): Promise<AssetEntryRead> {
  const response = await fetch(`${API_BASE}/inventory/orders/inbound`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
    signal,
  });
  return handleResponse<AssetEntryRead>(response);
}

/**
 * Registra una orden de salida (outbound) — asignación o consumo.
 * Requiere autenticación. La API valida que el stock sea suficiente
 * y devuelve HTTP 400 si no lo es.
 */
export async function createOutboundOrder(
  payload: CreateOutboundPayload,
  signal?: AbortSignal,
): Promise<AssetExitRead> {
  const response = await fetch(`${API_BASE}/inventory/orders/outbound`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
    signal,
  });
  return handleResponse<AssetExitRead>(response);
}

/**
 * Obtiene el historial completo de órdenes (entradas y salidas)
 * con datos del producto asociado.
 */
export async function getOrders(signal?: AbortSignal): Promise<AssetOrderEntry[]> {
  const response = await fetch(`${API_BASE}/inventory/orders`, { signal });
  return handleResponse<AssetOrderEntry[]>(response);
}
