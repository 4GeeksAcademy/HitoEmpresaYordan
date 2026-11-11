import type { Metadata } from "next";
import { LoginForm } from "@/src/components/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión | Nexova Backoffice",
};

export default function LoginPage() {
  return (
    <div className="fixed inset-0 bg-[#070B16]">
      <LoginForm />
    </div>
  );
}