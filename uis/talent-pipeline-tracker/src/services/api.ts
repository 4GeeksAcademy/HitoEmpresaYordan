import type {
  Candidate,
  CandidateStage,
  CandidateStatus,
  CreateCandidateInput,
  CreateNoteInput,
  Note,
  PatchCandidateInput,
  UpdateCandidateInput,
} from "@/src/types";

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

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return response.json();

  const text = await response.text();
  return text || null;
}

export async function request<T>(path: string, init?: RequestInit, baseUrl = process.env.NEXT_PUBLIC_API_URL): Promise<T> {
  const apiBaseUrl = baseUrl?.replace(/\/+$/, "");

  if (!apiBaseUrl) {
    throw new Error("Falta configurar NEXT_PUBLIC_API_URL");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...Object.fromEntries(new Headers(init?.headers).entries()),
    },
    cache: "no-store",
  });

  const body = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(
      `Error en la API: ${response.status}`,
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

function mapStatusFromApi(value?: string): CandidateStatus {
  switch (value?.toLowerCase()) {
    case "received":
    case "pending":
      return "aplicado";
    case "in_progress":
      return "en-proceso";
    case "selected":
      return "contratado";
    case "discarded":
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

function mapStageFromApi(value?: string): CandidateStage {
  switch (value?.toLowerCase()) {
    case "pending": return "screening";
    case "review": return "revision";
    case "personal_interview": return "entrevista-rrhh";
    case "technical_interview": return "entrevista-tecnica";
    case "offer_presented": return "oferta";
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

function mapApiRecordToCandidate(record: ApiRecord): Candidate {
  return {
    id: record.id,
    nombre: record.full_name,
    email: record.email,
    telefono: record.phone ?? "",
    puesto: record.position,
    linkedinUrl: record.linkedin_url ?? "",
    cvUrl: record.cv_url ?? "",
    aniosExperiencia: Number(record.experience_years ?? 0),
    estado: mapStatusFromApi(record.status),
    etapa: mapStageFromApi(record.stage),
    fechaAplicacion: record.applied_at ?? new Date().toISOString(),
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

function mapApiNoteToNote(note: ApiNote, candidateId: string | number): Note {
  return {
    id: note.id,
    candidateId: note.record_id ?? candidateId,
    texto: note.content,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
    createdBy: note.created_by,
  };
}

export async function getCandidates(): Promise<Candidate[]> {
  const body = await request<unknown>("/records?page=1&limit=200");
  const data = readDataField(body);

  if (!Array.isArray(data)) return [];
  return data.map((record) => mapApiRecordToCandidate(record as ApiRecord));
}

export async function getCandidateById(id: number | string): Promise<Candidate> {
  const body = await request<unknown>(`/records/${id}`);
  return mapApiRecordToCandidate(readDataField(body) as ApiRecord);
}

export async function createCandidate(payload: CreateCandidateInput): Promise<Candidate> {
  const body = await request<unknown>("/records", {
    method: "POST",
    body: JSON.stringify(mapCandidateInputToApi(payload)),
  });

  const created = mapApiRecordToCandidate(readDataField(body) as ApiRecord);
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

  const updated = mapApiRecordToCandidate(readDataField(body) as ApiRecord);
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

  return mapApiRecordToCandidate(readDataField(body) as ApiRecord);
}

export async function getCandidateNotes(id: number | string): Promise<Note[]> {
  const body = await request<unknown>(`/records/${id}/notes`);
  const data = readDataField(body);

  if (!Array.isArray(data)) return [];
  return data.map((note) => mapApiNoteToNote(note as ApiNote, id));
}

export async function addCandidateNote(
  id: number | string,
  payload: CreateNoteInput
): Promise<Note> {
  const body = await request<unknown>(`/records/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ content: payload.texto }),
  });

  return mapApiNoteToNote(readDataField(body) as ApiNote, id);
}

export async function deleteCandidateNote(
  id: number | string,
  noteId: number | string
): Promise<void> {
  await request<null>(`/records/${id}/notes/${noteId}`, {
    method: "DELETE",
  });
}
