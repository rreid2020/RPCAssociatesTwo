# Domain Ownership Map

## Core Domains and Primary Ownership

| Domain | Current Primary Code | Target Boundary |
|---|---|---|
| Identity/Auth | `src/pages/portal/SignIn.tsx`, `SignUp.tsx`, `api/server/middleware/portalAuth.js` | `src/domains/Identity`, `src/platform/contracts/auth` |
| Workspace | `src/pages/portal/accounting/AccountingWorkspacePage.tsx`, `api/server/services/accountingWorkspaceService.js` | `src/domains/Workspace` |
| Subscription/Billing | `src/lib/subscriptions/*`, `src/services/billing/*`, `api/server/routes/billingRoutes.js` | `src/domains/Subscription`, `src/domains/Billing` |
| Entitlements | `src/lib/subscriptions/hooks.ts`, `api/server/services/orchestrators/billingOrchestrator.js` | `src/domains/Entitlements` |
| Documents | `src/pages/portal/FileRepository.tsx`, `api/server/services/portalS3.js` | `src/domains/Documents`, `src/platform/documents` |
| Accounting/Working Papers | accounting pages + `workingPapersService.js` | `src/domains/Accounting`, `src/domains/WorkingPapers` |
| Tax Intelligence | `src/pages/portal/tax-intelligence/*`, `api/server/services/tax-intelligence/*` | `src/domains/TaxIntelligence` |
| Integrations | `integrationOAuthService.js`, provider services | `src/domains/Integrations` |
| Audit/Events | governance + audit tables | `src/domains/Audit`, `src/platform/events` |
| Workflows/Jobs/Usage/AI/Notifications | partial contracts only | formal platform + domain skeletons |

## Ownership Principle
Business logic belongs in domain services/repositories; shared capabilities belong in `src/platform/*`.
