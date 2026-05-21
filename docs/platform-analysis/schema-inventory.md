# Schema Inventory

## Classification Model
- **Stable Core**: preserve, additive modernization only.
- **Transitional**: wrap and incrementally refactor.
- **Legacy**: isolate and gradually retire.
- **New Platform**: contract-first, workspace-scoped by default.

## Inventory (High-Level)

### Stable Core
- `taxgpt.users`
- tax intelligence return artifacts already used in production
- core workspace membership/profile structures introduced for onboarding

### Transitional
- accounting working papers tables (`accounting_*`, `trial_balance_*`, `lead_sheet_*`)
- portal repository tables (`portal_client_files`, `portal_folders`, checklist/activity/deadline tables)
- integration connection surfaces and OAuth linkage tables

### Legacy
- `public.leads`
- `public.contacts`
- older portal integration request surfaces where workspace-native equivalents now exist

### New Platform
- workspace billing and entitlement tables (`workspace_subscriptions`, `workspace_entitlements`, usage/event mappings)
- new platform cross-cutting foundations under `src/platform/*` and `src/domains/*`

## Convergence Targets
- Converge duplicated workspace/billing DDL ownership.
- Keep additive migration-only policy for all current operational schemas.
