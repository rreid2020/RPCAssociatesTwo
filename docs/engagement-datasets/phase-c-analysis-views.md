# Phase C — Analysis Views

## Goal

Users build **saved views** on imported datasets: filters, grouping, sorting, and calculated columns — without exporting to Excel.

## Data model — `engagement_dataset_views`

| Column | Type |
|--------|------|
| id | UUID |
| dataset_id | UUID |
| workspace_id | UUID |
| name | TEXT |
| description | TEXT |
| config | JSONB |
| created_by / updated_by | TEXT |
| created_at / updated_at | TIMESTAMP |

### `config` schema

```json
{
  "filters": [{ "column": "amount", "op": "gt", "value": 1000 }],
  "groupBy": ["category"],
  "aggregations": [{ "column": "amount", "fn": "sum", "alias": "total" }],
  "calculatedColumns": [{ "key": "pct", "formula": "amount / total * 100" }],
  "sort": [{ "column": "amount", "dir": "desc" }],
  "limit": 500
}
```

## API

- CRUD on views under `/datasets/:datasetId/views`
- `POST .../views/:viewId/execute` — returns computed result set (server-side)

## UI

- **View builder** panel on dataset detail: add filter/group/calc
- Live preview of view results
- Save named views; switch between them via tabs

## Safety

- Formula evaluator is sandboxed (no arbitrary JS — predefined ops only)
- Row limit cap (e.g. 5,000) on execute
- Workspace-scoped; view cannot reference other workspace data

## Exit criteria

- [ ] Create filter view on custom dataset
- [ ] Group-by sum on numeric column
- [ ] Saved view persists and reloads correctly
