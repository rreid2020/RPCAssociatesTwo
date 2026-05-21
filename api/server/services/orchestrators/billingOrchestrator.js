import {
  ensureWorkspaceBillingRows,
  getWorkspaceEntitlementRow,
  getWorkspaceSubscriptionRow,
  getWorkspaceUsageRow,
  recordWorkspaceBillingEvent,
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
  return { processed: true, duplicate: false }
}
