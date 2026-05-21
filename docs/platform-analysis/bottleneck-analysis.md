# Bottleneck Analysis

## Primary Bottlenecks

### 1) Backend Route Monolith
- `api/server/routes/portalRoutes.js` contains mixed concerns and long-term change risk.
- Impact: slower feature delivery, regression risk, uneven authz/entitlement enforcement.

### 2) Large Frontend Feature Pages
- `src/pages/portal/accounting/AccountingWorkspacePage.tsx`
- `src/pages/portal/tax-intelligence/ReturnBuilder.tsx`
- `src/pages/portal/Subscription.tsx`
- Impact: difficult testing, high merge conflict probability, coupling of view + orchestration.

### 3) Migration/Schema Drift Risk
- Runtime bootstrap SQL and Drizzle schemas overlap.
- Impact: inconsistent environments, migration uncertainty, governance risk for financial workflows.

### 4) Entitlement Enforcement Inconsistency
- Guards and API checks are partially wired.
- Impact: premium feature pathways may diverge between client UX and server enforcement.

## Near-Term Mitigations
- Split route domains behind composed routers without changing URLs.
- Continue extracting feature pages into domain modules with compatibility exports.
- Converge schema governance into a single primary migration path.
- Standardize entitlement checks in a single policy helper per feature domain.
