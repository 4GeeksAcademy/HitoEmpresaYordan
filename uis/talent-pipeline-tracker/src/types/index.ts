export type CandidateStatus = "aplicado" | "en-proceso" | "contratado" | "rechazado";

export type CandidateStage =
  | "screening"
  | "entrevista-rrhh"
  | "entrevista-tecnica"
  | "entrevista-final"
  | "oferta"
  | "hired"
  | "descartado";

export interface Candidate {
  id: string | number;
  nombre: string;
  email: string;
  telefono: string;
  puesto: string;
  linkedinUrl: string;
  cvUrl: string;
  aniosExperiencia: number;
  estado: CandidateStatus;
  etapa: CandidateStage;
  fechaAplicacion: string;
}

export type CreateCandidateInput = Omit<Candidate, "id">;

export type UpdateCandidateInput = CreateCandidateInput;

export interface PatchCandidateInput {
  estado?: CandidateStatus;
  etapa?: CandidateStage;
}

export interface Note {
  id: string | number;
  candidateId: string | number;
  texto: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface CreateNoteInput {
  texto: string;
  createdBy?: string;
}
