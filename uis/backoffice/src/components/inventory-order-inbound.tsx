"use client";

import { useEffect, useState } from "react";
import {
  getProducts,
  createInboundOrder,
  type Asset,
  type AssetEntryRead,
} from "@/src/services/inventory";
import { ApiError, getToken } from "@/src/services/api";

const OFFICES = ["Valencia", "Miami"] as const;

interface FormState {
  asset_id: string;
  quantity: string;
  supplier: string;
  office: string;
}

const EMPTY_FORM: FormState = {
  asset_id: "",
  quantity: "",
  supplier: "",
  office: "",
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

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

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.asset_id) errors.asset_id = "Selecciona un producto";
  if (!form.quantity.trim() || !Number.isFinite(Number(form.quantity)) || Number(form.quantity) < 1) {
    errors.quantity = "La cantidad debe ser un número mayor o igual a 1";
  }
  if (!form.supplier.trim()) errors.supplier = "El proveedor es obligatorio";
  if (!form.office) errors.office = "Selecciona una oficina";
  return errors;
}

export function InventoryOrderInbound() {
  const [products, setProducts] = useState<Asset[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<AssetEntryRead | null>(null);

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

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    setSuccess(null);

    const fieldErrors = validate(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    const user_uuid = decodeUserUuid();
    if (!user_uuid) {
      setApiError("No se pudo identificar al usuario. Inicia sesión de nuevo.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createInboundOrder({
        asset_id: Number(form.asset_id),
        quantity: Number(form.quantity),
        supplier: form.supplier.trim(),
        office: form.office,
        user_uuid,
      });
      setSuccess(result);
      setForm(EMPTY_FORM);
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.message
          : "No se pudo registrar la entrada. Revisa los datos e inténtalo de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field: keyof FormState) =>
    `rounded-md border px-3 py-2 ${errors[field] ? "border-red-400" : "border-slate-300"}`;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Registrar entrada de inventario</h1>
        <p className="text-sm text-slate-600">
          Registra una compra o entrega recibida por Nexova.
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
          <strong className="font-semibold">✅ Entrada registrada correctamente.</strong>
          <ul className="mt-2 list-inside list-disc space-y-1 text-emerald-700">
            <li>
              Producto:{" "}
              {products.find((p) => p.id === success.asset_id)?.name ?? `ID ${success.asset_id}`}
            </li>
            <li>Cantidad: {success.quantity} uds.</li>
            <li>Proveedor: {success.supplier}</li>
            <li>Oficina: {success.office}</li>
          </ul>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="max-w-lg space-y-4 rounded-lg border border-slate-200 bg-white p-6"
      >
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
                {product.name} ({product.sku}) — {product.office} — {product.current_stock} uds.
              </option>
            ))}
          </select>
          {errors.asset_id && <span className="text-xs text-red-600">{errors.asset_id}</span>}
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor="quantity" className="font-medium">
            Cantidad recibida *
          </label>
          <input
            id="quantity"
            type="number"
            min="1"
            step="1"
            value={form.quantity}
            onChange={(e) => setField("quantity", e.target.value)}
            className={inputClass("quantity")}
            placeholder="Ej: 10"
          />
          {errors.quantity && <span className="text-xs text-red-600">{errors.quantity}</span>}
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor="supplier" className="font-medium">
            Proveedor *
          </label>
          <input
            id="supplier"
            type="text"
            value={form.supplier}
            onChange={(e) => setField("supplier", e.target.value)}
            className={inputClass("supplier")}
            placeholder="Ej: TechDistrib Valencia S.L."
          />
          {errors.supplier && <span className="text-xs text-red-600">{errors.supplier}</span>}
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor="office" className="font-medium">
            Oficina receptora *
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
            {submitting ? "Registrando…" : "Registrar entrada"}
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
