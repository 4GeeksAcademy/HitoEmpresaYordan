import { SectionShell } from "@/components/SectionShell";

export type AboutSectionProps = {
  id?: string;
};

export function AboutSection({ id = "sobre-nosotros" }: AboutSectionProps) {
  return (
    <SectionShell
      id={id}
      eyebrow="Sobre nosotros"
      title="15 anos construyendo equipos de alto rendimiento entre Espana y EE.UU."
      className="pt-8"
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="text-slate-100/85">
            Nexova Solutions integra consultoria humana y automatizacion inteligente para acelerar decisiones de talento sin
            perder criterio experto. Nuestro modelo conecta atraccion, operacion y liderazgo para crecer con control.
          </p>
          <p className="mt-4 text-slate-100/85">
            Operamos con equipos especializados en seleccion, formacion, soporte, ventas, marketing, recursos humanos y
            tecnologia.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-cyan-200/35 bg-cyan-300/10 p-4">
            <dt className="text-xs uppercase tracking-[0.14em] text-cyan-100">Facturacion anual</dt>
            <dd className="mt-1 text-2xl font-black text-white">+8M USD</dd>
          </div>
          <div className="rounded-xl border border-fuchsia-200/35 bg-fuchsia-300/10 p-4">
            <dt className="text-xs uppercase tracking-[0.14em] text-fuchsia-100">Cobertura</dt>
            <dd className="mt-1 text-2xl font-black text-white">Valencia + Miami</dd>
          </div>
          <div className="rounded-xl border border-amber-200/35 bg-amber-300/10 p-4">
            <dt className="text-xs uppercase tracking-[0.14em] text-amber-100">Equipo</dt>
            <dd className="mt-1 text-2xl font-black text-white">120 personas</dd>
          </div>
          <div className="rounded-xl border border-emerald-200/35 bg-emerald-300/10 p-4">
            <dt className="text-xs uppercase tracking-[0.14em] text-emerald-100">Experiencia</dt>
            <dd className="mt-1 text-2xl font-black text-white">15 anos</dd>
          </div>
        </dl>
      </div>
    </SectionShell>
  );
}
