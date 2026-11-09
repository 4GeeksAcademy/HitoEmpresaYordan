"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppNav } from "@/src/components/app-nav";
import { getToken } from "@/src/services/api";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("nexova:auth-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("nexova:auth-change", onChange);
  };
}

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";
  const token = useSyncExternalStore(subscribe, getToken, () => null);

  useEffect(() => {
    if (isLoginPage && token) router.replace("/");
    else if (!isLoginPage && !token) router.replace("/login");
  }, [isLoginPage, router, token]);

  if (isLoginPage) return children;
  if (!token) return null;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppNav />
      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}