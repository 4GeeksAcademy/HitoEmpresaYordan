"use client";

import type { ReactNode } from "react";
import { useAuthGate } from "../hooks/useAuthGate";

export interface AuthGateProps {
  children: ReactNode;
  /** Componente opcional para renderizar la navegación lateral cuando hay sesión. */
  navComponent?: ReactNode;
}

/**
 * Wrapper de layout que protege rutas y redirige automáticamente.
 *
 * - En /login → renderiza solo los hijos (sin layout).
 * - En rutas protegidas sin token → renderiza null (la redirección ocurre en el hook).
 * - En rutas protegidas con token → renderiza el layout con navegación lateral.
 *
 * Sustituye al antiguo `auth-gate.tsx` del backoffice.
 */
export function AuthGate({ children, navComponent }: AuthGateProps) {
  const { token, isLoginPage } = useAuthGate();

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {navComponent}
      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}