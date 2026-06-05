# Phase D — Import Templates & Cross-Dataset Joins

## Goal

Accelerate repeat imports and connect supporting schedules to trial balance analysis.

## Import templates — `workspace_dataset_import_templates`

| Column | Type |
|--------|------|
| id | UUID |
| workspace_id | UUID |
| name | TEXT | e.g. "Wave Trial Balance", "Client AR Aging" |
| dataset_type | VARCHAR |
| header_row_number | INT | Optional default |
| column_schema | JSONB | Predefined column mapping |
| mapping_hints | JSONB | Header keyword bonuses |
| created_by | TEXT |
| created_at | TIMESTAMP |

### UX

- On import, offer **"Apply saved template"** if workspace has matching templates
- **"Save as template"** after successful manual mapping
- Templates are workspace-scoped (not global) for tenant safety

## Cross-dataset joins — `engagement_dataset_view_joins`

Stored inside view `config` (Phase C extension):

```json
{
  "joins": [{
    "targetDatasetId": "uuid",
    "type": "left",
    "localColumn": "account_number",
    "foreignColumn": "acct_no"
  }]
}
```

### Supported join types (v1)

- Left join only
- One additional dataset per view (v1 cap)
- Join keys must be text or number columns

### Use cases

- TB account number ↔ AR aging customer code
- TB account ↔ fixed asset GL account
- Custom schedule enrichment

## AI assist (optional)

When template + heuristics fail, AI suggests:

- Header row
- Column types
- Join keys between two datasets

Requires `OPENAI_API_KEY` (same as TB import).

## Exit criteria

- [ ] Save/import using workspace template
- [ ] View with left join returns combined rows
- [ ] TB workflow still independent and unaffected
