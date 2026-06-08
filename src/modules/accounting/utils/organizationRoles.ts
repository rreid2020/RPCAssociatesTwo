export const ORGANIZATION_PORTAL_ROLES = ['owner', 'admin', 'manager', 'employee'] as const

export const ASSIGNABLE_ORGANIZATION_ROLES = ['admin', 'manager', 'employee'] as const

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  employee: 'Employee'
}

export function normalizeOrganizationPortalRole (role: unknown): string {
  const normalized = String(role || '').trim().toLowerCase()
  if (normalized === 'owner') return 'owner'
  if (normalized === 'admin' || normalized === 'manager' || normalized === 'employee') return normalized
  return 'employee'
}

export function organizationRoleLabel (role: unknown): string {
  return ROLE_LABELS[normalizeOrganizationPortalRole(role)] || String(role || '')
}
