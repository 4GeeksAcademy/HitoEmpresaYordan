export const INCIDENT_STATUS_LABELS = {
  open: "Abierta",
  in_progress: "En curso",
  resolved: "Resuelta",
  discarded: "Descartada",
} as const;

export const INCIDENT_CATEGORY_LABELS = {
  technical_failure: "Fallo técnico",
  process_error: "Error de proceso",
  client_complaint: "Queja de cliente",
  candidate_issue: "Problema de candidato",
  staff_issue: "Incidencia de personal",
  sla_breach: "Incumplimiento de SLA",
  data_quality: "Calidad de datos",
  other: "Otra",
} as const;

export const INCIDENT_ORIGIN_LABELS = {
  customer: "Cliente corporativo",
  branch: "Personal de oficina",
  internal: "Interno",
} as const;

export const INCIDENT_BRANCH_LABELS = {
  central: "Central — Sede Valencia",
  valencia_operations: "Valencia — Operaciones",
  miami_office: "Miami Office",
  remote: "Remoto (empleado sin sede fija)",
} as const;

export type IncidentStatus = keyof typeof INCIDENT_STATUS_LABELS;
export type IncidentCategory = keyof typeof INCIDENT_CATEGORY_LABELS;
export type IncidentOrigin = keyof typeof INCIDENT_ORIGIN_LABELS;
export type IncidentBranch = keyof typeof INCIDENT_BRANCH_LABELS;

export const INCIDENT_TRANSITIONS: Record<IncidentStatus, readonly IncidentStatus[]> = {
  open: ["in_progress", "discarded"],
  in_progress: ["resolved", "discarded"],
  resolved: [],
  discarded: [],
};

export interface IncidentInput {
  title: string;
  description: string;
  category: IncidentCategory;
  status: IncidentStatus;
  origin: IncidentOrigin;
  branch: IncidentBranch;
}

export interface Incident extends IncidentInput {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface IncidentSummary {
  total: number;
  by_status: Record<IncidentStatus, number>;
  by_category: Record<IncidentCategory, number>;
  by_origin: Record<IncidentOrigin, number>;
  by_branch: Record<IncidentBranch, number>;
}

export type IncidentFilters = Partial<Pick<IncidentInput, "status" | "origin" | "branch" | "category">>;
export type IncidentFieldErrors = Partial<Record<keyof IncidentInput, string>>;