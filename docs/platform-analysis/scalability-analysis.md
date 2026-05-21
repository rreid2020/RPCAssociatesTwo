# Scalability Analysis

## Application Scalability
- Route-level lazy loading is in place for heavy areas.
- Main limits are orchestration concentration in large files and repeated per-route data loading.
- Service facades exist and should become the standard API access path for easier caching/query abstraction.

## Backend Scalability
- API is functionally scalable but operationally constrained by monolithic route files and duplicated policy checks.
- Request-id middleware and typed envelopes provide a base for observability improvements.
- Billing orchestrator/repository model is a scalable template for other domains.

## Data Scalability
- Workspace-centric entities are emerging, but some accounting paths still rely on owner-user indirection.
- RLS prep exists but requires incremental adoption and verified tenant context handling.
- Duplicate schema ownership is the largest scalability governance risk.

## Scalability Priorities
1. Complete route/service modularization by bounded context.
2. Consolidate schema governance and remove migration drift.
3. Standardize workspace-scoped entitlement and permission enforcement.
4. Introduce jobs/usage pipelines for heavier OCR/AI/sync workloads.
