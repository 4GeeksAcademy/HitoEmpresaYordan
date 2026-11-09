# Shared incident validation

Python package `nexova_shared`, based on the root `company-BRIEFIING` contract.
The existing TypeScript package is independent and remains unchanged.

From the repository root, install the API and its shared workspace dependency:

```sh
uv sync --package nexova-suppliers-api
```

## API

Import `IncidentCreate` directly as the FastAPI request model. Import `Incident`
for stored records, or call `validate_incident(payload)` outside FastAPI.
Validate updates against the persisted status with
`validate_status_transition(current_status, requested_status)` before saving.
Only the four transitions listed in the briefing are accepted, including no
outgoing transitions from final states. Initial CSV imports may have final states.

```python
from nexova_shared import IncidentCreate, validate_status_transition

payload = IncidentCreate(
    title="ATS unavailable",
    description="The recruitment team cannot access the ATS.",
    category="technical_failure",
    origin="internal",
)
next_status = validate_status_transition(payload.status, "in_progress")
```

## CSV Seed

`CsvIncidentRow` validates source rows. `transform_csv_incident(row)` returns an
`incident` and a separate `deduplication_key`. `iter_csv_incidents(path)` reads a
UTF-8 CSV using the standard CSV parser, skips invalid rows with a warning and
suppresses repeated keys. Additional CSV columns are ignored.

```python
from nexova_shared import iter_csv_incidents

for entry in iter_csv_incidents("incidents-nexova.csv"):
    document = entry.incident.model_dump(mode="json")
    # Save document through the seed's storage layer.
    # Save entry.deduplication_key separately after a successful insert.
```

Descriptions remain unchanged; titles use the first 120 characters, then trim
surrounding whitespace. Dates must be real calendar dates in `YYYY-MM-DD` form
and become midnight UTC. Both timestamps are identical. Origin is always
`customer` and branch is always `central`. Unknown CSV codes are rejected rather
than silently assigned a default category or status.

Deduplication uses `ticket_id`, or `(title, created_at)` when it is absent or
blank. The ticket ID is not included in the incident document. To make imports
idempotent across runs, the seed must persist the keys separately and pass them
back as `seen_keys: set[tuple[str, ...]]` to `iter_csv_incidents`. Keep that
metadata consistent with successful inserts; the iterator alone only deduplicates
within a run. Reuse an existing record's title and UTC timestamp for fallback
keys.

## Exports

- `IncidentStatus`, `IncidentCategory`, `IncidentBranch`, `IncidentOrigin`.
- `BRANCH_LABELS`, `CSV_STATUS_MAP`, `CSV_CATEGORY_MAP`, `STATUS_TRANSITIONS`.
- `IncidentCreate`, `Incident`, `IncidentSeed`, `CsvIncidentRow`, `CsvIncidentImport`.
- `validate_incident`, `validate_status_transition`, `transform_csv_incident`,
  `iter_csv_incidents`.

No previous CSV analyzer or historical CSV is included in this repository. The
rules here implement the provided briefing, not additional inferred analyzer
rules. The expected 96-row totals must be checked when that CSV is available.
Incident persistence, routes and the database seed are separate consumers of this
package; the existing supplier API and supplier seed are not replaced.