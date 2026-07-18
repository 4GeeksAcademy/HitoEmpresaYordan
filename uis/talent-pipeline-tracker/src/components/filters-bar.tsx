interface FiltersBarProps {
  status: string;
  stage: string;
  query: string;
  onStatusChange: (value: string) => void;
  onStageChange: (value: string) => void;
  onQueryChange: (value: string) => void;
}

const statusOptions = ["all", "aplicado", "en-proceso", "contratado", "rechazado"];

const stageOptions = [
  "all",
  "screening",
  "entrevista-rrhh",
  "entrevista-tecnica",
  "entrevista-final",
  "oferta",
  "hired",
  "descartado",
];

export function FiltersBar({
  status,
  stage,
  query,
  onStatusChange,
  onStageChange,
  onQueryChange,
}: FiltersBarProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3">
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Buscar por nombre o email</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Ej. ana@empresa.com"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Filtrar por estado</span>
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "Todos" : option}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Filtrar por etapa</span>
        <select
          value={stage}
          onChange={(event) => onStageChange(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
        >
          {stageOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "Todas" : option}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
