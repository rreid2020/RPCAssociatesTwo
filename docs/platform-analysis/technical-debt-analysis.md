# Technical Debt Analysis

## Debt Categories

### Structural Debt
- Feature-heavy pages acting as mini-apps.
- Mixed module ownership between `src/pages`, `src/modules`, and new billing slices.

### Backend Layering Debt
- Legacy route handlers directly issuing SQL.
- Parallel policy patterns instead of a single authorization/entitlement pipeline.

### Data Governance Debt
- Runtime DDL + migration DDL duplication.
- Transitional schema/table evolution not consistently represented in one migration ledger.

### Product Flow Debt
- Subscription and billing UX overlap still exists across old and new surfaces.
- Some guard checks are centralized; others remain route-local.

## Debt Reduction Strategy
- Prioritize debt that affects correctness and governance first (schema drift, entitlement consistency).
- Use extraction over rewrite for page and router debt.
- Keep all user-facing routes and visual behavior unchanged while refactoring internals.
