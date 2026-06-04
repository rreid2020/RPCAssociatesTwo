# Phase 1 Design Review — Engagement Execution Core

## Coexistence model

| Field | Purpose | Phase 1 |
|-------|---------|---------|
| `status` | Record lifecycle (draft/active/in_review/completed/archived) | Unchanged |
| `review_flow_status` | Preparer/reviewer signoff pipeline | Unchanged |
| `execution_phase` | Methodology lifecycle (planning → locked) | **New** |

Legacy endpoints never read or write `execution_phase`. New `/execution` APIs are isolated.

## `execution_phase` values

- `planning`
- `fieldwork`
- `review`
- `partner_review`
- `completed`
- `locked`

## Transition matrix (manual, role-gated)

| From → To | staff | manager | reviewer | firm_admin |
|-----------|-------|---------|----------|------------|
| planning → fieldwork | ✓ | ✓ | — | ✓ |
| fieldwork → review | ✓ | ✓ | — | ✓ |
| review → partner_review | — | ✓ | ✓ | ✓ |
| partner_review → completed | — | ✓ | ✓ | ✓ |
| any → locked | — | ✓ | — | ✓ |
| locked → * | — | — | — | ✓ (unlock to completed) |

Auto-suggestion (non-blocking) uses checklist/procedure completion and open review notes; never mutates `review_flow_status`.

## Backfill

```sql
UPDATE taxgpt.accounting_engagements
SET execution_phase = 'planning'
WHERE execution_phase IS NULL;
```

## Non-goals (Phase 1)

- No changes to `status` / `review_flow_status` enums or transitions
- No financial statement or PBC deliverables
- No replacement of trial balance or document storage
- No mandatory migration of legacy UI to execution_phase
