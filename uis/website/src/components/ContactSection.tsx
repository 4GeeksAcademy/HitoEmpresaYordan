import { SectionShell } from "@/components/SectionShell";

export type ContactSectionProps = {
  id?: string;
};

export function ContactSection({ id = "contacto" }: ContactSectionProps) {
  return (
    <SectionShell id={id} eyebrow="Contacto" title="Formulario de contacto para empresas" className="pt-8">
      <div className="rounded-2xl border border-white/15 bg-white/5 p-5 sm:p-6">
        <p className="text-sm text-slate-200/85">Respondemos en menos de 24 horas habiles.</p>
        <form className="mt-5 grid gap-4 sm:grid-cols-2" aria-label="Formulario de contacto empresarial">
          <div>
            <label htmlFor="nombre" className="mb-1 block text-sm font-semibold text-slate-100">
              Nombre completo
            </label>
            <input
              id="nombre"
              name="nombre"
              aria-label="Nombre completo"
              type="text"
              className="w-full rounded-lg border border-white/20 bg-[#081228]/85 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
              placeholder="Ej. Laura Mendoza"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-100">
              Correo electronico
            </label>
            <input
              id="email"
              name="email"
              aria-label="Correo electronico"
              type="email"
              className="w-full rounded-lg border border-white/20 bg-[#081228]/85 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
              placeholder="tu@empresa.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="mensaje" className="mb-1 block text-sm font-semibold text-slate-100">
              Mensaje
            </label>
            <textarea
              id="mensaje"
              name="mensaje"
              aria-label="Mensaje"
              rows={4}
              className="w-full rounded-lg border border-white/20 bg-[#081228]/85 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
              placeholder="Cuentanos tu necesidad, objetivo o perfil que te interesa..."
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              aria-label="Enviar consulta"
              className="inline-flex items-center justify-center rounded-xl border border-cyan-300/70 bg-cyan-300/15 px-5 py-2.5 text-sm font-bold text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.35)] transition hover:bg-cyan-300/25"
            >
              Enviar consulta
            </button>
          </div>
        </form>
      </div>
    </SectionShell>
  );
}
