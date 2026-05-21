export type AuditSeverity = 'info' | 'warning' | 'critical'

export interface AuditEvent {
  eventType: string
  workspaceId: string
  actorUserId: string | null
  severity: AuditSeverity
  metadata: Record<string, unknown>
  occurredAt: string
}

export function createAuditEvent (input: Omit<AuditEvent, 'occurredAt'>): AuditEvent {
  return {
    ...input,
    occurredAt: new Date().toISOString()
  }
}
