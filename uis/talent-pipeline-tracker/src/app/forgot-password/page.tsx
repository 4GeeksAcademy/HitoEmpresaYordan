"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { requestPasswordReset } from "@/src/services/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const submissionStarted = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionStarted.current) return;
    submissionStarted.current = true;
    setIsSubmitting(true);

    await requestPasswordReset(email.trim()).catch(() => undefined);
    setIsSubmitted(true);
    setIsSubmitting(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          Nexova · People Talent
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">
          Recuperar contraseña
        </h1>

        <form className="mt-7" onSubmit={handleSubmit} aria-busy={isSubmitting}>
          <fieldset className="space-y-5" disabled={isSubmitting || isSubmitted}>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Correo electrónico
              </label>
              <input
                autoComplete="email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50"
                id="email"
                maxLength={254}
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </div>
            <button
              className="w-full rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
            >
              {isSubmitting ? "Enviando..." : isSubmitted ? "Solicitud enviada" : "Enviar enlace"}
            </button>
          </fieldset>
        </form>

        {isSubmitted && (
          <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800" role="status">
            Si esa dirección está registrada, recibirás un enlace en breve
          </p>
        )}

        <Link className="mt-6 inline-block text-sm font-semibold text-sky-700 underline-offset-2 hover:underline" href="/login">
          Volver a iniciar sesión
        </Link>
      </section>
    </main>
  );
}