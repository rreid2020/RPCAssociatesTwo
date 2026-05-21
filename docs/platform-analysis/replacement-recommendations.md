# Replacement Recommendations

## Replace Incrementally (Not Big-Bang)

### 1) Replace Monolithic Route Ownership
- Replace `portalRoutes` domain-by-domain with composed route modules.
- Keep mount paths and endpoint contracts unchanged.

### 2) Replace Runtime-Centric DDL Ownership
- Transition duplicated runtime DDL into governed migration ownership.
- Keep temporary compatibility shims until migration convergence is validated.

### 3) Replace Page-Centric Orchestration
- Move orchestration from mega-pages to domain services/hooks with compatibility wrappers.

### 4) Replace Ad-Hoc Access Checks
- Replace scattered route checks with formal permission + entitlement policy helpers.

## Do Not Replace
- Clerk
- Stripe
- React/Vite framework stack
- Existing visual design system
- Existing PostgreSQL schema data
