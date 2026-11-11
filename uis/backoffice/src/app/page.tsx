import Link from "next/link";
import { BackofficeHero } from "@/src/components/backoffice-hero";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <BackofficeHero />

      <section className="max-w-2xl space-y-5">
        <h2 className="text-xl font-extrabold tracking-tight text-white">
          Panel principal
        </h2>
        <p className="text-sm leading-relaxed text-slate-100/85">
          Herramientas internas para el equipo de operaciones y RR. HH.
        </p>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/suppliers"
            className="inline-flex items-center justify-center rounded-xl border border-cyan-200/80 bg-cyan-300/20 px-5 py-2.5 text-sm font-bold text-cyan-50 shadow-[0_0_22px_rgba(34,211,238,0.5)] transition hover:-translate-y-0.5 hover:bg-cyan-300/30"
          >
            Ir al directorio de proveedores
          </Link>
          <Link
            href="/inventory/products"
            className="inline-flex items-center justify-center rounded-xl border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/20"
          >
            Ver inventario
          </Link>
        </div>
      </section>
    </div>
  );
}
