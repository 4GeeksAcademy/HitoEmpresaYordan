"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { saveNewPassword } from "@/src/services/public-auth";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!token) return setError("El enlace no contiene un token válido. Solicitá uno nuevo.");
    if (password !== confirmation) return setError("Las contraseñas no coinciden.");
    setLoading(true);
    try {
      const result = await saveNewPassword(token, password);
      setMessage(result.message || "Contraseña restablecida correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo restablecer la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070B16] px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-white/15 bg-white/[0.07] p-8 text-white shadow-2xl backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">Nexova Backoffice</p>
        <h1 className="mt-3 text-3xl font-semibold">Nueva contraseña</h1>
        <p className="mt-3 text-sm text-white/60">Ingresá y confirmá tu nueva contraseña.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm text-white/75" htmlFor="password">Nueva contraseña</label>
          <input id="password" className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300" type="password" minLength={8} autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} />
          <label className="block text-sm text-white/75" htmlFor="confirmation">Confirmar contraseña</label>
          <input id="confirmation" className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300" type="password" minLength={8} autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} />
          {message && <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200">{message} <Link className="underline" href="/login">Iniciar sesión</Link></p>}
          {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
          <button disabled={loading || Boolean(message)} className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">{loading ? "Guardando..." : "Restablecer contraseña"}</button>
        </form>
        <p className="mt-6 text-center text-sm"><Link className="text-cyan-300 hover:underline" href="/login">Volver al inicio de sesión</Link></p>
      </section>
    </main>
  );
}
