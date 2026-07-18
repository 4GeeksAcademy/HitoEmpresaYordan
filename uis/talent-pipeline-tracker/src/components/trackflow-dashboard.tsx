"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CandidateList } from "@/src/components/candidate-list";
import { FiltersBar } from "@/src/components/filters-bar";
import { NewCandidateForm } from "@/src/components/new-candidate-form";
import { createCandidate, getCandidates } from "@/src/services/api";
import type { Candidate, CreateCandidateInput } from "@/src/types";

export function TrackFlowDashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? searchParams.get("estado") ?? "all";
  const stage = searchParams.get("stage") ?? searchParams.get("etapa") ?? "all";
  const query = searchParams.get("q") ?? "";

  const updateQueryParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      // Normalize legacy query keys to keep a single canonical URL shape.
      if (key === "status") params.delete("estado");
      if (key === "stage") params.delete("etapa");

      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const loadCandidates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getCandidates();
      setCandidates(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No fue posible cargar candidatos.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCandidates();
  }, [loadCandidates]);

  const visibleCandidates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return candidates.filter((candidate) => {
      const matchesStatus = status === "all" ? true : candidate.estado === status;
      const matchesStage = stage === "all" ? true : candidate.etapa === stage;
      const matchesQuery =
        normalizedQuery.length === 0
          ? true
          : candidate.nombre.toLowerCase().includes(normalizedQuery) ||
            candidate.email.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesStage && matchesQuery;
    });
  }, [candidates, query, stage, status]);

  const handleCreateCandidate = useCallback(
    async (payload: CreateCandidateInput) => {
      const created = await createCandidate(payload);

      setCandidates((prev) => {
        const exists = prev.some((candidate) => candidate.id === created.id);
        if (exists) return prev;
        return [created, ...prev];
      });
    },
    []
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-10 sm:px-8">
      <header className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          TrackFlow · People Talent
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Pipeline de candidaturas
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600">
          Visualiza el estado operativo del reclutamiento, filtra por etapa y gestiona nuevas candidaturas desde un solo panel.
        </p>
      </header>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <FiltersBar
            status={status}
            stage={stage}
            query={query}
            onStatusChange={(value) => updateQueryParam("status", value)}
            onStageChange={(value) => updateQueryParam("stage", value)}
            onQueryChange={(value) => updateQueryParam("q", value)}
          />

          <CandidateList
            candidates={visibleCandidates}
            isLoading={isLoading}
            error={error}
          />
        </div>

        <NewCandidateForm onCreate={handleCreateCandidate} />
      </section>
    </main>
  );
}
