import type { PermissionKey, PlatformRole } from './types'

export const ROLE_PERMISSIONS: Record<PlatformRole, PermissionKey[]> = {
  super_admin: [
    'workspace.manage',
    'workspace.invite',
    'billing.read',
    'billing.manage',
    'subscription.change',
    'engagement.read',
    'engagement.manage',
    'working_papers.read',
    'working_papers.manage',
    'review_notes.manage',
    'signoff.perform',
    'documents.manage',
    'integrations.manage'
  ],
  firm_admin: [
    'workspace.manage',
    'workspace.invite',
    'billing.read',
    'billing.manage',
    'subscription.change',
    'engagement.read',
    'engagement.manage',
    'working_papers.read',
    'working_papers.manage',
    'review_notes.manage',
    'signoff.perform',
    'documents.manage',
    'integrations.manage'
  ],
  manager: [
    'engagement.read',
    'engagement.manage',
    'documents.read',
    'documents.write',
    'workflows.approve',
    'workflows.manage',
    'ai.use',
    'tax.review',
    'billing.read',
    'working_papers.read',
    'working_papers.manage',
    'workingpapers.edit',
    'review_notes.manage',
    'signoff.perform',
    'documents.manage'
  ],
  reviewer: [
    'engagement.read',
    'documents.read',
    'workflows.approve',
    'tax.review',
    'billing.read',
    'working_papers.read',
    'review_notes.manage',
    'signoff.perform',
    'documents.manage'
  ],
  staff: [
    'engagement.read',
    'documents.read',
    'documents.write',
    'ai.use',
    'working_papers.read',
    'working_papers.manage',
    'workingpapers.edit',
    'documents.manage'
  ],
  client: [
    'engagement.read',
    'documents.read',
    'billing.read',
    'working_papers.read'
  ],
  external_read_only: [
    'engagement.read',
    'documents.read',
    'billing.read',
    'working_papers.read'
  ]
}

export function roleHasPermission (role: PlatformRole, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

