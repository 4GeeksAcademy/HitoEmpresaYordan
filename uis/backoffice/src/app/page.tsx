import Link from "next/link";

export default function HomePage() {
  return (
    <section className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Backoffice de Nexova</h1>
      <p className="text-slate-600">
        Herramientas internas para el equipo de operaciones y RR. HH.
      </p>
      <Link
        href="/suppliers"
        className="inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Ir al directorio de proveedores
      </Link>
    </section>
  );
}
