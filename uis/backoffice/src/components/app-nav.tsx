"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import { removeToken } from "@/src/services/api";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/suppliers", label: "Proveedores" },
  { href: "/inventory/products", label: "Inventario" },
  { href: "/inventory/orders", label: "Órdenes" },
  { href: "/pricing", label: "Calcular tarifas" },
];

export function AppNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const handleLogout = useCallback(() => {
    removeToken();
    window.location.replace("/login");
  }, []);

  return (
    <>
      {/* ─── Navbar superior ─── */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-[#070B16]/95 px-4 backdrop-blur-md">
        {/* Izquierda: hamburguesa + marca */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
          <span className="text-base font-extrabold tracking-tight text-white">
            Nexova Backoffice
          </span>
        </div>

        {/* Derecha: Mi perfil + Cerrar sesión */}
        <div className="flex items-center gap-2">
          <Link
            href="/account/profile"
            className="inline-flex items-center justify-center rounded-xl border border-cyan-200/60 bg-cyan-300/15 px-3 py-1.5 text-xs font-bold text-cyan-50 shadow-[0_0_12px_rgba(34,211,238,0.3)] transition hover:-translate-y-0.5 hover:bg-cyan-300/25"
          >
            Mi perfil
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/20"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* ─── Menú hamburguesa (sidebar) ─── */}
      {menuOpen && (
        <>
          {/* Overlay para cerrar al hacer clic fuera */}
          <div
            className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <aside className="fixed left-0 top-14 z-20 h-[calc(100vh-3.5rem)] w-64 border-r border-white/10 bg-[#070B16] p-4 shadow-2xl">
            <nav className="flex flex-col gap-1">
              {LINKS.map((link) => {
                const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                      active
                        ? "border border-cyan-200/60 bg-cyan-300/15 text-cyan-50 shadow-[0_0_12px_rgba(34,211,238,0.3)]"
                        : "border border-transparent text-slate-100/85 hover:border-white/20 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
