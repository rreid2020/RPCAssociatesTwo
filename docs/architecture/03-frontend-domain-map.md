# Frontend Domain Map

## Domain Overview
The frontend currently combines marketing and SaaS portal concerns in one app. This map defines bounded domains for extraction into `src/modules/*`.

## Current Domain-to-Path Map
- Marketing: `src/pages/Home.tsx`, `src/pages/Services.tsx`, `src/pages/Resources.tsx`, `src/pages/Articles.tsx`.
- SEO/content rendering: `src/components/SEO.tsx`, `src/components/PortableText.tsx`, `src/lib/sanity/*`.
- Portal shell and dashboard: `src/components/ClientPortalShell.tsx`, `src/pages/portal/Dashboard.tsx`.
- Accounting and working papers: `src/pages/portal/accounting/AccountingWorkspacePage.tsx`.
- Tax Intelligence: `src/pages/portal/tax-intelligence/*`.
- Calculators and tax engines: `src/pages/TaxCalculator.tsx`, `src/pages/TaxEngineCalculatorPage.tsx`, `src/features/donation-optimizer/*`, `src/tax/*`.
- Documents/files: `src/pages/portal/FileRepository.tsx`.
- Subscription access controls: `src/lib/subscriptions/*`.

## Target Module Boundaries
- `src/modules/marketing/`
- `src/modules/portal/`
- `src/modules/accounting/`
- `src/modules/working-papers/`
- `src/modules/tax-intelligence/`
- `src/modules/integrations/`
- `src/modules/calculators/`
- `src/modules/documents/`
- `src/modules/subscriptions/`
- `src/modules/seo/`
- `src/modules/auth/`

## Extraction Rules
- Move route definitions first, then page-level orchestration, then leaf components/hooks/services.
- Keep compatibility exports during migration to avoid broad import churn.
- Avoid visual/styling changes during extraction.

## Shared Layer Candidates
- Design/UI primitives to `src/shared/ui/`.
- Shell/navigation/layout to `src/shared/layouts/` and `src/shared/navigation/`.
- Cross-domain helpers to `src/lib/` and typed contracts to `src/types/`.

