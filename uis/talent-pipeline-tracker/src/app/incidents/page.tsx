import { IncidentDirectory } from "@/src/components/incident-directory";
import { IncidentSummaryPanel } from "@/src/components/incident-summary";

export default function IncidentsPage() {
  return (
    <>
      <IncidentDirectory />
      <IncidentSummaryPanel />
    </>
  );
}