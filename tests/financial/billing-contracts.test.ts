import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BILLING_EVENT_TYPES,
  createBillingEventEnvelope,
  normalizeBillingStatus
} from '../../api/server/services/governance/billingContracts.js'

const repositoryMocks = vi.hoisted(() => ({
  recordWorkspaceBillingEvent: vi.fn(),
  ensureWorkspaceBillingRows: vi.fn(),
  getWorkspaceEntitlementRow: vi.fn(),
  getWorkspaceSubscriptionRow: vi.fn(),
  getWorkspaceUsageRow: vi.fn(),
  upsertWorkspaceEntitlementsRow: vi.fn(),
  upsertWorkspaceSubscriptionRow: vi.fn()
}))

vi.mock('../../api/server/services/repositories/billingRepository.js', () => repositoryMocks)

describe('billing governance and webhook contracts', () => {
  beforeEach(() => {
    repositoryMocks.recordWorkspaceBillingEvent.mockReset()
  })

  it('normalizes unknown billing statuses to none', () => {
    expect(normalizeBillingStatus('ACTIVE')).toBe('active')
    expect(normalizeBillingStatus('unexpected')).toBe('none')
  })

  it('creates billing event envelopes with required fields', () => {
    const envelope = createBillingEventEnvelope({
      workspaceId: 'ws_123',
      eventType: BILLING_EVENT_TYPES.SUBSCRIPTION_UPDATED,
      source: 'stripe',
      sourceEventId: 'evt_123',
      payload: { subscriptionId: 'sub_123' }
    })
    expect(envelope.workspaceId).toBe('ws_123')
    expect(envelope.eventType).toBe(BILLING_EVENT_TYPES.SUBSCRIPTION_UPDATED)
  })

  it('handles webhook idempotency by reporting duplicates', async () => {
    const { handleBillingWebhookEvent } = await import('../../api/server/services/orchestrators/billingOrchestrator.js')

    repositoryMocks.recordWorkspaceBillingEvent
      .mockResolvedValueOnce({ id: 'evt_row_1' })
      .mockResolvedValueOnce(null)

    const first = await handleBillingWebhookEvent({} as any, {
      workspaceId: 'ws_1',
      eventType: BILLING_EVENT_TYPES.SUBSCRIPTION_UPDATED,
      source: 'stripe',
      sourceEventId: 'evt_1',
      payload: { status: 'active' }
    })
    const second = await handleBillingWebhookEvent({} as any, {
      workspaceId: 'ws_1',
      eventType: BILLING_EVENT_TYPES.SUBSCRIPTION_UPDATED,
      source: 'stripe',
      sourceEventId: 'evt_1',
      payload: { status: 'active' }
    })

    expect(first.processed).toBe(true)
    expect(first.duplicate).toBe(false)
    expect(second.processed).toBe(false)
    expect(second.duplicate).toBe(true)
  })
})
