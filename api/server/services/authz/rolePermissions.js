export const PLATFORM_ROLES = [
  'super_admin',
  'firm_admin',
  'manager',
  'reviewer',
  'staff',
  'client',
  'external_read_only'
]

export const PERMISSION_KEYS = [
  'workspace.read',
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
]

const ROLE_PERMISSION_MAP = {
  super_admin: PERMISSION_KEYS,
  firm_admin: PERMISSION_KEYS,
  manager: ['workspace.read', 'engagement.read', 'engagement.manage', 'working_papers.read', 'working_papers.manage', 'workingpapers.edit', 'review_notes.manage', 'signoff.perform', 'documents.read', 'documents.write', 'documents.manage', 'workflows.manage', 'workflows.approve', 'billing.read', 'ai.use', 'tax.review'],
  reviewer: ['workspace.read', 'engagement.read', 'working_papers.read', 'review_notes.manage', 'signoff.perform', 'documents.read', 'documents.manage', 'workflows.approve', 'billing.read', 'tax.review'],
  staff: ['workspace.read', 'engagement.read', 'working_papers.read', 'working_papers.manage', 'workingpapers.edit', 'documents.read', 'documents.write', 'documents.manage', 'ai.use'],
  client: ['workspace.read', 'engagement.read', 'working_papers.read', 'documents.read', 'billing.read'],
  external_read_only: ['workspace.read', 'engagement.read', 'working_papers.read', 'documents.read', 'billing.read']
}

const WORKSPACE_ROLE_TO_PLATFORM_ROLE = {
  owner: 'firm_admin',
  admin: 'firm_admin',
  manager: 'manager',
  reviewer: 'reviewer',
  preparer: 'staff',
  client: 'client',
  read_only: 'external_read_only'
}

const CLERK_ORG_ROLE_TO_PLATFORM_ROLE = {
  'org:admin': 'firm_admin',
  'org:member': 'staff'
}

export function mapWorkspaceRoleToPlatformRole (workspaceRole) {
  const normalized = String(workspaceRole || '').trim().toLowerCase()
  return WORKSPACE_ROLE_TO_PLATFORM_ROLE[normalized] || 'external_read_only'
}

export function mapClerkOrganizationRoleToPlatformRole (clerkRole) {
  const normalized = String(clerkRole || '').trim().toLowerCase()
  return CLERK_ORG_ROLE_TO_PLATFORM_ROLE[normalized] || null
}

export function hasPermission (role, permission) {
  const permissions = ROLE_PERMISSION_MAP[role] || []
  return permissions.includes(permission)
}

export function listPermissionsForRole (role) {
  return [...(ROLE_PERMISSION_MAP[role] || [])]
}

