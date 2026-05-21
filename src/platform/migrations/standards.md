# Migration Standards

## Rules
- Use additive migrations by default.
- Never drop/rename production columns without compatibility bridge migrations.
- Use explicit backfills and idempotent checks where legacy runtime DDL exists.
- Keep one migration source of truth per table family.

## Entity Convention
New workspace-scoped entities should include:
- `id` (UUID)
- `workspace_id`
- `created_at`, `updated_at`
- `created_by`, `updated_by`
- optional `deleted_at`

## Index Convention
- Index all foreign key columns.
- Index high-cardinality filter columns used by primary list endpoints.
- For events/audit, index `(workspace_id, created_at DESC)`.

## Rollout Convention
- Ship migrations before code paths that require them.
- Preserve compatibility reads during transitions.
- Validate with smoke tests against existing production-like snapshots.
