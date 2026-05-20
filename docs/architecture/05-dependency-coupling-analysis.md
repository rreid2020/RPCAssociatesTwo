# Dependency and Coupling Analysis

## High Coupling Hotspots
- `src/App.tsx` couples all route concerns and auth wrappers.
- `src/components/ClientPortalShell.tsx` couples navigation, feature access, and portal UX.
- `src/pages/portal/accounting/AccountingWorkspacePage.tsx` couples multiple accounting subdomains in one file.
- `api/server/routes/portalRoutes.js` couples many unrelated portal features in one router.
- `api/server/services/workingPapersService.js` couples engagement, lead sheet, trial balance, and review workflows.

## Dependency Risks
- Frontend clients and server payloads rely on implicit contracts rather than explicit shared DTO schema.
- Database schema has dual ownership (`ensurePortalSchema.js` and Drizzle migrations).
- Environment dependencies differ between root app, API server, and client-portal monorepo.

## Coupling Matrix (Current)
- UI Routing -> Auth Guards -> Shell -> Service Clients -> Backend Routes -> Domain Services -> DB.
- Content and SEO concerns are partly distributed between page-level usage and script-based sitemap generation.

## Refactor Targets
- Extract route registries to isolate domain routing boundaries.
- Introduce service facades and typed DTO layers to reduce direct route-client coupling.
- Split backend routers/services by bounded context.
- Establish shared permission and tenant context helpers to avoid ad hoc checks.

## Guardrails
- No endpoint/path removals during migration.
- Keep adapter exports until all consumers move.
- Use compatibility tests for route and auth parity before removing old wiring.

