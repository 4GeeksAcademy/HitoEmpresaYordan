"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  AuthenticationApiError,
  getCurrentAccount,
  updateAccountProfile,
} from "@/src/services/auth";

const emptyProfile = {
  name: "",
  phone: "",
  address: "",
};

export default function AccountProfilePage() {
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadAccount() {
      try {
        const account = await getCurrentAccount();
        if (!isCurrent) return;
        setEmail(account?.email ?? "");
        setProfile({
          name: account?.profile?.name ?? "",
          phone: account?.profile?.phone ?? "",
          address: account?.profile?.address ?? "",
        });
      } catch (loadError) {
        if (!isCurrent) return;
        setError(
          loadError instanceof AuthenticationApiError
            ? loadError.message
            : "No se pudo cargar tu perfil. Inténtalo de nuevo."
        );
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadAccount();

    return () => {
      isCurrent = false;
    };
  }, [loadAttempt]);

  function retryLoad() {
    setError(null);
    setIsLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const updatedProfile = await updateAccountProfile({
        name: profile.name.trim() || null,
        phone: profile.phone.trim() || null,
        address: profile.address.trim() || null,
      });
      setProfile({
        name: updatedProfile.name ?? "",
        phone: updatedProfile.phone ?? "",
        address: updatedProfile.address ?? "",
      });
      setSuccess("Tus datos de contacto se actualizaron correctamente.");
    } catch (saveError) {
      setError(
        saveError instanceof AuthenticationApiError
          ? saveError.message
          : "No se pudieron guardar los cambios. Inténtalo de nuevo."
      );
    } finally {
      setIsSaving(false);
    }
  }

  const inputClassName =
    "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100";

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10 sm:px-8">
      <header className="mb-6">
        <Link className="text-sm font-medium text-sky-700 hover:underline" href="/">
          ← Volver al pipeline
        </Link>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          Cuenta
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Mi perfil
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Consulta tu cuenta y actualiza tus datos de contacto.
        </p>
        <Link className="mt-4 inline-block text-sm font-semibold text-sky-700 hover:underline" href="/account/change-password">
          Cambiar contraseña
        </Link>
      </header>

      {isLoading ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600" role="status">
          Cargando perfil...
        </p>
      ) : (
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
              <p>{error}</p>
              <button type="button" onClick={retryLoad} className="mt-2 font-semibold underline">
                Reintentar carga
              </button>
              {error.includes("sesión") && (
                <Link className="mt-2 inline-block font-semibold underline" href="/login">
                  Ir a iniciar sesión
                </Link>
              )}
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900">Datos de cuenta</h2>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700">Correo electrónico</p>
              <p className="mt-1 break-all text-sm text-slate-600">
                {email || "No disponible"}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900">Datos de perfil</h2>
            <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="name">
                  Nombre
                </label>
                <input
                  autoComplete="name"
                  className={inputClassName}
                  disabled={!email || isSaving}
                  id="name"
                  maxLength={200}
                  name="name"
                  onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                  type="text"
                  value={profile.name}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="phone">
                  Teléfono
                </label>
                <input
                  autoComplete="tel"
                  className={inputClassName}
                  disabled={!email || isSaving}
                  id="phone"
                  maxLength={50}
                  name="phone"
                  onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
                  type="tel"
                  value={profile.phone}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="address">
                  Dirección
                </label>
                <input
                  autoComplete="street-address"
                  className={inputClassName}
                  disabled={!email || isSaving}
                  id="address"
                  maxLength={500}
                  name="address"
                  onChange={(event) => setProfile((current) => ({ ...current, address: event.target.value }))}
                  type="text"
                  value={profile.address}
                />
              </div>

              {success && (
                <p className="text-sm text-emerald-700" role="status">
                  {success}
                </p>
              )}

              <div>
                <button
                  className="rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!email || isSaving}
                  type="submit"
                >
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}