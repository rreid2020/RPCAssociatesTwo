# Service and API Map

## Primary API Surface (Express)
- Entry: `api/server/server.js`
- Portal router: `api/server/routes/portalRoutes.js`
- Tax router: `api/server/routes/taxIntelligenceRoutes.js`
- Auth middleware: `api/server/middleware/portalAuth.js`

## Major Backend Domain Services
- Accounting workspace tenancy and memberships:
  - `api/server/services/accountingWorkspaceService.js`
- Working papers and engagement workflows:
  - `api/server/services/workingPapersService.js`
  - `api/server/services/trialBalanceImportService.js`
- Integrations and token handling:
  - `api/server/services/integrationOAuthService.js`
  - `api/server/services/accountingProviders.js`
  - `api/server/services/tokenEncryption.js`
- Documents and storage:
  - `api/server/services/portalS3.js`
- Tax Intelligence:
  - `api/server/services/tax-intelligence/*`

## Frontend Service Clients
- Portal client and DTO-like typing: `src/lib/portalApi.ts`
- Tax Intelligence client: `src/lib/taxIntelligenceApi.ts`
- Config helpers: `src/lib/config/api.ts`

## Secondary TaxGPT Stack
- API: `client-portal/taxgpt-api/src/*`
- Web: `client-portal/taxgpt-web/src/*`
- Shared package contracts: `client-portal/packages/shared/*`

## Target Service Architecture
Introduce `src/services/` domain facades:
- `src/services/api/`
- `src/services/accounting/`
- `src/services/tax/`
- `src/services/integrations/`
- `src/services/documents/`
- `src/services/auth/`

And backend decomposition under `api/server/services/`:
- `repositories/` for persistence access
- `orchestrators/` for business workflows
- `dto/` for transport contracts

## Compatibility Strategy
- Keep endpoint URLs and payload shape stable.
- Introduce wrappers around existing fetch clients first.
- Migrate screens to wrappers incrementally.

