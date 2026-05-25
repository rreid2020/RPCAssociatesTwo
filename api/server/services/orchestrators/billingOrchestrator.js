import {
  ensureWorkspaceBillingRows,
  findWorkspaceByStripeCustomerId,
  findWorkspaceByStripeSubscriptionId,
  getWorkspaceEntitlementRow,
  getWorkspaceSubscriptionRow,
  getWorkspaceUsageRow,
  recordWorkspaceBillingEvent,
  upsertWorkspaceStripeCustomerMapping,
  upsertWorkspaceEntitlementsRow,
  upsertWorkspaceSubscriptionRow
} from '../repositories/billingRepository.js'
import { createBillingEventEnvelope, normalizeBillingStatus } from '../governance/billingContracts.js'
import { resolvePlanById } from '../billing/planCatalog.js'
import { toWorkspaceEntitlementsDto, toWorkspaceSubscriptionDto, toWorkspaceUsageDto } from '../dto/billingDto.js'

const FORCE_ENTERPRISE = process.env.FORCE_ENTERPRISE_ENTITLEMENTS !== 'false'

export async function getWorkspaceBillingOverview (pool, workspaceId) {
  await ensureWorkspaceBillingRows(pool, workspaceId)
  const [subscriptionRow, entitlementRow, usageRow] = await Promise.all([
    getWorkspaceSubscriptionRow(pool, workspaceId),
    getWorkspaceEntitlementRow(pool, workspaceId),
    getWorkspaceUsageRow(pool, workspaceId)
  ])

  return {
    subscription: toWorkspaceSubscriptionDto(subscriptionRow),
    entitlements: toWorkspaceEntitlementsDto(entitlementRow),
    usage: toWorkspaceUsageDto(usageRow)
  }
}

export async function getWorkspaceEntitlements (pool, workspaceId) {
  await ensureWorkspaceBillingRows(pool, workspaceId)
  const row = await getWorkspaceEntitlementRow(pool, workspaceId)
  return toWorkspaceEntitlementsDto(row)
}

export async function syncEntitlementsFromPlan (pool, workspaceId, planId) {
  const effectivePlan = FORCE_ENTERPRISE ? resolvePlanById('ENTERPRISE') : resolvePlanById(planId)
  const row = await upsertWorkspaceEntitlementsRow(pool, workspaceId, effectivePlan.entitlements)
  return toWorkspaceEntitlementsDto(row)
}

export async function syncSubscriptionStatus (pool, workspaceId, patch) {
  const status = normalizeBillingStatus(patch.status)
  const planId = resolvePlanById(patch.planId).id
  const row = await upsertWorkspaceSubscriptionRow(pool, workspaceId, {
    planId: FORCE_ENTERPRISE ? 'ENTERPRISE' : planId,
    status,
    interval: patch.interval || 'monthly',
    stripeCustomerId: patch.stripeCustomerId || null,
    stripeSubscriptionId: patch.stripeSubscriptionId || null,
    cancelAtPeriodEnd: Boolean(patch.cancelAtPeriodEnd),
    currentPeriodStart: patch.currentPeriodStart || null,
    currentPeriodEnd: patch.currentPeriodEnd || null,
    trialEndsAt: patch.trialEndsAt || null
  })
  const subscription = toWorkspaceSubscriptionDto(row)
  await syncEntitlementsFromPlan(pool, workspaceId, subscription.plan_id)
  return subscription
}

export async function handleBillingWebhookEvent (pool, payload) {
  const envelope = createBillingEventEnvelope(payload)
  const inserted = await recordWorkspaceBillingEvent(pool, {
    ...envelope,
    idempotencyKey: `${envelope.source}:${envelope.sourceEventId || envelope.eventType}`
  })
  if (!inserted) {
    return { processed: false, duplicate: true }
  }
  if (String(envelope.source).toLowerCase() !== 'stripe') {
    return { processed: true, duplicate: false, ignored: true, reason: 'unsupported_source' }
  }

  const eventType = String(payload?.eventType || '')
  const raw = payload?.payload || {}
  const obj = raw?.data?.object || {}
  const metadata = obj?.metadata || {}
  const customerId = obj?.customer || null
  const subscriptionId = obj?.id || obj?.subscription || null
  let workspaceId = payload?.workspaceId || metadata.workspaceId || metadata.workspace_id || null

  if (!workspaceId && subscriptionId) {
    workspaceId = await findWorkspaceByStripeSubscriptionId(pool, subscriptionId)
  }
  if (!workspaceId && customerId) {
    workspaceId = await findWorkspaceByStripeCustomerId(pool, customerId)
  }
  if (!workspaceId) {
    return { processed: true, duplicate: false, ignored: true, reason: 'workspace_not_resolved' }
  }

  if (customerId) {
    const clerkUserId = metadata.clerkUserId || metadata.clerk_user_id || 'stripe:webhook'
    await upsertWorkspaceStripeCustomerMapping(pool, workspaceId, clerkUserId, customerId)
  }

  if (eventType.startsWith('customer.subscription.')) {
    const interval = obj?.items?.data?.[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly'
    const mappedStatus = (() => {
      const status = String(obj?.status || 'none').toLowerCase()
      if (status === 'active' || status === 'trialing') return 'active'
      if (status === 'past_due') return 'past_due'
      if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') return 'canceled'
      return 'none'
    })()
    const planId = String(metadata.planId || metadata.plan_id || payload?.planId || 'FREE')
    await syncSubscriptionStatus(pool, workspaceId, {
      planId,
      status: mappedStatus,
      interval,
      stripeCustomerId: customerId,
      stripeSubscriptionId: obj?.id || null,
      cancelAtPeriodEnd: Boolean(obj?.cancel_at_period_end),
      currentPeriodStart: obj?.current_period_start ? new Date(obj.current_period_start * 1000).toISOString() : null,
      currentPeriodEnd: obj?.current_period_end ? new Date(obj.current_period_end * 1000).toISOString() : null,
      trialEndsAt: obj?.trial_end ? new Date(obj.trial_end * 1000).toISOString() : null
    })
  }

  return { processed: true, duplicate: false, workspaceId }
}
