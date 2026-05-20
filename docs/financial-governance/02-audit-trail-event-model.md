# Audit Trail Event Model

## Event Model Requirements
- Append-only event storage for governance-critical transitions.
- Every event includes identity and scope metadata.
- Events are immutable; corrections are modeled as compensating events.

## Event Envelope
- `eventId`
- `occurredAt`
- `actorUserId`
- `actorRole`
- `tenantId`
- `workspaceId`
- `engagementId` (nullable)
- `eventType`
- `subjectType`
- `subjectId`
- `before` (optional snapshot)
- `after` (optional snapshot)
- `metadata`

## Minimum Event Types
- Workspace membership changes.
- Role/permission changes.
- Engagement lifecycle transitions.
- Trial balance imports and refreshes.
- Lead sheet generation and signoffs.
- Review note status changes.
- Document attach/link/detach actions.
- Integration connection state changes.

## Operational Rules
- Emit events in the same transactional boundary as state changes where possible.
- Ensure audit emission failure is observable and alertable.
- Do not mutate historical event payloads.

