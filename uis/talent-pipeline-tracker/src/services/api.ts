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
  phone: string;
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
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return await response.json();
  }

  const text = await response.text();
  return text || null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_API_URL environment variable");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
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

function mapStatusFromApi(value: string | undefined): CandidateStatus {
  if (!value) return "aplicado";

  const normalized = value.toLowerCase();

  if (["applied", "pending", "new"].includes(normalized)) return "aplicado";
  if (["in_progress", "in-progress", "interview", "review"].includes(normalized)) return "en-proceso";
  if (["hired", "accepted", "closed_won"].includes(normalized)) return "contratado";
  if (["rejected", "discarded", "closed_lost"].includes(normalized)) return "rechazado";

  return value;
}

function mapStatusToApi(value: CandidateStatus): string {
  if (value === "aplicado") return "pending";
  if (value === "en-proceso") return "in_progress";
  if (value === "contratado") return "hired";
  if (value === "rechazado") return "rejected";
  return value;
}

function mapStageFromApi(value: string | undefined): CandidateStage {
  if (!value) return "screening";

  const normalized = value.toLowerCase();

  if (["review", "screening"].includes(normalized)) return "screening";
  if (["hr_interview", "interview_rrhh", "entrevista-rrhh"].includes(normalized)) return "entrevista-rrhh";
  if (["tech_interview", "entrevista-tecnica"].includes(normalized)) return "entrevista-tecnica";
  if (["final_interview", "entrevista-final"].includes(normalized)) return "entrevista-final";
  if (["offer", "oferta"].includes(normalized)) return "oferta";
  if (["hired"].includes(normalized)) return "hired";
  if (["discarded", "descartado"].includes(normalized)) return "descartado";

  return value;
}

function mapStageToApi(value: CandidateStage): string {
  if (value === "entrevista-rrhh") return "hr_interview";
  if (value === "entrevista-tecnica") return "tech_interview";
  if (value === "entrevista-final") return "final_interview";
  if (value === "oferta") return "offer";
  if (value === "descartado") return "discarded";
  return value;
}

function mapApiRecordToCandidate(record: ApiRecord): Candidate {
  return {
    id: record.id,
    nombre: record.full_name,
    email: record.email,
    telefono: record.phone,
    puesto: record.position,
    linkedinUrl: record.linkedin_url ?? "",
    cvUrl: record.cv_url ?? "",
    aniosExperiencia: Number(record.experience_years ?? 0),
    estado: mapStatusFromApi(record.status),
    etapa: mapStageFromApi(record.stage),
    fechaAplicacion: record.applied_at ?? new Date().toISOString(),
  };
}

function mapCandidateInputToApi(payload: CreateCandidateInput | UpdateCandidateInput) {
  return {
    full_name: payload.nombre,
    email: payload.email,
    phone: payload.telefono,
    position: payload.puesto,
    linkedin_url: payload.linkedinUrl,
    cv_url: payload.cvUrl,
    experience_years: payload.aniosExperiencia,
    status: mapStatusToApi(payload.estado),
    stage: mapStageToApi(payload.etapa),
    applied_at: payload.fechaAplicacion,
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
  const body = await request<unknown>("/records", { method: "GET" });
  const data = readDataField(body);

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((record) => mapApiRecordToCandidate(record as ApiRecord));
}

export async function getCandidateById(id: number | string): Promise<Candidate> {
  const body = await request<unknown>(`/records/${id}`, { method: "GET" });
  const data = readDataField(body) as ApiRecord;
  return mapApiRecordToCandidate(data);
}

export async function createCandidate(
  payload: CreateCandidateInput
): Promise<Candidate> {
  const body = await request<unknown>("/records", {
    method: "POST",
    body: JSON.stringify(mapCandidateInputToApi(payload)),
  });

  const data = readDataField(body) as ApiRecord;
  return mapApiRecordToCandidate(data);
}

export async function updateCandidate(
  id: number | string,
  payload: UpdateCandidateInput
): Promise<Candidate> {
  const body = await request<unknown>(`/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(mapCandidateInputToApi(payload)),
  });

  const data = readDataField(body) as ApiRecord;
  return mapApiRecordToCandidate(data);
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

  const data = readDataField(body) as ApiRecord;
  return mapApiRecordToCandidate(data);
}

export async function getCandidateNotes(id: number | string): Promise<Note[]> {
  const body = await request<unknown>(`/records/${id}/notes`, { method: "GET" });
  const data = readDataField(body);

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((note) => mapApiNoteToNote(note as ApiNote, id));
}

export async function addCandidateNote(
  id: number | string,
  payload: CreateNoteInput
): Promise<Note> {
  const body = await request<unknown>(`/records/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ content: payload.texto, created_by: payload.createdBy }),
  });

  const data = readDataField(body) as ApiNote;
  return mapApiNoteToNote(data, id);
}

export async function deleteCandidateNote(
  id: number | string,
  noteId: number | string
): Promise<void> {
  await request<null>(`/records/${id}/notes/${noteId}`, { method: "DELETE" });
}
