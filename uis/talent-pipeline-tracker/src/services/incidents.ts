import { ApiError, request } from "@/src/services/api";
import { getAuthorizationHeader } from "@/src/services/auth-session";
import {
  INCIDENT_BRANCH_LABELS, INCIDENT_CATEGORY_LABELS, INCIDENT_ORIGIN_LABELS, INCIDENT_STATUS_LABELS,
  type Incident, type IncidentFieldErrors, type IncidentFilters, type IncidentInput, type IncidentStatus, type IncidentSummary,
} from "@/src/types/incident";

export async function getIncidentSummary(signal?: AbortSignal): Promise<IncidentSummary> {
  const data = await request<unknown>("/api/incidents/summary", {
    headers: getAuthorizationHeader(), signal,
  }, "/backend");
  if (!data || typeof data !== "object") throw new ApiError("Resumen no válido", 502, null);
  const summary = data as Record<string, unknown>;
  const total = summary.total;
  if (typeof total !== "number" || !Number.isSafeInteger(total) || total < 0) {
    throw new ApiError("Total no válido", 502, null);
  }
  const groups = {
    by_status: INCIDENT_STATUS_LABELS,
    by_category: INCIDENT_CATEGORY_LABELS,
    by_origin: INCIDENT_ORIGIN_LABELS,
    by_branch: INCIDENT_BRANCH_LABELS,
  };
  for (const [field, labels] of Object.entries(groups)) {
    const counts = summary[field];
    if (!counts || typeof counts !== "object" || Array.isArray(counts)) throw new ApiError("Métricas no válidas", 502, null);
    let sum = 0;
    for (const key of Object.keys(labels)) {
      const count = (counts as Record<string, unknown>)[key];
      if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) {
        throw new ApiError("Conteo no válido", 502, null);
      }
      sum += count;
    }
    if (sum !== total) throw new ApiError("Totales inconsistentes", 502, null);
  }
  return data as IncidentSummary;
}

export function listIncidents(filters: IncidentFilters, signal?: AbortSignal) {
  const params = new URLSearchParams();
  for (const [field, value] of Object.entries(filters)) {
    if (value) params.set(field, value);
  }
  const query = params.toString();
  return request<Incident[]>(`/api/incidents${query ? `?${query}` : ""}`, {
    headers: getAuthorizationHeader(), signal,
  }, "/backend");
}

export function createIncident(input: IncidentInput) {
  return request<Incident>("/api/incidents", {
    method: "POST", headers: getAuthorizationHeader(), body: JSON.stringify(input),
  }, "/backend");
}

export function updateIncidentStatus(id: number, status: IncidentStatus) {
  return request<Incident>(`/api/incidents/${id}/status`, {
    method: "PATCH", headers: getAuthorizationHeader(), body: JSON.stringify({ status }),
  }, "/backend");
}

export function incidentErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) return "Tu sesión no es válida. Inicia sesión de nuevo.";
    if (error.status >= 500) return "El servidor no pudo completar la operación. Inténtalo de nuevo.";
    if (error.status === 404) return "La incidencia ya no está disponible. Actualiza el listado.";
    if (error.status === 400 || error.status === 422) return "La petición no es válida. Revisa los campos y el estado actual de la incidencia.";
  }
  return "No se pudo conectar con el servicio de incidencias. Inténtalo de nuevo.";
}

export function incidentFieldErrors(error: unknown): IncidentFieldErrors {
  if (!(error instanceof ApiError) || !error.details || typeof error.details !== "object") return {};
  const details = error.details as Record<string, unknown>;
  const issues = Array.isArray(details.errors) ? details.errors : Array.isArray(details.detail) ? details.detail : [];
  const errors: IncidentFieldErrors = {};
  for (const issue of issues) {
    if (!issue || typeof issue !== "object") continue;
    const path = typeof issue.field === "string" ? issue.field.split(".") : issue.loc;
    const field = Array.isArray(path) ? path.at(-1) : undefined;
    if (typeof field !== "string" || !["title", "description", "category", "origin", "branch", "status"].includes(field)) continue;
    errors[field as keyof IncidentInput] = issue.type === "missing"
      ? "Este campo es obligatorio."
      : issue.type === "string_too_long"
        ? "El título no puede superar los 120 caracteres."
        : "El valor no es válido. Revisa este campo.";
  }
  return errors;
}