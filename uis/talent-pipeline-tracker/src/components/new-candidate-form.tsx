import { useMemo, useState } from "react";
import type { CandidateStage, CandidateStatus, CreateCandidateInput } from "@/src/types";

interface NewCandidateFormProps {
  onCreate: (payload: CreateCandidateInput) => Promise<void>;
}

const initialState = {
  nombre: "",
  email: "",
  telefono: "",
  puesto: "",
  linkedinUrl: "",
  cvUrl: "",
  aniosExperiencia: "",
  estado: "aplicado",
  etapa: "screening",
};

export function NewCandidateForm({ onCreate }: NewCandidateFormProps) {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"ok" | "error" | null>(null);

  const requiredMissing = useMemo(() => {
    const requiredFields = [form.nombre, form.email, form.telefono, form.puesto];
    return requiredFields.some((value) => value.trim().length === 0);
  }, [form]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (requiredMissing) {
      setMessageType("error");
      setMessage("Completa los campos obligatorios antes de continuar.");
      return;
    }

    setSubmitting(true);

    try {
      await onCreate({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        puesto: form.puesto.trim(),
        linkedinUrl: form.linkedinUrl.trim(),
        cvUrl: form.cvUrl.trim(),
        aniosExperiencia: Number(form.aniosExperiencia || 0),
        estado: form.estado as CandidateStatus,
        etapa: form.etapa as CandidateStage,
        fechaAplicacion: new Date().toISOString(),
      });

      setMessageType("ok");
      setMessage("Candidatura registrada con éxito.");
      setForm(initialState);
    } catch (error) {
      const text = error instanceof Error ? error.message : "No se pudo crear la candidatura.";
      setMessageType("error");
      setMessage(text);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header>
        <h2 className="text-lg font-semibold text-slate-900">Registrar nueva candidatura</h2>
        <p className="mt-1 text-sm text-slate-600">
          Crea una candidatura y actualiza el pipeline sin salir del tablero.
        </p>
      </header>

      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
        <input
          required
          placeholder="Nombre completo"
          value={form.nombre}
          onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
        />
        <input
          required
          type="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
        />
        <input
          required
          placeholder="Teléfono"
          value={form.telefono}
          onChange={(event) => setForm((prev) => ({ ...prev, telefono: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
        />
        <input
          required
          placeholder="Puesto"
          value={form.puesto}
          onChange={(event) => setForm((prev) => ({ ...prev, puesto: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
        />
        <input
          placeholder="LinkedIn"
          value={form.linkedinUrl}
          onChange={(event) => setForm((prev) => ({ ...prev, linkedinUrl: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
        />
        <input
          placeholder="URL CV"
          value={form.cvUrl}
          onChange={(event) => setForm((prev) => ({ ...prev, cvUrl: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
        />
        <input
          type="number"
          min="0"
          placeholder="Años de experiencia"
          value={form.aniosExperiencia}
          onChange={(event) => setForm((prev) => ({ ...prev, aniosExperiencia: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
        />

        <select
          value={form.estado}
          onChange={(event) => setForm((prev) => ({ ...prev, estado: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
        >
          <option value="aplicado">aplicado</option>
          <option value="en-proceso">en-proceso</option>
          <option value="contratado">contratado</option>
          <option value="rechazado">rechazado</option>
        </select>

        <select
          value={form.etapa}
          onChange={(event) => setForm((prev) => ({ ...prev, etapa: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
        >
          <option value="screening">screening</option>
          <option value="entrevista-rrhh">entrevista-rrhh</option>
          <option value="entrevista-tecnica">entrevista-tecnica</option>
          <option value="entrevista-final">entrevista-final</option>
          <option value="oferta">oferta</option>
          <option value="hired">hired</option>
          <option value="descartado">descartado</option>
        </select>

        <div className="md:col-span-2 flex items-center justify-between gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Guardando..." : "Guardar candidatura"}
          </button>

          {message && (
            <p
              role="status"
              className={`text-sm ${messageType === "ok" ? "text-emerald-700" : "text-rose-700"}`}
            >
              {message}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
