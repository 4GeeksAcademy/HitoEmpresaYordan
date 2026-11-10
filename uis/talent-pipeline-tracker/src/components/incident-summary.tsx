"use client";

import { useEffect, useState } from "react";
import { getIncidentSummary, incidentErrorMessage } from "@/src/services/incidents";
import {
  INCIDENT_BRANCH_LABELS, INCIDENT_CATEGORY_LABELS, INCIDENT_ORIGIN_LABELS, INCIDENT_STATUS_LABELS,
  INCIDENT_CATEGORY_DESCRIPTIONS, INCIDENT_ORIGIN_DESCRIPTIONS, INCIDENT_STATUS_DESCRIPTIONS,
  INCIDENT_BRIEFING_SUMMARY,
  type IncidentSummary,
} from "@/src/types/incident";

type SummaryState =
  | { kind: "loading" | "slow" }
  | { kind: "ready"; data: IncidentSummary }
  | { kind: "error"; message: string };

const GROUPS = [
  { field: "by_status", title: "Por estado", labels: INCIDENT_STATUS_LABELS, descriptions: INCIDENT_STATUS_DESCRIPTIONS, color: "bg-teal-600" },
  { field: "by_category", title: "Por categoría", labels: INCIDENT_CATEGORY_LABELS, descriptions: INCIDENT_CATEGORY_DESCRIPTIONS, color: "bg-sky-600" },
  { field: "by_origin", title: "Por origen", labels: INCIDENT_ORIGIN_LABELS, descriptions: INCIDENT_ORIGIN_DESCRIPTIONS, color: "bg-rose-500" },
  { field: "by_branch", title: "Por sede", labels: INCIDENT_BRANCH_LABELS, descriptions: INCIDENT_BRANCH_LABELS, color: "bg-amber-600" },
] as const;

const numberFormat = new Intl.NumberFormat("es-ES");

export function IncidentSummaryPanel() {
  const [state, setState] = useState<SummaryState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [source, setSource] = useState<"auto" | "api" | "briefing">("auto");

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

  const actual = state.kind === "ready" ? state.data : null;
  const showingBriefing = source === "briefing" || (source === "auto" && (!actual || actual.total === 0));
  const loading = !showingBriefing && (state.kind === "loading" || state.kind === "slow");
  const data = showingBriefing ? INCIDENT_BRIEFING_SUMMARY : actual;

  return (
    <section aria-labelledby="incident-summary-title" aria-busy={loading} className="mt-8 min-w-0 border-y border-slate-300 py-6">
      <header className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="incident-summary-title" className="text-xl font-semibold text-slate-900">Resumen de incidencias</h2>
        <p className="flex items-baseline gap-2 text-sm text-slate-600">
          Total <strong className="break-all text-2xl font-semibold tabular-nums text-slate-900">{data ? numberFormat.format(data.total) : "—"}</strong>
        </p>
      </header>

      <fieldset className="mb-4 flex flex-wrap gap-4 text-sm">
        <legend className="sr-only">Fuente de métricas</legend>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2">
          <input type="radio" name="incident-summary-source" checked={showingBriefing} onChange={() => setSource("briefing")} />
          Referencia del briefing
        </label>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2">
          <input type="radio" name="incident-summary-source" checked={!showingBriefing} onChange={() => setSource("api")} />
          Registros reales
        </label>
      </fieldset>

      {showingBriefing && <p className="mb-4 border-l-4 border-amber-500 bg-amber-50 p-3 text-sm text-amber-950">
        Fuente: company-BRIEFIING. {numberFormat.format(INCIDENT_BRIEFING_SUMMARY.total)} incidencias esperadas tras el seed; no son registros importados.
        {actual && <span className="mt-1 block">Incidencias guardadas actualmente: {numberFormat.format(actual.total)}.</span>}
      </p>}

      <div className="mb-4 min-h-6 text-sm" aria-live="polite">
        {(state.kind === "loading" || state.kind === "slow") && <p role="status" className="flex items-center gap-2 text-slate-600">
          <span aria-hidden="true" className="size-4 shrink-0 rounded-full border-2 border-teal-200 border-t-teal-700 motion-safe:animate-spin" />
          {state.kind === "slow" ? "Las métricas están tardando más de lo habitual…" : "Cargando métricas…"}
        </p>}
        {data?.total === 0 && <p role="status" className="text-slate-600">Todavía no hay incidencias registradas.</p>}
      </div>

      {state.kind === "error" && (
        <div className="mb-5 border-l-4 border-red-500 bg-red-50 p-4">
          <p role="alert" className="text-sm text-red-800">No se pudo cargar el resumen. {state.message}</p>
          <button type="button" onClick={retry} className="mt-3 min-h-11 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">Reintentar métricas</button>
        </div>
      )}
      {(state.kind !== "error" || showingBriefing) && (
        <div className="grid min-w-0 gap-x-8 gap-y-7 sm:grid-cols-2 xl:grid-cols-4">
          {GROUPS.map((group) => {
            const counts: Record<string, number> | null = data ? data[group.field] : null;
            const descriptions: Record<string, string> = group.descriptions;
            return (
              <div key={group.field} className="min-w-0">
                <h3 className="mb-4 text-sm font-semibold text-slate-900">{group.title}</h3>
                <ul aria-label={group.title} className="space-y-3">
                  {Object.entries(group.labels).map(([key, label]) => {
                    const count = counts?.[key];
                    return (
                      <li key={key} className="min-w-0">
                        <div className="mb-1.5 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 text-sm">
                          <span title={descriptions[key]} className="break-words text-slate-600 [overflow-wrap:anywhere]">{label}</span>
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