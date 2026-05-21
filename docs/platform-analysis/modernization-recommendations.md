# Modernization Recommendations

## Recommended Modernization Path

1. **Finalize Domain Skeletons**
   - Add `src/domains/*` and map existing module/page ownership progressively.

2. **Formalize Platform Primitives**
   - Introduce `src/platform/*` contracts for database, repositories, events, workflows, usage, jobs, and observability.

3. **Complete Guard Composition**
   - Standardize `AuthGuard -> OnboardingGuard -> SubscriptionGuard -> EntitlementGuard` usage with shared policies.

4. **Consolidate Plan/Entitlement Truth**
   - Keep one canonical plan model and entitlement map consumed by UI and backend services.

5. **Converge Migration Governance**
   - Reduce runtime DDL dependence; migrate toward single governed migration path.

6. **Incrementally Split Monolith Files**
   - Extract accounting and subscription/onboarding flows into domain-level components/services without route changes.

7. **Strengthen Auditability**
   - Promote event and audit contracts to first-class persisted workflows, especially for billing, onboarding, and AI usage.
