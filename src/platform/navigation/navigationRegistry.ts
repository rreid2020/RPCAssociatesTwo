import { resolveEntityProfilesNavLabel } from '../workspace/companyProfileLabels'

export type NavigationContext = {
  workspaceType: 'business' | 'firm' | 'individual' | null
  profileBusinessType: string | null
  workspaceRole: string | null
  onboardingComplete: boolean
  features: {
    workingPapers: boolean
    integrations: boolean
  }
  permissions: string[]
  isStaff?: boolean
}

export type NavigationItem = {
  to: string
  label: string
  iconKey: string
  badge?: string
  /** Indent within the section (1 = primary item, 2 = nested sub-item). */
  depth?: 0 | 1 | 2
  /** exact = pathname must match `to`; child = active only on nested routes under `to` */
  activeWhen?: 'exact' | 'child'
  requiredFeature?: 'workingPapers' | 'integrations'
  requiredPermission?: string
  requiredWorkspaceRoles?: string[]
  requiredStaff?: boolean
}

export type NavigationSection = {
  id: string
  label?: string
  iconKey?: string
  depth?: 0 | 1 | 2
  items: NavigationItem[]
}

const ROLLOUT_BYPASS_ENABLED =
  import.meta.env.MODE !== 'test' &&
  import.meta.env.VITE_FORCE_ENTERPRISE_ACCESS !== 'false'

const SECTIONS: NavigationSection[] = [
  {
    id: 'primary',
    items: [
      { to: '/portal/dashboard', label: 'Dashboard', iconKey: 'dashboard' }
    ]
  },
  {
    id: 'tax-intelligence',
    label: 'Tax Intelligence',
    iconKey: 'calculator',
    depth: 0,
    items: [
      { to: '/portal/taxgpt', label: 'Tax GPT', iconKey: 'sparkles', badge: 'Active', depth: 2 }
    ]
  },
  {
    id: 'tax-returns-title',
    label: 'Tax Return Builder',
    iconKey: 'plus',
    depth: 0,
    items: []
  },
  {
    id: 'tax-returns',
    depth: 1,
    items: [
      { to: '/app/tax-intelligence/returns', label: 'Tax Returns', iconKey: 'clipboardList', depth: 2 },
      { to: '/app/tax-intelligence/documents', label: 'Document Processing', iconKey: 'exchange', depth: 2 },
      { to: '/app/tax-intelligence/optimization', label: 'Optimization', iconKey: 'magic', depth: 2 },
      { to: '/app/tax-intelligence/scenarios', label: 'Scenarios', iconKey: 'trend', depth: 2 },
      { to: '/app/tax-intelligence/risk', label: 'Audit & Risk', iconKey: 'shield', depth: 2 },
      { to: '/app/tax-intelligence/forms-schedules', label: 'Forms & Schedules', iconKey: 'terminal', depth: 2 }
    ]
  },
  {
    id: 'accounting-title',
    label: 'Accounting Operations',
    iconKey: 'ledger',
    depth: 0,
    items: []
  },
  {
    id: 'company-profile-title',
    label: 'Business/Firm Profile',
    iconKey: 'building',
    depth: 1,
    items: []
  },
  {
    id: 'company-profile',
    depth: 2,
    items: [
      { to: '/portal/accounting/company-profile', label: 'Business/Firm Details', iconKey: 'workspace', requiredPermission: 'workspace.manage' },
      { to: '/portal/accounting/company-profile/employees', label: 'Invite Employees', iconKey: 'userPlus', requiredPermission: 'workspace.invite' },
      { to: '/portal/accounting/company-profile/entities', label: 'Entity Profiles / Clients', iconKey: 'users', requiredPermission: 'workspace.manage' },
      { to: '/portal/accounting/company-profile/roles-and-permissions', label: 'Roles & Permissions', iconKey: 'key', requiredPermission: 'rbac.read' }
    ]
  },
  {
    id: 'accounting',
    depth: 1,
    items: [
      { to: '/portal/accounting/working-papers/engagements', label: 'Engagements', iconKey: 'calendar', requiredFeature: 'workingPapers', requiredPermission: 'engagement.read' },
      { to: '/portal/accounting/working-papers/engagements?approvalReady=true', label: 'Approval Ready', iconKey: 'clipboardCheck', requiredFeature: 'workingPapers', requiredPermission: 'engagement.read' },
      { to: '/portal/accounting/integrations', label: 'Integrations', iconKey: 'plug', requiredFeature: 'integrations', requiredPermission: 'integrations.manage' }
    ]
  },
  {
    id: 'docs-billing',
    items: [
      { to: '/portal/files', label: 'Documents', iconKey: 'folder' },
      { to: '/portal/subscription', label: 'Subscription', iconKey: 'creditCard' },
      { to: '/portal/billing/subscription', label: 'Billing', iconKey: 'lock', requiredPermission: 'billing.read' },
      { to: '/portal/ops', label: 'Ops Portal', iconKey: 'server', requiredStaff: true }
    ]
  }
]

function isItemVisible (item: NavigationItem, context: NavigationContext) {
  if (item.requiredStaff && !context.isStaff) return false
  if (ROLLOUT_BYPASS_ENABLED) return true
  if (item.to === '/portal/billing/subscription') return true
  if (context.workspaceType === 'individual' && item.to === '/portal/accounting/company-profile/employees') {
    return false
  }
  if (!context.onboardingComplete && item.to.startsWith('/portal/accounting/working-papers')) return false
  if (item.requiredFeature && !context.features[item.requiredFeature]) return false
  if (item.requiredPermission && !context.permissions.includes(item.requiredPermission)) return false
  if (item.requiredStaff && !context.isStaff) return false
  if (item.requiredWorkspaceRoles?.length) {
    const role = String(context.workspaceRole || '').trim().toLowerCase()
    if (!item.requiredWorkspaceRoles.includes(role)) return false
  }
  return true
}

export function buildNavigationSections (context: NavigationContext): NavigationSection[] {
  const entityProfilesLabel = resolveEntityProfilesNavLabel(context.profileBusinessType, context.workspaceType)
  return SECTIONS
    .map((section) => ({
      ...section,
      items: section.items
        .map((item) => (
          item.to === '/portal/accounting/company-profile/entities'
            ? { ...item, label: entityProfilesLabel }
            : item
        ))
        .filter((item) => isItemVisible(item, context))
    }))
    .filter((section) => section.items.length > 0 || Boolean(section.label))
}
