export const ENGAGEMENT_LIFECYCLE_STATES = [
  'draft',
  'in_progress',
  'under_review',
  'review_blocked',
  'ready_for_signoff',
  'signed_off',
  'archived'
] as const

export type EngagementLifecycleState = typeof ENGAGEMENT_LIFECYCLE_STATES[number]

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
] as const

export type AuditEventType = typeof AUDIT_EVENT_TYPES[number]

export interface GovernanceEventEnvelope {
  eventId: string
  eventType: AuditEventType
  occurredAt: string
  actorUserId: string
  workspaceId: string
  engagementId?: string | null
  metadata?: Record<string, unknown>
}

