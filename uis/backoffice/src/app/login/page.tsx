import type { Metadata } from "next";
import { LoginForm } from "@/src/components/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión | Nexova Backoffice",
};

export default function LoginPage() {
  return <LoginForm />;
}