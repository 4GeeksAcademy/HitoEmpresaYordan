import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi perfil | Nexova Backoffice",
};

export default function ProfilePage() {
  // Página de perfil placeholder — conserva la estructura para enrutamiento.
  return (
    <section className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight text-white">
        Mi perfil
      </h1>
      <p className="text-sm leading-relaxed text-slate-100/85">
        Información del perfil del usuario autenticado.
      </p>
      <div className="rounded-[1rem] border border-white/10 bg-white/5 p-5">
        <p className="text-sm text-slate-300">
        </p>
      </div>
    </section>
  );
}