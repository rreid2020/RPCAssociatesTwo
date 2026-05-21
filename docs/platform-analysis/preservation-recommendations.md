# Preservation Recommendations

## Preserve As-Is (Functional Baselines)
- Clerk as sole authentication and identity source.
- Clerk OAuth providers and callback behavior.
- Existing user-visible routes and canonical redirects.
- Existing portal shell UI, styling, and branding conventions.
- Existing workspace onboarding outcomes and current dashboard entry behavior.
- Existing PostgreSQL operational tables and non-destructive migration posture.
- Existing integration endpoints and current QBO/Google connection flow surfaces.

## Preserve While Refactoring Internals
- API response envelopes and route paths.
- Existing feature flags and rollout toggles.
- Existing workspace selection header semantics until repository boundaries are stabilized.

## Preservation Rule
Every modernization change should be adapter-first and reversible, with parity tests for affected flows.
