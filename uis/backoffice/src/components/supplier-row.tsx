"use client";

import { useState } from "react";
import { updateSupplierRate, updateSupplierStatus } from "@/src/services/api";
import { CATEGORY_LABELS, type Supplier } from "@/src/types/supplier";

const RENEWAL_WINDOW_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

function formatRate(amount: number, currency: string) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(amount);
}

function daysUntil(date: string, now: number) {
  return Math.ceil((new Date(`${date}T00:00:00`).getTime() - now) / DAY_MS);
}

interface Props {
  supplier: Supplier;
  now: number;
  onUpdated: (supplier: Supplier) => void;
}

export function SupplierRow({ supplier, now, onUpdated }: Props) {
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState(String(supplier.monthly_rate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = supplier.status === "active";
  const renewalDays = supplier.contract_renewal_date ? daysUntil(supplier.contract_renewal_date, now) : null;
  const renewalSoon = renewalDays !== null && renewalDays >= 0 && renewalDays <= RENEWAL_WINDOW_DAYS;

  async function run(action: () => Promise<Supplier>) {
    setSaving(true);
    setError(null);
    try {
      onUpdated(await action());
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el cambio");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveRate(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(rateInput);
    if (!rateInput.trim() || !Number.isFinite(value) || value <= 0) {
      setError("La tarifa debe ser un número mayor que 0");
      return;
    }
    if (await run(() => updateSupplierRate(supplier.id, value))) setEditingRate(false);
  }

  function startEditing() {
    setRateInput(String(supplier.monthly_rate));
    setError(null);
    setEditingRate(true);
  }

  return (
    <tr
      className={`${isActive ? "" : "bg-slate-50 text-slate-500"} ${
        renewalSoon ? "border-l-4 border-l-amber-400" : ""
      }`}
    >
      <td className="px-4 py-3 align-top">
        <div className={`font-medium ${isActive ? "text-slate-900" : "text-slate-500 line-through decoration-slate-300"}`}>
          {supplier.name}
        </div>
        {supplier.contact_email && <div className="text-xs text-slate-500">{supplier.contact_email}</div>}
        {supplier.contract_renewal_date && (
          <div className="mt-1 text-xs text-slate-500">
            Renovación: {supplier.contract_renewal_date}
            {renewalSoon && (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800">
                {renewalDays === 0 ? "Renueva hoy" : `Renueva en ${renewalDays} días`}
              </span>
            )}
          </div>
        )}
        {error && (
          <div role="alert" className="mt-1 text-xs text-red-600">
            {error}
          </div>
        )}
      </td>
      <td className="px-4 py-3 align-top">{supplier.country}</td>
      <td className="px-4 py-3 align-top">
        <div className="flex flex-wrap gap-1">
          {supplier.categories.map((category) => (
            <span key={category} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              {CATEGORY_LABELS[category] ?? category}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        {editingRate ? (
          <form onSubmit={saveRate} className="flex items-center gap-2">
            <input
              type="number"
              min="0.01"
              step="0.01"
              autoFocus
              aria-label={`Nueva tarifa de ${supplier.name}`}
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className="w-28 rounded-md border border-slate-300 px-2 py-1"
            />
            <span className="text-xs">{supplier.currency}</span>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-slate-900 px-2 py-1 text-xs text-white disabled:opacity-50"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingRate(false);
                setError(null);
              }}
              className="text-xs text-slate-500 underline"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-mono">{formatRate(supplier.monthly_rate, supplier.currency)}</span>
            <button type="button" onClick={startEditing} className="text-xs text-sky-700 underline hover:text-sky-900">
              Editar
            </button>
          </div>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isActive
              ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
              : "bg-rose-100 text-rose-800 ring-1 ring-rose-200"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
          {isActive ? "Activo" : "Suspendido"}
        </span>
      </td>
      <td className="px-4 py-3 text-right align-top">
        <button
          type="button"
          disabled={saving}
          onClick={() => run(() => updateSupplierStatus(supplier.id, isActive ? "suspended" : "active"))}
          className={`rounded-md border px-3 py-1 text-xs font-medium disabled:opacity-50 ${
            isActive
              ? "border-rose-300 text-rose-700 hover:bg-rose-50"
              : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          {isActive ? "Suspender" : "Activar"}
        </button>
      </td>
    </tr>
  );
}
