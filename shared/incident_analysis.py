import csv
import io
import re
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, TextIO, Tuple


CATEGORIES = ("TECHNICAL", "BILLING", "ACCESS", "HR_QUERY", "COMPLAINT")
STATUSES = ("OPEN", "CLOSED", "DISCARDED")
REQUIRED_COLUMNS = (
	"client_company",
	"category",
	"description",
	"agent_id",
	"customer_email",
	"status",
	"satisfaction_score",
)
AGENT_ID_PATTERN = re.compile(r"AGT-[0-9]{2}")
EMAIL_PATTERN = re.compile(
	r"[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*"
	r"@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?"
	r"(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+"
)
INVALID_REASON_ORDER = (
	"Missing client_company",
	"Invalid or missing category",
	"Invalid or missing description",
	"Invalid or missing agent_id",
	"Invalid or missing email",
	"Closed ticket, no score",
	"Closed ticket, invalid score",
)


class CSVFormatError(ValueError):
	"""Raised when a CSV cannot be interpreted as an incidents file."""


@dataclass
class AnalysisResult:
	total_records: int = 0
	valid_records: int = 0
	invalid_records: int = 0
	invalid_reasons: Counter = field(default_factory=Counter)
	categories: Counter = field(default_factory=Counter)
	statuses: Counter = field(default_factory=Counter)
	scores: Counter = field(default_factory=Counter)
	score_total: int = 0


def validate_record(record: Dict[str, str]) -> Tuple[List[str], int]:
	reasons = []
	client_company = (record.get("client_company") or "").strip()
	category = record.get("category") or ""
	description = (record.get("description") or "").strip()
	agent_id = record.get("agent_id") or ""
	customer_email = (record.get("customer_email") or "").strip()
	status = (record.get("status") or "").strip()
	score_text = (record.get("satisfaction_score") or "").strip()
	score = None

	if not client_company:
		reasons.append("Missing client_company")
	if category not in CATEGORIES:
		reasons.append("Invalid or missing category")
	if len(description) < 5:
		reasons.append("Invalid or missing description")
	if not AGENT_ID_PATTERN.fullmatch(agent_id):
		reasons.append("Invalid or missing agent_id")
	local_part = customer_email.partition("@")[0]
	if (
		len(customer_email) > 254
		or len(local_part) > 64
		or not EMAIL_PATTERN.fullmatch(customer_email)
	):
		reasons.append("Invalid or missing email")

	if status == "CLOSED":
		if not score_text:
			reasons.append("Closed ticket, no score")
		elif score_text not in {"1", "2", "3", "4", "5"}:
			reasons.append("Closed ticket, invalid score")
		else:
			score = int(score_text)
			if not 1 <= score <= 5:
				reasons.append("Closed ticket, invalid score")
				score = None

	return reasons, score if score is not None else 0


def analyze_csv(csv_file: TextIO) -> AnalysisResult:
	result = AnalysisResult()
	try:
		reader = csv.DictReader(csv_file, strict=True)
		headers = reader.fieldnames
		if not headers:
			raise CSVFormatError("CSV is missing its header row")
		if any(not header or not header.strip() for header in headers):
			raise CSVFormatError("CSV contains an empty column name")
		if len(headers) != len(set(headers)):
			raise CSVFormatError("CSV contains duplicate column names")
		missing_headers = [column for column in REQUIRED_COLUMNS if column not in headers]
		if missing_headers:
			raise CSVFormatError("CSV is missing required columns")

		for record in reader:
			if None in record:
				raise CSVFormatError("CSV row has more fields than its header")
			result.total_records += 1
			reasons, score = validate_record(record)

			# Count each invalid row once, but retain all causes for its breakdown.
			if reasons:
				result.invalid_records += 1
				result.invalid_reasons.update(reasons)
				continue

			result.valid_records += 1
			category = record.get("category") or ""
			status = (record.get("status") or "").strip() or "(missing)"
			result.categories[category] += 1
			result.statuses[status] += 1

			if status == "CLOSED":
				result.scores[score] += 1
				result.score_total += score
	except csv.Error as error:
		raise CSVFormatError("Malformed CSV data") from error

	return result


