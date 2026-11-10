'use client';

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useCallback } from "react";

function HeroSection() {
  return (
    <section id="inicio" aria-labelledby="hero-titulo" className="relative overflow-hidden">
      <Image
        src="/imagenes/imagenhero.jpg"
        alt="Equipo de consultoría de Nexova Solutions conectando talento entre Valencia y Miami"
        className="absolute inset-0 h-full w-full object-cover opacity-30"
        fill
        priority
        sizes="100vw"
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070B16]/88 via-[#070B16]/82 to-[#070B16]/92" />
      <div className="absolute -left-16 top-20 h-56 w-56 rounded-full bg-cyan-300/25 blur-[90px] motion-reduce:animate-none animate-soft-float" />
      <div className="absolute right-0 top-24 h-64 w-64 rounded-full bg-fuchsia-300/20 blur-[110px] motion-reduce:animate-none animate-soft-float [animation-delay:0.8s]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-14 pt-16 sm:px-8 sm:pt-20 lg:pt-24">
        <div
          id="heroCard"
          className="mx-auto max-w-3xl rounded-[2rem] border border-white/25 bg-white/10 p-5 text-center shadow-[0_18px_60px_rgba(2,6,23,0.55)] backdrop-blur-2xl motion-reduce:animate-none sm:p-7 animate-hero-enter"
        >
          <p className="inline-flex rounded-full border border-cyan-200/40 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
            Nexova Solutions · Fundada en <time dateTime="2011">2011</time> · 15 años · 120 empleados · Valencia + Miami
          </p>
          <h1 id="hero-titulo" className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            El puente de talento entre Europa y EE.UU. para empresas de Retail, Finanzas y Tecnología
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-100/90 sm:text-base">
            Somos una consultora de recursos humanos y selección de talento, con raíces en Valencia y expansión estratégica en Miami.
            Ayudamos a empresas de Retail, Finanzas y Tecnología a externalizar la gestión de talento para enfocarse en su core
            business, mejorar su velocidad operativa y sostener equipos comprometidos.
          </p>

          <div className="mt-7 grid gap-3 motion-reduce:animate-none sm:flex sm:flex-wrap sm:justify-center sm:gap-4 animate-hero-enter-delay">
            <Link
              href="/application.html"
              className="inline-flex items-center justify-center rounded-xl border border-cyan-200/80 bg-cyan-300/20 px-6 py-3 font-bold text-cyan-50 shadow-[0_0_22px_rgba(34,211,238,0.5)] transition hover:-translate-y-0.5 hover:bg-cyan-300/30"
            >
              Ir al formulario de aplicación
            </Link>
            <Link
              href="#servicios"
              className="inline-flex items-center justify-center rounded-xl border border-white/35 bg-white/10 px-6 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/20"
            >
              Ver servicios
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article
            className="rounded-3xl border border-cyan-200/35 bg-[#081228]/85 p-5 shadow-[0_10px_30px_rgba(34,211,238,0.18)] backdrop-blur"
            data-reveal
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-100">Propuesta de valor</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-100/90 sm:text-base">
              <li>
                <strong className="font-extrabold text-cyan-200 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]">
                  Headhunting
                </strong>{" "}
                de mandos medios y directivos con precisión quirúrgica.
              </li>
              <li>
                <strong className="font-extrabold text-fuchsia-200 drop-shadow-[0_0_8px_rgba(232,121,249,0.75)]">
                  Outsourcing
                </strong>{" "}
                de equipos de soporte especializados para operación intensiva.
              </li>
              <li>
                <strong className="font-extrabold text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.75)]">
                  Corporate Training
                </strong>{" "}
                para fortalecer liderazgo, cultura y retención.
              </li>
            </ul>
          </article>

          <article
            className="rounded-3xl border border-fuchsia-200/30 bg-[#140B2A]/80 p-5 shadow-[0_10px_30px_rgba(232,121,249,0.15)] backdrop-blur"
            data-reveal
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-100">Diferenciador</p>
            <h2 className="mt-3 text-2xl font-extrabold leading-snug text-white">
              No solo buscamos gente; formamos líderes y gestionamos equipos de soporte de alto rendimiento.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-100/85">
              Integramos consultoría humana y automatización inteligente para reducir tiempos, elevar calidad de matching
              y mantener una experiencia premium para clientes y candidatos.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

function ServiciosSection() {
  return (
    <section
      id="servicios"
      aria-labelledby="servicios-titulo"
      className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-8 sm:py-20"
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200" data-reveal>
        Nuestros 3 pilares
      </p>
      <h2
        id="servicios-titulo"
        className="mt-3 max-w-4xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
        data-reveal
      >
        Soluciones para escalar talento con precisión
      </h2>

      <div className="mt-10 border-l border-white/20 pl-4 sm:pl-7">
        <article className="relative py-5" data-reveal>
          <span className="absolute -left-[1.05rem] top-8 h-2.5 w-2.5 rounded-full bg-cyan-300 sm:-left-[1.95rem]" />
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-200">01 · Headhunting</p>
          <p className="mt-2 max-w-4xl text-base text-slate-100/90">
            Diseñamos búsquedas de mandos medios y directivos con mapeo de mercado, score de compatibilidad y validación por competencias
            para asegurar encaje técnico, cultural y estratégico. Combinamos criterio consultivo con analítica de talento para reducir el
            tiempo de screening y presentar ternas más sólidas desde la primera ronda.
          </p>
        </article>

        <article className="relative border-t border-white/10 py-5" data-reveal>
          <span className="absolute -left-[1.05rem] top-8 h-2.5 w-2.5 rounded-full bg-fuchsia-300 sm:-left-[1.95rem]" />
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-fuchsia-200">02 · Outsourcing</p>
          <p className="mt-2 max-w-4xl text-base text-slate-100/90">
            Implementamos equipos de soporte especializados para operaciones intensivas en Retail, Finanzas y Tecnología, con playbooks,
            base de conocimiento y seguimiento de SLA en tiempo casi real. Estandarizamos procesos críticos para mejorar continuidad operativa,
            trazabilidad y experiencia de cliente final sin perder flexibilidad en picos de demanda.
          </p>
        </article>

        <article className="relative border-t border-white/10 py-5" data-reveal>
          <span className="absolute -left-[1.05rem] top-8 h-2.5 w-2.5 rounded-full bg-amber-300 sm:-left-[1.95rem]" />
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-200">03 · Corporate Training</p>
          <p className="mt-2 max-w-4xl text-base text-slate-100/90">
            Desarrollamos programas de formación en liderazgo, comunicación y desempeño para líderes y equipos de primera línea,
            conectando cada módulo con objetivos de negocio medibles. A través de rutas formativas y seguimiento por KPIs de talento,
            elevamos compromiso, productividad y retención de perfiles clave.
          </p>
        </article>
      </div>
    </section>
  );
}

function IASection() {
  return (
    <section id="ia" aria-labelledby="ia-titulo" className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-8 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div data-reveal>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">IA aplicada al reclutamiento</p>
          <h2
            id="ia-titulo"
            className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            Automatizamos screening y scoring para acelerar decisiones sin perder criterio humano
          </h2>
          <p className="mt-4 max-w-4xl text-slate-100/85">
            Diseñamos un copiloto para consultores que prioriza candidatos por compatibilidad, genera alertas de riesgo y mejora KPIs clave
            como tiempo de screening, velocidad de cierre y satisfacción de cliente/candidato.
          </p>
        </div>
        <div className="space-y-4" data-reveal>
          <div className="rounded-xl border border-cyan-200/35 bg-cyan-300/10 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-100">Tiempo de screening</p>
            <p className="mt-1 text-lg font-bold text-white">Menor fricción operacional</p>
          </div>
          <div className="rounded-xl border border-fuchsia-200/35 bg-fuchsia-300/10 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-fuchsia-100">Velocidad de cierre</p>
            <p className="mt-1 text-lg font-bold text-white">Decisiones más rápidas y consistentes</p>
          </div>
          <div className="rounded-xl border border-amber-200/35 bg-amber-300/10 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-amber-100">Satisfacción</p>
            <p className="mt-1 text-lg font-bold text-white">Mejor experiencia cliente y candidato</p>
          </div>
        </div>
      </div>

      <div className="mt-20 grid gap-10 lg:grid-cols-2 sm:mt-24" data-reveal>
        <div className="border-l border-rose-300/55 pl-4 sm:pl-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-rose-200">Antes de integrar IA</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-100/90">
            <li>Criba de CVs, entrevistas iniciales y priorizacion realizadas de forma manual.</li>
            <li>Seguimiento irregular en ventas y oportunidades perdidas por tareas repetitivas.</li>
            <li>Reportes ejecutivos semanales en PDF, con datos que llegan con retraso.</li>
            <li>Soporte externalizado sin base de conocimiento ni visibilidad operativa en tiempo real.</li>
          </ul>
        </div>
        <div className="border-l border-emerald-300/60 pl-4 sm:pl-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-200">Ahora con IA integrada</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-100/90">
            <li>Screening y scoring asistidos para priorizar mejor y reducir carga operativa manual.</li>
            <li>Alertas automaticas de riesgo para oportunidades y candidatos criticos.</li>
            <li>Paneles con indicadores casi en tiempo real para direccion y lideres de area.</li>
            <li>Estandarizacion de respuestas y soporte guiado por conocimiento para mejorar SLA.</li>
          </ul>
        </div>
      </div>

      <div className="mt-20 sm:mt-24" data-reveal>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-100">Resultados medibles tras integrar IA</p>
        <p className="mt-2 text-sm text-slate-100/90">Impacto consolidado en los ultimos 6 meses de operacion asistida por agente IA.</p>

        <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
          <div className="grid gap-3 py-4 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <p className="text-sm font-semibold text-white">Reduccion de tiempo de seleccion</p>
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Antes 100%</span>
                <span>Ahora 58%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/15">
                <div className="h-2 w-[58%] rounded-full bg-cyan-300" />
              </div>
              <p className="mt-1 text-right text-sm font-black text-cyan-100">-42%</p>
            </div>
          </div>

          <div className="grid gap-3 py-4 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <p className="text-sm font-semibold text-white">Precision de ajuste candidato-oferta</p>
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Antes 62%</span>
                <span>Ahora 93%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/15">
                <div className="h-2 w-[93%] rounded-full bg-fuchsia-300" />
              </div>
              <p className="mt-1 text-right text-sm font-black text-fuchsia-100">+31%</p>
            </div>
          </div>

          <div className="grid gap-3 py-4 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <p className="text-sm font-semibold text-white">
              Seguimiento 24/7 de candidatos y procesos centralizado en agente IA
            </p>
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Antes 28%</span>
                <span>Ahora 100%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/15">
                <div className="h-2 w-full rounded-full bg-emerald-300" />
              </div>
              <p className="mt-1 text-right text-sm font-black text-emerald-100">+72 pts</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectoresSection() {
  return (
    <section
      id="sectores"
      aria-labelledby="sectores-titulo"
      className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-8 sm:py-20"
    >
      <div className="grid gap-7 lg:grid-cols-2 lg:gap-12">
        <div data-reveal>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-200">Especialidad sectorial</p>
          <h2
            id="sectores-titulo"
            className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            Retail y Finanzas: cuando el compromiso del equipo define el crecimiento
          </h2>
          <p className="mt-4 text-slate-100/85">
            Sabemos lo que enfrentan tus líderes: rotación, presión por resultados y dificultad para sostener equipos comprometidos.
            Nexova lo resuelve con un modelo integral que conecta atracción de talento, operación y liderazgo.
          </p>
        </div>
        <ul className="space-y-3" data-reveal>
          <li className="border-l-2 border-cyan-300 pl-4 text-slate-100/90">
            Modelos de servicio adaptados a ciclos de alta demanda.
          </li>
          <li className="border-l-2 border-fuchsia-300 pl-4 text-slate-100/90">
            Mapeo de perfiles críticos para crecimiento sostenible.
          </li>
          <li className="border-l-2 border-amber-300 pl-4 text-slate-100/90">
            Capacitación continua para mantener desempeño y cultura.
          </li>
        </ul>
      </div>
    </section>
  );
}

function OrganizacionSection() {
  return (
    <section
      id="organizacion"
      aria-labelledby="organizacion-titulo"
      className="relative mx-auto w-full max-w-7xl overflow-hidden px-4 py-14 sm:px-8 sm:py-20"
    >
      <div
        className="pointer-events-none absolute inset-0 -z-0 opacity-75 motion-reduce:animate-none animate-map-drift"
        aria-hidden="true"
      >
        <svg viewBox="0 0 1200 520" className="h-full w-full" preserveAspectRatio="none" role="img">
          <defs>
            <linearGradient id="orgRouteMain" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.08" />
              <stop offset="48%" stopColor="#22D3EE" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#E879F9" stopOpacity="0.36" />
            </linearGradient>
            <linearGradient id="orgRouteAlt" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#67E8F9" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="orgRouteSoft" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#F5D0FE" stopOpacity="0.16" />
            </linearGradient>
          </defs>

          <path
            className="[stroke-dasharray:520] [stroke-dashoffset:520] motion-reduce:animate-none animate-map-line"
            d="M138 462 C 300 410, 480 300, 640 258 C 790 216, 900 132, 966 56"
            stroke="url(#orgRouteMain)"
            strokeWidth="2.6"
            fill="none"
            strokeLinecap="round"
          />
          <path
            className="[stroke-dasharray:520] [stroke-dashoffset:520] motion-reduce:animate-none animate-map-line-delayed"
            d="M128 478 C 300 438, 500 340, 664 292 C 806 250, 916 172, 974 84"
            stroke="url(#orgRouteAlt)"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            className="[stroke-dasharray:520] [stroke-dashoffset:520] motion-reduce:animate-none animate-map-line-late"
            d="M150 444 C 312 382, 500 272, 658 226 C 806 182, 914 110, 968 48"
            stroke="url(#orgRouteMain)"
            strokeWidth="1.1"
            fill="none"
            strokeLinecap="round"
            opacity="0.75"
          />
          <path
            className="[stroke-dasharray:12_10] [stroke-dashoffset:140] motion-reduce:animate-none animate-map-line-soft"
            d="M120 494 C 300 470, 506 416, 702 350 C 836 304, 928 210, 980 112"
            stroke="url(#orgRouteSoft)"
            strokeWidth="1.1"
            fill="none"
            strokeLinecap="round"
          />
          <path
            className="[stroke-dasharray:12_10] [stroke-dashoffset:140] motion-reduce:animate-none animate-map-line-soft"
            d="M160 420 C 342 332, 536 230, 704 194 C 836 166, 926 108, 972 58"
            stroke="url(#orgRouteSoft)"
            strokeWidth="0.95"
            fill="none"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            className="[stroke-dasharray:520] [stroke-dashoffset:520] motion-reduce:animate-none animate-map-line-late"
            d="M142 456 C 332 404, 530 318, 700 270 C 834 232, 928 150, 976 72"
            stroke="url(#orgRouteAlt)"
            strokeWidth="0.95"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>
      </div>

      <div className="relative z-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div data-reveal>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Cómo está organizada Nexova</p>
          <h2
            id="organizacion-titulo"
            className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            120 personas, 7 áreas clave y una dirección enfocada en escalar
          </h2>
          <p className="mt-4 text-slate-100/85">
            Laura Mendoza lidera la compañía desde 2011, consolidando 15 años de trayectoria con una visión orientada a resultados.
            Nexova opera entre España y EE.UU. con equipos especializados en selección, formación, soporte, ventas, marketing, RR.HH. y tecnología.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2" data-reveal>
          <div className="border border-white/15 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-100">Selección</p>
            <p className="mt-1 text-sm text-slate-100/90">40 consultores liderados por Javier Almeida.</p>
          </div>
          <div className="border border-white/15 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-fuchsia-100">Formación corporativa</p>
            <p className="mt-1 text-sm text-slate-100/90">12 personas lideradas por Elena Vargas.</p>
          </div>
          <div className="border border-white/15 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-amber-100">Atención al cliente</p>
            <p className="mt-1 text-sm text-slate-100/90">30 agentes de atención al cliente liderados por Roberto Díaz.</p>
          </div>
          <div className="border border-white/15 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-100">Ventas y negocio</p>
            <p className="mt-1 text-sm text-slate-100/90">18 personas lideradas por Megan Clarke.</p>
          </div>
          <div className="border border-white/15 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-fuchsia-100">Marketing y comunicación</p>
            <p className="mt-1 text-sm text-slate-100/90">Equipo liderado por Carmen Ruiz.</p>
          </div>
          <div className="border border-white/15 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-amber-100">Recursos humanos</p>
            <p className="mt-1 text-sm text-slate-100/90">
              4 especialistas liderados por Patricia Solís para selección interna y desarrollo de talento.
            </p>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
        <div className="absolute left-[76%] top-[11%] lg:left-[82%] lg:top-[7%]">
          <div className="relative h-6 w-6">
            <span className="absolute inset-0 origin-center rounded-full bg-fuchsia-300/45 motion-reduce:animate-none animate-map-pulse" />
            <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-200" />
          </div>
          <span className="ml-2 inline-block text-[11px] font-semibold tracking-wide text-fuchsia-100/75">
            Miami
          </span>
        </div>

        <div className="absolute left-[12%] top-[89%] lg:left-[10%] lg:top-[90%]">
          <div className="relative h-6 w-6">
            <span className="absolute inset-0 origin-center rounded-full bg-cyan-300/45 motion-reduce:animate-none animate-map-pulse" />
            <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200" />
          </div>
          <span className="ml-2 inline-block text-[11px] font-semibold tracking-wide text-cyan-100/75">
            Valencia
          </span>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section
      id="trust"
      aria-labelledby="trust-titulo"
      className="mx-auto w-full max-w-7xl px-4 py-14 text-center sm:px-8 sm:py-20"
      data-reveal
    >
      <p id="trust-titulo" className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
        Indicador de confianza
      </p>
      <p className="mx-auto mt-3 max-w-4xl text-2xl font-extrabold leading-tight text-white sm:text-3xl">
        Más de 8 millones de dólares en facturación anual avalan nuestra capacidad operativa para medianas empresas.
      </p>
      <div className="mx-auto mt-5 h-px max-w-2xl bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
    </section>
  );
}

function ContactSection() {
  return (
    <section
      id="contacto"
      className="mx-auto mt-8 w-full max-w-7xl px-4 sm:px-8"
      aria-labelledby="contacto-form-titulo"
    >
      <div className="rounded-2xl border border-white/15 bg-white/5 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-200">Formulario de contacto</p>
            <h2 id="contacto-form-titulo" className="mt-1 text-xl font-extrabold text-white sm:text-2xl">
              Formulario de contacto para empresas
            </h2>
          </div>
          <p className="text-sm text-slate-200/80">Respondemos en menos de 24 horas hábiles.</p>
        </div>

        <p className="mt-3 text-sm text-slate-200/85">Si quieres postularte como candidato, usa el botón Aplicar ahora.</p>

        <form
          id="contactForm"
          className="mt-5 grid gap-4 sm:grid-cols-2"
          aria-label="Formulario de contacto exclusivo para empresas"
          noValidate
          aria-describedby="contactFormErrors contactFormSuccess"
        >
          <p
            id="contactFormErrors"
            className="hidden sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          />

          <div>
            <label htmlFor="nombre" className="mb-1 block text-sm font-semibold text-slate-100">
              Nombre completo
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              autoComplete="name"
              className="w-full rounded-lg border border-white/20 bg-[#081228]/85 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
              placeholder="Ej. Laura Mendoza"
              aria-required="true"
              aria-invalid="false"
              aria-describedby="nombre-error"
            />
            <p id="nombre-error" className="mt-1 text-sm text-red-300" data-error-for="nombre" aria-live="polite" />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-100">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-white/20 bg-[#081228]/85 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
              placeholder="tu@empresa.com"
              aria-required="true"
              aria-invalid="false"
              aria-describedby="email-error"
            />
            <p id="email-error" className="mt-1 text-sm text-red-300" data-error-for="email" aria-live="polite" />
          </div>

          <div>
            <label htmlFor="empresa" className="mb-1 block text-sm font-semibold text-slate-100">
              Empresa
            </label>
            <input
              id="empresa"
              name="empresa"
              type="text"
              required
              autoComplete="organization"
              className="w-full rounded-lg border border-white/20 bg-[#081228]/85 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
              placeholder="Nombre de tu empresa"
              aria-required="true"
              aria-invalid="false"
              aria-describedby="empresa-error"
            />
            <p id="empresa-error" className="mt-1 text-sm text-red-300" data-error-for="empresa" aria-live="polite" />
          </div>

          <div>
            <label htmlFor="tipo" className="mb-1 block text-sm font-semibold text-slate-100">
              Motivo de contacto
            </label>
            <select
              id="tipo"
              name="tipo"
              required
              className="w-full rounded-lg border border-white/20 bg-[#081228]/85 px-3 py-2.5 text-sm text-white focus:border-cyan-300 focus:outline-none"
              aria-required="true"
              aria-invalid="false"
              aria-describedby="tipo-error"
            >
              <option value="" selected disabled>
                Selecciona una opción
              </option>
              <option value="consulta-empresa">Consulta empresarial</option>
              <option value="alianzas">Alianzas estratégicas</option>
              <option value="solicitud-servicios">Solicitud de servicios de Nexova</option>
            </select>
            <p id="tipo-error" className="mt-1 text-sm text-red-300" data-error-for="tipo" aria-live="polite" />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="mensaje" className="mb-1 block text-sm font-semibold text-slate-100">
              Mensaje
            </label>
            <textarea
              id="mensaje"
              name="mensaje"
              rows={4}
              required
              className="w-full rounded-lg border border-white/20 bg-[#081228]/85 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
              placeholder="Cuéntanos tu necesidad, objetivo o perfil que te interesa..."
              aria-required="true"
              aria-invalid="false"
              aria-describedby="mensaje-error"
            />
            <p id="mensaje-error" className="mt-1 text-sm text-red-300" data-error-for="mensaje" aria-live="polite" />
          </div>

          <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-start gap-2 text-sm text-slate-200/85">
              <input
                id="consentimiento"
                name="consentimiento"
                type="checkbox"
                required
                className="mt-1 rounded border-white/30 bg-transparent"
                aria-required="true"
                aria-invalid="false"
                aria-describedby="consentimiento-error"
              />
              Acepto ser contactado por el equipo de Nexova para dar seguimiento a esta solicitud.
            </label>
            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
              <button
                type="reset"
                className="inline-flex items-center justify-center rounded-xl border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
              >
                Limpiar formulario
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl border border-cyan-300/70 bg-cyan-300/15 px-5 py-2.5 text-sm font-bold text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.35)] transition hover:bg-cyan-300/25"
              >
                Enviar consulta
              </button>
            </div>
          </div>
          <p
            id="consentimiento-error"
            className="sm:col-span-2 text-sm text-red-300"
            data-error-for="consentimiento"
            aria-live="polite"
          />
          <p
            id="contactFormSuccess"
            className="hidden sm:col-span-2 rounded-lg border border-emerald-300/45 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          />
        </form>
      </div>
    </section>
  );
}

function TelemetryPanel() {
  return (
    <>
      <button
        id="telemetryToggle"
        type="button"
        className="fixed bottom-4 right-4 z-40 inline-flex items-center justify-center rounded-full border border-cyan-300/60 bg-[#081228]/90 px-4 py-3 text-sm font-bold text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.28)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-[#0b1733] focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-[#070B16]"
        aria-haspopup="dialog"
        aria-expanded="false"
        aria-controls="telemetryPanel"
      >
        Ver Telemetría / Panel de Datos (Hito 2)
      </button>

      <div
        id="telemetryOverlay"
        className="pointer-events-none fixed inset-0 z-50 opacity-0 transition-opacity duration-300"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[#020617]/70 backdrop-blur-sm" />

        <aside
          id="telemetryPanel"
          className="absolute right-0 top-0 h-full w-full max-w-xl translate-x-full overflow-y-auto border-l border-white/15 bg-[#07101f]/95 p-5 shadow-[-20px_0_60px_rgba(2,6,23,0.45)] transition-transform duration-300 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="telemetryTitle"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Hito 2</p>
              <h2 id="telemetryTitle" className="mt-2 text-2xl font-extrabold text-white">
                Telemetría operativa simulada
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Panel de demostración alimentado por las utilidades TypeScript del proyecto, sin alterar el contenido principal de la landing.
              </p>
            </div>
            <button
              id="telemetryClose"
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-lg text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              aria-label="Cerrar panel de telemetría"
            >
              ×
            </button>
          </div>

          <div className="mt-8 space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-100">Candidatos</p>
              <p id="telemetryCandidateSearch" className="mt-3 text-sm leading-relaxed text-slate-300" />
              <ul id="telemetryCandidates" className="mt-4 space-y-3" />
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-fuchsia-100">Reporte de cursos</p>
              <div id="telemetryCoursesSummary" className="mt-3 space-y-1 text-sm text-slate-300" />
              <ul id="telemetryCourses" className="mt-4 space-y-3" />
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-100">Auditoría de soporte</p>
              <p id="telemetrySupportSummary" className="mt-3 text-sm leading-relaxed text-slate-300" />
              <ul id="telemetrySupport" className="mt-4 space-y-3" />
            </section>
          </div>
        </aside>
      </div>
    </>
  );
}

function Footer() {
  return (
    <footer className="mt-8 border-t border-white/20 bg-[#050916]/70 text-white backdrop-blur-xl">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-8">
        <div>
          <p className="text-lg font-extrabold text-white">Nexova Solutions</p>
          <p className="mt-2 text-sm text-slate-200/85">
            15 años construyendo soluciones de talento para empresas que necesitan crecer con control y agilidad.
          </p>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-cyan-200">Contacto</p>
          <address className="mt-2 not-italic space-y-1 text-sm text-slate-200/85">
            <p>
              <a href="mailto:contacto@nexovasolutions.com" className="transition hover:text-cyan-200">
                contacto@nexovasolutions.com
              </a>
            </p>
            <p>
              <a href="tel:+34960000000" className="transition hover:text-cyan-200">
                +34 960 000 000
              </a>
            </p>
          </address>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-fuchsia-200">Sedes</p>
          <p className="mt-2 text-sm text-slate-200/85">Valencia, España</p>
          <p className="text-sm text-slate-200/85">Miami, Florida</p>
        </div>
      </div>
    </footer>
  );
}

function LandingScripts() {
  return (
    <>
      <Script src="/validation.js" strategy="afterInteractive" />
      <Script src="/demo.js" strategy="afterInteractive" />
      <Script id="landing-interactive" strategy="afterInteractive">
        {`
          (function () {
            const desktopNav = document.getElementById("desktopNav");
            const mobileNav = document.getElementById("mobileNav");
            const headerCta = document.getElementById("headerCta");
            const heroCard = document.getElementById("heroCard");
            const heroSection = document.getElementById("inicio");
            const heroImage = heroSection ? heroSection.querySelector('img[src="/imagenes/imagenhero.jpg"]') : null;
            const revealEls = Array.from(document.querySelectorAll("[data-reveal]"));
            const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            revealEls.forEach(function (el) {
              el.classList.add("opacity-0", "translate-y-6", "transition-all", "duration-700", "ease-out");
            });

            function centerSectionInViewport(el, behavior) {
              const rect = el.getBoundingClientRect();
              const absoluteTop = window.scrollY + rect.top;
              const targetTop = Math.max(0, absoluteTop - window.innerHeight / 2 + rect.height / 2);
              window.scrollTo({ top: targetTop, behavior: behavior });
            }

            function centerHashTarget(hash, behavior) {
              if (!hash || hash === "#" || hash === "#contenido-principal") return;
              const el = hash === "#inicio" && heroCard ? heroCard : document.querySelector(hash);
              if (!el) return;
              centerSectionInViewport(el, behavior);
            }

            function syncNavFade() {
              const shouldFade = window.scrollY > 12;
              [desktopNav, mobileNav, headerCta].forEach(function (el) {
                if (!el) return;
                el.classList.toggle("opacity-40", shouldFade);
              });
            }

            function syncHeroImageFade() {
              if (!heroSection || !heroImage) return;
              const rect = heroSection.getBoundingClientRect();
              const progress = Math.min(Math.max((0 - rect.top) / (rect.height * 0.95), 0), 1);
              const baseOpacity = 0.3;
              heroImage.style.opacity = String(baseOpacity * (1 - progress));
            }

            window.addEventListener("scroll", syncNavFade, { passive: true });
            window.addEventListener("scroll", syncHeroImageFade, { passive: true });
            syncNavFade();
            syncHeroImageFade();

            document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
              anchor.addEventListener("click", function (event) {
                const href = anchor.getAttribute("href");
                if (!href || href === "#" || href === "#contenido-principal") return;
                const target = href === "#inicio" && heroCard ? heroCard : document.querySelector(href);
                if (!target) return;
                event.preventDefault();
                history.pushState(null, "", href);
                centerSectionInViewport(target, "smooth");
              });
            });

            window.addEventListener("hashchange", function () {
              centerHashTarget(window.location.hash, "smooth");
            });

            if (window.location.hash) {
              requestAnimationFrame(function () {
                centerHashTarget(window.location.hash, "auto");
              });
            }

            if (prefersReducedMotion) {
              revealEls.forEach(function (el) {
                el.classList.remove("opacity-0", "translate-y-6");
                el.classList.add("opacity-100", "translate-y-0");
              });
            } else if ("IntersectionObserver" in window) {
              const observer = new IntersectionObserver(
                function (entries, obs) {
                  entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.remove("opacity-0", "translate-y-6");
                    entry.target.classList.add("opacity-100", "translate-y-0");
                    obs.unobserve(entry.target);
                  });
                },
                { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
              );
              revealEls.forEach(function (el) {
                observer.observe(el);
              });
            } else {
              revealEls.forEach(function (el) {
                el.classList.remove("opacity-0", "translate-y-6");
                el.classList.add("opacity-100", "translate-y-0");
              });
            }
          })();
        `}
      </Script>
    </>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/15 bg-[#050916]/55 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-4">
        <a href="#inicio" className="flex items-center gap-3" aria-label="Inicio Nexova Solutions">
          <span
            className="grid h-10 w-10 place-content-center rounded-2xl border border-white/40 bg-gradient-to-br from-cyan-300/90 to-fuchsia-300/80 text-[#0A1021] shadow-[0_0_26px_rgba(34,211,238,0.45)] text-lg font-black"
            aria-hidden="true"
          >
            N
          </span>
          <span className="text-base font-extrabold tracking-tight leading-none text-white">Nexova Solutions</span>
        </a>

        <nav
          id="desktopNav"
          className="hidden md:block transition-all duration-300"
          aria-label="Navegación principal"
        >
          <ul className="flex items-center gap-6 text-sm font-semibold text-white">
            <li>
              <a href="#servicios" className="transition hover:text-[#C46A4A]">
                Servicios
              </a>
            </li>
            <li>
              <a href="#ia-titulo" className="transition hover:text-[#C46A4A]">
                IA aplicada
              </a>
            </li>
            <li>
              <a href="#sectores-titulo" className="transition hover:text-[#C46A4A]">
                Especialidad
              </a>
            </li>
            <li>
              <a href="#organizacion-titulo" className="transition hover:text-[#C46A4A]">
                Sectores
              </a>
            </li>
            <li>
              <a href="#contacto" className="transition hover:text-[#C46A4A]">
                Contacto
              </a>
            </li>
            <li>
              <a href="/login" className="transition hover:text-[#C46A4A]">
                Operaciones
              </a>
            </li>
          </ul>
        </nav>

        <a
          id="headerCta"
          href="/application.html"
          className="hidden rounded-xl border border-cyan-300/70 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.45)] transition-all duration-300 hover:bg-cyan-300/20 hover:shadow-[0_0_24px_rgba(34,211,238,0.8)] sm:inline-flex"
        >
          Aplicar ahora
        </a>
      </div>

      <nav
        id="mobileNav"
        className="px-4 pb-3 transition-all duration-300 sm:px-8 md:hidden"
        aria-label="Navegación móvil"
      >
        <ul className="flex items-center gap-3 overflow-x-auto text-xs font-semibold text-white">
          <li>
            <a
              href="#servicios"
              className="whitespace-nowrap rounded-full border border-cyan-200/35 bg-white/10 px-3 py-1.5"
            >
              Servicios
            </a>
          </li>
          <li>
            <a
              href="#ia-titulo"
              className="whitespace-nowrap rounded-full border border-cyan-200/35 bg-white/10 px-3 py-1.5"
            >
              IA aplicada
            </a>
          </li>
          <li>
            <a
              href="#sectores-titulo"
              className="whitespace-nowrap rounded-full border border-cyan-200/35 bg-white/10 px-3 py-1.5"
            >
              Especialidad
            </a>
          </li>
          <li>
            <a
              href="#organizacion-titulo"
              className="whitespace-nowrap rounded-full border border-cyan-200/35 bg-white/10 px-3 py-1.5"
            >
              Sectores
            </a>
          </li>
          <li>
            <a
              href="#contacto"
              className="whitespace-nowrap rounded-full border border-cyan-200/35 bg-white/10 px-3 py-1.5"
            >
              Contacto
            </a>
          </li>
          <li>
            <a
              href="/login"
              className="whitespace-nowrap rounded-full border border-cyan-200/35 bg-white/10 px-3 py-1.5"
            >
              Operaciones
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default function LandingPage() {
  return (
    <>
      <Header />
      <main id="contenido-principal" className="relative overflow-hidden space-y-5 sm:space-y-9">
        <HeroSection />
        <ServiciosSection />
        <IASection />
        <SectoresSection />
        <OrganizacionSection />
        <TrustSection />
        <ContactSection />
      </main>
      <Footer />
      <TelemetryPanel />
      <LandingScripts />
    </>
  );
}
