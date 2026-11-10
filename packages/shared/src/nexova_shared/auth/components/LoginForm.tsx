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
        <p className="text-sm font-semibold text-slate-500">{brandText}</p>
      )}
      <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
      <form
        className="mt-6 grid gap-4"
        onSubmit={handleSubmit}
        aria-busy={submitting}
      >
        {error && (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div>
          <label
            htmlFor="login-email"
            className="mb-1 block text-sm font-medium"
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
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-slate-700"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-1 block text-sm font-medium"
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
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-slate-700"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {submitting ? submittingLabel : submitLabel}
        </button>

        {registerHref && (
          <p className="text-center text-sm text-slate-600">
            ¿No tienes cuenta?{" "}
            <a
              href={registerHref}
              className="font-medium text-blue-600 hover:underline"
            >
              Registrarse
            </a>
          </p>
        )}
      </form>
    </div>
  );
}