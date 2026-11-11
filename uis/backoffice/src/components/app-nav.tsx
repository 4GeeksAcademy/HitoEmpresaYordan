"use client";

import Link from "next/link";
import { removeToken } from "@/src/services/api";

export function AppNav() {
  function handleLogout() {
    removeToken();
    window.location.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-[#070B16]/95 px-4 backdrop-blur-md">
      <span className="text-base font-extrabold tracking-tight text-white">
        Nexova Backoffice
      </span>
      <div className="flex items-center gap-2">
        <Link href="/account/profile" className="rounded-xl border border-cyan-200/60 bg-cyan-300/15 px-3 py-1.5 text-xs font-bold text-cyan-50">
          Mi perfil
        </Link>
        <button type="button" onClick={handleLogout} className="rounded-xl border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
