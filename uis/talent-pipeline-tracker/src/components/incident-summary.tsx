"use client";

import { useEffect, useState } from "react";
import { getIncidentSummary, incidentErrorMessage } from "@/src/services/incidents";
import {
  INCIDENT_BRANCH_LABELS, INCIDENT_CATEGORY_LABELS, INCIDENT_ORIGIN_LABELS, INCIDENT_STATUS_LABELS,
  type IncidentSummary,
} from "@/src/types/incident";

type SummaryState =
  | { kind: "loading" | "slow" }
  | { kind: "ready"; data: IncidentSummary }
  | { kind: "error"; message: string };

const GROUPS = [
  { field: "by_status", title: "Por estado", labels: INCIDENT_STATUS_LABELS, color: "bg-teal-600" },
  { field: "by_category", title: "Por categoría", labels: INCIDENT_CATEGORY_LABELS, color: "bg-sky-600" },
  { field: "by_origin", title: "Por origen", labels: INCIDENT_ORIGIN_LABELS, color: "bg-rose-500" },
  { field: "by_branch", title: "Por sede", labels: INCIDENT_BRANCH_LABELS, color: "bg-amber-600" },
] as const;

const numberFormat = new Intl.NumberFormat("es-ES");

export function IncidentSummaryPanel() {
  const [state, setState] = useState<SummaryState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const slowTimer = window.setTimeout(() => setState({ kind: "slow" }), 5000);
    const timeout = window.setTimeout(() => {
      controller.abort();
      setState({ kind: "error", message: "La consulta de métricas ha tardado demasiado. Vuelve a intentarlo." });
    }, 20000);

    async function load() {
      try {
        const data = await getIncidentSummary(controller.signal);
        if (!controller.signal.aborted) setState({ kind: "ready", data });
      } catch (error) {
        if (!controller.signal.aborted) setState({ kind: "error", message: incidentErrorMessage(error) });
      } finally {
        window.clearTimeout(slowTimer);
        window.clearTimeout(timeout);
      }
    }
    void load();
    return () => {
      controller.abort();
      window.clearTimeout(slowTimer);
      window.clearTimeout(timeout);
    };
  }, [attempt]);

  function retry() {
    setState({ kind: "loading" });
    setAttempt((previous) => previous + 1);
  }

  const loading = state.kind === "loading" || state.kind === "slow";
  const data = state.kind === "ready" ? state.data : null;

  return (
    <section aria-labelledby="incident-summary-title" aria-busy={loading} className="mt-8 min-w-0 border-y border-slate-300 py-6">
      <header className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="incident-summary-title" className="text-xl font-semibold text-slate-900">Resumen de incidencias</h2>
        <p className="flex items-baseline gap-2 text-sm text-slate-600">
          Total <strong className="break-all text-2xl font-semibold tabular-nums text-slate-900">{data ? numberFormat.format(data.total) : "—"}</strong>
        </p>
      </header>

      <div className="mb-4 min-h-6 text-sm" aria-live="polite">
        {loading && <p role="status" className="flex items-center gap-2 text-slate-600">
          <span aria-hidden="true" className="size-4 shrink-0 rounded-full border-2 border-teal-200 border-t-teal-700 motion-safe:animate-spin" />
          {state.kind === "slow" ? "Las métricas están tardando más de lo habitual…" : "Cargando métricas…"}
        </p>}
        {data?.total === 0 && <p role="status" className="text-slate-600">Todavía no hay incidencias registradas.</p>}
      </div>

      {state.kind === "error" ? (
        <div className="border-l-4 border-red-500 bg-red-50 p-4">
          <p role="alert" className="text-sm text-red-800">No se pudo cargar el resumen. {state.message}</p>
          <button type="button" onClick={retry} className="mt-3 min-h-11 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">Reintentar métricas</button>
        </div>
      ) : (
        <div className="grid min-w-0 gap-x-8 gap-y-7 sm:grid-cols-2 xl:grid-cols-4">
          {GROUPS.map((group) => {
            const counts: Record<string, number> | null = data ? data[group.field] : null;
            return (
              <div key={group.field} className="min-w-0">
                <h3 className="mb-4 text-sm font-semibold text-slate-900">{group.title}</h3>
                <ul aria-label={group.title} className="space-y-3">
                  {Object.entries(group.labels).map(([key, label]) => {
                    const count = counts?.[key];
                    return (
                      <li key={key} className="min-w-0">
                        <div className="mb-1.5 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 text-sm">
                          <span className="break-words text-slate-600">{label}</span>
                          <span className="font-medium tabular-nums text-slate-900">{count === undefined ? "…" : numberFormat.format(count)}</span>
                        </div>
                        <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-sm bg-slate-200">
                          <div className={`h-full rounded-sm ${count === undefined ? "w-2/3 bg-slate-300 motion-safe:animate-pulse" : group.color}`}
                            style={count === undefined ? undefined : { width: `${data && data.total > 0 ? (count / data.total) * 100 : 0}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}