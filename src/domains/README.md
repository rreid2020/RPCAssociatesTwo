# Domains

This directory defines business ownership boundaries for the financial intelligence platform.

Rules:
- Domain logic belongs in domain services/repositories/contracts.
- UI components remain compatibility-friendly with `src/modules/*` during migration.
- Cross-cutting capabilities belong in `src/platform/*`.
