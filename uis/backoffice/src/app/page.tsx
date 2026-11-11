"use client";

import dynamic from "next/dynamic";
import { Suspense, useState } from "react";

const Suppliers = dynamic(() => import("@/src/components/supplier-directory").then(m => m.SupplierDirectory));
const Products = dynamic(() => import("@/src/components/inventory-products").then(m => m.InventoryProducts));
const Inbound = dynamic(() => import("@/src/components/inventory-order-inbound").then(m => m.InventoryOrderInbound));
const Outbound = dynamic(() => import("@/src/components/inventory-order-outbound").then(m => m.InventoryOrderOutbound));
const Orders = dynamic(() => import("@/src/components/inventory-orders").then(m => m.InventoryOrders));
const Candidates = dynamic(() => import("@/src/components/talent/nexova-dashboard").then(m => m.NexovaDashboard));
const Incidents = dynamic(() => import("@/src/components/talent/incident-directory").then(m => m.IncidentDirectory));
const IncidentForm = dynamic(() => import("@/src/components/talent/incident-form").then(m => m.IncidentForm));

const sections = [
  {
    title: "Proveedores",
    description: "Directorio, filtros y gestión de proveedores",
    content: <Suppliers />,
  },
  {
    title: "Inventario",
    description: "Productos, stock y disponibilidad",
    content: <Products />,
  },
  {
    title: "Órdenes",
    description: "Entradas, salidas e historial de movimientos",
    content: (
      <div className="space-y-10">
        <section>
          <h2 className="mb-5 text-xl font-semibold text-slate-900">Órdenes de entrada</h2>
          <Inbound />
        </section>
        <section className="border-t border-slate-200 pt-8">
          <h2 className="mb-5 text-xl font-semibold text-slate-900">Órdenes de salida</h2>
          <Outbound />
        </section>
        <section className="border-t border-slate-200 pt-8">
          <h2 className="mb-5 text-xl font-semibold text-slate-900">Historial de órdenes</h2>
          <Orders />
        </section>
      </div>
    ),
  },
  {
    title: "Candidatos",
    description: "Pipeline, filtros, métricas y nuevas candidaturas",
    content: (
      <Suspense fallback={<p className="p-4">Cargando candidatos…</p>}>
        <Candidates />
      </Suspense>
    ),
  },
  {
    title: "Incidencias",
    description: "Listado, filtros, cambios de estado y registro",
    content: (
      <>
        <Incidents />
        <div className="mt-10 border-t border-slate-200 pt-8">
          <h2 className="mb-5 text-xl font-semibold text-slate-900">Registrar incidencia</h2>
          <IncidentForm />
        </div>
      </>
    ),
  },
];

export default function HomePage() {
  const [openSection, setOpenSection] = useState<number | null>(0);
  const [visitedSections, setVisitedSections] = useState<number[]>([0]);

  function toggleSection(index: number) {
    setOpenSection(current => current === index ? null : index);
    setVisitedSections(current => current.includes(index) ? current : [...current, index]);
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-8 sm:px-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Nexova · Backoffice
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
          Panel de gestión
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Todas las herramientas en una única pantalla.
        </p>
      </header>

      {sections.map((section, index) => {
        const isOpen = openSection === index;

        return (
          <section
            key={section.title}
            className="overflow-hidden rounded-2xl border border-white/15 bg-white shadow-lg"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggleSection(index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-slate-50 sm:px-7"
            >
              <span>
                <span className="block text-lg font-bold text-slate-900">{section.title}</span>
                <span className="mt-1 block text-sm text-slate-500">{section.description}</span>
              </span>
              <span aria-hidden="true" className="text-2xl font-light text-slate-500">
                {isOpen ? "−" : "+"}
              </span>
            </button>

            {visitedSections.includes(index) && (
              <div
                hidden={!isOpen}
                className="border-t border-slate-200 px-4 py-6 sm:px-7"
              >
                {section.content}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
