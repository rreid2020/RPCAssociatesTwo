# Database Analysis

## Database Topology
- PostgreSQL is the platform data store.
- Operational data is primarily in the `taxgpt` schema, with form captures in `public`.

## Integration Paths
- API runtime uses `node-pg` with startup schema ensure.
- Shared package uses Drizzle schema/migrations for broader typed contracts.

## Key Risks
- Duplicate DDL ownership (`ensurePortalSchema` and service-level table ensures) for workspace/billing surfaces.
- Partial migration journaling and non-uniform schema source of truth.
- Transitional tenant isolation with mixed ownership semantics.

## Governance Direction
- Establish one primary migration authority for schema evolution.
- Keep runtime schema ensure only as temporary compatibility fallback.
- Adopt additive, reversible, audited migration standards with explicit domain ownership.

## Data Safety Position
- No destructive schema rewrites required for current evolution path.
- Existing tables should be preserved and wrapped behind repositories/services.
