import type {
  Candidate,
  CandidateStage,
  CandidateStatus,
  CreateCandidateInput,
  CreateNoteInput,
  Note,
  PatchCandidateInput,
  UpdateCandidateInput,
} from "@/src/types/talent";
import { getAuthorizationHeader } from "@/src/services/talent/auth-session";

interface ApiRecord {
  id: string | number;
  full_name: string;
  email: string;
  phone?: string;
  position: string;
  linkedin_url?: string;
  cv_url?: string;
  experience_years?: number;
  status?: string;
  stage?: string;
  applied_at?: string;
}

interface ApiNote {
  id: string | number;
  record_id?: string | number;
  content: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
}

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function getApiErrorMessage(status: number): string {
  if (status === 0) return "No se pudo conectar con el servicio. Comprueba tu conexión e inténtalo de nuevo.";
  if (status === 401) return "Tu sesión no es válida. Inicia sesión de nuevo.";
  if (status === 403) return "No tienes permiso para realizar esta acción.";
  if (status === 404) return "El recurso solicitado ya no está disponible.";
  if (status === 409) return "El cambio entra en conflicto con los datos actuales.";
  if (status === 400 || status === 422) return "Revisa los datos e inténtalo de nuevo.";
  if (status >= 500) return "El servicio no pudo completar la solicitud. Inténtalo de nuevo más tarde.";
  return "No se pudo completar la solicitud. Inténtalo de nuevo.";
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return response.json();

  const text = await response.text();
  if (response.ok && text) throw new Error("Respuesta de formato no válido");
  return text || null;
}

export async function request<T>(path: string, init?: RequestInit, baseUrl = "/api"): Promise<T> {
  const apiBaseUrl = baseUrl?.replace(/\/+$/, "");

  let response: Response;
  try {
    const headers = new Headers(init?.headers);
    for (const [name, value] of Object.entries(getAuthorizationHeader())) {
      headers.set(name, value);
    }
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(headers.entries()),
      },
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError(getApiErrorMessage(0), 0, null);
  }

  let body: unknown;
  try {
    body = await parseResponseBody(response);
  } catch {
    throw new ApiError("El servicio devolvió una respuesta no válida. Inténtalo de nuevo.", response.status, null);
  }

  if (!response.ok) {
    throw new ApiError(
      getApiErrorMessage(response.status),
      response.status,
      body
    );
  }

  return body as T;
}

function readDataField(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;
  const container = body as Record<string, unknown>;
  return container.data ?? body;
}

function asApiRecord(value: unknown): ApiRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError("El servicio devolvió datos de candidatura no válidos. Inténtalo de nuevo.", 502, null);
  }
  return value as ApiRecord;
}

function asApiNote(value: unknown): ApiNote {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError("El servicio devolvió datos de nota no válidos. Inténtalo de nuevo.", 502, null);
  }
  return value as ApiNote;
}

function mapStatusFromApi(value?: unknown): CandidateStatus {
  switch (typeof value === "string" ? value.toLowerCase() : undefined) {
    case "received":
    case "pending":
    case "applied":
    case "new":
      return "aplicado";
    case "in_progress":
    case "in-progress":
    case "interview":
    case "review":
      return "en-proceso";
    case "selected":
    case "hired":
    case "accepted":
    case "closed_won":
      return "contratado";
    case "discarded":
    case "rejected":
    case "closed_lost":
      return "rechazado";
    default:
      return "aplicado";
  }
}

function mapStatusToApi(value: CandidateStatus): string {
  switch (value) {
    case "aplicado": return "received";
    case "en-proceso": return "in_progress";
    case "contratado": return "selected";
    case "rechazado": return "discarded";
  }
}

function mapStageFromApi(value?: unknown): CandidateStage {
  switch (typeof value === "string" ? value.toLowerCase() : undefined) {
    case "pending": return "screening";
    case "screening": return "screening";
    case "review": return "revision";
    case "hr_interview":
    case "interview_rrhh":
    case "entrevista-rrhh":
    case "personal_interview": return "entrevista-rrhh";
    case "tech_interview":
    case "entrevista-tecnica":
    case "technical_interview": return "entrevista-tecnica";
    case "final_interview":
    case "entrevista-final": return "entrevista-final";
    case "offer":
    case "oferta":
    case "offer_presented": return "oferta";
    case "hired": return "hired";
    case "discarded":
    case "descartado": return "descartado";
    default: return "screening";
  }
}

function mapStageToApi(value: CandidateStage): string {
  switch (value) {
    case "screening": return "pending";
    case "revision": return "review";
    case "entrevista-rrhh": return "personal_interview";
    case "entrevista-tecnica": return "technical_interview";
    case "oferta": return "offer_presented";
    default: return "pending";
  }
}

