# System Inventory

## Purpose
This document inventories the current RPCAssociatesTwo platform and identifies source-of-truth runtime surfaces that must remain backward compatible during the strangler migration.

## Runtime Surfaces
- Frontend SPA: `src/` (React 18 + TypeScript + Vite + React Router + Tailwind + Clerk + Sanity).
- Primary backend API: `api/server/` (Express + pg + Clerk token verification).
- TaxGPT secondary stack: `client-portal/` (workspace monorepo with `taxgpt-api` Fastify and `taxgpt-web` Vite app).
- CMS: `sanity-studio/` (Sanity schemas, content model, editorial tooling).
- Deployment and platform operations: `.do/`, `Dockerfile`, `docker-compose.yml`, `nginx.conf`, root and docs deployment guides.

## Core Product Domains
- Marketing and SEO content: `src/pages/*`, `src/components/SEO.tsx`, `scripts/generate-sitemap.mjs`.
- Client portal shell and subscription gating: `src/components/ClientPortalShell.tsx`, `src/lib/subscriptions/*`.
- Accounting workspace and working papers: `src/pages/portal/accounting/*`, `api/server/services/workingPapersService.js`, `api/server/services/accountingWorkspaceService.js`.
- Tax Intelligence workflows: `src/pages/portal/tax-intelligence/*`, `api/server/routes/taxIntelligenceRoutes.js`, `api/server/services/tax-intelligence/*`.
- File repository: `src/pages/portal/FileRepository.tsx`, `api/server/services/portalS3.js`.

## Critical Configuration Surfaces
- Frontend env: root `.env` with `VITE_*` variables.
- API env: `api/server/.env` with fallback load from `client-portal/.env`.
- Shared migration/env contracts: `client-portal/packages/shared/src/config/index.ts`.
- Database schema management currently split across:
  - Runtime bootstrap SQL: `api/server/db/ensurePortalSchema.js`
  - Drizzle schema/migrations: `client-portal/packages/shared/src/db/schema.ts`, `client-portal/packages/shared/drizzle/*`

## Existing Architectural Risks
- Monolithic route registry in `src/App.tsx`.
- Large feature pages acting as internal routers (`AccountingWorkspacePage.tsx`, `ReturnBuilder.tsx`).
- Mixed URL conventions for Tax Intelligence (`/app/tax-intelligence/*` and legacy `/portal/tax-intelligence/*`).
- Fragmented test coverage and no unified integration test layer.
- Duplicate/parallel platform stacks with partial overlap (`src/portal` vs `client-portal/taxgpt-web`).

## Migration Constraints
- Preserve existing URLs, redirects, auth behavior, SEO files, and visual UX patterns.
- Introduce modular architecture in parallel, with adapters and compatibility exports.
- Favor extraction over rewrites.

