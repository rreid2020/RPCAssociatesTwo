# Phase B — Engagement Datasets

## Goal

Users can import any ad-hoc CSV/XLSX as a named dataset on an engagement, map columns to typed fields, and browse imported rows.

## Data model

### `engagement_datasets`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| workspace_id | UUID | Tenant scope |
| engagement_id | UUID | FK |
| name | TEXT | User label |
| description | TEXT | Optional |
| dataset_type | VARCHAR | `custom`, `ar_aging`, `fixed_assets`, `payroll`, `gl_detail`, `other` |
| status | VARCHAR | `draft`, `imported`, `archived` |
| header_row_index | INT | Detected/selected header (0-based) |
| column_schema | JSONB | `[{ key, label, dataType, sourceColumn }]` |
| row_count | INT | Denormalized |
| source_file_name | TEXT | Last import file |
| latest_import_batch_id | UUID | FK |
| created_by / updated_by | TEXT | Accountability |
| created_at / updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |

### `engagement_dataset_import_batches`

Same provenance pattern as `trial_balance_import_batches`: file name, column mapping, warnings, row counts.

### `engagement_dataset_rows`

| Column | Type |
|--------|------|
| id | UUID |
| dataset_id | UUID |
| source_row_number | INT |
| row_data | JSONB |
| created_at | TIMESTAMP |

## User flow

1. Engagement → **Datasets** tab
2. **New dataset** → name + optional type
3. Upload file → auto-detect (shared wizard)
4. Map columns: for each source column, set **field key**, **label**, **data type** (text/number/currency/date)
5. Update preview → see parsed rows
6. Import → persisted rows; dataset appears in list
7. Open dataset → paginated row table

## UI components

- `EngagementDatasetsPage` — list + create
- `DatasetDetailPage` — row grid + re-import
- `SpreadsheetImportWizard` — shared with TB (pluggable mapping config)
- `DatasetColumnMapper` — custom schema mapping (Phase B specific)

## Non-goals (Phase B)

- No analysis views yet (Phase C)
- No cross-dataset joins (Phase D)
- Trial balance does NOT auto-create a dataset row (TB stays separate)
