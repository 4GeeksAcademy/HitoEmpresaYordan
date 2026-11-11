"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "../api";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("nexova:auth-change", onChange);
  window.addEventListener("auth:logout", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("nexova:auth-change", onChange);
    window.removeEventListener("auth:logout", onChange);
  };
}

/**
 * Hook que sincroniza el estado del token con `useSyncExternalStore`
 * y redirige según la ruta actual:
 *   - Si hay token y estás en /login → redirige a "/"
 *   - Si NO hay token y NO estás en /login → redirige a "/login"
 *
 * Devuelve el token actual (o null).
 */
export function useAuthGate(): {
  token: string | null;
  isLoginPage: boolean;
} {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";

  const token = useSyncExternalStore(subscribe, getToken, () => null);

  useEffect(() => {
    if (isLoginPage && token) {
      router.replace("/");
    } else if (!isLoginPage && !token) {
      router.replace("/login");
    }
  }, [isLoginPage, router, token]);

  return { token, isLoginPage };
}