function mapApiRecordToCandidate(record: ApiRecord | null | undefined): Candidate {
  return {
    id: record?.id ?? "unknown",
    nombre: typeof record?.full_name === "string" ? record.full_name : "Candidatura sin nombre",
    email: typeof record?.email === "string" ? record.email : "",
    telefono: typeof record?.phone === "string" ? record.phone : "",
    puesto: typeof record?.position === "string" ? record.position : "Sin puesto indicado",
    linkedinUrl: typeof record?.linkedin_url === "string" ? record.linkedin_url : "",
    cvUrl: typeof record?.cv_url === "string" ? record.cv_url : "",
    aniosExperiencia: Number(record?.experience_years ?? 0) || 0,
    estado: mapStatusFromApi(record?.status),
    etapa: mapStageFromApi(record?.stage),
    fechaAplicacion: typeof record?.applied_at === "string" ? record.applied_at : new Date().toISOString(),
  };
}

// RecordCreate no admite status, stage ni applied_at.
function mapCandidateInputToApi(payload: CreateCandidateInput | UpdateCandidateInput) {
  return {
    full_name: payload.nombre,
    email: payload.email,
    phone: payload.telefono,
    position: payload.puesto,
    linkedin_url: payload.linkedinUrl || null,
    cv_url: payload.cvUrl || null,
    experience_years: payload.aniosExperiencia,
  };
}

function mapApiNoteToNote(note: ApiNote | null | undefined, candidateId: string | number): Note {
  return {
    id: note?.id ?? "unknown",
    candidateId: note?.record_id ?? candidateId,
    texto: typeof note?.content === "string" ? note.content : "",
    createdAt: typeof note?.created_at === "string" ? note.created_at : new Date().toISOString(),
    updatedAt: note?.updated_at,
    createdBy: note?.created_by,
  };
}

export async function getCandidates(): Promise<Candidate[]> {
  const body = await request<unknown>("/records?page=1&limit=200");
  const data = readDataField(body);

  if (!Array.isArray(data)) {
    throw new ApiError("No se pudo interpretar el listado de candidaturas. Inténtalo de nuevo.", 502, null);
  }
  return data.map((record) => mapApiRecordToCandidate(asApiRecord(record)));
}

export async function getCandidateById(id: number | string): Promise<Candidate> {
  const body = await request<unknown>(`/records/${id}`);
  return mapApiRecordToCandidate(asApiRecord(readDataField(body)));
}

export async function createCandidate(payload: CreateCandidateInput): Promise<Candidate> {
  const body = await request<unknown>("/records", {
    method: "POST",
    body: JSON.stringify(mapCandidateInputToApi(payload)),
  });

  const created = mapApiRecordToCandidate(asApiRecord(readDataField(body)));
  return patchCandidate(created.id, {
    estado: payload.estado,
    etapa: payload.etapa,
  });
}

export async function updateCandidate(
  id: number | string,
  payload: UpdateCandidateInput
): Promise<Candidate> {
  const body = await request<unknown>(`/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(mapCandidateInputToApi(payload)),
  });

  asApiRecord(readDataField(body));
  return patchCandidate(id, {
    estado: payload.estado,
    etapa: payload.etapa,
  });
}

export async function patchCandidate(
  id: number | string,
  payload: PatchCandidateInput
): Promise<Candidate> {
  const body = await request<unknown>(`/records/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...(payload.estado ? { status: mapStatusToApi(payload.estado) } : {}),
      ...(payload.etapa ? { stage: mapStageToApi(payload.etapa) } : {}),
    }),
  });

  return mapApiRecordToCandidate(asApiRecord(readDataField(body)));
}

export async function getCandidateNotes(id: number | string): Promise<Note[]> {
  const body = await request<unknown>(`/records/${id}/notes`);
  const data = readDataField(body);

  if (!Array.isArray(data)) {
    throw new ApiError("No se pudo interpretar el listado de notas. Inténtalo de nuevo.", 502, null);
  }
  return data.map((note) => mapApiNoteToNote(asApiNote(note), id));
}

export async function addCandidateNote(
  id: number | string,
  payload: CreateNoteInput
): Promise<Note> {
  const body = await request<unknown>(`/records/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ content: payload.texto }),
  });

  return mapApiNoteToNote(asApiNote(readDataField(body)), id);
}

export async function deleteCandidateNote(
  id: number | string,
  noteId: number | string
): Promise<void> {
  await request<null>(`/records/${id}/notes/${noteId}`, {
    method: "DELETE",
  });
}
