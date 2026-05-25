import Stripe from 'stripe'
import { resolvePlanById } from './planCatalog.js'

let stripeClient = null

function getStripeSecretKey () {
  const secretKey = String(process.env.STRIPE_SECRET_KEY || '').trim()
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is required for Stripe billing operations')
  }
  return secretKey
}

function getStripeClient () {
  if (stripeClient) return stripeClient
  stripeClient = new Stripe(getStripeSecretKey())
  return stripeClient
}

export async function createCheckoutSession ({
  workspaceId,
  planId,
  interval,
  successUrl,
  cancelUrl,
  stripeCustomerId = null,
  customerEmail = null
}) {
  if (!workspaceId) throw new Error('workspaceId is required')
  if (!planId) throw new Error('planId is required')
  if (!interval) throw new Error('interval is required')
  if (!successUrl || !cancelUrl) throw new Error('successUrl and cancelUrl are required')
  const plan = resolvePlanById(planId)
  const priceId = plan.stripePriceIds?.[String(interval || 'monthly').toLowerCase()]
  if (!priceId) {
    throw new Error(`Stripe price not configured for ${plan.id} (${interval})`)
  }
  const stripe = getStripeClient()
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [{ price: priceId, quantity: 1 }],
    customer: stripeCustomerId || undefined,
    customer_email: stripeCustomerId ? undefined : (customerEmail || undefined),
    allow_promotion_codes: true,
    metadata: {
      workspaceId: String(workspaceId),
      planId: plan.id,
      interval: String(interval)
    },
    subscription_data: {
      metadata: {
        workspaceId: String(workspaceId),
        planId: plan.id,
        interval: String(interval)
      }
    }
  })

  return {
    checkoutUrl: session.url,
    checkoutSessionId: session.id
  }
}

export async function createBillingPortalSession ({ workspaceId, returnUrl, stripeCustomerId }) {
  if (!workspaceId) throw new Error('workspaceId is required')
  if (!returnUrl) throw new Error('returnUrl is required')
  if (!stripeCustomerId) throw new Error('stripeCustomerId is required')
  const stripe = getStripeClient()
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl
  })
  return {
    portalUrl: session.url
  }
}

export async function cancelSubscription ({ workspaceId, stripeSubscriptionId }) {
  if (!workspaceId) throw new Error('workspaceId is required')
  if (!stripeSubscriptionId) throw new Error('stripeSubscriptionId is required')
  const stripe = getStripeClient()
  const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true
  })
  return { ok: true, subscription }
}

export async function changeSubscriptionPlan ({ workspaceId, stripeSubscriptionId, planId, interval }) {
  if (!workspaceId) throw new Error('workspaceId is required')
  if (!stripeSubscriptionId) throw new Error('stripeSubscriptionId is required')
  if (!planId) throw new Error('planId is required')
  if (!interval) throw new Error('interval is required')
  const plan = resolvePlanById(planId)
  const priceId = plan.stripePriceIds?.[String(interval || 'monthly').toLowerCase()]
  if (!priceId) {
    throw new Error(`Stripe price not configured for ${plan.id} (${interval})`)
  }
  const stripe = getStripeClient()
  const existing = await stripe.subscriptions.retrieve(stripeSubscriptionId)
  const itemId = existing.items?.data?.[0]?.id
  if (!itemId) {
    throw new Error('Stripe subscription item not found')
  }
  const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false,
    proration_behavior: 'create_prorations',
    items: [{ id: itemId, price: priceId }],
    metadata: {
      workspaceId: String(workspaceId),
      planId: plan.id,
      interval: String(interval)
    }
  })
  return { ok: true, subscription }
}

export async function parseStripeWebhook (rawPayload, signature) {
  if (!rawPayload || !signature) {
    throw new Error('Missing webhook payload/signature')
  }
  const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim()
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required')
  }
  const stripe = getStripeClient()
  const payloadBuffer = Buffer.isBuffer(rawPayload) ? rawPayload : Buffer.from(String(rawPayload))
  return stripe.webhooks.constructEvent(payloadBuffer, signature, webhookSecret)
}
