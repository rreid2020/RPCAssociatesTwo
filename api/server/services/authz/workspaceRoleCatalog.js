export const WORKSPACE_MEMBER_ROLES = new Set(['owner', 'admin', 'manager', 'employee'])

const LEGACY_WORKSPACE_ROLE_ALIASES = {
  preparer: 'employee',
  reviewer: 'employee',
  read_only: 'employee',
  client: 'employee',
  member: 'employee'
}

export const WORKSPACE_MEMBER_ROLE_OPTIONS = ['admin', 'manager', 'employee']

export function normalizeWorkspaceMemberRole (role, { strict = false } = {}) {
  const normalized = String(role || '').trim().toLowerCase()
  const canonical = LEGACY_WORKSPACE_ROLE_ALIASES[normalized] || normalized
  if (!WORKSPACE_MEMBER_ROLES.has(canonical)) {
    if (strict) throw new Error('Invalid workspace member role')
    return 'employee'
  }
  return canonical
}

export function assertWorkspaceMemberRole (role) {
  return normalizeWorkspaceMemberRole(role, { strict: true })
}

let roleCatalogMigrationPromise = null

export async function ensureRoleCatalogMigrations (pool) {
  if (roleCatalogMigrationPromise) return roleCatalogMigrationPromise
  roleCatalogMigrationPromise = (async () => {
    await pool.query(
      `UPDATE taxgpt.accounting_workspace_members
       SET role = 'employee', updated_at = now()
       WHERE role IN ('preparer', 'reviewer', 'read_only', 'client')`
    )
    await pool.query(
      `UPDATE taxgpt.accounting_workspace_invites
       SET role = 'employee', updated_at = now()
       WHERE role IN ('preparer', 'reviewer', 'read_only', 'client')`
    )
    await pool.query(
      `UPDATE taxgpt.engagement_employee_assignments
       SET assignment_role = 'partner', updated_at = now()
       WHERE assignment_role = 'member'`
    )
  })()
  return roleCatalogMigrationPromise
}
