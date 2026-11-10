"use client";

import type { ReactNode } from "react";
import { AuthGate as SharedAuthGate } from "@nexova/auth";
import { AppNav } from "@/src/components/app-nav";

export function AuthGate({ children }: { children: ReactNode }) {
  return (
    <SharedAuthGate navComponent={<AppNav />}>
      {children}
    </SharedAuthGate>
  );
}