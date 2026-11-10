"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getProducts,
  createOutboundOrder,
  type Asset,
  type AssetExitRead,
} from "@/src/services/inventory";
import { ApiError, getToken } from "@/src/services/api";

const OFFICES = ["Valencia", "Miami"] as const;

interface FormState {
  asset_id: string;
  quantity: string;
  exit_type: "allocation" | "consumption";
  assigned_to: string;
  office: string;
}

const EMPTY_FORM: FormState = {
  asset_id: "",
  quantity: "",
  exit_type: "allocation",
  assigned_to: "",
  office: "",
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

/**
 * Umbral de stock bajo para advertencia visual: si la cantidad solicitada
 * deja al producto con menos de 3 unidades después de la salida, se muestra
 * una advertencia adicional al usuario.
 */
const POST_EXIT_WARNING_THRESHOLD = 3;

function decodeUserUuid(): string {
  const token = getToken();
  if (!token) return "";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // El JWT tiene "sub" = user_id (int de TinyDB).
    // El briefing indica usar el UUID del usuario de TinyDB; convertimos
    // el id numérico a string como identificador único del usuario.
    return String(payload.sub ?? "");
  } catch {
    return "";
  }
}

function validate(form: FormState, availableStock: number): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.asset_id) errors.asset_id = "Selecciona un producto";
  if (!form.quantity.trim() || !Number.isFinite(Number(form.quantity)) || Number(form.quantity) < 1) {
    errors.quantity = "La cantidad debe ser un número mayor o igual a 1";
  } else if (Number(form.quantity) > availableStock) {
    errors.quantity = `Stock insuficiente. Disponible: ${availableStock}, solicitado: ${Number(form.quantity)}.`;
  }
  if (!form.office) errors.office = "Selecciona una oficina";
  if (form.exit_type === "allocation" && !form.assigned_to.trim()) {
    errors.assigned_to = "El nombre del empleado es obligatorio para asignaciones";
  }
  return errors;
}

/**
 * Componente para registrar una salida de inventario (asignación o consumo).
 *
 * - Al seleccionar un producto, muestra su stock disponible en tiempo real.
 * - Si la cantidad supera el stock, muestra una advertencia visual inmediata.
 * - Si la API responde con HTTP 400 (stock insuficiente), captura y muestra
 *   el mensaje de error de la API junto al campo de cantidad.
 */
