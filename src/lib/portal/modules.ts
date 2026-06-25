export type PortalModuleStatus = 'available' | 'active' | 'development'

export interface PortalModule {
  id: string
  pill: string
  title: string
  intro: string
  bullets: string[]
  status: PortalModuleStatus
}

export const portalModuleStatusLabel: Record<PortalModuleStatus, string> = {
  available: 'Available',
  active: 'Active',
  development: 'Under Development'
}

export const portalModules: PortalModule[] = [
  {
    id: 'dashboard',
    pill: 'Dashboard',
    title: 'Account visibility and action items',
    intro:
      'Your personalized dashboard shows service status, open items, upcoming milestones, and quick access to portal tools.',
    bullets: [
      'Account overview and active projects',
      'Open items and action required',
      'Upcoming milestones and deadlines',
      'Quick access to files, research, and papers'
    ],
    status: 'available'
  },
  {
    id: 'taxgpt',
    pill: 'Tax Intelligence',
    title: 'TaxGPT',
    intro:
      'AI-powered Canadian tax research with citations from CRA publications, legislation, and official guidance.',
    bullets: [
      'Tax research chat with source citations',
      'Document intelligence and form guidance',
      'Deduction discovery and audit risk insights',
      'Proactive tax planning recommendations'
    ],
    status: 'active'
  },
  {
    id: 'tax-return-builder',
    pill: 'Tax Return Builder',
    title: 'Personal T1 return workspace',
    intro:
      'Prepare personal income tax returns end to end with interview-driven setup, slips, schedules, and optimization.',
    bullets: [
      'Tax returns and CRA slip entry',
      'Document processing and optimization',
      'Scenarios, audit & risk, forms & schedules',
      'Interview-driven return setup'
    ],
    status: 'development'
  },
  {
    id: 'file-repository',
    pill: 'File Repository',
    title: 'Secure document sharing',
    intro:
      'Centralize accounting and tax documents with secure upload, organized folders, version control, and fast search.',
    bullets: [
      'Secure upload and encrypted storage',
      'Organized folders by year and project',
      'Version control and document history',
      'Drag-and-drop upload and mobile access'
    ],
    status: 'available'
  },
  {
    id: 'working-papers',
    pill: 'Working Papers',
    title: 'Collaborative workpapers',
    intro:
      'Digital workpapers, shared checklists, and contextual notes in one searchable workspace for accounting engagements.',
    bullets: [
      'Collaborative checklists and workflows',
      'Digital workpapers linked to source docs',
      'Notes, comments, and audit trail',
      'Template library for common engagements'
    ],
    status: 'development'
  },
  {
    id: 'integrations',
    pill: 'Integrations',
    title: 'Accounting app connections',
    intro:
      'Connect QuickBooks, Xero, banking, and business apps to streamline data flow and reduce manual entry.',
    bullets: [
      'QuickBooks Online and Xero connections',
      'Banking and transaction import',
      'Payment, payroll, and expense app links',
      'Automated reporting from connected data'
    ],
    status: 'development'
  }
]

export const portalPlatformSeo = {
  title: 'Client Portal | TaxGPT, Tax Return Builder & Accounting Workspace',
  description:
    "Axiom's secure client portal brings Dashboard, TaxGPT AI tax research, Tax Return Builder, File Repository, Working Papers, and accounting integrations into one signed-in workspace for Canadian businesses.",
  keywords: [
    'client portal',
    'secure client workspace',
    'TaxGPT',
    'Canadian tax research',
    'tax return builder',
    'T1 tax return software',
    'file repository',
    'working papers',
    'accounting integrations',
    'QuickBooks integration',
    'Xero integration',
    'Ottawa accountant portal',
    'accounting collaboration',
    'CRA tax guidance'
  ]
}
