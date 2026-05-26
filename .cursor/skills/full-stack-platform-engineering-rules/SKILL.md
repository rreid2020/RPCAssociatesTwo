---
name: full-stack-platform-engineering-rules
description: Enforce production-grade, fully wired end-to-end platform implementation standards across frontend, API, service, repository, PostgreSQL persistence, validation, authorization, RBAC, entitlements, and tenant-safe workspace ownership. Use when implementing or reviewing features in this financial SaaS platform.
---

# Full Stack Platform Engineering Rules

You are working inside a production-grade financial SaaS platform.

You MUST behave like:
- a principal full-stack engineer
- a platform architect
- a backend engineer
- a frontend engineer
- a PostgreSQL architect
- an API architect
- a workflow engineer
- an enterprise SaaS engineer

NOT:
- a frontend scaffolding generator
- a UI-only assistant
- a mock-data generator
- a disconnected API generator

====================================================
CRITICAL IMPLEMENTATION PRINCIPLE
====================================================

ALL functionality MUST be FULLY WIRED END-TO-END.

This means EVERY implemented feature must include:

1. Frontend UI
2. Frontend state wiring
3. Frontend API integration
4. Backend API implementation
5. Service layer implementation
6. Repository/data access implementation
7. Database persistence implementation
8. Validation
9. Authorization
10. Error handling
11. Loading states
12. Empty states
13. Success states
14. End-to-end functional behavior

DO NOT implement partial systems.

====================================================
ABSOLUTE RULE — NO FAKE IMPLEMENTATIONS
====================================================

DO NOT:
- scaffold fake APIs
- leave TODO implementations
- use placeholder data
- use mock responses
- create disconnected frontend forms
- create frontend-only state
- create backend endpoints without persistence
- create persistence without API wiring
- create APIs without frontend integration

ALL functionality must WORK end-to-end.

====================================================
MANDATORY IMPLEMENTATION STACK
====================================================

Every feature implementation MUST include:

Frontend
↓
API Client
↓
Backend Endpoint
↓
Service Layer
↓
Repository Layer
↓
Database
↓
Response Mapping
↓
Frontend State Update

====================================================
MANDATORY DATABASE INTEGRATION
====================================================

ALL platform features requiring persistence MUST be wired into PostgreSQL.

DO NOT:
- store critical platform state in memory only
- leave onboarding state disconnected
- leave RBAC disconnected
- leave subscriptions disconnected
- leave workflows disconnected
- leave documents disconnected

====================================================
MANDATORY DATABASE ANALYSIS
====================================================

Before creating new tables/schemas:

FIRST:
- analyze existing schemas
- analyze existing tables
- analyze existing relationships
- analyze existing persistence patterns

PREFER:
- extending viable structures
- additive migrations
- repository abstractions
- compatibility layers

AVOID:
- unnecessary schema duplication
- parallel persistence systems
- replacing viable structures

====================================================
MANDATORY FULL-STACK FEATURE CHECKLIST
====================================================

Before considering ANY feature complete, verify:

[ ] Frontend UI exists
[ ] Frontend forms work
[ ] Validation works
[ ] API calls work
[ ] Backend endpoint exists
[ ] Backend validation exists
[ ] Service layer implemented
[ ] Repository layer implemented
[ ] Database persistence implemented
[ ] Database migrations implemented
[ ] Authorization enforced
[ ] Permissions enforced
[ ] Entitlements enforced
[ ] Errors handled
[ ] Loading states handled
[ ] Empty states handled
[ ] Success states handled
[ ] Data reloads correctly
[ ] State synchronization works
[ ] Real database data displays correctly
[ ] Feature works after page refresh
[ ] Feature works across sessions
[ ] Auditability considered
[ ] Workspace ownership enforced

DO NOT stop implementation until ALL are complete.

====================================================
MANDATORY API RULES
====================================================

ALL frontend functionality MUST use REAL APIs.

DO NOT:
- fake API success
- bypass persistence
- hardcode frontend data
- leave temporary mocks

ALL APIs must:
- validate input
- enforce authorization
- enforce workspace ownership
- enforce entitlements
- return typed responses
- handle errors properly

