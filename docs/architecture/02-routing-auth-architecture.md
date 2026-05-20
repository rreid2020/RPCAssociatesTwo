# Routing and Auth Architecture

## Current Routing Topology
- Primary route registry: `src/App.tsx` (single-file route composition spanning marketing + portal + accounting + tax intelligence).
- Route protection pattern: repeated `SignedIn` + `SignedOut` wrappers from Clerk for protected portal paths.
- Canonical marketing shell: Header/Footer wrapping nested marketing routes.
- Portal shell: page-level wrapping with `ClientPortalShell` (not route-layout centralized).

## Auth Flow
- Frontend:
  - `src/main.tsx` mounts `ClerkProvider`.
  - `src/pages/portal/SignIn.tsx` and `SignUp.tsx` handle user auth UX.
  - Protected routes rely on inline guard duplication in `App.tsx`.
- Backend:
  - `api/server/middleware/portalAuth.js` verifies Clerk JWT (`verifyToken`).
  - Routes in `api/server/routes/portalRoutes.js` and `taxIntelligenceRoutes.js` call `getClerkUser` per request.

## SEO and Routing Interaction
- Metadata runtime: `src/components/SEO.tsx`.
- Sitemaps: `scripts/generate-sitemap.mjs` writes `public/sitemap.xml`.
- Runtime serving safeguards:
  - `api/server/server.js` explicitly serves `/sitemap.xml` and `/robots.txt`.
- Canonical redirect normalization: `src/components/CanonicalRedirect.tsx`.

## Key Defects to Address (Non-Breaking)
- Route definitions are difficult to scale and review.
- Guard logic is duplicated and brittle.
- Lack of route registry separation by domain.
- No systematic route-level lazy loading for heavy feature views.

## Target Router Decomposition
Introduce route registries under `src/router/`:
- `index.tsx`
- `marketing.routes.tsx`
- `auth.routes.tsx`
- `portal.routes.tsx`
- `accounting.routes.tsx`
- `tax.routes.tsx`
- `resource.routes.tsx`

## Guarding Model
- Create `ProtectedRoute` wrapper for Clerk behavior parity.
- Create `PortalLayoutRoute` to centralize shell behavior.
- Preserve all current URLs and redirects, including legacy aliases.

## Acceptance Criteria
- URL parity: all current paths resolve exactly as before.
- Auth parity: unauthorized users always redirect to `/portal/sign-in`.
- SEO parity: no regressions in sitemap, robots, canonical behavior.

