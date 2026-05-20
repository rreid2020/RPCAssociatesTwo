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
  'workspace.manage',
  'workspace.invite',
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
  manager: ['engagement.read', 'engagement.manage', 'working_papers.read', 'working_papers.manage', 'review_notes.manage', 'signoff.perform', 'documents.manage'],
  reviewer: ['engagement.read', 'working_papers.read', 'review_notes.manage', 'signoff.perform', 'documents.manage'],
  staff: ['engagement.read', 'working_papers.read', 'working_papers.manage', 'documents.manage'],
  client: ['engagement.read', 'working_papers.read'],
  external_read_only: ['engagement.read', 'working_papers.read']
}

export function hasPermission (role, permission) {
  const permissions = ROLE_PERMISSION_MAP[role] || []
  return permissions.includes(permission)
}

