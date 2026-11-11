import Link from "next/link";

const navigation = [
  { href: "#servicios", label: "Servicios" },
  { href: "#proceso", label: "Cómo trabajamos" },
  { href: "#tarifas", label: "Tarifas" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="#inicio" aria-label="Nexova, inicio">
        <span className="wordmark-symbol" aria-hidden="true">N</span>
        <span>NEXOVA</span>
      </Link>
      <nav className="desktop-nav" aria-label="Navegación principal">
        {navigation.map((item) => (
          <Link href={item.href} key={item.href}>{item.label}</Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <Link
          className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20"
          href="/login"
        >
          Iniciar sesión
        </Link>
        <Link className="header-cta" href="#tarifas">Calcular una tarifa <span aria-hidden="true">↗</span></Link>
      </div>
      <details className="mobile-nav">
        <summary aria-label="Abrir menú de navegación">Menú</summary>
        <nav aria-label="Navegación móvil">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
          <Link href="/login">Iniciar sesión</Link>
          <Link href="#tarifas">Calcular una tarifa</Link>
        </nav>
      </details>
    </header>
  );
}