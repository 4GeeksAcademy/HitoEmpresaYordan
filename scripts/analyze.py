import sys
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
if str(REPOSITORY_ROOT) not in sys.path:
	sys.path.insert(0, str(REPOSITORY_ROOT))

from shared.incident_analysis import CSVFormatError, analyze_csv, build_report, export_results


def ask_export() -> bool:
	while True:
		try:
			answer = input("¿Desea exportar los resultados a CSV? [s / n]: ").strip().lower()
		except EOFError:
			return False
		if answer in ("s", "n"):
			return answer == "s"
		print("Respuesta no válida. Escriba 's' o 'n'.")


def main() -> int:
	if len(sys.argv) < 2:
		print("Usage: python analyze.py <incidents-csv>", file=sys.stderr)
		return 2

	csv_path = Path(sys.argv[1])
	try:
		with csv_path.open("r", newline="", encoding="utf-8-sig") as csv_file:
			result = analyze_csv(csv_file)
	except (OSError, UnicodeError, CSVFormatError) as error:
		print("Error reading CSV: {}".format(error), file=sys.stderr)
		return 1

	lines, metrics = build_report(result)
	print("\n".join(lines))

	if ask_export():
		try:
			export_results(metrics, Path("results.csv"))
		except OSError as error:
			print("Error writing results.csv: {}".format(error), file=sys.stderr)
			return 1
		print("Results exported to results.csv")
	return 0


if __name__ == "__main__":
	sys.exit(main())