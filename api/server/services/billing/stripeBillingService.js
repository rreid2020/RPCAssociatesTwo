export async function createCheckoutSession ({
  workspaceId,
  planId,
  interval,
  successUrl,
  cancelUrl
}) {
  if (!workspaceId) throw new Error('workspaceId is required')
  if (!planId) throw new Error('planId is required')
  if (!interval) throw new Error('interval is required')
  if (!successUrl || !cancelUrl) throw new Error('successUrl and cancelUrl are required')

  return {
    checkoutUrl: `${successUrl}${successUrl.includes('?') ? '&' : '?'}billing_stub=checkout`
  }
}

export async function createBillingPortalSession ({ workspaceId, returnUrl }) {
  if (!workspaceId) throw new Error('workspaceId is required')
  if (!returnUrl) throw new Error('returnUrl is required')
  return {
    portalUrl: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}billing_stub=portal`
  }
}

export async function cancelSubscription ({ workspaceId }) {
  if (!workspaceId) throw new Error('workspaceId is required')
  return { ok: true }
}

export async function changeSubscriptionPlan ({ workspaceId, planId, interval }) {
  if (!workspaceId) throw new Error('workspaceId is required')
  if (!planId) throw new Error('planId is required')
  if (!interval) throw new Error('interval is required')
  return { ok: true }
}

export async function parseStripeWebhook (rawPayload, signature) {
  if (!rawPayload || !signature) {
    throw new Error('Missing webhook payload/signature')
  }
  return {
    id: `stub_${Date.now()}`,
    type: 'customer.subscription.updated',
    data: {}
  }
}
