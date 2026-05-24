export type NavigationContext = {
  workspaceType: 'business' | 'firm' | null
  onboardingComplete: boolean
  features: {
    workingPapers: boolean
    integrations: boolean
  }
  permissions: string[]
}

export type NavigationItem = {
  to: string
  label: string
  iconKey: string
  requiredFeature?: 'workingPapers' | 'integrations'
  requiredPermission?: string
}

export type NavigationSection = {
  id: string
  label?: string
  depth?: 0 | 1 | 2
  items: NavigationItem[]
}

const SECTIONS: NavigationSection[] = [
  {
    id: 'primary',
    items: [
      { to: '/portal/dashboard', label: 'Dashboard', iconKey: 'dashboard' }
    ]
  },
  {
    id: 'tax-intelligence-title',
    label: 'Financial Intelligence',
    depth: 0,
    items: []
  },
  {
    id: 'tax-intelligence',
    label: 'Tax Intelligence',
    depth: 1,
    items: [
      { to: '/portal/taxgpt', label: 'Tax GPT', iconKey: 'sparkles' },
      { to: '/app/tax-intelligence/returns', label: 'Tax Returns', iconKey: 'document' },
      { to: '/app/tax-intelligence/returns', label: 'Return Builder', iconKey: 'plus' },
      { to: '/app/tax-intelligence/documents', label: 'Document Processing', iconKey: 'exchange' },
      { to: '/app/tax-intelligence/optimization', label: 'Optimization', iconKey: 'magic' },
      { to: '/app/tax-intelligence/scenarios', label: 'Scenarios', iconKey: 'trend' },
      { to: '/app/tax-intelligence/risk', label: 'Audit & Risk', iconKey: 'shield' },
      { to: '/app/tax-intelligence/forms-schedules', label: 'Forms & Schedules', iconKey: 'terminal' }
    ]
  },
  {
    id: 'accounting-title',
    label: 'Accounting Operations',
    depth: 0,
    items: []
  },
  {
    id: 'accounting',
    depth: 1,
    items: [
      { to: '/portal/accounting/company-profile', label: 'Company Profile', iconKey: 'workspace', requiredPermission: 'workspace.manage' },
      { to: '/portal/accounting/workspaces', label: 'Workspace Admin', iconKey: 'workspace', requiredPermission: 'workspace.manage' },
      { to: '/portal/accounting/working-papers/engagements', label: 'Engagements', iconKey: 'calendar', requiredFeature: 'workingPapers', requiredPermission: 'engagement.read' },
      { to: '/portal/accounting/working-papers', label: 'Working Papers', iconKey: 'document', requiredFeature: 'workingPapers', requiredPermission: 'working_papers.read' },
      { to: '/portal/accounting/integrations', label: 'Integrations', iconKey: 'terminal', requiredFeature: 'integrations', requiredPermission: 'integrations.manage' }
    ]
  },
  {
    id: 'docs-billing',
    items: [
      { to: '/portal/files', label: 'Documents', iconKey: 'folder' },
      { to: '/portal/subscription', label: 'Subscription', iconKey: 'shield' },
      { to: '/portal/billing/subscription', label: 'Billing', iconKey: 'lock', requiredPermission: 'billing.read' }
    ]
  }
]

function isItemVisible (item: NavigationItem, context: NavigationContext) {
  if (!context.onboardingComplete && item.to.startsWith('/portal/accounting/working-papers')) return false
  if (item.requiredFeature && !context.features[item.requiredFeature]) return false
  if (item.requiredPermission && !context.permissions.includes(item.requiredPermission)) return false
  return true
}

export function buildNavigationSections (context: NavigationContext): NavigationSection[] {
  return SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => isItemVisible(item, context))
    }))
    .filter((section) => section.items.length > 0 || Boolean(section.label))
}
