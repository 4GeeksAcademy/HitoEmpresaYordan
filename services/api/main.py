import io
import os
import re
from typing import List, Optional, Tuple

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from shared.incident_analysis import (
    CSVFormatError,
    analyze_csv,
    build_report,
    build_summary,
    metrics_to_csv,
)

app = FastAPI(title="Nexova Incidents API")
latest_metrics: Optional[List[Tuple[str, str]]] = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "https://glorious-meme-g4g9gq756x65hv54j-5500.app.github.dev",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def _safe_upload_filename(filename: Optional[str]) -> str:
    basename = (filename or "upload.csv").replace("\\", "/").rsplit("/", 1)[-1]
    if "@" in basename:
        return "[nombre redactado]"
    return re.sub(r"[\r\n\t]", "_", basename)


@app.post("/api/incidents/analyze")
async def analyze_incidents(file: UploadFile = File(...)):
    global latest_metrics
    content = await file.read()
    print(
        "[Nexova] Archivo recibido: {} ({} bytes)".format(
            _safe_upload_filename(file.filename), len(content)
        ),
        flush=True,
    )
    if not content or not content.strip():
        raise HTTPException(status_code=400, detail="The uploaded CSV file is empty.")

    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="The uploaded file must be a UTF-8 CSV.")

    try:
        result = analyze_csv(io.StringIO(text, newline=""))
    except CSVFormatError as error:
        raise HTTPException(status_code=400, detail=str(error))

    report_lines, metrics = build_report(result)
    latest_metrics = metrics
    for line in report_lines:
        print("[Nexova] {}".format(line), flush=True)
    if result.total_records == 100:
        print("[Nexova] Análisis de las 100 filas completado correctamente.", flush=True)
    else:
        print(
            "[Nexova] Análisis completado correctamente: {} filas procesadas.".format(
                result.total_records
            ),
            flush=True,
        )
    return build_summary(result)


@app.get("/api/incidents/results/export")
async def export_latest_results():
    if latest_metrics is None:
        raise HTTPException(status_code=404, detail="No analysis has been run yet.")
    return Response(
        content=metrics_to_csv(latest_metrics),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="results.csv"'},
    )