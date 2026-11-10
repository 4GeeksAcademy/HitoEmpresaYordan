"use client";

import { useState, type FormEvent } from "react";
import { ApiError, login } from "@/src/services/api";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await login(email.trim(), password);
      window.location.replace("/");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudo iniciar sesión. Comprueba tus datos e inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <p className="text-sm font-semibold text-slate-500">Nexova Backoffice</p>
      <h1 className="mt-2 text-2xl font-semibold">Iniciar sesión</h1>
      <form className="mt-6 grid gap-4" onSubmit={handleSubmit} aria-busy={submitting}>
        {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">Correo electrónico</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-slate-700"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-slate-700"
          />
        </div>
        <button type="submit" disabled={submitting} className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-60">
          {submitting ? "Iniciando sesión…" : "Iniciar sesión"}
        </button>
      </form>
    </main>
  );
}