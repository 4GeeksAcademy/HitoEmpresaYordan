"use client";

import { useEffect, useState } from "react";
import { SupplierForm } from "@/src/components/supplier-form";
import { SupplierRow } from "@/src/components/supplier-row";
import { listSuppliers } from "@/src/services/api";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  COUNTRIES,
  type Country,
  type Supplier,
  type SupplierCategory,
  type SupplierFilters,
} from "@/src/types/supplier";

function matchesFilters(supplier: Supplier, filters: SupplierFilters) {
  return (
    (!filters.country || supplier.country === filters.country) &&
    (!filters.category || supplier.categories.includes(filters.category))
  );
}

export function SupplierDirectory() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filters, setFilters] = useState<SupplierFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const controller = new AbortController();
    listSuppliers(filters, controller.signal)
      .then((data) => {
        setSuppliers(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Error al cargar los proveedores");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filters]);

  function updateFilters(next: SupplierFilters) {
    setLoading(true);
    setFilters(next);
  }

  function handleCreated(created: Supplier) {
    if (matchesFilters(created, filters)) {
      setSuppliers((prev) => [...prev, created]);
    }
    setShowForm(false);
  }

  function handleUpdated(updated: Supplier) {
    setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  const activeCount = suppliers.filter((s) => s.status === "active").length;
  const suspendedCount = suppliers.length - activeCount;
  const hasFilters = Boolean(filters.country || filters.category);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Directorio de proveedores</h1>
          <p className="text-sm text-slate-600">
            {suppliers.length} proveedores · {activeCount} activos · {suspendedCount} suspendidos
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          {showForm ? "Cerrar formulario" : "Nuevo proveedor"}
        </button>
      </header>

      {showForm && <SupplierForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />}

      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">País</span>
          <select
            value={filters.country ?? ""}
            onChange={(e) =>
              updateFilters({ ...filters, country: (e.target.value || undefined) as Country | undefined })
            }
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Todos</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Categoría</span>
          <select
            value={filters.category ?? ""}
            onChange={(e) =>
              updateFilters({
                ...filters,
                category: (e.target.value || undefined) as SupplierCategory | undefined,
              })
            }
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Todas</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>
        {hasFilters && (
          <button
            type="button"
            onClick={() => updateFilters({})}
            className="rounded-md px-3 py-2 text-sm text-slate-600 underline hover:text-slate-900"
          >
            Limpiar filtros
          </button>
        )}
        {loading && <span className="text-sm text-slate-500">Cargando…</span>}
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className={`w-full text-left text-sm transition-opacity ${loading ? "opacity-60" : ""}`}>
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">País</th>
              <th className="px-4 py-3">Categorías</th>
              <th className="px-4 py-3">Tarifa mensual</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map((supplier) => (
              <SupplierRow key={supplier.id} supplier={supplier} now={now} onUpdated={handleUpdated} />
            ))}
            {!loading && suppliers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  {hasFilters ? "Ningún proveedor coincide con los filtros." : "No hay proveedores registrados."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
