"use client";

import { type ReactNode, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../api";

export interface ProtectedLayoutProps {
  children: ReactNode;
  /** Texto personalizado para el estado de carga. Por defecto: "Loading..." */
  loadingText?: string;
}

/**
 * Wrapper que protege una ruta mostrando un spinner de carga
 * mientras verifica la autenticación.
 *
 * Sustituye al antiguo `protected-layout.tsx` del website.
 */
export function ProtectedLayout({
  children,
  loadingText = "Loading...",
}: ProtectedLayoutProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      setIsLoading(false);
      return;
    }
    setIsAuthorized(true);
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="mt-4 text-gray-600">{loadingText}</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}