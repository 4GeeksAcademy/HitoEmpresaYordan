"use client";

import { useState, type FormEvent } from "react";
import { createIncident, incidentErrorMessage, incidentFieldErrors } from "@/src/services/incidents";
import {
  INCIDENT_BRANCH_LABELS, INCIDENT_CATEGORY_LABELS, INCIDENT_ORIGIN_LABELS, INCIDENT_STATUS_LABELS,
  INCIDENT_CATEGORY_DESCRIPTIONS, INCIDENT_ORIGIN_DESCRIPTIONS, INCIDENT_STATUS_DESCRIPTIONS,
  type Incident, type IncidentFieldErrors, type IncidentInput,
} from "@/src/types/incident";

type Draft = Record<keyof IncidentInput, string>;
const EMPTY_FORM: Draft = { title: "", description: "", category: "", origin: "", branch: "central", status: "open" };
const SELECTS = {
  category: { label: "Categoría", options: INCIDENT_CATEGORY_LABELS, descriptions: INCIDENT_CATEGORY_DESCRIPTIONS },
  origin: { label: "Origen", options: INCIDENT_ORIGIN_LABELS, descriptions: INCIDENT_ORIGIN_DESCRIPTIONS },
  branch: { label: "Sede", options: INCIDENT_BRANCH_LABELS, descriptions: {} },
  status: { label: "Estado", options: INCIDENT_STATUS_LABELS, descriptions: INCIDENT_STATUS_DESCRIPTIONS },
};

function validate(form: Draft): IncidentFieldErrors {
  const errors: IncidentFieldErrors = {};
  if (!form.title.trim()) errors.title = "El título es obligatorio.";
  else if (form.title.length > 120) errors.title = "El título no puede superar los 120 caracteres.";
  if (!form.description.trim()) errors.description = "La descripción es obligatoria.";
  for (const [field, { label, options }] of Object.entries(SELECTS)) {
    if (!Object.hasOwn(options, form[field as keyof Draft])) {
      errors[field as keyof IncidentInput] = `Selecciona un valor válido para ${label.toLowerCase()}.`;
    }
  }
  return errors;
}

export function IncidentForm() {
  const [form, setForm] = useState<Draft>(EMPTY_FORM);
  const [errors, setErrors] = useState<IncidentFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [created, setCreated] = useState<Incident | null>(null);

  function setField(field: keyof Draft, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setCreated(null);
    setApiError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setCreated(null);
    setApiError(null);
    const invalid = validate(form);
    setErrors(invalid);
    if (Object.keys(invalid).length) return;
    setSubmitting(true);
    try {
      const saved = await createIncident({ ...form, title: form.title.trim() } as IncidentInput);
      setCreated(saved);
      setForm(EMPTY_FORM);
      setErrors({});
    } catch (error) {
      setErrors(incidentFieldErrors(error));
      setApiError(incidentErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  const controlClass = (field: keyof Draft) =>
    `w-full min-w-0 rounded-md border bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-2 focus:outline-offset-2 focus:outline-teal-700 ${errors[field] ? "border-red-500" : "border-slate-300"}`;

  return (
    <form onSubmit={submit} noValidate aria-busy={submitting} className="max-w-3xl space-y-6">
      <div aria-live="polite" role="status">
        {created && <p className="rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">Incidencia #{created.id} registrada correctamente.</p>}
      </div>
      {apiError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{apiError}</p>}
      {Object.values(errors).some(Boolean) && <p role="alert" className="text-sm text-red-800">Revisa los campos marcados antes de guardar.</p>}

      <fieldset disabled={submitting} className="space-y-5 disabled:opacity-70">
        <legend className="sr-only">Datos de la incidencia</legend>
        <div>
          <label htmlFor="incident-title" className="mb-1.5 block text-sm font-medium">Título *</label>
          <input id="incident-title" name="title" required maxLength={120} value={form.title}
            onChange={(event) => setField("title", event.target.value)} className={controlClass("title")}
            aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "incident-title-error" : undefined} />
          {errors.title && <p id="incident-title-error" className="mt-1 text-sm text-red-700">{errors.title}</p>}
        </div>
        <div>
          <label htmlFor="incident-description" className="mb-1.5 block text-sm font-medium">Descripción *</label>
          <textarea id="incident-description" name="description" required rows={5} value={form.description}
            onChange={(event) => setField("description", event.target.value)} className={controlClass("description")}
            aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "incident-description-error" : undefined} />
          {errors.description && <p id="incident-description-error" className="mt-1 text-sm text-red-700">{errors.description}</p>}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {(Object.keys(SELECTS) as (keyof typeof SELECTS)[]).map((field) => {
            const { label, options } = SELECTS[field];
            const descriptions: Record<string, string> = SELECTS[field].descriptions;
            const description = descriptions[form[field]];
            const highlighted = field === "branch" && form.origin === "branch";
            return (
              <div key={field} className={highlighted ? "rounded-md bg-teal-50 p-3 ring-2 ring-teal-600" : ""}>
                <label htmlFor={`incident-${field}`} className={`mb-1.5 block text-sm font-medium ${highlighted ? "text-teal-900" : ""}`}>{label} *</label>
                <select id={`incident-${field}`} name={field} required value={form[field]}
                  onChange={(event) => setField(field, event.target.value)} className={controlClass(field)}
                  aria-invalid={Boolean(errors[field])}
                  aria-describedby={[
                    errors[field] ? `incident-${field}-error` : "",
                    description ? `incident-${field}-description` : "",
                  ].filter(Boolean).join(" ") || undefined}>
                  <option value="">Selecciona…</option>
                  {Object.entries(options).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
                </select>
                {description && <p id={`incident-${field}-description`} className="mt-2 break-words text-xs text-slate-600">{description}</p>}
                {errors[field] && <p id={`incident-${field}-error`} className="mt-1 text-sm text-red-700">{errors[field]}</p>}
              </div>
            );
          })}
        </div>
      </fieldset>

      <dl className="grid gap-4 border-y border-slate-200 py-4 text-sm sm:grid-cols-3">
        <div><dt className="text-slate-500">ID</dt><dd className="mt-1 font-medium">{created ? `#${created.id}` : "Pendiente"}</dd></div>
        <div><dt className="text-slate-500">Creación</dt><dd className="mt-1">{created ? new Date(created.created_at).toLocaleString("es-ES") : "Pendiente"}</dd></div>
        <div><dt className="text-slate-500">Última actualización</dt><dd className="mt-1">{created ? new Date(created.updated_at).toLocaleString("es-ES") : "Pendiente"}</dd></div>
      </dl>
      <button type="submit" disabled={submitting} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-wait disabled:opacity-60">
        {submitting && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {submitting ? "Guardando…" : "Registrar incidencia"}
      </button>
    </form>
  );
}