import { BILLING_PLANS } from '../../services/billing/plans'

export type SubscriptionPlan = 'FREE' | 'PROFESSIONAL' | 'TAX_INTELLIGENCE' | 'ENTERPRISE'

export interface SubscriptionFeatures {
  dashboard: boolean
  taxgpt: boolean
  taxgptPremium: boolean
  fileRepository: boolean
  workingPapers: boolean
  integrations: boolean
  canInviteUsers: boolean
  maxStorageMb: number
  maxUsers: number
  aiMonthlyCredits: number
}

export type FeatureAccessKey =
  | 'dashboard'
  | 'taxgpt'
  | 'taxgptPremium'
  | 'fileRepository'
  | 'workingPapers'
  | 'integrations'
  | 'canInviteUsers'

export interface SubscriptionPlanConfig {
  id: SubscriptionPlan
  name: string
  description: string
  monthlyPrice: number
  annualPrice: number
  features: SubscriptionFeatures
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionPlanConfig> = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    description: 'Get started with Tax GPT, dashboard access, and workspace onboarding.',
    monthlyPrice: BILLING_PLANS.FREE.monthlyPrice,
    annualPrice: BILLING_PLANS.FREE.annualPrice,
    features: {
      dashboard: true,
      taxgpt: BILLING_PLANS.FREE.entitlements.canAccessTaxGPT,
      taxgptPremium: false,
      fileRepository: true,
      workingPapers: BILLING_PLANS.FREE.entitlements.canAccessWorkingPapers,
      integrations:
        BILLING_PLANS.FREE.entitlements.canUseQBOIntegration ||
        BILLING_PLANS.FREE.entitlements.canUseGoogleSheetsIntegration,
      canInviteUsers: BILLING_PLANS.FREE.entitlements.canInviteUsers,
      maxStorageMb: BILLING_PLANS.FREE.entitlements.maxStorageMb,
      maxUsers: BILLING_PLANS.FREE.entitlements.maxUsers,
      aiMonthlyCredits: BILLING_PLANS.FREE.entitlements.aiMonthlyCredits
    }
  },
  PROFESSIONAL: {
    id: 'PROFESSIONAL',
    name: 'Professional',
    description: 'Working papers, integrations, and team operations for growing firms.',
    monthlyPrice: BILLING_PLANS.PROFESSIONAL.monthlyPrice,
    annualPrice: BILLING_PLANS.PROFESSIONAL.annualPrice,
    features: {
      dashboard: true,
      taxgpt: BILLING_PLANS.PROFESSIONAL.entitlements.canAccessTaxGPT,
      taxgptPremium: true,
      fileRepository: true,
      workingPapers: BILLING_PLANS.PROFESSIONAL.entitlements.canAccessWorkingPapers,
      integrations:
        BILLING_PLANS.PROFESSIONAL.entitlements.canUseQBOIntegration ||
        BILLING_PLANS.PROFESSIONAL.entitlements.canUseGoogleSheetsIntegration,
      canInviteUsers: BILLING_PLANS.PROFESSIONAL.entitlements.canInviteUsers,
      maxStorageMb: BILLING_PLANS.PROFESSIONAL.entitlements.maxStorageMb,
      maxUsers: BILLING_PLANS.PROFESSIONAL.entitlements.maxUsers,
      aiMonthlyCredits: BILLING_PLANS.PROFESSIONAL.entitlements.aiMonthlyCredits
    }
  },
  TAX_INTELLIGENCE: {
    id: 'TAX_INTELLIGENCE',
    name: 'Tax Intelligence',
    description: 'AI-powered tax research, returns, scenarios, and document intelligence.',
    monthlyPrice: BILLING_PLANS.TAX_INTELLIGENCE.monthlyPrice,
    annualPrice: BILLING_PLANS.TAX_INTELLIGENCE.annualPrice,
    features: {
      dashboard: true,
      taxgpt: BILLING_PLANS.TAX_INTELLIGENCE.entitlements.canAccessTaxGPT,
      taxgptPremium: true,
      fileRepository: true,
      workingPapers: BILLING_PLANS.TAX_INTELLIGENCE.entitlements.canAccessWorkingPapers,
      integrations:
        BILLING_PLANS.TAX_INTELLIGENCE.entitlements.canUseQBOIntegration ||
        BILLING_PLANS.TAX_INTELLIGENCE.entitlements.canUseGoogleSheetsIntegration,
      canInviteUsers: BILLING_PLANS.TAX_INTELLIGENCE.entitlements.canInviteUsers,
      maxStorageMb: BILLING_PLANS.TAX_INTELLIGENCE.entitlements.maxStorageMb,
      maxUsers: BILLING_PLANS.TAX_INTELLIGENCE.entitlements.maxUsers,
      aiMonthlyCredits: BILLING_PLANS.TAX_INTELLIGENCE.entitlements.aiMonthlyCredits
    }
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'Maximum scale, advanced controls, and enterprise-ready governance.',
    monthlyPrice: BILLING_PLANS.ENTERPRISE.monthlyPrice,
    annualPrice: BILLING_PLANS.ENTERPRISE.annualPrice,
    features: {
      dashboard: true,
      taxgpt: BILLING_PLANS.ENTERPRISE.entitlements.canAccessTaxGPT,
      taxgptPremium: true,
      fileRepository: true,
      workingPapers: BILLING_PLANS.ENTERPRISE.entitlements.canAccessWorkingPapers,
      integrations:
        BILLING_PLANS.ENTERPRISE.entitlements.canUseQBOIntegration ||
        BILLING_PLANS.ENTERPRISE.entitlements.canUseGoogleSheetsIntegration,
      canInviteUsers: BILLING_PLANS.ENTERPRISE.entitlements.canInviteUsers,
      maxStorageMb: BILLING_PLANS.ENTERPRISE.entitlements.maxStorageMb,
      maxUsers: BILLING_PLANS.ENTERPRISE.entitlements.maxUsers,
      aiMonthlyCredits: BILLING_PLANS.ENTERPRISE.entitlements.aiMonthlyCredits
    }
  }
}
