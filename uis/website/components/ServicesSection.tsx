import { SectionShell } from "@/components/SectionShell";

type ServiceItem = {
  name: string;
  description: string;
  accentClass: string;
};

const SERVICES: ServiceItem[] = [
  {
    name: "Headhunting",
    description:
      "Busquedas de mandos medios y directivos con mapeo de mercado, score de compatibilidad y validacion por competencias.",
    accentClass: "text-cyan-200",
  },
  {
    name: "Outsourcing",
    description:
      "Equipos de soporte especializados para operaciones intensivas en Retail, Finanzas y Tecnologia con foco en SLA y continuidad.",
    accentClass: "text-fuchsia-200",
  },
  {
    name: "Corporate Training",
    description:
      "Programas de liderazgo, comunicacion y desempeno conectados con objetivos medibles de negocio y retencion.",
    accentClass: "text-amber-200",
  },
];

export type ServicesSectionProps = {
  id?: string;
};

export function ServicesSection({ id = "servicios" }: ServicesSectionProps) {
  return (
    <SectionShell
      id={id}
      eyebrow="Nuestros 3 pilares"
      title="Caracteristicas y servicios para escalar talento con precision"
    >
      <div className="grid gap-4 md:grid-cols-3">
        {SERVICES.map((service) => (
          <article key={service.name} className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur">
            <h3 className={`text-xl font-extrabold ${service.accentClass}`}>{service.name}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-100/90">{service.description}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
