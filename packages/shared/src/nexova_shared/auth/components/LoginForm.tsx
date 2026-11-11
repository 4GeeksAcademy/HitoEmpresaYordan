"use client";

import { useState, type FormEvent } from "react";
import { ApiError, login } from "../api";

export interface LoginFormLabels {
  email?: string;
  password?: string;
  submit?: string;
  submitting?: string;
}

export interface LoginFormProps {
  /** Callback invocado tras login exitoso. Por defecto recarga la página en "/". */
  onSuccess?: () => void;
  /** Texto de marca mostrado sobre el título. Ej: "Nexova Backoffice" */
  brandText?: string;
  /** Título del formulario. Por defecto: "Iniciar sesión" */
  title?: string;
  /** Enlace a la página de registro (si se muestra). */
  registerHref?: string;
  /** Clases CSS adicionales para personalización visual. */
  className?: string;
  /** Textos personalizables. */
  labels?: LoginFormLabels;
}

/**
 * Componente de formulario de inicio de sesión compartido entre frontends.
 *
 * Acepta props de personalización visual y de comportamiento,
 * mientras centraliza la lógica de autenticación.
 */
export function LoginForm({
  onSuccess,
  brandText,
  title = "Iniciar sesión",
  registerHref,
  className = "",
  labels,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emailLabel = labels?.email ?? "Correo electrónico";
  const passwordLabel = labels?.password ?? "Contraseña";
  const submitLabel = labels?.submit ?? "Iniciar sesión";
  const submittingLabel = labels?.submitting ?? "Iniciando sesión…";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await login(email.trim(), password);
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.replace("/");
      }
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "No se pudo iniciar sesión. Comprueba tus datos e inténtalo de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={className}>
      {brandText && (
        <p className="text-sm font-semibold text-slate-400">{brandText}</p>
      )}
      <h1 className="mt-2 text-2xl font-semibold text-white">{title}</h1>
      <form
        className="mt-6 grid gap-4"
        onSubmit={handleSubmit}
        aria-busy={submitting}
      >
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-400/30 bg-red-900/30 p-3 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        <div>
          <label
            htmlFor="login-email"
            className="mb-1 block text-sm font-medium text-slate-300"
          >
            {emailLabel}
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-white/20 bg-[#0A0E1F] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:border-cyan-400/60 focus:ring-cyan-400/20"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-1 block text-sm font-medium text-slate-300"
          >
            {passwordLabel}
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-white/20 bg-[#0A0E1F] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:border-cyan-400/60 focus:ring-cyan-400/20"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl border border-cyan-200/80 bg-cyan-300/20 py-2.5 text-sm font-bold text-cyan-50 shadow-[0_0_22px_rgba(34,211,238,0.5)] transition hover:-translate-y-0.5 hover:bg-cyan-300/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? submittingLabel : submitLabel}
        </button>

        {registerHref && (
          <p className="text-center text-sm text-slate-400 mt-4">
            ¿No tienes cuenta?{" "}
            <a
              href={registerHref}
              className="font-medium text-cyan-300 hover:underline"
            >
              Registrarse
            </a>
          </p>
        )}
      </form>
    </div>
  );
}