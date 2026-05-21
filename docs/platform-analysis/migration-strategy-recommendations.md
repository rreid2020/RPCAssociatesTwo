# Migration Strategy Recommendations

## Strategy
Use a strangler, compatibility-first strategy with additive increments.

## Sequence
1. Publish analysis baseline and governance standards.
2. Add domain/platform skeletons and contract boundaries.
3. Extract guard and access policy composition.
4. Converge billing/entitlements and freemium UX consistency.
5. Converge migration ownership and schema governance.
6. Add workflow/events/audit/jobs/usage/AI foundational contracts.
7. Expand regression coverage and rollout controls.

## Migration Rules
- No destructive table drops or schema rewrites.
- Preserve route contracts and UX behavior throughout migration.
- Prefer adapters and compatibility exports during extraction.
- Gate behavioral changes behind feature flags where risk is non-trivial.

## Verification Gates
- Build and targeted test suite on each phase.
- Auth/OAuth onboarding parity checks.
- Workspace entitlement and billing contract checks.
- Schema drift checks between runtime bootstrap and migration ownership.
