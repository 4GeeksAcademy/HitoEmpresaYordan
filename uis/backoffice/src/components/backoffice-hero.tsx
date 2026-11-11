import Image from "next/image";

export function BackofficeHero() {
  return (
    <section
      aria-labelledby="backoffice-hero-title"
      className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/5 shadow-[0_18px_60px_rgba(2,6,23,0.55)]"
    >
      <Image
        src="/imagenes/imagenhero.jpg"
        alt="Oficinas de Nexova Solutions"
        fill
        priority
        className="object-cover opacity-20"
        sizes="(max-width: 768px) 100vw, 80vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070B16]/88 via-[#070B16]/82 to-[#070B16]/92" />
      <div className="absolute -left-12 top-10 h-40 w-40 rounded-full bg-cyan-300/20 blur-[70px]" />
      <div className="absolute right-0 top-16 h-48 w-48 rounded-full bg-fuchsia-300/15 blur-[90px]" />

      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20 lg:py-24">
        <p className="inline-flex rounded-full border border-cyan-200/40 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
          Nexova Solutions backoffice
        </p>
        <h1
          id="backoffice-hero-title"
          className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl"
        >
          Nexova Solutions backoffice
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-100/85 sm:text-base">
          Herramientas internas para el equipo de operaciones y RR. HH.
        </p>
      </div>
    </section>
  );
}