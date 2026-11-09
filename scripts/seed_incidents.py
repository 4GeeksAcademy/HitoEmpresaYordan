import argparse
import csv
import sys
from dataclasses import dataclass, field
from pathlib import Path

from nexova_shared import transform_csv_incident
from pydantic import ValidationError
from tinydb import TinyDB


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CSV = ROOT / "content/contexts/incidents-file-analysis/incidents-nexova.csv"
DEFAULT_DATABASE = ROOT / "services/api/data/db.json"
REQUIRED_COLUMNS = {"description", "date", "status", "category"}


@dataclass
class SeedReport:
    read: int = 0
    inserted: int = 0
    duplicates: int = 0
    errors: list[str] = field(default_factory=list)


def seed_incidents(csv_path: Path, database_path: Path = DEFAULT_DATABASE) -> SeedReport:
    report = SeedReport()
    with csv_path.open(encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source, strict=True)
        missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"Faltan columnas obligatorias: {', '.join(sorted(missing))}")

        with TinyDB(database_path, create_dirs=True, indent=2, ensure_ascii=False) as database:
            incidents = database.table("incidents")
            imports = database.table("incident_imports")
            seen = {tuple(record["key"]) for record in imports.all()}
            for row in reader:
                report.read += 1
                try:
                    if None in row:
                        raise ValueError("La fila contiene mas valores que columnas")
                    entry = transform_csv_incident(row)
                except (ValidationError, ValueError) as error:
                    report.errors.append(
                        f"Linea {reader.line_num}, ticket_id={row.get('ticket_id')!r}: {error}"
                    )
                    continue

                if entry.deduplication_key in seen:
                    report.duplicates += 1
                    continue

                document = entry.incident.model_dump(mode="json")
                incident_id = incidents.insert(document)
                try:
                    imports.insert({"key": list(entry.deduplication_key), "incident_id": incident_id})
                except Exception:
                    incidents.remove(doc_ids=[incident_id])
                    raise
                seen.add(entry.deduplication_key)
                report.inserted += 1
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Importar incidencias CSV con validacion compartida.")
    parser.add_argument("csv", nargs="?", type=Path, default=DEFAULT_CSV, help="Ruta del CSV historico")
    parser.add_argument("--db", type=Path, default=DEFAULT_DATABASE, help="Ruta de la base TinyDB")
    args = parser.parse_args(argv)
    try:
        report = seed_incidents(args.csv, args.db)
    except (OSError, ValueError, csv.Error) as error:
        print(f"Seed interrumpido: {error}", file=sys.stderr)
        return 1

    print(
        f"Seed finalizado: {report.read} filas leidas, {report.inserted} insertadas, "
        f"{report.duplicates} duplicadas, {len(report.errors)} invalidas."
    )
    if report.errors:
        print("Detalle de filas descartadas:", file=sys.stderr)
        for error in report.errors:
            print(error, file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())