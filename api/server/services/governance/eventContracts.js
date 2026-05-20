import crypto from 'crypto'

export const AUDIT_EVENT_TYPES = [
  'workspace.member_added',
  'workspace.invite_created',
  'workspace.invite_accepted',
  'engagement.status_changed',
  'engagement.archived',
  'trial_balance.imported',
  'lead_sheet.generated',
  'lead_sheet.preparer_signed_off',
  'lead_sheet.reviewer_signed_off',
  'review_note.status_changed',
  'document.linked',
  'integration.connection_updated'
]

export function createGovernanceEvent ({
  eventType,
  actorUserId,
  workspaceId,
  engagementId = null,
  metadata = {}
}) {
  if (!AUDIT_EVENT_TYPES.includes(eventType)) {
    throw new Error(`Unsupported governance event type: ${eventType}`)
  }
  return {
    eventId: crypto.randomUUID(),
    eventType,
    occurredAt: new Date().toISOString(),
    actorUserId,
    workspaceId,
    engagementId,
    metadata
  }
}

