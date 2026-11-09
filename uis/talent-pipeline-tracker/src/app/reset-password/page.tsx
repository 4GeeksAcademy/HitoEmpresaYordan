"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AuthenticationApiError, resetPassword } from "@/src/services/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInvalidToken, setIsInvalidToken] = useState(false);
  const submissionStarted = useRef(false);
  const missingToken = !token.trim();
  const errorMessage = missingToken
    ? "El enlace de recuperación no contiene un token válido. Solicita un nuevo enlace."
    : error;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionStarted.current || missingToken || isInvalidToken) return;
    setError(null);
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError("La contraseña no puede superar los 72 bytes.");
      return;
    }

    submissionStarted.current = true;
    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      router.replace("/login?passwordReset=success");
    } catch (submitError) {
      if (submitError instanceof AuthenticationApiError && submitError.status === 400) {
        setIsInvalidToken(true);
        setError("Este enlace es inválido, ha caducado o ya se ha utilizado. Solicita un nuevo enlace.");
      } else {
        setError("No se pudo restablecer la contraseña. Comprueba tu conexión e inténtalo de nuevo.");
      }
      submissionStarted.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          TrackFlow · People Talent
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">
          Restablecer contraseña
        </h1>

        <form className="mt-7" onSubmit={handleSubmit} aria-busy={isSubmitting}>
          <fieldset className="space-y-5" disabled={isSubmitting || missingToken || isInvalidToken}>
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Nueva contraseña
              </label>
              <input
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50"
                id="new-password"
                maxLength={72}
                minLength={8}
                name="new_password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Confirmar contraseña
              </label>
              <input
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50"
                id="confirm-password"
                maxLength={72}
                minLength={8}
                name="confirm_password"
                onChange={(event) => setConfirmation(event.target.value)}
                required
                type="password"
                value={confirmation}
              />
            </div>
            <button
              className="w-full rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
            >
              {isSubmitting ? "Guardando..." : "Guardar contraseña"}
            </button>
          </fieldset>
        </form>

        {errorMessage && (
          <div className="mt-5 space-y-3">
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800" role="alert">
              {errorMessage}
            </p>
            <Link className="inline-block text-sm font-semibold text-sky-700 underline-offset-2 hover:underline" href="/forgot-password">
              Solicitar un nuevo enlace
            </Link>
          </div>
        )}

        <Link className="mt-6 inline-block text-sm font-semibold text-sky-700 underline-offset-2 hover:underline" href="/login">
          Volver a iniciar sesión
        </Link>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center px-4" role="status">Cargando...</main>}>
      <ResetPasswordForm />
    </Suspense>
  );
}