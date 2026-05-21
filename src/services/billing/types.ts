export type BillingPlanId = 'FREE' | 'PROFESSIONAL' | 'TAX_INTELLIGENCE' | 'ENTERPRISE'

export type BillingInterval = 'monthly' | 'annual'

export type BillingSubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | 'none'

export interface WorkspaceEntitlements {
  canAccessWorkingPapers: boolean
  canAccessTaxGPT: boolean
  canUseQBOIntegration: boolean
  canUseGoogleSheetsIntegration: boolean
  canInviteUsers: boolean
  maxStorageMb: number
  maxUsers: number
  aiMonthlyCredits: number
}

export interface WorkspaceUsageSnapshot {
  storageMbUsed: number
  activeUsers: number
  aiCreditsUsedThisMonth: number
}

export interface BillingPlanDefinition {
  id: BillingPlanId
  displayName: string
  monthlyPrice: number
  annualPrice: number
  stripeProductId: string
  stripePriceIds: {
    monthly: string
    annual: string
  }
  entitlements: WorkspaceEntitlements
}

export interface WorkspaceSubscription {
  workspaceId: string
  planId: BillingPlanId
  status: BillingSubscriptionStatus
  interval: BillingInterval
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export interface BillingOverview {
  subscription: WorkspaceSubscription
  entitlements: WorkspaceEntitlements
  usage: WorkspaceUsageSnapshot
}

export interface CheckoutSessionRequest {
  workspaceId: string
  planId: BillingPlanId
  interval: BillingInterval
  successUrl: string
  cancelUrl: string
}

export interface CheckoutSessionResponse {
  checkoutUrl: string
}

export interface BillingPortalSessionRequest {
  workspaceId: string
  returnUrl: string
}

export interface BillingPortalSessionResponse {
  portalUrl: string
}
