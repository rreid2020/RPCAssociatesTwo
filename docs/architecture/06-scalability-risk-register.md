# Scalability Risk Register

## Risk Ratings
- Severity: High/Medium/Low
- Horizon: Immediate/Quarterly/Long-term

## Risks

1. Monolithic route composition in `src/App.tsx`
- Severity: High
- Horizon: Immediate
- Impact: Slow feature delivery, guard regressions, onboarding friction.
- Mitigation: Modular route registries + protected/layout wrappers.

2. Mega-page orchestration in accounting and tax workflows
- Severity: High
- Horizon: Immediate
- Impact: Higher defect density, harder testability.
- Mitigation: Module extraction with compatibility exports.

3. Dual schema ownership model
- Severity: High
- Horizon: Immediate
- Impact: Migration drift and production inconsistency.
- Mitigation: Align runtime bootstrap and migration ownership model with explicit contracts.

4. Sparse integration testing
- Severity: High
- Horizon: Immediate
- Impact: Regressions in auth/tenant isolation and route behavior.
- Mitigation: Add integration and financial deterministic test suites.

5. Weak RBAC formalization
- Severity: Medium
- Horizon: Quarterly
- Impact: Permission drift as tenant complexity increases.
- Mitigation: Role hierarchy + permission matrix + policy resolvers.

6. Fragmented operational instrumentation
- Severity: Medium
- Horizon: Quarterly
- Impact: Slow incident triage and unclear auditability.
- Mitigation: Structured logging, correlation IDs, telemetry contracts.

7. Inconsistent environment validation
- Severity: Medium
- Horizon: Quarterly
- Impact: Environment-specific runtime failures.
- Mitigation: Centralized env schema validation layer for frontend/backend.

