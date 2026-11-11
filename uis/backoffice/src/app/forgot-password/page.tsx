"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { sendPasswordReset } from "@/src/services/public-auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await sendPasswordReset(email.trim());
      setMessage(result.message || "Si la cuenta existe, recibirás un enlace para restablecer la contraseña.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la solicitud.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070B16] px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-white/15 bg-white/[0.07] p-8 text-white shadow-2xl backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">Nexova Backoffice</p>
        <h1 className="mt-3 text-3xl font-semibold">Recuperar contraseña</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">Ingresá el correo asociado a tu cuenta. Si existe, recibirás un enlace para crear una contraseña nueva.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm text-white/75" htmlFor="email">Correo electrónico</label>
          <input id="email" className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
          {message && <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200">{message}</p>}
          {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">{loading ? "Enviando..." : "Enviar enlace"}</button>
        </form>
        <p className="mt-6 text-center text-sm"><Link className="text-cyan-300 hover:underline" href="/login">Volver al inicio de sesión</Link></p>
      </section>
    </main>
  );
}
