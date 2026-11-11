"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { registerAccount } from "@/src/services/public-auth";

export default function RegisterPage() {
  const [values, setValues] = useState({
    email: "", password: "", name: "", phone: "", address: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await registerAccount({
        email: values.email.trim(),
        password: values.password,
        ...(values.name.trim() && { name: values.name.trim() }),
        ...(values.phone.trim() && { phone: values.phone.trim() }),
        ...(values.address.trim() && { address: values.address.trim() }),
      });
      window.location.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  const field = "w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-cyan-300";
  const label = "mb-1.5 block text-sm text-white/75";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070B16] px-5 py-10">
      <section className="w-full max-w-xl rounded-3xl border border-white/15 bg-white/[0.07] p-7 text-white shadow-2xl backdrop-blur-xl sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">Nexova Backoffice</p>
        <h1 className="mt-3 text-3xl font-semibold">Crear cuenta</h1>
        <p className="mt-2 text-sm text-white/60">Completá tus datos para registrarte.</p>
        <form onSubmit={submit} className="mt-7 grid gap-4 sm:grid-cols-2">
          <div><label className={label}>Correo electrónico *</label><input className={field} type="email" autoComplete="email" required value={values.email} onChange={e => update("email", e.target.value)} /></div>
          <div><label className={label}>Contraseña *</label><input className={field} type="password" autoComplete="new-password" minLength={8} required value={values.password} onChange={e => update("password", e.target.value)} /></div>
          <div><label className={label}>Nombre</label><input className={field} autoComplete="name" value={values.name} onChange={e => update("name", e.target.value)} /></div>
          <div><label className={label}>Teléfono</label><input className={field} type="tel" autoComplete="tel" value={values.phone} onChange={e => update("phone", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={label}>Dirección</label><input className={field} autoComplete="street-address" value={values.address} onChange={e => update("address", e.target.value)} /></div>
          {error && <p role="alert" className="sm:col-span-2 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
          <button disabled={loading} className="sm:col-span-2 rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-200 disabled:opacity-50">{loading ? "Creando cuenta..." : "Crear cuenta"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-white/65">¿Ya tenés cuenta? <Link className="text-cyan-300 hover:underline" href="/login">Iniciar sesión</Link></p>
      </section>
    </main>
  );
}
