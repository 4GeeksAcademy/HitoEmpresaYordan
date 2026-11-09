import Link from "next/link";

export default function IncidentsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <nav aria-label="Menú de incidencias" className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-slate-300 pb-4 text-sm font-medium">
        <Link href="/" className="mr-auto text-slate-700 hover:text-teal-800">Nexova</Link>
        <Link href="/incidents" className="text-teal-800 underline-offset-4 hover:underline">Incidencias</Link>
        <Link href="/incidents/new" className="text-teal-800 underline-offset-4 hover:underline">Registrar incidencia</Link>
        <Link href="/account/profile" className="text-slate-700 hover:text-teal-800">Mi perfil</Link>
      </nav>
      {children}
    </main>
  );
}