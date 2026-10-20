"use client";

import { useState } from "react";
import { createSupplier } from "@/src/services/api";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  COUNTRIES,
  CURRENCY_BY_COUNTRY,
  STATUSES,
  type Country,
  type Supplier,
  type SupplierCategory,
  type SupplierCreateInput,
  type SupplierStatus,
} from "@/src/types/supplier";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface FormState {
  name: string;
  country: Country | "";
  categories: SupplierCategory[];
  monthly_rate: string;
  status: SupplierStatus;
  contract_renewal_date: string;
  contact_email: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  country: "",
  categories: [],
  monthly_rate: "",
  status: "active",
  contract_renewal_date: "",
  contact_email: "",
  notes: "",
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) errors.name = "El nombre es obligatorio";
  if (!form.country) errors.country = "Selecciona un país";
  if (form.categories.length === 0) errors.categories = "Selecciona al menos una categoría";
  const rate = Number(form.monthly_rate);
  if (!form.monthly_rate.trim() || !Number.isFinite(rate) || rate <= 0) {
    errors.monthly_rate = "La tarifa debe ser un número mayor que 0";
  }
  if (form.contact_email && !EMAIL_PATTERN.test(form.contact_email)) {
    errors.contact_email = "Email no válido";
  }
  return errors;
}

interface Props {
  onCreated: (supplier: Supplier) => void;
  onCancel: () => void;
}

export function SupplierForm({ onCreated, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function toggleCategory(category: SupplierCategory) {
    setField(
      "categories",
      form.categories.includes(category)
        ? form.categories.filter((c) => c !== category)
        : [...form.categories, category]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    const fieldErrors = validate(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0 || !form.country) return;

    const input: SupplierCreateInput = {
      name: form.name.trim(),
      country: form.country,
      categories: form.categories,
      monthly_rate: Number(form.monthly_rate),
      currency: CURRENCY_BY_COUNTRY[form.country],
      status: form.status,
      ...(form.contract_renewal_date && { contract_renewal_date: form.contract_renewal_date }),
      ...(form.contact_email.trim() && { contact_email: form.contact_email.trim() }),
      ...(form.notes.trim() && { notes: form.notes.trim() }),
    };

    setSubmitting(true);
    try {
      onCreated(await createSupplier(input));
      setForm(EMPTY_FORM);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "No se pudo registrar el proveedor");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field: keyof FormState) =>
    `rounded-md border px-3 py-2 ${errors[field] ? "border-red-400" : "border-slate-300"}`;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-6"
    >
      <h2 className="text-lg font-semibold">Registrar proveedor</h2>

      {apiError && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <strong className="font-semibold">La API rechazó el registro: </strong>
          {apiError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Nombre *</span>
          <input
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            className={inputClass("name")}
          />
          {errors.name && <span className="text-xs text-red-600">{errors.name}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">País *</span>
          <select
            value={form.country}
            onChange={(e) => setField("country", e.target.value as Country | "")}
            className={inputClass("country")}
          >
            <option value="">Selecciona…</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          {errors.country && <span className="text-xs text-red-600">{errors.country}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">
            Tarifa mensual * {form.country && `(${CURRENCY_BY_COUNTRY[form.country]})`}
          </span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.monthly_rate}
            onChange={(e) => setField("monthly_rate", e.target.value)}
            className={inputClass("monthly_rate")}
          />
          {errors.monthly_rate && <span className="text-xs text-red-600">{errors.monthly_rate}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Estado *</span>
          <select
            value={form.status}
            onChange={(e) => setField("status", e.target.value as SupplierStatus)}
            className={inputClass("status")}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status === "active" ? "Activo" : "Suspendido"}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Email de contacto</span>
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => setField("contact_email", e.target.value)}
            className={inputClass("contact_email")}
          />
          {errors.contact_email && <span className="text-xs text-red-600">{errors.contact_email}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Renovación del contrato</span>
          <input
            type="date"
            value={form.contract_renewal_date}
            onChange={(e) => setField("contract_renewal_date", e.target.value)}
            className={inputClass("contract_renewal_date")}
          />
        </label>
      </div>

      <fieldset className="text-sm">
        <legend className="mb-2 font-medium">Categorías *</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category) => (
            <label key={category} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.categories.includes(category)}
                onChange={() => toggleCategory(category)}
              />
              {CATEGORY_LABELS[category]}
            </label>
          ))}
        </div>
        {errors.categories && <span className="mt-1 block text-xs text-red-600">{errors.categories}</span>}
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Notas</span>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          className={inputClass("notes")}
        />
      </label>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? "Guardando…" : "Registrar proveedor"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md px-4 py-2 text-sm text-slate-600 hover:text-slate-900">
          Cancelar
        </button>
      </div>
    </form>
  );
}
