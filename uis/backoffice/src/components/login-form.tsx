"use client";

import { LoginForm as SharedLoginForm } from "@nexova/auth";

/**
 * Formulario de inicio de sesión del backoffice.
 * Delega en el componente compartido @nexova/auth con personalización visual.
 * Mantiene la misma estética oscura de la landing page principal.
 */
export function LoginForm() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      {/* Fondo oscuro con orbes decorativos como en la landing */}
      <div className="fixed inset-0 -z-10 bg-[#070B16]" />
      <div className="fixed -left-16 top-20 h-56 w-56 rounded-full bg-cyan-300/25 blur-[90px] motion-reduce:animate-none -z-10" />
      <div className="fixed right-0 top-24 h-64 w-64 rounded-full bg-fuchsia-300/20 blur-[110px] motion-reduce:animate-none -z-10" />

      <SharedLoginForm
        brandText="Nexova Backoffice"
        title="Iniciar sesión"
        className="rounded-[2rem] border border-white/25 bg-white/10 p-7 text-white shadow-[0_18px_60px_rgba(2,6,23,0.55)] backdrop-blur-2xl"
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