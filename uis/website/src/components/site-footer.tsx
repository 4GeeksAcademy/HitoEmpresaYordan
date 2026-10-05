import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link className="wordmark footer-wordmark" href="#inicio">
        <span className="wordmark-symbol" aria-hidden="true">N</span>
        <span>NEXOVA</span>
      </Link>
      <p>Headhunting · Soporte al cliente · Formación corporativa</p>
      <Link href="#inicio">Volver arriba ↑</Link>
    </footer>
  );
}