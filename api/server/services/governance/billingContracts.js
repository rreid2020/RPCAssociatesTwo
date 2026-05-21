export const BILLING_EVENT_TYPES = {
  SUBSCRIPTION_ACTIVATED: 'subscription.activated',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  PAYMENT_FAILED: 'payment.failed',
  INVOICE_PAID: 'invoice.paid',
  TRIAL_ENDED: 'trial.ended'
}

export const BILLING_SUBSCRIPTION_STATUSES = [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'none'
]

export function normalizeBillingStatus (value) {
  const status = String(value || 'none').trim().toLowerCase()
  if (BILLING_SUBSCRIPTION_STATUSES.includes(status)) {
    return status
  }
  return 'none'
}

export function createBillingEventEnvelope ({
  workspaceId,
  eventType,
  source,
  sourceEventId,
  payload = {}
}) {
  if (!workspaceId) throw new Error('workspaceId is required')
  if (!eventType) throw new Error('eventType is required')
  if (!source) throw new Error('source is required')

  return {
    workspaceId,
    eventType,
    source,
    sourceEventId: sourceEventId || null,
    payload
  }
}
