import Image from "next/image";

export type HeroSectionProps = {
  ctaHref: string;
};

export function HeroSection({ ctaHref }: HeroSectionProps) {
  return (
    <section id="inicio" aria-labelledby="hero-title" className="relative overflow-hidden border-b border-white/10">
      <Image
        src="/imagenes/imagenhero.jpg"
        alt="Equipo de consultoria de Nexova Solutions conectando talento entre Valencia y Miami"
        fill
        priority
        className="object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070B16]/90 via-[#070B16]/84 to-[#070B16]/95" />
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-20 pt-16 sm:px-8 sm:pt-24 lg:pt-28">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/20 bg-white/8 p-6 text-center shadow-[0_20px_60px_rgba(2,6,23,0.55)] backdrop-blur-2xl sm:p-9">
          <p className="inline-flex rounded-full border border-cyan-200/40 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
            Nexova Solutions · Fundada en 2011 · 15 anos · Valencia + Miami
          </p>
          <h1 id="hero-title" className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            El puente de talento entre Europa y EE.UU. para empresas de Retail, Finanzas y Tecnologia
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-sm leading-relaxed text-slate-100/90 sm:text-base">
            Somos una consultora de recursos humanos y seleccion de talento. Ayudamos a empresas de Retail, Finanzas y
            Tecnologia a externalizar la gestion de talento para enfocarse en su core business y sostener equipos
            comprometidos.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-xl border border-cyan-200/80 bg-cyan-300/20 px-6 py-3 font-bold text-cyan-50 shadow-[0_0_22px_rgba(34,211,238,0.45)] transition hover:-translate-y-0.5 hover:bg-cyan-300/30"
            >
              Aplicar ahora
            </a>
            <a
              href="#servicios"
              className="inline-flex items-center justify-center rounded-xl border border-white/35 bg-white/10 px-6 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/20"
            >
              Ver servicios
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
