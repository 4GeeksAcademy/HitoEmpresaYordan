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


class SeedError(Exception):
    pass


def seed_incidents(csv_path: Path, database_path: Path = DEFAULT_DATABASE) -> SeedReport:
    report = SeedReport()
    try:
        source = csv_path.open(encoding="utf-8-sig", newline="")
    except OSError as error:
        raise SeedError(
            f"No se pudo abrir el CSV '{csv_path.name}' ({type(error).__name__})."
        ) from error

    with source:
        reader = csv.DictReader(source, strict=True)
        try:
            fieldnames = reader.fieldnames or []
        except (OSError, UnicodeError, csv.Error) as error:
            raise SeedError(
                f"No se pudo leer el encabezado del CSV '{csv_path.name}' ({type(error).__name__})."
            ) from error

        if not fieldnames or any(not name.strip() for name in fieldnames):
            raise SeedError(f"El CSV '{csv_path.name}' tiene encabezados vacios o no validos.")
        duplicates = sorted({name for name in fieldnames if fieldnames.count(name) > 1})
        if duplicates:
            raise SeedError(f"El CSV '{csv_path.name}' tiene encabezados duplicados: {', '.join(duplicates)}")

        missing = REQUIRED_COLUMNS - set(fieldnames)
        if missing:
            raise SeedError(f"Faltan columnas obligatorias: {', '.join(sorted(missing))}")

        try:
            database = TinyDB(database_path, create_dirs=True, indent=2, ensure_ascii=False)
        except (OSError, ValueError) as error:
            raise SeedError(
                f"No se pudo abrir la base '{database_path.name}' ({type(error).__name__})."
            ) from error

        try:
            with database as database:
                incidents = database.table("incidents")
                imports = database.table("incident_imports")
                seen = {tuple(record["key"]) for record in imports.all()}
                while True:
                    try:
                        row = next(reader)
                    except StopIteration:
                        break
                    except (OSError, UnicodeError, csv.Error) as error:
                        raise SeedError(
                            f"No se pudo parsear el CSV '{csv_path.name}' cerca de la linea "
                            f"{reader.line_num} ({type(error).__name__})."
                        ) from error

                    report.read += 1
                    if None in row:
                        report.errors.append(
                            f"Linea {reader.line_num}: la fila contiene mas valores que columnas."
                        )
                        continue

                    try:
                        entry = transform_csv_incident(row)
                    except ValidationError as error:
                        fields = sorted({
                            ".".join(str(part) for part in issue.get("loc", ()))
                            for issue in error.errors(include_input=False)
                        })
                        report.errors.append(
                            f"Linea {reader.line_num}: campos no validos ({', '.join(fields) or 'fila'})."
                        )
                        continue
                    except ValueError:
                        report.errors.append(f"Linea {reader.line_num}: fila con datos no validos.")
                        continue

                    if entry.deduplication_key in seen:
                        report.duplicates += 1
                        continue

                    document = entry.incident.model_dump(mode="json")
                    incident_id = None
                    try:
                        incident_id = incidents.insert(document)
                        imports.insert({"key": list(entry.deduplication_key), "incident_id": incident_id})
                    except Exception as error:
                        if incident_id is not None:
                            incidents.remove(doc_ids=[incident_id])
                        raise SeedError(
                            f"No se pudo guardar la fila {reader.line_num} en la base "
                            f"'{database_path.name}' ({type(error).__name__})."
                        ) from error
                    seen.add(entry.deduplication_key)
                    report.inserted += 1
        except SeedError:
            raise
        except (OSError, ValueError, TypeError, KeyError) as error:
            raise SeedError(
                f"No se pudo leer o actualizar la base '{database_path.name}' ({type(error).__name__})."
            ) from error
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Importar incidencias CSV con validacion compartida.")
    parser.add_argument("csv", nargs="?", type=Path, default=DEFAULT_CSV, help="Ruta del CSV historico")
    parser.add_argument("--db", type=Path, default=DEFAULT_DATABASE, help="Ruta de la base TinyDB")
    args = parser.parse_args(argv)
    try:
        report = seed_incidents(args.csv, args.db)
    except SeedError as error:
        print(f"Seed interrumpido: {error}", file=sys.stderr)
        return 1
    except OSError as error:
        print(f"Seed interrumpido por un fallo de lectura/escritura ({type(error).__name__}).", file=sys.stderr)
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