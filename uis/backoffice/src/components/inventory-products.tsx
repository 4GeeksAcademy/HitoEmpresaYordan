"use client";

import { useEffect, useState } from "react";
import { getProducts } from "@/src/services/inventory";
import { ApiError } from "@/src/services/api";
import type { Asset } from "@/src/services/inventory";

// ── Etiquetas para las categorías del briefing ─────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  hardware: "Hardware",
  peripherals: "Periféricos",
  office_supplies: "Material oficina",
  training_materials: "Material formación",
};

const CATEGORY_COLORS: Record<string, string> = {
  hardware: "bg-blue-100 text-blue-800",
  peripherals: "bg-purple-100 text-purple-800",
  office_supplies: "bg-green-100 text-green-800",
  training_materials: "bg-orange-100 text-orange-800",
};

/**
 * Umbral de stock bajo: consideramos "bajo" cualquier producto con
 * current_stock menor que 5 unidades. Se usa como punto de referencia
 * para que el equipo de operaciones pueda reabastecer antes de que
 * se agote el material.
 */
const LOW_STOCK_THRESHOLD = 5;

/**
 * Umbral de stock crítico: current_stock igual a 0. El producto
 * no tiene unidades disponibles hasta que se registre una nueva entrada.
 */
const CRITICAL_STOCK_THRESHOLD = 0;

function StockBadge({ stock }: { stock: number }) {
  if (stock <= CRITICAL_STOCK_THRESHOLD) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
        <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
        Sin stock
      </span>
    );
  }

  if (stock < LOW_STOCK_THRESHOLD) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        {stock} uds. · Bajo
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {stock} uds.
    </span>
  );
}

export function InventoryProducts() {
  const [products, setProducts] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const data = await getProducts(controller.signal);
        setProducts(data);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar los productos. Inténtalo de nuevo.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [reload]);

  function retry() {
    setLoading(true);
    setError(null);
    setReload((prev) => prev + 1);
  }

  // Estadísticas
  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => p.current_stock < LOW_STOCK_THRESHOLD && p.current_stock > CRITICAL_STOCK_THRESHOLD).length;
  const outOfStockCount = products.filter((p) => p.current_stock <= CRITICAL_STOCK_THRESHOLD).length;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Inventario de productos</h1>
        <p className="text-sm text-slate-600">
          {totalProducts} productos ·{" "}
          {outOfStockCount > 0 && (
            <>
              <span className="text-red-600 font-medium">{outOfStockCount} sin stock</span>
              {" · "}
            </>
          )}
          {lowStockCount > 0 && (
            <>
              <span className="text-amber-600 font-medium">{lowStockCount} stock bajo</span>
              {" · "}
            </>
          )}
          {products.filter((p) => p.current_stock >= LOW_STOCK_THRESHOLD).length} stock saludable
        </p>
      </header>

      {error && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button type="button" onClick={retry} className="ml-3 font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table
          className={`w-full text-left text-sm transition-opacity ${loading ? "opacity-60" : ""}`}
        >
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Oficina</th>
              <th className="px-4 py-3 font-medium">Stock actual</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading && products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  Cargando productos…
                </td>
              </tr>
            )}
            {!loading && products.length === 0 && !error && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  No hay productos registrados en el inventario.
                </td>
              </tr>
            )}
            {products.map((product) => (
              <tr
                key={product.id}
                className={
                  product.current_stock <= CRITICAL_STOCK_THRESHOLD
                    ? "bg-red-50/50"
                    : product.current_stock < LOW_STOCK_THRESHOLD
                      ? "bg-amber-50/50"
                      : ""
                }
              >
                <td className="px-4 py-3 font-medium text-slate-900">{product.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{product.sku}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
                      CATEGORY_COLORS[product.category] ?? "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {CATEGORY_LABELS[product.category] ?? product.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{product.office}</td>
                <td className="px-4 py-3">
                  <StockBadge stock={product.current_stock} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <a
                      href={`/inventory/orders/inbound`}
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 transition"
                    >
                      + Entrada
                    </a>
                    <a
                      href={`/inventory/orders/outbound`}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                    >
                      - Salida
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && products.length > 0 && (
        <p className="text-center text-sm text-slate-500">Actualizando…</p>
      )}
    </section>
  );
}
