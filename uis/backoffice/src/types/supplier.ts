export const COUNTRIES = ["Spain", "USA"] as const;
export type Country = (typeof COUNTRIES)[number];

export const CURRENCY_BY_COUNTRY: Record<Country, Currency> = {
  Spain: "EUR",
  USA: "USD",
};
export type Currency = "EUR" | "USD";

export const STATUSES = ["active", "suspended"] as const;
export type SupplierStatus = (typeof STATUSES)[number];

export const CATEGORIES = [
  "job_boards",
  "ats_software",
  "assessment_tools",
  "training_platforms",
  "payroll_and_hr_software",
  "video_interview",
  "background_check",
  "office_and_facilities",
  "it_and_software_licenses",
] as const;
export type SupplierCategory = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<SupplierCategory, string> = {
  job_boards: "Portales de empleo",
  ats_software: "Software ATS",
  assessment_tools: "Evaluación",
  training_platforms: "Formación",
  payroll_and_hr_software: "Nóminas y RR. HH.",
  video_interview: "Videoentrevista",
  background_check: "Verificación de antecedentes",
  office_and_facilities: "Oficinas e instalaciones",
  it_and_software_licenses: "Licencias IT y software",
};

export interface Supplier {
  id: number;
  name: string;
  country: Country;
  categories: SupplierCategory[];
  monthly_rate: number;
  currency: Currency;
  status: SupplierStatus;
  contract_renewal_date: string | null;
  contact_email: string | null;
  notes: string | null;
  updated_at: string;
}

export interface SupplierCreateInput {
  name: string;
  country: Country;
  categories: SupplierCategory[];
  monthly_rate: number;
  currency: Currency;
  status: SupplierStatus;
  contract_renewal_date?: string;
  contact_email?: string;
  notes?: string;
}

export interface SupplierFilters {
  country?: Country;
  category?: SupplierCategory;
}
