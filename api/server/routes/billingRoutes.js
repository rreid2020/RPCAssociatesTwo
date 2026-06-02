import { Router } from 'express'
import { getClerkUser } from '../middleware/portalAuth.js'
import { getWorkspaceContext } from '../services/accountingWorkspaceService.js'
import { assertWorkspacePermissionWithCustomRoles } from '../services/authz/workspaceRbacService.js'
import {
  getWorkspaceBillingOverview,
  getWorkspaceEntitlements,
  handleBillingWebhookEvent,
  syncEntitlementsFromPlan,
  syncSubscriptionStatus
} from '../services/orchestrators/billingOrchestrator.js'
import {
  cancelSubscription,
  changeSubscriptionPlan,
  createBillingPortalSession,
  createCheckoutSession,
  parseStripeWebhook
} from '../services/billing/stripeBillingService.js'

export function createBillingRouter (pool) {
  const r = Router()

  const resolveScope = async (req, res, session) => {
    try {
      const workspace = await getWorkspaceContext(pool, session.userId, null, {
        expectedClerkOrgId: session.orgId || null
      })
      return { workspace }
    } catch (e) {
      res.status(403).json({ error: e instanceof Error ? e.message : 'Workspace access denied' })
      return null
    }
  }

  const requirePermission = async (scope, session, permission, res) => {
    try {
      await assertWorkspacePermissionWithCustomRoles(pool, {
        workspaceId: scope.workspace.id,
        workspaceRole: scope.workspace.role,
        clerkUserId: session.userId,
        permission
      })
      return true
    } catch (e) {
      res.status(403).json({ error: e instanceof Error ? e.message : 'Permission denied' })
      return false
    }
  }

  r.get('/v1/billing/overview', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveScope(req, res, session)
    if (!scope) return
    if (!(await requirePermission(scope, session, 'billing.read', res))) return
    try {
      const billing = await getWorkspaceBillingOverview(pool, scope.workspace.id)
      res.json({ billing })
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : 'Could not load billing overview' })
    }
  })

  r.get('/v1/billing/entitlements', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveScope(req, res, session)
    if (!scope) return
    if (!(await requirePermission(scope, session, 'billing.read', res))) return
    try {
      const entitlements = await getWorkspaceEntitlements(pool, scope.workspace.id)
      res.json({ entitlements })
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : 'Could not load entitlements' })
    }
  })

  r.post('/v1/billing/checkout-sessions', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveScope(req, res, session)
    if (!scope) return
    if (!(await requirePermission(scope, session, 'subscription.change', res))) return
    try {
      const billing = await getWorkspaceBillingOverview(pool, scope.workspace.id)
      const checkout = await createCheckoutSession({
        workspaceId: scope.workspace.id,
        planId: req.body?.planId,
        interval: req.body?.interval,
        successUrl: req.body?.successUrl,
        cancelUrl: req.body?.cancelUrl,
        stripeCustomerId: billing?.subscription?.stripe_customer_id || null,
        customerEmail: req.body?.customerEmail || null
      })
      res.json({ checkout })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not create checkout session' })
    }
  })

  r.post('/v1/billing/portal-sessions', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveScope(req, res, session)
    if (!scope) return
    if (!(await requirePermission(scope, session, 'billing.manage', res))) return
    try {
      const billing = await getWorkspaceBillingOverview(pool, scope.workspace.id)
      const portal = await createBillingPortalSession({
        workspaceId: scope.workspace.id,
        returnUrl: req.body?.returnUrl,
        stripeCustomerId: billing?.subscription?.stripe_customer_id || null
      })
      res.json({ portal })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not create billing portal session' })
    }
  })

  r.post('/v1/billing/subscription/cancel', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveScope(req, res, session)
    if (!scope) return
    if (!(await requirePermission(scope, session, 'subscription.change', res))) return
    try {
      const billing = await getWorkspaceBillingOverview(pool, scope.workspace.id)
      await cancelSubscription({
        workspaceId: scope.workspace.id,
        stripeSubscriptionId: billing?.subscription?.stripe_subscription_id || null
      })
      const subscription = await syncSubscriptionStatus(pool, scope.workspace.id, {
        planId: req.body?.planId || 'FREE',
        status: 'canceled',
        interval: req.body?.interval || 'monthly',
        cancelAtPeriodEnd: true
      })
      await syncEntitlementsFromPlan(pool, scope.workspace.id, subscription.plan_id)
      res.json({ subscription })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not cancel subscription' })
    }
  })

  r.post('/v1/billing/subscription/change-plan', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveScope(req, res, session)
    if (!scope) return
    if (!(await requirePermission(scope, session, 'subscription.change', res))) return
    try {
      const billing = await getWorkspaceBillingOverview(pool, scope.workspace.id)
      await changeSubscriptionPlan({
        workspaceId: scope.workspace.id,
        stripeSubscriptionId: billing?.subscription?.stripe_subscription_id || null,
        planId: req.body?.planId,
        interval: req.body?.interval
      })
      const subscription = await syncSubscriptionStatus(pool, scope.workspace.id, {
        planId: req.body?.planId,
        status: req.body?.status || 'active',
        interval: req.body?.interval || 'monthly',
        cancelAtPeriodEnd: Boolean(req.body?.cancelAtPeriodEnd),
        stripeCustomerId: req.body?.stripeCustomerId || null,
        stripeSubscriptionId: req.body?.stripeSubscriptionId || null,
        currentPeriodStart: req.body?.currentPeriodStart || null,
        currentPeriodEnd: req.body?.currentPeriodEnd || null,
        trialEndsAt: req.body?.trialEndsAt || null
      })
      const entitlements = await syncEntitlementsFromPlan(pool, scope.workspace.id, subscription.plan_id)
      res.json({ subscription, entitlements })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not change subscription plan' })
    }
  })

  r.post('/v1/billing/subscription/sync', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveScope(req, res, session)
    if (!scope) return
    if (!(await requirePermission(scope, session, 'billing.manage', res))) return
    try {
      const subscription = await syncSubscriptionStatus(pool, scope.workspace.id, {
        planId: req.body?.planId || 'FREE',
        status: req.body?.status || 'none',
        interval: req.body?.interval || 'monthly',
        stripeCustomerId: req.body?.stripeCustomerId || null,
        stripeSubscriptionId: req.body?.stripeSubscriptionId || null,
        cancelAtPeriodEnd: Boolean(req.body?.cancelAtPeriodEnd),
        currentPeriodStart: req.body?.currentPeriodStart || null,
        currentPeriodEnd: req.body?.currentPeriodEnd || null,
        trialEndsAt: req.body?.trialEndsAt || null
      })
      res.json({ subscription })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not sync subscription status' })
    }
  })

  r.post('/v1/billing/entitlements/sync', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveScope(req, res, session)
    if (!scope) return
    try {
      const entitlements = await syncEntitlementsFromPlan(pool, scope.workspace.id, req.body?.planId || 'FREE')
      res.json({ entitlements })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not sync entitlements' })
    }
  })

  r.post('/v1/billing/webhooks/stripe', async (req, res) => {
    const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim()
    if (!webhookSecret) {
      return res.status(503).json({ error: 'STRIPE_WEBHOOK_SECRET is not configured' })
    }
    try {
      const signature = Array.isArray(req.headers['stripe-signature'])
        ? req.headers['stripe-signature'][0]
        : req.headers['stripe-signature']
      const event = await parseStripeWebhook(req.body, signature)
      const result = await handleBillingWebhookEvent(pool, {
        workspaceId: event?.data?.object?.metadata?.workspaceId || event?.data?.object?.metadata?.workspace_id || null,
        eventType: event.type || 'subscription.updated',
        source: 'stripe',
        sourceEventId: event.id || null,
        payload: event || {}
      })
      res.json({ received: true, ...result })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not process billing webhook' })
    }
  })

  return r
}
