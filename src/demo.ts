import { ordenarCandidatosPorMúltiplesCampos } from "./utils/collections.js";
import { busquedaBinariaCandidatoPorScoring } from "./utils/search.js";
import { calcularPromedioHorasResolucion, generarReporteCursos } from "./utils/transformations.js";
import { excedeSLA } from "./utils/validations.js";
import type { Candidato, Curso, Ticket } from "./types/models.js";

type DashboardData = {
  candidatosOrdenados: Candidato[];
  scoringBuscado: number;
  indiceEncontrado: number;
  candidatoEncontrado: Candidato | null;
  reporteCursos: ReturnType<typeof generarReporteCursos>;
  cursos: Curso[];
  tickets: Array<Ticket & { excedeSla: boolean }>;
  promedioHoras: number;
};

const candidatosSimulados: Candidato[] = [
  { id: "cand-001", nombre: "Lucía Pérez", puesto: "Recruiter Senior", scoringCV: 91, estado: "Entrevista" },
  { id: "cand-002", nombre: "Andrés Costa", puesto: "HRBP Retail", scoringCV: 84, estado: "Criba" },
  { id: "cand-003", nombre: "Marta Soler", puesto: "Talent Acquisition Lead", scoringCV: 91, estado: "Contratado" },
  { id: "cand-004", nombre: "Diego Ferrer", puesto: "People Analyst", scoringCV: 77, estado: "Criba" },
  { id: "cand-005", nombre: "Sofía Navarro", puesto: "Consultora de Formación", scoringCV: 88, estado: "Entrevista" }
];

const cursosSimulados: Curso[] = [
  { id: "curso-001", titulo: "Liderazgo para mandos medios", categoria: "Liderazgo", precio: 890, inscritos: 42 },
  { id: "curso-002", titulo: "Comunicación en equipos híbridos", categoria: "Comunicación", precio: 640, inscritos: 31 },
  { id: "curso-003", titulo: "Feedback y conversaciones difíciles", categoria: "Habilidades Blandas", precio: 520, inscritos: 19 },
  { id: "curso-004", titulo: "Liderazgo comercial para retail", categoria: "Liderazgo", precio: 940, inscritos: 47 }
];

const ticketsSimulados: Ticket[] = [
  { id: "tk-201", cliente: "Retail Nova", prioridad: "Alta", horasResolucion: 18, estado: "Resuelto" },
  { id: "tk-202", cliente: "Finaxis Group", prioridad: "Media", horasResolucion: 27, estado: "Resuelto" },
  { id: "tk-203", cliente: "Miami Tech Partners", prioridad: "Alta", horasResolucion: 11, estado: "En Proceso" },
  { id: "tk-204", cliente: "Valencia Stores", prioridad: "Baja", horasResolucion: 33, estado: "Resuelto" }
];

function buildDashboardData(): DashboardData {
  const candidatosOrdenados = ordenarCandidatosPorMúltiplesCampos(candidatosSimulados, "desc");
  const candidatosOrdenadosAsc = ordenarCandidatosPorMúltiplesCampos(candidatosSimulados, "asc");
  const scoringBuscado = 91;
  const indiceEncontrado = busquedaBinariaCandidatoPorScoring(candidatosOrdenadosAsc, scoringBuscado);
  const candidatoEncontrado = indiceEncontrado >= 0 ? candidatosOrdenadosAsc[indiceEncontrado] : null;
  const reporteCursos = generarReporteCursos(cursosSimulados);
  const ticketsAuditados = ticketsSimulados.map((ticket) => ({
    ...ticket,
    excedeSla: excedeSLA(ticket)
  }));
  const promedioHoras = calcularPromedioHorasResolucion(ticketsSimulados);

  return {
    candidatosOrdenados,
    scoringBuscado,
    indiceEncontrado,
    candidatoEncontrado,
    reporteCursos,
    cursos: cursosSimulados,
    tickets: ticketsAuditados,
    promedioHoras
  };
}

function renderCandidateList(candidatos: Candidato[]): string {
  return candidatos
    .map(
      (candidato) => `
        <li class="rounded-xl border border-white/10 bg-white/5 p-3">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <p class="text-sm font-bold text-white">${candidato.nombre}</p>
                    <p class="text-xs text-slate-300">${candidato.puesto} · ${candidato.estado}</p>
                </div>
                <span class="rounded-full border border-cyan-300/40 bg-cyan-300/10 px-2.5 py-1 text-xs font-bold text-cyan-100">
                    Score ${candidato.scoringCV}
                </span>
            </div>
        </li>`
    )
    .join("");
}

