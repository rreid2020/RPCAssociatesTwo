# Incremental Migration Roadmap

## Wave A — Audit and Documentation
- Deliver architecture and governance docs.
- Add target folder scaffolding with migration notes.
- No runtime behavior changes.

## Wave B — Router Extraction
- Create `src/router/*` registries.
- Introduce `ProtectedRoute` and `PortalLayoutRoute`.
- Keep all existing path aliases and redirects.
- Add route parity checks.

## Wave C — Module Shell Extraction
- Create `src/modules/*` shells.
- Move route-adjacent logic first (routes and page orchestrators).
- Maintain compatibility exports to avoid broad breakage.

## Wave D — Shared Platform and Typed Service Facades
- Add `src/shared/*` and `src/services/*` foundations.
- Wrap existing clients (`portalFetch`, `taxFetch`) with typed facades.
- Migrate consumers incrementally.

## Wave E — RBAC and Tenant Policy Foundations
- Add role enums, permission matrices, policy resolvers.
- Integrate with workspace and engagement context checks.

## Wave F — Financial Governance Contracts
- Define audit event taxonomy, lifecycle contracts, and lineage schemas.
- Add governance hooks in backend service layer.

## Wave G — Tests, Observability, DX
- Expand test architecture and coverage gates.
- Add structured logging/error/telemetry contracts.
- Add env validation and architecture boundary linting.

## Exit Criteria per Wave
- Build passes.
- Existing route behavior unchanged.
- Clerk auth parity validated.
- No SEO regressions for sitemap/robots/canonical handling.

