import Link from "next/link";
import type { Candidate } from "@/src/types";

interface CandidateListProps {
  candidates: Candidate[];
  isLoading: boolean;
  error: string | null;
}

function StatusBadge({ value }: { value: string }) {
  const lowerValue = value.toLowerCase();
  const palette =
    lowerValue === "contratado"
      ? "bg-emerald-100 text-emerald-800"
      : lowerValue === "rechazado" || lowerValue === "descartado"
        ? "bg-rose-100 text-rose-800"
        : "bg-sky-100 text-sky-800";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${palette}`}>
      {value}
    </span>
  );
}

export function CandidateList({ candidates, isLoading, error }: CandidateListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-200/70"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
        No hay candidaturas que coincidan con los filtros activos.
      </div>
    );
  }

  return (
    <ul className="grid gap-3">
      {candidates.map((candidate) => (
        <li
          key={candidate.id}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sky-200 hover:shadow"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <Link
                href={`/${candidate.id}`}
                className="text-base font-semibold text-slate-900 underline-offset-2 hover:text-sky-700 hover:underline"
              >
                {candidate.nombre}
              </Link>
              <p className="mt-1 text-sm text-slate-600">{candidate.puesto}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Estado</span>
              <StatusBadge value={candidate.estado} />
              <span className="ml-2 text-xs font-medium text-slate-500">Etapa</span>
              <StatusBadge value={candidate.etapa} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
