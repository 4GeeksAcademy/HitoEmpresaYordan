"use client";

import { useRouter } from "next/navigation";
import { LoginForm as SharedLoginForm } from "@nexova/auth";

/**
 * Formulario de inicio de sesión del website corporativo.
 * Delega en el componente compartido @nexova/auth con personalización visual.
 * Adaptado al tono oscuro de la landing page (#070B16).
 */
export default function LoginForm() {
  const router = useRouter();

  return (
    <div className="w-full max-w-md mx-auto">
      <SharedLoginForm
        brandText="Nexova Solutions"
        title="Iniciar sesión"
        registerHref="/register"
        className="rounded-[2rem] border border-white/25 bg-white/10 p-7 text-white shadow-[0_18px_60px_rgba(2,6,23,0.55)] backdrop-blur-2xl"
        labels={{
          email: "Correo electrónico",
          password: "Contraseña",
          submit: "Iniciar sesión",
          submitting: "Iniciando sesión…",
        }}
        onSuccess={() => router.push("/dashboard")}
      />
    </div>
  );
}
