export type FooterSectionProps = {
  year?: number;
};

export function FooterSection({ year = new Date().getFullYear() }: FooterSectionProps) {
  return (
    <footer className="mt-8 border-t border-white/20 bg-[#050916]/70 text-white backdrop-blur-xl">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-8">
        <div>
          <p className="text-lg font-extrabold text-white">Nexova Solutions</p>
          <p className="mt-2 text-sm text-slate-200/85">
            15 anos construyendo soluciones de talento para empresas que necesitan crecer con control y agilidad.
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
          <p className="mt-2 text-sm text-slate-200/85">Valencia, Espana</p>
          <p className="text-sm text-slate-200/85">Miami, Florida</p>
          <p className="mt-4 text-xs text-slate-300/80">{year} Nexova Solutions. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
