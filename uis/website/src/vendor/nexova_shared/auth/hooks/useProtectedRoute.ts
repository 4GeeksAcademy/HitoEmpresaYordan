"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../api";

/**
 * Hook que verifica si hay un token JWT disponible.
 * Si no lo hay, redirige a /login.
 * Devuelve `true` si el usuario está autenticado.
 */
export function useProtectedRoute(): boolean {
  const router = useRouter();
  const token = getToken();

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [router, token]);

  return !!token;
}