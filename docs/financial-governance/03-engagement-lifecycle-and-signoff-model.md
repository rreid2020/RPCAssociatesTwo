# Engagement Lifecycle and Signoff Model

## Lifecycle States
- Draft
- InProgress
- UnderReview
- ReviewBlocked
- ReadyForSignoff
- SignedOff
- Archived

## Transition Rules
- Transitions must be role-gated and tenant-scoped.
- Invalid transitions must be rejected with explicit policy reasons.
- Every transition emits an audit event.

## Signoff Model
- Preparer and reviewer signoffs are distinct actions.
- Signoff records require:
  - actor identity
  - role at time of action
  - timestamp
  - engagement/lead-sheet scope
  - optional attestation metadata

## Review Notes Governance
- Notes move through managed states (open/addressed/cleared/reopened).
- Status history is retained in audit events.
- Reopen operations must capture reason metadata.

## Compatibility Constraint
- Existing engagement and review endpoints remain unchanged during initial migration.
- Governance enforcement is introduced behind service-layer policy checks first.

