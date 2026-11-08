import { Suspense } from "react";
import { TrackFlowDashboard } from "@/src/components/trackflow-dashboard";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-10 sm:px-8">
          <p role="status">Cargando panel...</p>
        </main>
      }
    >
      <TrackFlowDashboard />
    </Suspense>
  );
}
