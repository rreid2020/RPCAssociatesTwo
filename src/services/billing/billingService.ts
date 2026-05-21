import { callPortalApi, type TokenProvider } from '../api/client'
import { BILLING_PLANS } from './plans'
import type {
  BillingOverview,
  BillingPortalSessionRequest,
  BillingPortalSessionResponse,
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  WorkspaceEntitlements
} from './types'

const defaultPlan = BILLING_PLANS.FREE

function defaultEntitlements (): WorkspaceEntitlements {
  return { ...defaultPlan.entitlements }
}

export async function getBillingOverview (getToken: TokenProvider): Promise<BillingOverview> {
  const data = await callPortalApi<{ billing: BillingOverview }>('/v1/billing/overview', getToken)
  return data.billing
}

export async function createCheckoutSession (
  getToken: TokenProvider,
  payload: CheckoutSessionRequest
): Promise<CheckoutSessionResponse> {
  const data = await callPortalApi<{ checkout: CheckoutSessionResponse }>(
    '/v1/billing/checkout-sessions',
    getToken,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  )
  return data.checkout
}

export async function createBillingPortalSession (
  getToken: TokenProvider,
  payload: BillingPortalSessionRequest
): Promise<BillingPortalSessionResponse> {
  const data = await callPortalApi<{ portal: BillingPortalSessionResponse }>(
    '/v1/billing/portal-sessions',
    getToken,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  )
  return data.portal
}

export async function getWorkspaceEntitlements (getToken: TokenProvider): Promise<WorkspaceEntitlements> {
  try {
    const data = await callPortalApi<{ entitlements: WorkspaceEntitlements }>(
      '/v1/billing/entitlements',
      getToken
    )
    return data.entitlements
  } catch {
    return defaultEntitlements()
  }
}