export function InventoryOrderOutbound() {
  const [products, setProducts] = useState<Asset[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<AssetExitRead | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await getProducts(controller.signal);
        setProducts(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError) {
          setApiError(err.message);
        }
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  // Producto seleccionado con su stock disponible
  const selectedProduct: Asset | undefined = useMemo(
    () => products.find((p) => p.id === Number(form.asset_id)),
    [products, form.asset_id],
  );

  const availableStock = selectedProduct?.current_stock ?? 0;

  // Stock restante estimado después de la salida (solo para advertencia visual)
  const estimatedRemaining = useMemo(() => {
    const qty = Number(form.quantity);
    if (!form.asset_id || !Number.isFinite(qty) || qty < 1) return null;
    return availableStock - qty;
  }, [form.asset_id, form.quantity, availableStock]);

  // Advertencia si la salida dejaría stock bajo
  const lowStockWarning = useMemo(() => {
    if (estimatedRemaining === null) return null;
    if (estimatedRemaining < 0) {
      return `La cantidad solicitada (${Number(form.quantity)}) supera el stock disponible (${availableStock}). Reduce la cantidad.`;
    }
    if (estimatedRemaining < POST_EXIT_WARNING_THRESHOLD && estimatedRemaining >= 0) {
      return `Tras esta salida quedarán ${estimatedRemaining} uds. (stock bajo). Considera reabastecer pronto.`;
    }
    return null;
  }, [estimatedRemaining, availableStock, form.quantity]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    // Limpiar el error de cantidad específico cuando cambia el campo
    if (key === "quantity" || key === "asset_id") {
      setQuantityError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    setQuantityError(null);
    setSuccess(null);

    const fieldErrors = validate(form, availableStock);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    const user_uuid = decodeUserUuid();
    if (!user_uuid) {
      setApiError("No se pudo identificar al usuario. Inicia sesión de nuevo.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createOutboundOrder({
        asset_id: Number(form.asset_id),
        quantity: Number(form.quantity),
        exit_type: form.exit_type,
        assigned_to:
          form.exit_type === "allocation" ? form.assigned_to.trim() : null,
        office: form.office,
        user_uuid,
      });
      setSuccess(result);
      setForm(EMPTY_FORM);
    } catch (err) {
      if (err instanceof ApiError) {
        // Mostrar el error de la API en el campo de cantidad si es 400 por stock
        if (err.status === 400) {
          setQuantityError(err.message);
        } else {
          setApiError(err.message);
        }
      } else {
        setApiError(
          "No se pudo registrar la salida. Revisa los datos e inténtalo de nuevo.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field: keyof FormState) =>
    `rounded-md border px-3 py-2 ${errors[field] ? "border-red-400" : "border-slate-300"}`;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Registrar salida de inventario</h1>
        <p className="text-sm text-slate-600">
          Registra una asignación a un empleado o un evento de consumo.
        </p>
      </header>

      {apiError && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong className="font-semibold">Error: </strong>
          {apiError}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <strong className="font-semibold">✅ Salida registrada correctamente.</strong>
          <ul className="mt-2 list-inside list-disc space-y-1 text-emerald-700">
            <li>
              Producto:{" "}
              {products.find((p) => p.id === success.asset_id)?.name ?? `ID ${success.asset_id}`}
            </li>
            <li>Cantidad: {success.quantity} uds.</li>
            <li>Tipo: {success.exit_type === "allocation" ? "Asignación" : "Consumo"}</li>
            {success.assigned_to && <li>Asignado a: {success.assigned_to}</li>}
            <li>Oficina: {success.office}</li>
          </ul>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="max-w-lg space-y-4 rounded-lg border border-slate-200 bg-white p-6"
      >
        {/* Producto */}
        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor="asset_id" className="font-medium">
            Producto *
          </label>
          <select
            id="asset_id"
            value={form.asset_id}
            onChange={(e) => setField("asset_id", e.target.value)}
            className={inputClass("asset_id")}
          >
            <option value="">Selecciona un producto…</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku}) — {product.office}
              </option>
            ))}
          </select>
          {errors.asset_id && (
            <span className="text-xs text-red-600">{errors.asset_id}</span>
          )}

          {/* Stock disponible mostrado de forma reactiva al seleccionar producto */}
          {selectedProduct && (
            <div
              className={`mt-2 rounded-md border px-3 py-2 text-sm ${
                availableStock <= 0
                  ? "border-red-200 bg-red-50 text-red-700"
                  : availableStock < 5
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              <span className="font-medium">Stock disponible:</span>{" "}
              {availableStock} uds.
            </div>
          )}
        </div>

        {/* Tipo de salida */}
        <div className="flex flex-col gap-1 text-sm">
          <label className="font-medium">Tipo de salida *</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="exit_type"
                value="allocation"
                checked={form.exit_type === "allocation"}
                onChange={(e) =>
                  setField("exit_type", e.target.value as "allocation" | "consumption")
                }
                className="h-4 w-4"
              />
              Asignación a empleado
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="exit_type"
                value="consumption"
                checked={form.exit_type === "consumption"}
                onChange={(e) =>
                  setField("exit_type", e.target.value as "allocation" | "consumption")
                }
                className="h-4 w-4"
              />
              Consumo
            </label>
          </div>
        </div>

        {/* Asignado a (solo para allocation) */}
        {form.exit_type === "allocation" && (
          <div className="flex flex-col gap-1 text-sm">
            <label htmlFor="assigned_to" className="font-medium">
              Asignado a (empleado) *
            </label>
            <input
              id="assigned_to"
              type="text"
              value={form.assigned_to}
              onChange={(e) => setField("assigned_to", e.target.value)}
              className={inputClass("assigned_to")}
              placeholder="Nombre del empleado"
            />
            {errors.assigned_to && (
              <span className="text-xs text-red-600">{errors.assigned_to}</span>
            )}
          </div>
        )}

        {/* Cantidad */}
        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor="quantity" className="font-medium">
            Cantidad *
          </label>
          <input
            id="quantity"
            type="number"
            min="1"
            step="1"
            value={form.quantity}
            onChange={(e) => setField("quantity", e.target.value)}
            className={
              quantityError
                ? "rounded-md border border-red-400 px-3 py-2"
                : errors.quantity
                  ? "rounded-md border border-red-400 px-3 py-2"
                  : "rounded-md border border-slate-300 px-3 py-2"
            }
            placeholder="Ej: 5"
          />
          {/* Error de validación local (client-side) */}
          {errors.quantity && !quantityError && (
            <span className="text-xs text-red-600">{errors.quantity}</span>
          )}
          {/* Error devuelto por la API (HTTP 400 - stock insuficiente) */}
          {quantityError && (
            <span className="mt-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
              {quantityError}
            </span>
          )}
          {/* Advertencia visual de stock bajo tras la salida */}
          {lowStockWarning && (
            <span
              className={`mt-1 rounded-md border px-2 py-1 text-xs font-medium ${
                estimatedRemaining !== null && estimatedRemaining < 0
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              ⚠️ {lowStockWarning}
            </span>
          )}
        </div>

        {/* Oficina */}
        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor="office" className="font-medium">
            Oficina *
          </label>
          <select
            id="office"
            value={form.office}
            onChange={(e) => setField("office", e.target.value)}
            className={inputClass("office")}
          >
            <option value="">Selecciona una oficina…</option>
            {OFFICES.map((office) => (
              <option key={office} value={office}>
                {office}
              </option>
            ))}
          </select>
          {errors.office && <span className="text-xs text-red-600">{errors.office}</span>}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {submitting ? "Registrando…" : "Registrar salida"}
          </button>
          <a
            href="/inventory/products"
            className="rounded-md border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancelar
          </a>
        </div>
      </form>
    </section>
  );
}