def _ordered_counts(counter: Counter, known_values: Tuple[str, ...]) -> List[Tuple[str, int]]:
	items = [(value, counter[value]) for value in known_values]
	items.extend(
		(value, counter[value])
		for value in sorted(set(counter) - set(known_values))
	)
	return items


def build_report(result: AnalysisResult) -> Tuple[List[str], List[Tuple[str, str]]]:
	lines = [
		"Total records: {}".format(result.total_records),
		"Valid records: {}".format(result.valid_records),
		"Invalid records: {}".format(result.invalid_records),
	]
	metrics = [
		("Total records", str(result.total_records)),
		("Valid records", str(result.valid_records)),
		("Invalid records", str(result.invalid_records)),
	]

	for reason in INVALID_REASON_ORDER:
		count = result.invalid_reasons[reason]
		if count:
			lines.append("  - {}: {}".format(reason, count))
			metrics.append((reason, str(count)))

	category_items = _ordered_counts(result.categories, CATEGORIES)
	category_breakdown = ", ".join(
		"{} ({})".format(name, count) for name, count in category_items
	)
	lines.append("Breakdown by Category (validos): {}".format(category_breakdown))
	metrics.extend(
		("Valid records by category: {}".format(name), str(count))
		for name, count in category_items
	)

	status_items = _ordered_counts(result.statuses, STATUSES)
	status_breakdown = ", ".join(
		"{} ({})".format(name, count) for name, count in status_items
	)
	lines.append("Breakdown by Status (validos): {}".format(status_breakdown))
	metrics.extend(
		("Valid records by status: {}".format(name), str(count))
		for name, count in status_items
	)

	closed_count = result.statuses["CLOSED"]
	scored_closed_count = sum(result.scores.values())
	average = result.score_total / scored_closed_count if scored_closed_count else 0
	score_breakdown = ", ".join(
		"Score {}: {}".format(score, result.scores[score])
		for score in range(1, 6)
	)
	lines.append(
		"Satisfaction Index (closed tickets): {} of {}, Average: {:.2f} / 5.00 ({})".format(
			scored_closed_count, closed_count, average, score_breakdown
		)
	)
	metrics.extend(
		[
			("Satisfaction Index (closed tickets)", "{} of {}".format(
				scored_closed_count, closed_count
			)),
			("Average satisfaction score", "{:.2f} / 5.00".format(average)),
		]
	)
	metrics.extend(
		("Satisfaction score {}".format(score), str(result.scores[score]))
		for score in range(1, 6)
	)
	return lines, metrics


def build_summary(result: AnalysisResult) -> Dict[str, object]:
	closed_count = result.statuses["CLOSED"]
	scored_closed_count = sum(result.scores.values())
	average = result.score_total / scored_closed_count if scored_closed_count else 0
	return {
		"total_records": result.total_records,
		"valid_records": result.valid_records,
		"invalid_records": result.invalid_records,
		"invalid_breakdown": {
			reason: result.invalid_reasons[reason] for reason in INVALID_REASON_ORDER
		},
		"breakdown_by_category": dict(_ordered_counts(result.categories, CATEGORIES)),
		"breakdown_by_status": dict(_ordered_counts(result.statuses, STATUSES)),
		"satisfaction_index": {
			"scored_closed_tickets": scored_closed_count,
			"closed_tickets": closed_count,
			"average": round(average, 2),
			"score_distribution": {
				str(score): result.scores[score] for score in range(1, 6)
			},
		},
	}


def metrics_to_csv(metrics: List[Tuple[str, str]]) -> str:
	output = io.StringIO(newline="")
	writer = csv.writer(output, lineterminator="\n")
	writer.writerow(("Metric", "Value"))
	writer.writerows(metrics)
	return output.getvalue()


def export_results(metrics: List[Tuple[str, str]], output_path: Path) -> None:
	with output_path.open("w", newline="", encoding="utf-8") as csv_file:
		csv_file.write(metrics_to_csv(metrics))