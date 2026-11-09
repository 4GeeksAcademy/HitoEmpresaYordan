import { IncidentForm } from "@/src/components/incident-form";

export default function NewIncidentPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Registrar incidencia</h1>
      <IncidentForm />
    </>
  );
}