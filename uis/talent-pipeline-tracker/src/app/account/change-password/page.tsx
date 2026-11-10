"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { AuthenticationApiError, changePassword } from "@/src/services/auth";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const submissionStarted = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionStarted.current) return;
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (new TextEncoder().encode(newPassword).length > 72) {
      setError("La contraseña no puede superar los 72 bytes.");
      return;
    }

    submissionStarted.current = true;
    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      setSuccess("Tu contraseña se ha actualizado correctamente.");
    } catch (submitError) {
      if (submitError instanceof AuthenticationApiError && submitError.status === 400) {
        setError("La contraseña actual es incorrecta. Revísala e inténtalo de nuevo.");
      } else if (submitError instanceof AuthenticationApiError && submitError.status === 401) {
        setError("Tu sesión ha expirado. Inicia sesión para continuar.");
      } else {
        setError("No se pudo actualizar la contraseña. Comprueba tu conexión e inténtalo de nuevo más tarde.");
      }
    } finally {
      submissionStarted.current = false;
      setIsSubmitting(false);
    }
  }

  const inputClassName =
    "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100";

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10 sm:px-8">
      <header className="mb-6">
        <Link className="text-sm font-medium text-sky-700 hover:underline" href="/account/profile">
          Volver a mi perfil
        </Link>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          Cuenta
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Cambiar contraseña
        </h1>
      </header>

      <form className="max-w-md" onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <fieldset className="space-y-5" disabled={isSubmitting}>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="current-password">
              Contraseña actual
            </label>
            <input
              autoComplete="current-password"
              className={inputClassName}
              id="current-password"
              name="current_password"
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              type="password"
              value={currentPassword}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="new-password">
              Nueva contraseña
            </label>
            <input
              autoComplete="new-password"
              className={inputClassName}
              id="new-password"
              maxLength={72}
              minLength={8}
              name="new_password"
              onChange={(event) => setNewPassword(event.target.value)}
              required
              type="password"
              value={newPassword}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="confirm-password">
              Confirmar nueva contraseña
            </label>
            <input
              autoComplete="new-password"
              className={inputClassName}
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
            className="rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
          >
            {isSubmitting ? "Guardando..." : "Actualizar contraseña"}
          </button>
        </fieldset>

        {error && (
          <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800" role="status">
            {success}
          </p>
        )}
      </form>
    </main>
  );
}