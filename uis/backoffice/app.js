const API_BASE_URL = document.querySelector('meta[name="nexova-api-base-url"]').content.replace(/\/$/, "");
const ANALYZE_URL = `${API_BASE_URL}/api/incidents/analyze`;
const EXPORT_URL = `${API_BASE_URL}/api/incidents/results/export`;

const fileInput = document.querySelector("#fileInput");
const dropZone = document.querySelector("#dropZone");
const selectFileButton = document.querySelector("#selectFileButton");
const uploadStatus = document.querySelector("#uploadStatus");
const downloadButton = document.querySelector("#downloadButton");
const downloadStatus = document.querySelector("#downloadStatus");
const resultsSection = document.querySelector("#results");

const categoryLabels = {
    TECHNICAL: "Técnico",
    BILLING: "Facturación",
    ACCESS: "Acceso",
    HR_QUERY: "Consulta de RR. HH.",
    COMPLAINT: "Reclamación",
};

const statusLabels = {
    OPEN: "Abiertos",
    CLOSED: "Cerrados",
    DISCARDED: "Descartados",
    "(missing)": "Sin estado",
};

const reasonLabels = {
    "Missing client_company": "Empresa cliente vacía",
    "Invalid or missing category": "Categoría ausente o no reconocida",
    "Invalid or missing description": "Descripción ausente o demasiado corta",
    "Invalid or missing agent_id": "Identificador de agente no válido",
    "Invalid or missing email": "Correo ausente o no válido",
    "Closed ticket, no score": "Incidencia cerrada sin puntuación",
    "Closed ticket, invalid score": "Puntuación de cierre fuera del rango 1–5",
};

function setUploadStatus(message, state = "") {
    uploadStatus.textContent = message;
    uploadStatus.dataset.state = state;
}

function appendBar(container, label, count, total, className = "bar-row") {
    const row = document.createElement("div");
    row.className = className;

    const name = document.createElement("span");
    name.className = className === "score-row" ? "score-label" : "bar-label";
    name.textContent = label;

    const track = document.createElement("div");
    track.className = className === "score-row" ? "score-track" : "bar-track";
    track.setAttribute("aria-hidden", "true");

    const fill = document.createElement("div");
    fill.className = className === "score-row" ? "score-fill" : "bar-fill";
    fill.style.width = `${total > 0 ? (count / total) * 100 : 0}%`;
    track.append(fill);

    const value = document.createElement("span");
    value.className = className === "score-row" ? "score-value" : "bar-value";
    value.textContent = new Intl.NumberFormat("es-ES").format(count);

    row.append(name, track, value);
    container.append(row);
}

function renderBreakdown(containerId, breakdown, labels, total) {
    const container = document.querySelector(`#${containerId}`);
    container.replaceChildren();
    const entries = Object.entries(breakdown || {});

    if (!entries.length) {
        const empty = document.createElement("p");
        empty.className = "empty-breakdown";
        empty.textContent = "Sin registros válidos para mostrar.";
        container.append(empty);
        return;
    }

    for (const [key, count] of entries) {
        appendBar(container, labels[key] || key, count, total);
    }
}

function renderInvalidBreakdown(summary) {
    const notice = document.querySelector("#invalidNotice");
    const list = document.querySelector("#invalidBreakdown");
    list.replaceChildren();
    document.querySelector(".invalid-empty")?.remove();

    if (summary.invalid_records === 0) {
        notice.hidden = true;
        const cleanNotice = document.createElement("p");
        cleanNotice.className = "invalid-empty";
        cleanNotice.textContent = "No se encontraron registros inválidos.";
        document.querySelector(".metric-grid").after(cleanNotice);
        return;
    }

    notice.hidden = false;
    document.querySelector("#invalidTitle").textContent = `${summary.invalid_records} registros inválidos`;

    for (const [reason, count] of Object.entries(summary.invalid_breakdown || {})) {
        if (!count) continue;
        const item = document.createElement("li");
        const label = document.createElement("span");
        label.textContent = reasonLabels[reason] || reason;
        const quantity = document.createElement("strong");
        quantity.textContent = new Intl.NumberFormat("es-ES").format(count);
        item.append(label, quantity);
        list.append(item);
    }
}

