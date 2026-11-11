"use client";

import type { ReactNode } from "react";
import { useAuthGate } from "@nexova/auth";
import { AppNav } from "@/src/components/app-nav";

/**
 * Wrapper del backoffice que gestiona la autenticación y el layout.
 *
 * - En /login → renderiza solo los hijos.
 * - Sin token → renderiza null (el hook redirige).
 * - Con token → renderiza el layout con AppNav y contenido scrolleable.
 *
 * El padding-top pt-14 compensa el header sticky de 56px (h-14).
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { token, isLoginPage } = useAuthGate();

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <main className="flex-1">{children}</main>
    </div>
  );
}