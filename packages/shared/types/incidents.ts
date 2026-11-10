import catalog from "../src/nexova_shared/incident_catalog.json";

function codeLabels<Catalog extends Record<string, string>>(values: Catalog) {
  return Object.fromEntries(Object.keys(values).map((code) => [code, code])) as { [Key in keyof Catalog]: Key };
}

export const INCIDENT_STATUS_DESCRIPTIONS = catalog.statuses;
export const INCIDENT_CATEGORY_DESCRIPTIONS = catalog.categories;
export const INCIDENT_ORIGIN_DESCRIPTIONS = catalog.origins;
export const INCIDENT_BRANCH_LABELS = catalog.branches;
export const INCIDENT_STATUS_LABELS = codeLabels(INCIDENT_STATUS_DESCRIPTIONS);
export const INCIDENT_CATEGORY_LABELS = codeLabels(INCIDENT_CATEGORY_DESCRIPTIONS);
export const INCIDENT_ORIGIN_LABELS = codeLabels(INCIDENT_ORIGIN_DESCRIPTIONS);
export const INCIDENT_EXPECTED_SEED = catalog.seed;

export type IncidentStatus = keyof typeof INCIDENT_STATUS_LABELS;
export type IncidentCategory = keyof typeof INCIDENT_CATEGORY_LABELS;
export type IncidentOrigin = keyof typeof INCIDENT_ORIGIN_LABELS;
export type IncidentBranch = keyof typeof INCIDENT_BRANCH_LABELS;

export const INCIDENT_TRANSITIONS = catalog.transitions as Record<IncidentStatus, readonly IncidentStatus[]>;

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

function completeCounts<Key extends string>(labels: Record<Key, string>, counts: Partial<Record<Key, number>>) {
  return Object.fromEntries(Object.keys(labels).map((key) => [key, counts[key as Key] ?? 0])) as Record<Key, number>;
}

export const INCIDENT_BRIEFING_SUMMARY: IncidentSummary = {
  total: INCIDENT_EXPECTED_SEED.expected_total,
  by_status: completeCounts(INCIDENT_STATUS_LABELS, INCIDENT_EXPECTED_SEED.expected_by_status),
  by_category: completeCounts(INCIDENT_CATEGORY_LABELS, INCIDENT_EXPECTED_SEED.expected_by_category),
  by_origin: completeCounts(INCIDENT_ORIGIN_LABELS, {
    [INCIDENT_EXPECTED_SEED.origin]: INCIDENT_EXPECTED_SEED.expected_total,
  }),
  by_branch: completeCounts(INCIDENT_BRANCH_LABELS, {
    [INCIDENT_EXPECTED_SEED.branch]: INCIDENT_EXPECTED_SEED.expected_total,
  }),
};

export type IncidentFilters = Partial<Pick<IncidentInput, "status" | "origin" | "branch" | "category">>;
export type IncidentFieldErrors = Partial<Record<keyof IncidentInput, string>>;