import { describe, expect, it } from 'vitest'
import { createAuditEvent } from '../../src/platform/audit/auditEvent'
import { createDefaultUsageSnapshot } from '../../src/platform/usage/usageContracts'
import { createQueuedJob } from '../../src/platform/jobs/jobContracts'
import { isValidWorkflowTransition } from '../../src/platform/workflows/workflowContracts'

describe('platform foundation contracts', () => {
  it('builds audit events with timestamps', () => {
    const event = createAuditEvent({
      eventType: 'test.event',
      workspaceId: 'ws_1',
      actorUserId: 'user_1',
      severity: 'info',
      metadata: { ok: true }
    })
    expect(event.occurredAt).toBeTruthy()
    expect(event.workspaceId).toBe('ws_1')
  })

  it('creates queued jobs with initial state', () => {
    const job = createQueuedJob('doc.extract', 'ws_1')
    expect(job.status).toBe('queued')
    expect(job.progressPercent).toBe(0)
  })

  it('validates workflow transitions', () => {
    expect(isValidWorkflowTransition('in_progress', 'pending_review')).toBe(true)
    expect(isValidWorkflowTransition('completed', 'in_progress')).toBe(false)
  })

  it('creates default usage snapshot', () => {
    const usage = createDefaultUsageSnapshot('ws_1')
    expect(usage.workspaceId).toBe('ws_1')
    expect(usage.activeUsers).toBe(1)
  })
})
