# Architecture Audit

## Scope
This audit covers the active runtime surfaces in `src/`, `api/server/`, and `client-portal/packages/shared`.

## Current Architectural Shape
- Frontend uses modular route registries in `src/router/*`, but major business flows remain page-centric.
- Backend uses mixed patterns: monolithic route handlers (`api/server/routes/portalRoutes.js`) and newer layered slices (`api/server/routes/billingRoutes.js` + orchestrator/repository).
- Data architecture is split between runtime SQL bootstrap (`api/server/db/ensurePortalSchema.js`) and Drizzle migrations (`client-portal/packages/shared/drizzle/*`).

## Strengths
- Clerk-first auth architecture is intact and centralized.
- Existing route extraction to registries reduces `App.tsx` complexity.
- Workspace and billing contracts now exist as first-class backend abstractions.
- Entitlement scaffolding is available in both frontend and backend layers.

## High-Risk Couplings
- Accounting and onboarding remain concentrated in large page components.
- Billing and subscription concerns are still partially split between old (`src/lib/subscriptions/*`) and new (`src/services/billing/*`) paths.
- Runtime DDL and migration DDL are duplicated for workspace/billing tables.

## Architectural Conclusion
The system is in a viable strangler phase. It should continue with additive extraction and contract-first layering, not rewrite.
