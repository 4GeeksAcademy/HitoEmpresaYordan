"use client";

import { useRouter } from "next/navigation";
import { LoginForm as SharedLoginForm } from "@nexova/auth";

/**
 * Formulario de inicio de sesión del website corporativo.
 * Delega en el componente compartido @nexova/auth con personalización visual.
 */
export default function LoginForm() {
  const router = useRouter();

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <SharedLoginForm
        title="Sign In"
        registerHref="/register"
        labels={{
          email: "Email",
          password: "Password",
          submit: "Sign In",
          submitting: "Signing in...",
        }}
        onSuccess={() => router.push("/dashboard")}
      />
    </div>
  );
}
