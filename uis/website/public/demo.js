/******************************************************************************
 * demo.js — Panel de demostración autónomo
 *
 * Contiene las funciones de las utilidades TypeScript inline para evitar
 * dependencias de módulos externos en el navegador.
 * Versión autónoma (sin imports) para cargar como script normal.
 ******************************************************************************/

// ── collections.js ───────────────────────────────────────────────────────────

function ordenarCandidatosPorMúltiplesCampos(candidatos, orden) {
  if (orden === void 0) { orden = "desc"; }
  return candidatos.slice().sort(function (a, b) {
    return orden === "desc"
      ? b.scoringCV - a.scoringCV
      : a.scoringCV - b.scoringCV;
  });
}

// ── search.js ────────────────────────────────────────────────────────────────

function busquedaBinariaCandidatoPorScoring(candidatosOrdenados, scoringBuscado) {
  var izquierda = 0;
  var derecha = candidatosOrdenados.length - 1;
  while (izquierda <= derecha) {
    var medio = Math.floor((izquierda + derecha) / 2);
    var scoringMedio = candidatosOrdenados[medio].scoringCV;
    if (scoringMedio === scoringBuscado) return medio;
    if (scoringMedio < scoringBuscado) izquierda = medio + 1;
    else derecha = medio - 1;
  }
  return -1;
}

// ── transformations.js ───────────────────────────────────────────────────────

function calcularPromedioHorasResolucion(tickets) {
  if (tickets.length === 0) return 0;
  var suma = tickets.reduce(function (acc, ticket) { return acc + ticket.horasResolucion; }, 0);
  return suma / tickets.length;
}

function generarReporteCursos(cursos) {
  var totalInscritos = cursos.reduce(function (acc, curso) { return acc + (curso.inscritos || 0); }, 0);
  var cursoConMasInscritos = cursos.reduce(function (mejor, curso) {
    return (!mejor || curso.inscritos > mejor.inscritos) ? curso : mejor;
  }, null);
  var cursoConMenosInscritos = cursos.reduce(function (peor, curso) {
    return (!peor || curso.inscritos < peor.inscritos) ? curso : peor;
  }, null);
  return { totalInscritos: totalInscritos, cursoConMasInscritos: cursoConMasInscritos, cursoConMenosInscritos: cursoConMenosInscritos };
}

// ── validations.js ───────────────────────────────────────────────────────────

function excedeSLA(ticket) {
  return ticket.horasResolucion > 24;
}

// ── Datos simulados ──────────────────────────────────────────────────────────

var candidatosSimulados = [
  { id: "cand-001", nombre: "Lucía Pérez", puesto: "Recruiter Senior", scoringCV: 91, estado: "Entrevista" },
  { id: "cand-002", nombre: "Andrés Costa", puesto: "HRBP Retail", scoringCV: 84, estado: "Criba" },
  { id: "cand-003", nombre: "Marta Soler", puesto: "Talent Acquisition Lead", scoringCV: 91, estado: "Contratado" },
  { id: "cand-004", nombre: "Diego Ferrer", puesto: "People Analyst", scoringCV: 77, estado: "Criba" },
  { id: "cand-005", nombre: "Sofía Navarro", puesto: "Consultora de Formación", scoringCV: 88, estado: "Entrevista" },
];

var cursosSimulados = [
  { id: "curso-001", titulo: "Liderazgo para mandos medios", categoria: "Liderazgo", precio: 890, inscritos: 42 },
  { id: "curso-002", titulo: "Comunicación en equipos híbridos", categoria: "Comunicación", precio: 640, inscritos: 31 },
  { id: "curso-003", titulo: "Feedback y conversaciones difíciles", categoria: "Habilidades Blandas", precio: 520, inscritos: 19 },
  { id: "curso-004", titulo: "Liderazgo comercial para retail", categoria: "Liderazgo", precio: 940, inscritos: 47 },
];

