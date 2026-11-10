"use client";

import { LoginForm as SharedLoginForm } from "@nexova/auth";

/**
 * Formulario de inicio de sesión del backoffice.
 * Delega en el componente compartido @nexova/auth con personalización visual.
 */
export function LoginForm() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <SharedLoginForm
        brandText="Nexova Backoffice"
        title="Iniciar sesión"
        labels={{
          email: "Correo electrónico",
          password: "Contraseña",
          submit: "Iniciar sesión",
          submitting: "Iniciando sesión…",
        }}
        onSuccess={() => window.location.replace("/")}
      />
    </main>
  );
}