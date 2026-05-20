# Testing Target Architecture

## Current State Summary
- Root vitest coverage is concentrated in tax engine tests.
- Minimal integration coverage for API/auth/tenant boundaries.
- No unified enterprise test topology across frontend and backend workflows.

## Target Test Topology
- `tests/unit/` for pure logic and utility tests.
- `tests/integration/` for route, auth, API-client, and tenant boundary tests.
- `tests/financial/` for deterministic accounting/tax governance tests.
- `tests/fixtures/` for canonical scenario datasets and reproducibility inputs.

## Priority Test Domains
- Route/auth parity for protected portal flows.
- Workspace and engagement tenant isolation behavior.
- Financial calculations determinism and reproducibility.
- Working papers lifecycle behavior (notes/signoffs/status transitions).
- API response shape compatibility during refactor.

## Utilities to Add
- Auth context test helpers (signed-in/signed-out roles).
- Tenant context factory helpers (workspace and engagement scopes).
- API mock layer for deterministic frontend service tests.
- Financial fixture loaders and expected-outcome validators.

## CI Gate Recommendation
- Required checks:
  - Typecheck
  - Lint
  - Unit tests
  - Integration smoke tests
  - Financial deterministic suite

