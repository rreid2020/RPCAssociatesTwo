# Target Architecture

## Principles
- Strangler migration over rewrite.
- Domain-oriented module boundaries.
- Explicit contracts for routing, permissions, API DTOs, and governance.
- Backward-compatible URLs, auth behavior, and content rendering.

## Proposed Structure
- Root: `/apps`, `/packages`, `/services`, `/docs` (coexisting with current layout while migrating).
- Frontend:
  - `src/app/`
  - `src/router/`
  - `src/layouts/`
  - `src/modules/`
  - `src/shared/`
  - `src/services/`
  - `src/hooks/`
  - `src/lib/`
  - `src/types/`
  - `src/providers/`
  - `src/config/`
  - `src/styles/`

## Router Design
- Modular route registries by domain.
- Shared route guards with Clerk parity.
- Route-level lazy loading for high-cost views.

## Service Design
- Frontend service facades with DTO mappings.
- Backend split into repositories, orchestrators, validators, authz policies.
- Stable HTTP contracts while internals are refactored.

## Authorization Design
- Role hierarchy and permission matrix as code.
- Tenant/workspace/engagement scope resolvers.
- Policy checks centralized in helper utilities.

## Governance Design
- Immutable audit events.
- Engagement lifecycle state contracts.
- Signoff and review traceability.
- Document lineage and source provenance.