var ticketsSimulados = [
  { id: "tk-201", cliente: "Retail Nova", prioridad: "Alta", horasResolucion: 18, estado: "Resuelto" },
  { id: "tk-202", cliente: "Finaxis Group", prioridad: "Media", horasResolucion: 27, estado: "Resuelto" },
  { id: "tk-203", cliente: "Miami Tech Partners", prioridad: "Alta", horasResolucion: 11, estado: "En Proceso" },
  { id: "tk-204", cliente: "Valencia Stores", prioridad: "Baja", horasResolucion: 33, estado: "Resuelto" },
];

// ── Lógica del dashboard ─────────────────────────────────────────────────────

function buildDashboardData() {
  var candidatosOrdenados = ordenarCandidatosPorMúltiplesCampos(candidatosSimulados, "desc");
  var candidatosOrdenadosAsc = ordenarCandidatosPorMúltiplesCampos(candidatosSimulados, "asc");
  var scoringBuscado = 91;
  var indiceEncontrado = busquedaBinariaCandidatoPorScoring(candidatosOrdenadosAsc, scoringBuscado);
  var candidatoEncontrado = indiceEncontrado >= 0 ? candidatosOrdenadosAsc[indiceEncontrado] : null;
  var reporteCursos = generarReporteCursos(cursosSimulados);
  var ticketsAuditados = ticketsSimulados.map(function (ticket) {
    return Object.assign({}, ticket, { excedeSla: excedeSLA(ticket) });
  });
  var promedioHoras = calcularPromedioHorasResolucion(ticketsSimulados);
  return {
    candidatosOrdenados: candidatosOrdenados,
    scoringBuscado: scoringBuscado,
    indiceEncontrado: indiceEncontrado,
    candidatoEncontrado: candidatoEncontrado,
    reporteCursos: reporteCursos,
    cursos: cursosSimulados,
    tickets: ticketsAuditados,
    promedioHoras: promedioHoras,
  };
}

function renderCandidateList(candidatos) {
  return candidatos
    .map(function (candidato) {
      return (
        '\n        <li class="rounded-xl border border-white/10 bg-white/5 p-3">\n            <div class="flex items-start justify-between gap-3">\n                <div>\n                    <p class="text-sm font-bold text-white">' +
        candidato.nombre +
        '</p>\n                    <p class="text-xs text-slate-300">' +
        candidato.puesto +
        " \xB7 " +
        candidato.estado +
        '</p>\n                </div>\n                <span class="rounded-full border border-cyan-300/40 bg-cyan-300/10 px-2.5 py-1 text-xs font-bold text-cyan-100">\n                    Score ' +
        candidato.scoringCV +
        '\n                </span>\n            </div>\n        </li>'
      );
    })
    .join("");
}

function renderCourses(cursos) {
  return cursos
    .map(function (curso) {
      return (
        '\n        <li class="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100">\n            <span>' +
        curso.titulo +
        '</span>\n            <span class="text-xs font-semibold uppercase tracking-[0.12em] text-amber-100">' +
        curso.inscritos +
        " inscritos</span>\n        </li>"
      );
    })
    .join("");
}

function renderTickets(tickets) {
  return tickets
    .map(function (ticket) {
      return (
        '\n        <li class="rounded-xl border ' +
        (ticket.excedeSla
          ? "border-red-400/50 bg-red-500/10"
          : "border-white/10 bg-white/5") +
        ' p-3">\n            <div class="flex items-start justify-between gap-3">\n                <div>\n                    <p class="text-sm font-bold text-white">' +
        ticket.cliente +
        '</p>\n                    <p class="text-xs text-slate-300">' +
        ticket.id +
        " \xB7 " +
        ticket.prioridad +
        " \xB7 " +
        ticket.estado +
        '</p>\n                </div>\n                <span class="rounded-full px-2.5 py-1 text-xs font-bold ' +
        (ticket.excedeSla
          ? "bg-red-400/20 text-red-100"
          : "bg-emerald-400/15 text-emerald-100") +
        '">\n                    ' +
        ticket.horasResolucion +
        "h " +
        (ticket.excedeSla ? "\xB7 Excede SLA" : "\xB7 Dentro de SLA") +
        '\n                </span>\n            </div>\n        </li>'
      );
    })
    .join("");
}

