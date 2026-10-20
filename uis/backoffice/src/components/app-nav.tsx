"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/suppliers", label: "Proveedores" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-slate-200 bg-slate-900 text-slate-100 md:w-60 md:border-b-0 md:border-r">
      <div className="px-6 py-5 text-lg font-semibold tracking-tight">Nexova Backoffice</div>
      <nav className="flex gap-1 px-3 pb-4 md:flex-col">
        {LINKS.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                active ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
