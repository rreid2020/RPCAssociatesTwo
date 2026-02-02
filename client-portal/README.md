Client Portal
=============

This folder contains the client portal codebase (including TaxGPT) and related
services. It is intentionally kept separate from the RPC marketing site.

Structure
---------
- taxgpt-web: TaxGPT web app (Clerk auth + portal layout)
- taxgpt-api: TaxGPT API service
- packages: Shared packages from the TaxGPT monorepo

Portal Shell
------------
The portal shell is defined in `taxgpt-web/src/pages/PortalLayout.tsx` and
includes top-level navigation slots for:
- Dashboard
- TaxGPT
- File Repository (placeholder)
- Working Papers (placeholder)
- Integrations (placeholder)

Next Steps
----------
- Wire new portal routes into `taxgpt-web` as features are built.
- Connect file repository, working papers, and integrations modules.