function renderCourses(cursos: Curso[]): string {
  return cursos
    .map(
      (curso) => `
        <li class="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100">
            <span>${curso.titulo}</span>
            <span class="text-xs font-semibold uppercase tracking-[0.12em] text-amber-100">${curso.inscritos} inscritos</span>
        </li>`
    )
    .join("");
}

function renderTickets(tickets: Array<Ticket & { excedeSla: boolean }>): string {
  return tickets
    .map(
      (ticket) => `
        <li class="rounded-xl border ${ticket.excedeSla ? "border-red-400/50 bg-red-500/10" : "border-white/10 bg-white/5"} p-3">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <p class="text-sm font-bold text-white">${ticket.cliente}</p>
                    <p class="text-xs text-slate-300">${ticket.id} · ${ticket.prioridad} · ${ticket.estado}</p>
                </div>
                <span class="rounded-full px-2.5 py-1 text-xs font-bold ${ticket.excedeSla ? "bg-red-400/20 text-red-100" : "bg-emerald-400/15 text-emerald-100"}">
                    ${ticket.horasResolucion}h ${ticket.excedeSla ? "· Excede SLA" : "· Dentro de SLA"}
                </span>
            </div>
        </li>`
    )
    .join("");
}

function renderDashboard(data: DashboardData): void {
  const candidatosHost = document.getElementById("telemetryCandidates");
  const busquedaHost = document.getElementById("telemetryCandidateSearch");
  const cursosHost = document.getElementById("telemetryCourses");
  const cursosResumenHost = document.getElementById("telemetryCoursesSummary");
  const soporteHost = document.getElementById("telemetrySupport");
  const soporteResumenHost = document.getElementById("telemetrySupportSummary");

  if (!candidatosHost || !busquedaHost || !cursosHost || !cursosResumenHost || !soporteHost || !soporteResumenHost) {
    return;
  }

  candidatosHost.innerHTML = renderCandidateList(data.candidatosOrdenados);

  busquedaHost.innerHTML = data.candidatoEncontrado
    ? `Búsqueda binaria por scoring ${data.scoringBuscado}: coincidencia en posición ${data.indiceEncontrado} del array ascendente, ${data.candidatoEncontrado.nombre} (${data.candidatoEncontrado.puesto}).`
    : `Búsqueda binaria por scoring ${data.scoringBuscado}: sin coincidencias en la muestra actual.`;

  cursosHost.innerHTML = renderCourses(data.cursos);
  cursosResumenHost.innerHTML = `
    <p>Total inscritos: <strong class="font-extrabold text-white">${data.reporteCursos.totalInscritos}</strong></p>
    <p>Curso más popular: <strong class="font-extrabold text-white">${data.reporteCursos.cursoConMasInscritos?.titulo ?? "Sin datos"}</strong></p>
    <p>Curso menos popular: <strong class="font-extrabold text-white">${data.reporteCursos.cursoConMenosInscritos?.titulo ?? "Sin datos"}</strong></p>
  `;

  soporteHost.innerHTML = renderTickets(data.tickets);
  soporteResumenHost.innerHTML = `Promedio de resolución: <strong class="font-extrabold text-white">${data.promedioHoras.toFixed(1)} horas</strong>. Tickets marcados en rojo exceden el SLA de 24 horas.`;
}

function setupTelemetryPanel(): void {
  const openButton = document.getElementById("telemetryToggle");
  const closeButton = document.getElementById("telemetryClose");
  const overlay = document.getElementById("telemetryOverlay");
  const panel = document.getElementById("telemetryPanel");

  if (!(openButton instanceof HTMLButtonElement) || !(closeButton instanceof HTMLButtonElement) || !overlay || !panel) {
    return;
  }

  const openPanel = () => {
    overlay.classList.remove("pointer-events-none", "opacity-0");
    overlay.classList.add("pointer-events-auto", "opacity-100");
    panel.classList.remove("translate-x-full");
    overlay.setAttribute("aria-hidden", "false");
    openButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("overflow-hidden");
  };

  const closePanel = () => {
    overlay.classList.add("pointer-events-none", "opacity-0");
    overlay.classList.remove("pointer-events-auto", "opacity-100");
    panel.classList.add("translate-x-full");
    overlay.setAttribute("aria-hidden", "true");
    openButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("overflow-hidden");
  };

  openButton.addEventListener("click", openPanel);
  closeButton.addEventListener("click", closePanel);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closePanel();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePanel();
    }
  });
}

renderDashboard(buildDashboardData());
setupTelemetryPanel();