function renderDashboard(data) {
  var candidatosHost = document.getElementById("telemetryCandidates");
  var busquedaHost = document.getElementById("telemetryCandidateSearch");
  var cursosHost = document.getElementById("telemetryCourses");
  var cursosResumenHost = document.getElementById("telemetryCoursesSummary");
  var soporteHost = document.getElementById("telemetrySupport");
  var soporteResumenHost = document.getElementById("telemetrySupportSummary");

  if (
    !candidatosHost ||
    !busquedaHost ||
    !cursosHost ||
    !cursosResumenHost ||
    !soporteHost ||
    !soporteResumenHost
  ) {
    return;
  }

  candidatosHost.innerHTML = renderCandidateList(data.candidatosOrdenados);
  busquedaHost.innerHTML = data.candidatoEncontrado
    ? "B\xFAsqueda binaria por scoring " +
      data.scoringBuscado +
      ": coincidencia en posici\xF3n " +
      data.indiceEncontrado +
      " del array ascendente, " +
      data.candidatoEncontrado.nombre +
      " (" +
      data.candidatoEncontrado.puesto +
      ")."
    : "B\xFAsqueda binaria por scoring " +
      data.scoringBuscado +
      ": sin coincidencias en la muestra actual.";
  cursosHost.innerHTML = renderCourses(data.cursos);
  cursosResumenHost.innerHTML =
    "\n    <p>Total inscritos: <strong class=\"font-extrabold text-white\">" +
    data.reporteCursos.totalInscritos +
    '</strong></p>\n    <p>Curso m\xE1s popular: <strong class="font-extrabold text-white">' +
    (data.reporteCursos.cursoConMasInscritos?.titulo ?? "Sin datos") +
    '</strong></p>\n    <p>Curso menos popular: <strong class="font-extrabold text-white">' +
    (data.reporteCursos.cursoConMenosInscritos?.titulo ?? "Sin datos") +
    "</strong></p>\n  ";
  soporteHost.innerHTML = renderTickets(data.tickets);
  soporteResumenHost.innerHTML =
    'Promedio de resoluci\xF3n: <strong class="font-extrabold text-white">' +
    data.promedioHoras.toFixed(1) +
    ' horas</strong>. Tickets marcados en rojo exceden el SLA de 24 horas.';
}

function setupTelemetryPanel() {
  var openButton = document.getElementById("telemetryToggle");
  var closeButton = document.getElementById("telemetryClose");
  var overlay = document.getElementById("telemetryOverlay");
  var panel = document.getElementById("telemetryPanel");

  if (
    !(openButton instanceof HTMLButtonElement) ||
    !(closeButton instanceof HTMLButtonElement) ||
    !overlay ||
    !panel
  ) {
    return;
  }

  var openPanel = function () {
    overlay.classList.remove("pointer-events-none", "opacity-0");
    overlay.classList.add("pointer-events-auto", "opacity-100");
    panel.classList.remove("translate-x-full");
    overlay.setAttribute("aria-hidden", "false");
    openButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("overflow-hidden");
  };

  var closePanel = function () {
    overlay.classList.add("pointer-events-none", "opacity-0");
    overlay.classList.remove("pointer-events-auto", "opacity-100");
    panel.classList.add("translate-x-full");
    overlay.setAttribute("aria-hidden", "true");
    openButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("overflow-hidden");
  };

  openButton.addEventListener("click", openPanel);
  closeButton.addEventListener("click", closePanel);
  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) {
      closePanel();
    }
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closePanel();
    }
  });
}

renderDashboard(buildDashboardData());
setupTelemetryPanel();