function renderSummary(summary) {
    document.querySelector("#totalRecords").textContent = new Intl.NumberFormat("es-ES").format(summary.total_records);
    document.querySelector("#validRecords").textContent = new Intl.NumberFormat("es-ES").format(summary.valid_records);
    document.querySelector("#invalidRecords").textContent = new Intl.NumberFormat("es-ES").format(summary.invalid_records);
    document.querySelector("#resultCount").textContent = `${new Intl.NumberFormat("es-ES").format(summary.total_records)} filas`;

    renderInvalidBreakdown(summary);
    renderBreakdown("categoryBreakdown", summary.breakdown_by_category, categoryLabels, summary.valid_records);
    renderBreakdown("statusBreakdown", summary.breakdown_by_status, statusLabels, summary.valid_records);

    const satisfaction = summary.satisfaction_index || {};
    document.querySelector("#averageScore").textContent = Number(satisfaction.average || 0).toFixed(2);
    document.querySelector("#satisfactionSample").textContent = `${satisfaction.scored_closed_tickets || 0} de ${satisfaction.closed_tickets || 0} incidencias cerradas con puntuación`;

    const scoreList = document.querySelector("#scoreBreakdown");
    scoreList.replaceChildren();
    const distribution = satisfaction.score_distribution || {};
    for (let score = 1; score <= 5; score += 1) {
        appendBar(scoreList, `Puntuación ${score}`, distribution[String(score)] || 0, satisfaction.scored_closed_tickets || 0, "score-row");
    }

    resultsSection.hidden = false;
    resultsSection.dataset.hasResults = "true";
    downloadButton.disabled = false;
}

async function uploadFile(file) {
    if (!file) return;
    document.querySelector("#fileName").textContent = "Archivo CSV seleccionado";
    downloadStatus.textContent = "";

    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
        setUploadStatus("Selecciona un archivo con extensión .csv.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);
    selectFileButton.disabled = true;
    downloadButton.disabled = true;
    dropZone.classList.add("is-busy");
    setUploadStatus("Analizando archivo…", "");

    try {
        const response = await fetch(ANALYZE_URL, {
            method: "POST",
            credentials: "include",
            body: formData,
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(payload.detail || `No se pudo analizar el archivo (HTTP ${response.status}).`);
        }

        renderSummary(payload);
        setUploadStatus("Análisis completado.", "success");
    } catch (error) {
        setUploadStatus(
            error instanceof TypeError
                ? "No se pudo conectar con el servicio de análisis. Comprueba que la API esté disponible."
                : error.message,
            "error",
        );
        downloadButton.disabled = !resultsSection.dataset.hasResults;
    } finally {
        selectFileButton.disabled = false;
        dropZone.classList.remove("is-busy");
        fileInput.value = "";
    }
}

selectFileButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => uploadFile(fileInput.files[0]));

for (const eventName of ["dragenter", "dragover"]) {
    dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropZone.classList.add("is-dragging");
    });
}

for (const eventName of ["dragleave", "drop"]) {
    dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropZone.classList.remove("is-dragging");
    });
}

dropZone.addEventListener("drop", (event) => {
    const [file] = event.dataTransfer.files;
    uploadFile(file);
});

downloadButton.addEventListener("click", async () => {
    downloadStatus.textContent = "";
    downloadButton.disabled = true;
    try {
        const response = await fetch(EXPORT_URL, { credentials: "include" });
        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.detail || `No se pudo descargar el CSV (HTTP ${response.status}).`);
        }
        const fileUrl = URL.createObjectURL(await response.blob());
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = "results.csv";
        document.body.append(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(fileUrl);
    } catch (error) {
        downloadStatus.textContent = error instanceof TypeError
            ? "No se pudo conectar con el servicio de exportación."
            : error.message;
    } finally {
        downloadButton.disabled = !resultsSection.dataset.hasResults;
    }
});
