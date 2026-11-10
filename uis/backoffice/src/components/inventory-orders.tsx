"use client";

import { useEffect, useState } from "react";
import { getOrders } from "@/src/services/inventory";
import { ApiError } from "@/src/services/api";
import type { AssetOrderEntry } from "@/src/services/inventory";

/**
 * Componente de solo lectura que muestra el historial completo de órdenes
 * de inventario (entradas y salidas) con datos del producto asociado.
 *
 * Es estrictamente de solo lectura: no incluye botones de edición ni borrado.
 * La protección de ruta la proporciona AuthGate en layout.tsx.
 */

function OrderTypeBadge({ orderType }: { orderType: "entry" | "exit" }) {
  if (orderType === "entry") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Entrada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Salida
    </span>
  );
}

function ExitTypeLabel({ exitType }: { exitType: string | null }) {
  if (exitType === "allocation") return <span className="text-slate-600">Asignación</span>;
  if (exitType === "consumption") return <span className="text-slate-600">Consumo</span>;
  return null;
}

function formatDateTime(iso: string): string {
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return iso;
  }
}

function formatUserUuid(uuid: string): string {
  // Muestra solo los primeros 8 caracteres del UUID para mantener la tabla legible
  if (uuid.length > 8) return `${uuid.slice(0, 8)}…`;
  return uuid;
}

export function InventoryOrders() {
  const [orders, setOrders] = useState<AssetOrderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const data = await getOrders(controller.signal);
        // Ordenar por id descendente (más recientes primero)
        const sorted = [...data].sort((a, b) => b.id - a.id);
        setOrders(sorted);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar las órdenes. Inténtalo de nuevo.",
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

  const entriesCount = orders.filter((o) => o.order_type === "entry").length;
  const exitsCount = orders.filter((o) => o.order_type === "exit").length;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Historial de órdenes</h1>
        <p className="text-sm text-slate-600">
          {orders.length} órdenes · {entriesCount} entradas · {exitsCount} salidas
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
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Cantidad</th>
              <th className="px-4 py-3 font-medium">Detalle</th>
              <th className="px-4 py-3 font-medium">Oficina</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Usuario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading && orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  Cargando órdenes…
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && !error && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  No hay órdenes registradas.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={`${order.order_type}-${order.id}`} className="hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <OrderTypeBadge orderType={order.order_type} />
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {order.asset_name ?? `ID ${order.asset_id}`}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {order.asset_sku ?? "—"}
                </td>
                <td className="px-4 py-3 tabular-nums text-slate-900">
                  {order.quantity} uds.
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {order.order_type === "entry" && order.supplier && (
                    <span>Proveedor: {order.supplier}</span>
                  )}
                  {order.order_type === "exit" && (
                    <>
                      <ExitTypeLabel exitType={order.exit_type} />
                      {order.assigned_to && (
                        <span className="ml-2">→ {order.assigned_to}</span>
                      )}
                    </>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700">{order.office}</td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                  {formatDateTime(order.created_at)}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400" title={order.user_uuid}>
                  {formatUserUuid(order.user_uuid)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && orders.length > 0 && (
        <p className="text-center text-sm text-slate-500">Actualizando…</p>
      )}
    </section>
  );
}
