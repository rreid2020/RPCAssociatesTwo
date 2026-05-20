# Operations and Observability Architecture

## Goals
- Improve incident detection and root-cause speed.
- Add operational visibility without vendor lock-in.
- Preserve current deployment patterns while introducing standards.

## Foundational Contracts
- Structured log envelope:
  - `timestamp`, `level`, `service`, `requestId`, `tenantId`, `userId`, `eventType`, `message`, `metadata`.
- Error envelope:
  - `code`, `message`, `context`, `requestId`, `recoverable`.
- Telemetry event contract:
  - action name, domain, actor, subject, result, timing.

## Instrumentation Points
- Frontend:
  - route transitions
  - auth state changes
  - critical workflow actions (engagement updates, imports, signoffs)
- Backend:
  - request lifecycle logging with correlation IDs
  - auth and tenant policy outcomes
  - integration connector lifecycle events
  - DB operation timing for hotspot routes

## Audit Logging Alignment
- Audit logs are separate from diagnostic logs.
- Governance events (financial workflows) must be immutable and append-only.
- Operational logs may be retained with rolling windows, while audit events require stronger retention policy.

## Deployment Operations Notes
- Keep current DigitalOcean + Docker paths working.
- Add explicit health endpoint consistency and readiness checks per service.
- Standardize environment validation at startup for predictable deployments.