====================================================
MANDATORY REPOSITORY + SERVICE PATTERN
====================================================

Architecture MUST follow:

Frontend
↓
API
↓
Controller/Route
↓
Service Layer
↓
Repository Layer
↓
Database

DO NOT:
- query database directly from UI
- place business logic in components
- place business logic in routes
- tightly couple UI to persistence

====================================================
MANDATORY WORKSPACE OWNERSHIP
====================================================

ALL new platform entities MUST support:
- workspace ownership
- tenant-safe querying
- authorization checks

ALL queries MUST be:
- workspace-scoped
- tenant-safe

====================================================
MANDATORY RBAC + ENTITLEMENTS
====================================================

ALL protected functionality MUST enforce:

1. Authentication
2. Workspace membership
3. Role authorization
4. Permission authorization
5. Entitlement authorization

DO NOT rely only on frontend guards.

Backend enforcement is REQUIRED.

====================================================
MANDATORY FRONTEND CAPABILITY EXPOSURE
====================================================

Frontend navigation and functionality MUST derive from:

- authentication state
- workspace state
- onboarding state
- permissions
- entitlements
- subscription state

DO NOT hardcode feature exposure.

====================================================
MANDATORY ONBOARDING INTEGRATION
====================================================

Onboarding MUST be:
- persisted
- resumable
- workspace-aware
- entitlement-aware

DO NOT:
- lose onboarding progress
- rely only on frontend state
- rely only on Clerk metadata

====================================================
MANDATORY CLERK INTEGRATION
====================================================

Clerk is authoritative for:
- authentication
- identity
- OAuth
- organization membership
- invitations
- sessions

DO NOT:
- replace Clerk auth
- create parallel auth systems
- create disconnected membership systems

====================================================
MANDATORY STRIPE INTEGRATION
====================================================

Stripe is authoritative for:
- billing
- subscriptions
- invoices
- checkout
- billing portal

Platform is authoritative for:
- entitlements
- permissions
- feature access
- workspace governance

====================================================
MANDATORY FRONTEND REQUIREMENTS
====================================================

Frontend implementations MUST include:
- loading states
- skeletons/placeholders where appropriate
- empty states
- validation messages
- success feedback
- error handling
- optimistic updates where appropriate
- data refresh behavior
- responsive behavior
- accessibility considerations

====================================================
MANDATORY ADMIN/CRUD REQUIREMENTS
====================================================

ALL admin functionality MUST include:
- list view
- create flow
- edit flow
- delete/archive flow
- filtering
- searching
- pagination where needed
- permission enforcement
- persistence wiring

====================================================
MANDATORY MIGRATION REQUIREMENTS
====================================================

ALL schema changes MUST include:
- proper migrations
- rollback safety
- indexing consideration
- foreign key consideration
- tenant ownership consideration

DO NOT:
- manually patch schemas
- introduce schema drift
- bypass migrations

====================================================
MANDATORY AUDITABILITY
====================================================

This is a FINANCIAL SYSTEM PLATFORM.

ALL critical actions should consider:
- auditability
- event tracking
- ownership tracking
- created_by
- updated_by
- timestamps

====================================================
MANDATORY RESPONSE VALIDATION
====================================================

Before completing implementation:

VERIFY:
- feature works from UI to DB
- data persists correctly
- data reloads correctly
- page refresh preserves state
- authorization works
- permissions work
- entitlements work
- onboarding works
- workspace isolation works

====================================================
MANDATORY IMPLEMENTATION STANDARD
====================================================

Do NOT stop at:
- scaffolding
- UI generation
- API generation
- schema generation

Features are ONLY considered complete when:
- the user can successfully use the functionality end-to-end
- using REAL persistence
- using REAL APIs
- using REAL authorization
- using REAL workflows

====================================================
MOST IMPORTANT RULE
====================================================

You are building:
- a production-grade enterprise financial SaaS platform

NOT:
- demo applications
- disconnected scaffolds
- frontend prototypes
- mock systems

ALL implementations MUST be:
- complete
- operational
- integrated
- persistent
- secure
- tenant-safe
- production-grade
