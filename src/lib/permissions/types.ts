export const ROLE_HIERARCHY = [
  'super_admin',
  'firm_admin',
  'manager',
  'reviewer',
  'staff',
  'client',
  'external_read_only'
] as const

export type PlatformRole = typeof ROLE_HIERARCHY[number]

export const PERMISSIONS = [
  'workspace.manage',
  'workspace.invite',
  'billing.read',
  'billing.manage',
  'subscription.change',
  'documents.read',
  'documents.write',
  'workflows.approve',
  'workflows.manage',
  'ai.use',
  'ai.admin',
  'tax.review',
  'workingpapers.edit',
  'engagement.read',
  'engagement.manage',
  'working_papers.read',
  'working_papers.manage',
  'review_notes.manage',
  'signoff.perform',
  'documents.manage',
  'integrations.manage'
] as const

export type PermissionKey = typeof PERMISSIONS[number]

export type PermissionSet = Record<PermissionKey, boolean>

