"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  AuthenticationApiError,
  loginUser,
  registerUser,
} from "@/src/services/auth";
import { setAccessToken } from "@/src/services/auth-session";

type RegisterField = "email" | "password" | "name" | "phone" | "address";
type FieldErrors = Partial<Record<RegisterField, string[]>>;

const FIELD_LABELS: Record<RegisterField, string> = {
  email: "Correo electrónico",
  password: "Contraseña",
  name: "Nombre",
  phone: "Teléfono",
  address: "Dirección",
};

function parseValidationErrors(body: unknown): { fields: FieldErrors; general: string[] } {
  const fields: FieldErrors = {};
  const general: string[] = [];

  if (!body || typeof body !== "object") return { fields, general };
  const detail = (body as Record<string, unknown>).detail;
  if (!Array.isArray(detail)) return { fields, general };

  for (const issue of detail) {
    if (!issue || typeof issue !== "object") continue;

    const item = issue as { loc?: unknown; msg?: unknown };
    const location = Array.isArray(item.loc) ? item.loc.map(String) : [];
    const field = location.filter((part) => part !== "body").at(-1) as RegisterField | undefined;
    const message = typeof item.msg === "string" ? item.msg : "Valor no válido.";

    if (field && field in FIELD_LABELS) {
      fields[field] = [...(fields[field] ?? []), message];
    } else {
      general.push(`${location.join(" → ") || "Formulario"}: ${message}`);
    }
  }

  return { fields, general };
}

function fieldErrorId(field: RegisterField): string {
  return `${field}-error`;
}

export default function RegisterPage() {
  const router = useRouter();
  const [values, setValues] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    address: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: RegisterField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setError(null);
    setIsSubmitting(true);

    let accountCreated = false;

    try {
      await registerUser({
        email: values.email.trim(),
        password: values.password,
        ...(values.name.trim() ? { name: values.name.trim() } : {}),
        ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
        ...(values.address.trim() ? { address: values.address.trim() } : {}),
      });
      accountCreated = true;

      const { access_token: accessToken } = await loginUser(
        values.email.trim(),
        values.password
      );
      setAccessToken(accessToken);
      router.replace("/");
    } catch (submitError) {
      if (submitError instanceof AuthenticationApiError && submitError.status === 422) {
        const validation = parseValidationErrors(submitError.body);
        setFieldErrors(validation.fields);
        setError(
          validation.general.length > 0
            ? validation.general.join(" ")
            : Object.keys(validation.fields).length === 0
              ? submitError.message
              : null
        );
      } else if (accountCreated) {
        setError(
          "La cuenta se creó, pero no se pudo iniciar sesión automáticamente. Inicia sesión con tus credenciales."
        );
      } else {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "No se pudo completar el registro. Revisa los datos e inténtalo de nuevo."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderFieldError(field: RegisterField) {
    const messages = fieldErrors[field];
    if (!messages?.length) return null;

    return (
      <ul className="mt-1.5 space-y-1 text-sm text-rose-700" id={fieldErrorId(field)}>
        {messages.map((message, index) => (
          <li key={`${field}-${index}`}>{message}</li>
        ))}
      </ul>
    );
  }

  const inputClassName =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          TrackFlow · People Talent
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          Crear cuenta
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Regístrate para acceder al pipeline de candidaturas.
        </p>

        <form className="mt-7 grid gap-x-4 gap-y-5 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="email">
              Correo electrónico
            </label>
            <input
              aria-describedby={fieldErrors.email ? fieldErrorId("email") : undefined}
              aria-invalid={Boolean(fieldErrors.email?.length)}
              autoComplete="email"
              className={inputClassName}
              id="email"
              name="email"
              onChange={(event) => updateField("email", event.target.value)}
              required
              type="email"
              value={values.email}
            />
            {renderFieldError("email")}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="password">
              Contraseña
            </label>
            <input
              aria-describedby={fieldErrors.password ? fieldErrorId("password") : undefined}
              aria-invalid={Boolean(fieldErrors.password?.length)}
              autoComplete="new-password"
              className={inputClassName}
              id="password"
              minLength={8}
              name="password"
              onChange={(event) => updateField("password", event.target.value)}
              required
              type="password"
              value={values.password}
            />
            {renderFieldError("password")}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="name">
              Nombre <span className="font-normal text-slate-500">(opcional)</span>
            </label>
            <input
              aria-describedby={fieldErrors.name ? fieldErrorId("name") : undefined}
              aria-invalid={Boolean(fieldErrors.name?.length)}
              autoComplete="name"
              className={inputClassName}
              id="name"
              maxLength={200}
              name="name"
              onChange={(event) => updateField("name", event.target.value)}
              type="text"
              value={values.name}
            />
            {renderFieldError("name")}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="phone">
              Teléfono <span className="font-normal text-slate-500">(opcional)</span>
            </label>
            <input
              aria-describedby={fieldErrors.phone ? fieldErrorId("phone") : undefined}
              aria-invalid={Boolean(fieldErrors.phone?.length)}
              autoComplete="tel"
              className={inputClassName}
              id="phone"
              maxLength={50}
              name="phone"
              onChange={(event) => updateField("phone", event.target.value)}
              type="tel"
              value={values.phone}
            />
            {renderFieldError("phone")}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="address">
              Dirección <span className="font-normal text-slate-500">(opcional)</span>
            </label>
            <input
              aria-describedby={fieldErrors.address ? fieldErrorId("address") : undefined}
              aria-invalid={Boolean(fieldErrors.address?.length)}
              autoComplete="street-address"
              className={inputClassName}
              id="address"
              maxLength={500}
              name="address"
              onChange={(event) => updateField("address", event.target.value)}
              type="text"
              value={values.address}
            />
            {renderFieldError("address")}
          </div>

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800 sm:col-span-2" role="alert">
              {error}
            </p>
          )}

          <div className="sm:col-span-2">
            <button
              className="w-full rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Ya tienes cuenta?{" "}
          <Link className="font-semibold text-sky-700 underline-offset-2 hover:underline" href="/login">
            Inicia sesión
          </Link>
        </p>
      </section>
    </main>
  );
}