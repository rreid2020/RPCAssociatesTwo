# Repository Structure Analysis

## Active Runtime Areas
- `src/`: primary frontend app.
- `api/server/`: primary backend API.
- `client-portal/packages/shared/`: shared schema/types/migration runtime.
- `docs/architecture/`: prior architecture workstream artifacts.

## Observed Structure Pattern
- Transitional hybrid: old page/service organization + new module/router scaffolding.
- Strong compatibility layer approach (`src/modules/*/routes/index.ts`) that supports incremental migration.

## Structural Gaps
- `src/domains/` and `src/platform/` are not yet formalized as core ownership boundaries.
- Shared design system and platform utility directories exist but are not uniformly consumed.
- Backend route composition is still dominated by a legacy all-in-one portal router.

## Recommended Structural Direction
- Keep current `src/modules/*` as compatibility shell.
- Introduce formal `src/domains/*` for business ownership and `src/platform/*` for cross-cutting primitives.
- Split backend routes by bounded context while preserving mount paths.
