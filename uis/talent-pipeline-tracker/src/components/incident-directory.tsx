"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { incidentErrorMessage, listIncidents, updateIncidentStatus } from "@/src/services/incidents";
import {
  INCIDENT_BRANCH_LABELS, INCIDENT_CATEGORY_LABELS, INCIDENT_ORIGIN_LABELS, INCIDENT_STATUS_LABELS, INCIDENT_TRANSITIONS,
  INCIDENT_CATEGORY_DESCRIPTIONS, INCIDENT_ORIGIN_DESCRIPTIONS, INCIDENT_STATUS_DESCRIPTIONS,
  type Incident, type IncidentFilters, type IncidentStatus,
} from "@/src/types/incident";

const FILTERS = {
  status: { label: "Estado", options: INCIDENT_STATUS_LABELS },
  origin: { label: "Origen", options: INCIDENT_ORIGIN_LABELS },
  branch: { label: "Sede", options: INCIDENT_BRANCH_LABELS },
  category: { label: "Categoría", options: INCIDENT_CATEGORY_LABELS },
};

interface DirectoryState {
  records: Incident[];
  loading: boolean;
  error: string | null;
}

export function IncidentDirectory() {
  const [filters, setFilters] = useState<IncidentFilters>({});
  const [reload, setReload] = useState(0);
  const [view, setView] = useState<DirectoryState>({ records: [], loading: true, error: null });
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [mutationErrors, setMutationErrors] = useState<Record<number, string>>({});
  const inFlight = useRef(new Set<number>());

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const records = await listIncidents(filters, controller.signal);
        if (!controller.signal.aborted) setView({ records, loading: false, error: null });
      } catch (error) {
        if (!controller.signal.aborted) setView({ records: [], loading: false, error: incidentErrorMessage(error) });
      }
    }
    void load();
    return () => controller.abort();
  }, [filters, reload]);

  function filterChanged(field: keyof IncidentFilters, value: string) {
    setView((previous) => ({ ...previous, loading: true, error: null }));
    setMutationErrors({});
    setFilters((previous) => ({ ...previous, [field]: value || undefined }));
  }

  function retry() {
    setView((previous) => ({ ...previous, loading: true, error: null }));
    setReload((previous) => previous + 1);
  }

  async function changeStatus(incident: Incident, target: IncidentStatus) {
    if (inFlight.current.has(incident.id) || !INCIDENT_TRANSITIONS[incident.status].includes(target)) return;
    inFlight.current.add(incident.id);
    setPending(new Set(inFlight.current));
    setMutationErrors((previous) => ({ ...previous, [incident.id]: "" }));
    setView((previous) => ({
      ...previous,
      records: previous.records.map((record) => record.id === incident.id ? { ...record, status: target } : record),
    }));
    try {
      const updated = await updateIncidentStatus(incident.id, target);
      const matches = Object.entries(filters).every(([field, value]) => !value || updated[field as keyof IncidentFilters] === value);
      setView((previous) => ({
        ...previous,
        records: previous.records.flatMap((record) => record.id === incident.id ? matches ? [updated] : [] : [record]),
      }));
    } catch (error) {
      setView((previous) => ({
        ...previous,
        records: previous.records.map((record) => record.id === incident.id ? incident : record),
      }));
      setMutationErrors((previous) => ({
        ...previous,
        [incident.id]: `No se guardó el cambio. Se ha restaurado el estado anterior. ${incidentErrorMessage(error)}`,
      }));
    } finally {
      inFlight.current.delete(incident.id);
      setPending(new Set(inFlight.current));
    }
  }

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Incidencias</h1>
        <Link href="/incidents/new" className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">Registrar incidencia</Link>
      </header>

      <fieldset disabled={pending.size > 0} className="mb-6 grid gap-4 border-y border-slate-200 py-5 sm:grid-cols-2 lg:grid-cols-4 disabled:opacity-70">
        <legend className="sr-only">Filtros de incidencias</legend>
        {(Object.keys(FILTERS) as (keyof IncidentFilters)[]).map((field) => {
          const { label, options } = FILTERS[field];
          return (
            <label key={field} htmlFor={`filter-${field}`} className="min-w-0 text-sm font-medium">
              {label}
              <select id={`filter-${field}`} value={filters[field] ?? ""} onChange={(event) => filterChanged(field, event.target.value)}
                className="mt-1.5 block min-h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-2 text-sm focus:outline-2 focus:outline-teal-700">
                <option value="">Todos</option>
                {Object.entries(options).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
              </select>
            </label>
          );
        })}
      </fieldset>

      <div aria-busy={view.loading}>
        {view.loading ? (
          <p role="status" className="flex items-center gap-3 py-12 text-sm text-slate-600">
            <span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-teal-200 border-t-teal-700" />
            Cargando incidencias…
          </p>
        ) : view.error ? (
          <div className="border-l-4 border-red-500 bg-red-50 p-4">
            <p role="alert" className="text-sm text-red-800">{view.error}</p>
            <button type="button" onClick={retry} className="mt-3 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-800">Reintentar</button>
          </div>
        ) : view.records.length === 0 ? (
          <p role="status" className="py-12 text-sm text-slate-600">
            {Object.values(filters).some(Boolean) ? "No hay incidencias que coincidan con los filtros." : "Todavía no hay incidencias registradas."}
          </p>
        ) : (
          <>
            <p role="status" className="mb-2 text-sm text-slate-600">{view.records.length} {view.records.length === 1 ? "incidencia" : "incidencias"}</p>
            <ul aria-label="Listado de incidencias" className="divide-y divide-slate-200">
              {view.records.map((incident) => {
                const saving = pending.has(incident.id);
                const transitions = INCIDENT_TRANSITIONS[incident.status];
                return (
                  <li key={incident.id} aria-busy={saving} className="grid min-w-0 gap-4 py-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_13rem]">
                    <div className="min-w-0">
                      <p className="mb-1 break-words text-xs font-medium text-slate-500">#{incident.id} · <span title={INCIDENT_CATEGORY_DESCRIPTIONS[incident.category]}>{INCIDENT_CATEGORY_LABELS[incident.category]}</span></p>
                      <h2 className="break-words text-base font-semibold [overflow-wrap:anywhere]">{incident.title}</h2>
                      <details className="mt-2 text-sm text-slate-600">
                        <summary className="w-fit cursor-pointer font-medium text-teal-800">Descripción</summary>
                        <p className="mt-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{incident.description}</p>
                      </details>
                    </div>
                    <dl className="min-w-0 space-y-2 text-sm">
                      <div><dt className="text-xs text-slate-500">Origen · Sede</dt><dd className="break-words"><span title={INCIDENT_ORIGIN_DESCRIPTIONS[incident.origin]}>{INCIDENT_ORIGIN_LABELS[incident.origin]}</span> · {INCIDENT_BRANCH_LABELS[incident.branch]}</dd></div>
                      <div><dt className="text-xs text-slate-500">Creación</dt><dd>{new Date(incident.created_at).toLocaleString("es-ES")}</dd></div>
                      <div><dt className="text-xs text-slate-500">Última actualización</dt><dd>{new Date(incident.updated_at).toLocaleString("es-ES")}</dd></div>
                    </dl>
                    <div className="min-w-0">
                      <label htmlFor={`status-${incident.id}`} className="mb-1.5 block text-sm font-medium">Estado</label>
                      <select id={`status-${incident.id}`} aria-label={`Estado de la incidencia ${incident.id}`}
                        title={INCIDENT_STATUS_DESCRIPTIONS[incident.status]}
                        value={incident.status} disabled={saving || transitions.length === 0}
                        aria-describedby={mutationErrors[incident.id] ? `status-error-${incident.id}` : undefined}
                        onChange={(event) => void changeStatus(incident, event.target.value as IncidentStatus)}
                        className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-teal-700 disabled:bg-slate-100 disabled:text-slate-600">
                        <option value={incident.status}>{INCIDENT_STATUS_LABELS[incident.status]}</option>
                        {transitions.map((status) => <option key={status} value={status}>{INCIDENT_STATUS_LABELS[status]}</option>)}
                      </select>
                      <p className="mt-2 break-words text-xs text-slate-600">{INCIDENT_STATUS_DESCRIPTIONS[incident.status]}</p>
                      {saving && <p role="status" className="mt-2 text-sm text-teal-800">Guardando…</p>}
                      {!saving && transitions.length === 0 && <p className="mt-2 text-xs text-slate-500">Estado final</p>}
                    </div>
                    {mutationErrors[incident.id] && <p id={`status-error-${incident.id}`} role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800 lg:col-span-3">{mutationErrors[incident.id]}</p>}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </>
  );
}