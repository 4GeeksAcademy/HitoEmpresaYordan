"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearAccessToken,
  getAccessTokenExpiration,
  getAccessTokenSnapshot,
  getServerAccessTokenSnapshot,
  isAccessTokenValid,
  subscribeToAuthSession,
} from "@/src/services/auth-session";

const PUBLIC_PATHS = new Set(["/login", "/register", "/forgot-password", "/reset-password"]);

export function AuthGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useSyncExternalStore(
    subscribeToAuthSession,
    getAccessTokenSnapshot,
    getServerAccessTokenSnapshot
  );
  const isPublicRoute = PUBLIC_PATHS.has(pathname);
  const hasValidSession = isAccessTokenValid(accessToken);

  useEffect(() => {
    if (isPublicRoute) return;

    if (!hasValidSession) {
      if (accessToken) clearAccessToken();
      router.replace("/login");
      return;
    }

    const expiration = getAccessTokenExpiration(accessToken);
    if (expiration === null) {
      clearAccessToken();
      router.replace("/login");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearAccessToken();
      router.replace("/login");
    }, Math.max(expiration - Date.now(), 0));

    return () => window.clearTimeout(timeoutId);
  }, [accessToken, hasValidSession, isPublicRoute, router]);

  if (isPublicRoute || hasValidSession) return children;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-sm text-slate-600" role="status">
      Verificando sesión...
    </main>
  );
}