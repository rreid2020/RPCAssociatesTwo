import type { SubscriptionPlan } from './types'

export const SUBSCRIPTION_PLAN_BENEFITS: Record<SubscriptionPlan, string[]> = {
  FREE: [
    'Dashboard, onboarding, and workspace setup',
    'Tax GPT research chat with CRA-grounded citations',
    'File repository and document access',
    'Individual, business, or firm account signup',
    'Up to 3 workspace members',
    '512 MB secure storage',
    '100 AI credits per month'
  ],
  TAX_INTELLIGENCE: [
    'Everything in Free',
    'Advanced tax intelligence workflows',
    'Return builder, scenarios, and optimization tools',
    'Document processing and audit risk insights',
    'Forms, schedules, and tax calculation support',
    'Up to 10 workspace members',
    '4 GB secure storage',
    '5,000 AI credits per month'
  ],
  PROFESSIONAL: [
    'Everything in Tax Intelligence',
    'Working papers and engagement management',
    'QuickBooks and Google Sheets integrations',
    'Client and entity profile management',
    'Team invites, roles, and collaboration',
    'Up to 25 workspace members',
    '10 GB secure storage',
    '2,500 AI credits per month'
  ],
  ENTERPRISE: [
    'Everything in Professional',
    'Maximum storage, users, and AI capacity',
    'Advanced RBAC and enterprise controls',
    'Priority rollout support and governance',
    'Up to 250 workspace members',
    '100 GB secure storage',
    '50,000 AI credits per month'
  ]
}

export function isDevFreeAccessMode (): boolean {
  return import.meta.env.VITE_FORCE_ENTERPRISE_ACCESS !== 'false'
}
