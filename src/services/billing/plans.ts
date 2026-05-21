import type { BillingPlanDefinition } from './types'

const env = import.meta.env

const getStripeId = (value: string | undefined, fallback: string): string => {
  const normalized = String(value || '').trim()
  return normalized || fallback
}

export const BILLING_PLANS: Record<BillingPlanDefinition['id'], BillingPlanDefinition> = {
  FREE: {
    id: 'FREE',
    displayName: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    stripeProductId: getStripeId(env.VITE_STRIPE_PRODUCT_FREE, 'prod_free'),
    stripePriceIds: {
      monthly: getStripeId(env.VITE_STRIPE_PRICE_FREE_MONTHLY, 'price_free_monthly'),
      annual: getStripeId(env.VITE_STRIPE_PRICE_FREE_ANNUAL, 'price_free_annual')
    },
    entitlements: {
      canAccessWorkingPapers: false,
      canAccessTaxGPT: true,
      canUseQBOIntegration: false,
      canUseGoogleSheetsIntegration: false,
      canInviteUsers: true,
      maxStorageMb: 512,
      maxUsers: 3,
      aiMonthlyCredits: 100
    }
  },
  PROFESSIONAL: {
    id: 'PROFESSIONAL',
    displayName: 'Professional',
    monthlyPrice: 129,
    annualPrice: 1290,
    stripeProductId: getStripeId(env.VITE_STRIPE_PRODUCT_PROFESSIONAL, 'prod_professional'),
    stripePriceIds: {
      monthly: getStripeId(env.VITE_STRIPE_PRICE_PROFESSIONAL_MONTHLY, 'price_professional_monthly'),
      annual: getStripeId(env.VITE_STRIPE_PRICE_PROFESSIONAL_ANNUAL, 'price_professional_annual')
    },
    entitlements: {
      canAccessWorkingPapers: true,
      canAccessTaxGPT: true,
      canUseQBOIntegration: true,
      canUseGoogleSheetsIntegration: true,
      canInviteUsers: true,
      maxStorageMb: 10240,
      maxUsers: 25,
      aiMonthlyCredits: 2500
    }
  },
  TAX_INTELLIGENCE: {
    id: 'TAX_INTELLIGENCE',
    displayName: 'Tax Intelligence',
    monthlyPrice: 79,
    annualPrice: 790,
    stripeProductId: getStripeId(env.VITE_STRIPE_PRODUCT_TAX_INTELLIGENCE, 'prod_tax_intelligence'),
    stripePriceIds: {
      monthly: getStripeId(env.VITE_STRIPE_PRICE_TAX_INTELLIGENCE_MONTHLY, 'price_tax_intelligence_monthly'),
      annual: getStripeId(env.VITE_STRIPE_PRICE_TAX_INTELLIGENCE_ANNUAL, 'price_tax_intelligence_annual')
    },
    entitlements: {
      canAccessWorkingPapers: false,
      canAccessTaxGPT: true,
      canUseQBOIntegration: false,
      canUseGoogleSheetsIntegration: false,
      canInviteUsers: true,
      maxStorageMb: 4096,
      maxUsers: 10,
      aiMonthlyCredits: 5000
    }
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    displayName: 'Enterprise',
    monthlyPrice: 499,
    annualPrice: 4990,
    stripeProductId: getStripeId(env.VITE_STRIPE_PRODUCT_ENTERPRISE, 'prod_enterprise'),
    stripePriceIds: {
      monthly: getStripeId(env.VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY, 'price_enterprise_monthly'),
      annual: getStripeId(env.VITE_STRIPE_PRICE_ENTERPRISE_ANNUAL, 'price_enterprise_annual')
    },
    entitlements: {
      canAccessWorkingPapers: true,
      canAccessTaxGPT: true,
      canUseQBOIntegration: true,
      canUseGoogleSheetsIntegration: true,
      canInviteUsers: true,
      maxStorageMb: 102400,
      maxUsers: 250,
      aiMonthlyCredits: 50000
    }
  }
}

export const BILLING_PLAN_ORDER: BillingPlanDefinition['id'][] = [
  'FREE',
  'TAX_INTELLIGENCE',
  'PROFESSIONAL',
  'ENTERPRISE'
]
