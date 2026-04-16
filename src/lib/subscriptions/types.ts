export type SubscriptionPlan = 'free' | 'basic' | 'professional' | 'enterprise'

export interface SubscriptionFeatures {
  dashboard: boolean
  taxgpt: boolean
  taxgptPremium: boolean
  fileRepository: boolean
  workingPapers: boolean
  integrations: boolean
}

export interface SubscriptionPlanConfig {
  id: SubscriptionPlan
  name: string
  description: string
  price: number | null // null for free
  features: SubscriptionFeatures
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionPlanConfig> = {
  free: {
    id: 'free',
    name: 'Free Plan',
    description: 'Basic access to client portal',
    price: null,
    features: {
      dashboard: true,
      taxgpt: true,
      taxgptPremium: false,
      fileRepository: false,
      workingPapers: false,
      integrations: false,
    },
  },
  basic: {
    id: 'basic',
    name: 'Basic Plan',
    description: 'Essential features for individuals',
    price: 29.99,
    features: {
      dashboard: true,
      taxgpt: true,
      taxgptPremium: true,
      fileRepository: true,
      workingPapers: false,
      integrations: false,
    },
  },
  professional: {
    id: 'professional',
    name: 'Professional Plan',
    description: 'Full features for small businesses',
    price: 99.99,
    features: {
      dashboard: true,
      taxgpt: true,
      taxgptPremium: true,
      fileRepository: true,
      workingPapers: true,
      integrations: true,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Plan',
    description: 'Custom solutions for large organizations',
    price: null, // Custom pricing
    features: {
      dashboard: true,
      taxgpt: true,
      taxgptPremium: true,
      fileRepository: true,
      workingPapers: true,
      integrations: true,
    },
  },
}
