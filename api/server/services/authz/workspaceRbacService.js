/**
 * Organization-scoped RBAC for company/firm employees.
 * Legacy workspace_* tables remain the permission definition store until migrated.
 */
import {
  PERMISSION_KEYS,
  getPermissionCatalog,
  getSystemWorkspaceRoleDefinitions,
  hasPermission,
  listPermissionsForRole,
  mapWorkspaceRoleToPlatformRole
} from './rolePermissions.js'
import { ensurePortalSchema } from '../../db/ensurePortalSchema.js'

const ROLE_NAME_RE = /^[a-z0-9_]{2,48}$/
const WORKSPACE_MEMBER_ROLES = new Set(['owner', 'admin', 'manager', 'reviewer', 'preparer', 'read_only', 'client'])

function normalizeRoleName (value) {
  const roleName = String(value || '').trim().toLowerCase()
  if (!ROLE_NAME_RE.test(roleName)) {
    throw new Error('Role name must be 2-48 characters and contain only a-z, 0-9, and underscores')
  }
  return roleName
}

function normalizeMemberRole (value) {
  return String(value || '').trim().toLowerCase()
}

async function resolveOrganizationIdForWorkspace (pool, workspaceId) {
  const { rows } = await pool.query(
    `SELECT organization_id
     FROM taxgpt.accounting_workspaces
     WHERE id = $1::uuid
     LIMIT 1`,
    [workspaceId]
  )
  return rows[0]?.organization_id || null
}

function normalizePermissionList (permissions = []) {
  if (!Array.isArray(permissions)) throw new Error('permissions must be an array')
  const unique = [...new Set(permissions.map((entry) => String(entry || '').trim()).filter(Boolean))]
  for (const permission of unique) {
    if (!PERMISSION_KEYS.includes(permission)) {
      throw new Error(`Unsupported permission: ${permission}`)
    }
  }
  return unique
}

function normalizeSourceRole (value) {
  const sourceRole = String(value || '').trim().toLowerCase()
  if (!sourceRole) throw new Error('sourceRole is required')
  return sourceRole
}

function parseJsonStringArray (value) {
  if (Array.isArray(value)) return value.map((entry) => String(entry))
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.map((entry) => String(entry)) : []
    } catch {
      return []
    }
  }
  return []
}

let workspaceRbacTablesEnsurePromise = null

export async function ensureWorkspaceRbacTables (pool) {
  if (!workspaceRbacTablesEnsurePromise) {
    workspaceRbacTablesEnsurePromise = (async () => {
      const { rows } = await pool.query(
        `SELECT to_regclass('taxgpt.organization_member_rbac_cache') IS NOT NULL AS ok`
      )
      if (!rows[0]?.ok) {
        await ensurePortalSchema(pool)
      }
    })().catch((error) => {
      workspaceRbacTablesEnsurePromise = null
      throw error
    })
  }
  await workspaceRbacTablesEnsurePromise
}

function buildResolvedWorkspacePermissions (workspaceRole) {
  const platformRole = mapWorkspaceRoleToPlatformRole(workspaceRole)
  return {
    platformRole,
    customRoles: [],
    permissions: listPermissionsForRole(platformRole)
  }
}

export async function invalidateOrganizationMemberRbacCache (pool, organizationId, clerkUserId = null) {
  await ensureWorkspaceRbacTables(pool)
  if (!organizationId) return
  if (clerkUserId) {
    await pool.query(
      `DELETE FROM taxgpt.organization_member_rbac_cache
       WHERE organization_id = $1::uuid
         AND clerk_user_id = $2`,
      [organizationId, clerkUserId]
    )
    return
  }
  await pool.query(
    `DELETE FROM taxgpt.organization_member_rbac_cache
     WHERE organization_id = $1::uuid`,
    [organizationId]
  )
}

/** @deprecated Use invalidateOrganizationMemberRbacCache with organization id */
export async function invalidateWorkspaceMemberRbacCache (pool, workspaceId, clerkUserId = null) {
  const organizationId = await resolveOrganizationIdForWorkspace(pool, workspaceId)
  await invalidateOrganizationMemberRbacCache(pool, organizationId, clerkUserId)
}

async function fetchMemberRbacCache (pool, organizationId, clerkUserId, memberRole) {
  const { rows } = await pool.query(
    `SELECT member_role, platform_role, custom_roles, permissions
     FROM taxgpt.organization_member_rbac_cache
     WHERE organization_id = $1::uuid
       AND clerk_user_id = $2
     LIMIT 1`,
    [organizationId, clerkUserId]
  )
  if (!rows[0]) return null
  const cachedRole = normalizeMemberRole(rows[0].member_role)
  if (cachedRole !== normalizeMemberRole(memberRole)) return null
  return {
    platformRole: String(rows[0].platform_role || ''),
    customRoles: parseJsonStringArray(rows[0].custom_roles),
    permissions: parseJsonStringArray(rows[0].permissions)
  }
}

async function upsertMemberRbacCache (pool, organizationId, workspaceId, memberRole, clerkUserId, resolved) {
  await pool.query(
    `INSERT INTO taxgpt.organization_member_rbac_cache
     (organization_id, clerk_user_id, workspace_id, member_role, platform_role, custom_roles, permissions, computed_at)
     VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6::jsonb, $7::jsonb, now())
     ON CONFLICT (organization_id, clerk_user_id)
     DO UPDATE SET
       workspace_id = EXCLUDED.workspace_id,
       member_role = EXCLUDED.member_role,
       platform_role = EXCLUDED.platform_role,
       custom_roles = EXCLUDED.custom_roles,
       permissions = EXCLUDED.permissions,
       computed_at = now()`,
    [
      organizationId,
      clerkUserId,
      workspaceId,
      normalizeMemberRole(memberRole),
      resolved.platformRole,
      JSON.stringify(resolved.customRoles || []),
      JSON.stringify(resolved.permissions || [])
    ]
  )
}

async function computeEffectiveMemberPermissionsUncached (pool, workspaceId, memberRole, clerkUserId) {
  const normalizedRole = normalizeMemberRole(memberRole)
  if (normalizedRole === 'owner' || normalizedRole === 'admin') {
    return buildResolvedWorkspacePermissions(memberRole)
  }

  const platformRole = mapWorkspaceRoleToPlatformRole(memberRole)
  const effective = new Set(listPermissionsForRole(platformRole))
  const { rows: customRoleRows } = await pool.query(
    `SELECT role_name
     FROM taxgpt.workspace_member_roles
     WHERE workspace_id = $1::uuid
       AND clerk_user_id = $2
     ORDER BY role_name ASC`,
    [workspaceId, clerkUserId]
  )
  const customRoleNames = customRoleRows.map((row) => row.role_name)
  if (customRoleNames.length > 0) {
    const { rows: permissionRows } = await pool.query(
      `SELECT DISTINCT permission_key
       FROM taxgpt.workspace_role_permissions
       WHERE workspace_id = $1::uuid
         AND role_name = ANY($2::text[])`,
      [workspaceId, customRoleNames]
    )
    for (const row of permissionRows) effective.add(row.permission_key)
  }

  return {
    platformRole,
    customRoles: customRoleNames,
    permissions: [...effective].sort()
  }
}

export async function resolveEffectiveOrganizationMemberPermissions (pool, {
  organizationId = null,
  workspaceId,
  memberRole,
  clerkUserId
}) {
  await ensureWorkspaceRbacTables(pool)
  const orgId = organizationId || await resolveOrganizationIdForWorkspace(pool, workspaceId)
  if (!orgId) throw new Error('Organization is required for employee permission resolution')

  let cached = await fetchMemberRbacCache(pool, orgId, clerkUserId, memberRole)
  if (cached) {
    const freshBasePermissions = listPermissionsForRole(mapWorkspaceRoleToPlatformRole(memberRole))
    const missingBasePermission = freshBasePermissions.some((permission) => !cached.permissions.includes(permission))
    if (missingBasePermission) {
      cached = null
    }
  }
  if (cached) return cached

  const resolved = await computeEffectiveMemberPermissionsUncached(pool, workspaceId, memberRole, clerkUserId)
  await upsertMemberRbacCache(pool, orgId, workspaceId, memberRole, clerkUserId, resolved)
  return resolved
}

/** Transitional wrapper: resolves permissions for an employee in the active company/firm account scope */
export async function resolveEffectiveWorkspacePermissions (pool, workspaceId, workspaceRole, clerkUserId, organizationId = null) {
  return resolveEffectiveOrganizationMemberPermissions(pool, {
    organizationId,
    workspaceId,
    memberRole: workspaceRole,
    clerkUserId
  })
}

export async function listWorkspaceRoles (pool, workspaceId) {
  await ensureWorkspaceRbacTables(pool)
  const { rows: roles } = await pool.query(
    `SELECT role_name, source_role, display_name, is_system, created_by, created_at, updated_at
     FROM taxgpt.workspace_custom_roles
     WHERE workspace_id = $1::uuid
     ORDER BY role_name ASC`,
    [workspaceId]
  )
  const { rows: perms } = await pool.query(
    `SELECT role_name, permission_key
     FROM taxgpt.workspace_role_permissions
     WHERE workspace_id = $1::uuid`,
    [workspaceId]
  )
  const byRole = new Map()
  for (const row of perms) {
    const current = byRole.get(row.role_name) || []
    current.push(row.permission_key)
    byRole.set(row.role_name, current)
  }
  return roles.map((role) => ({
    ...role,
    permissions: (byRole.get(role.role_name) || []).sort()
  }))
}

export async function upsertWorkspaceCustomRole (pool, workspaceId, actorUserId, payload = {}) {
  await ensureWorkspaceRbacTables(pool)
  const roleName = normalizeRoleName(payload.roleName)
  const sourceRole = normalizeSourceRole(payload.sourceRole)
  const displayName = String(payload.displayName || roleName).trim()
  const permissions = normalizePermissionList(payload.permissions || [])
  const systemBaseRole = mapWorkspaceRoleToPlatformRole(sourceRole)
  if (!systemBaseRole) throw new Error('Invalid source role for custom role')

  await pool.query(
    `INSERT INTO taxgpt.workspace_custom_roles
     (workspace_id, role_name, source_role, display_name, is_system, created_by, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, $4, false, $5, now(), now())
     ON CONFLICT (workspace_id, role_name)
     DO UPDATE SET source_role = EXCLUDED.source_role, display_name = EXCLUDED.display_name, updated_at = now()`,
    [workspaceId, roleName, sourceRole, displayName, actorUserId]
  )
  await pool.query(
    `DELETE FROM taxgpt.workspace_role_permissions
     WHERE workspace_id = $1::uuid
       AND role_name = $2`,
    [workspaceId, roleName]
  )
  for (const permission of permissions) {
    await pool.query(
      `INSERT INTO taxgpt.workspace_role_permissions
       (workspace_id, role_name, permission_key, created_at)
       VALUES ($1::uuid, $2, $3, now())
       ON CONFLICT (workspace_id, role_name, permission_key)
       DO NOTHING`,
      [workspaceId, roleName, permission]
    )
  }
  const organizationId = await resolveOrganizationIdForWorkspace(pool, workspaceId)
  await invalidateOrganizationMemberRbacCache(pool, organizationId)
  return { roleName, sourceRole, displayName, permissions }
}

export async function deleteWorkspaceCustomRole (pool, workspaceId, roleName) {
  await ensureWorkspaceRbacTables(pool)
  const normalizedRoleName = normalizeRoleName(roleName)
  const { rows } = await pool.query(
    `SELECT is_system
     FROM taxgpt.workspace_custom_roles
     WHERE workspace_id = $1::uuid
       AND role_name = $2
     LIMIT 1`,
    [workspaceId, normalizedRoleName]
  )
  if (!rows[0]) throw new Error('Custom role not found')
  if (rows[0].is_system) throw new Error('System roles cannot be deleted')

  await pool.query(
    `DELETE FROM taxgpt.workspace_member_roles
     WHERE workspace_id = $1::uuid
       AND role_name = $2`,
    [workspaceId, normalizedRoleName]
  )
  await pool.query(
    `DELETE FROM taxgpt.workspace_role_permissions
     WHERE workspace_id = $1::uuid
       AND role_name = $2`,
    [workspaceId, normalizedRoleName]
  )
  await pool.query(
    `DELETE FROM taxgpt.workspace_custom_roles
     WHERE workspace_id = $1::uuid
       AND role_name = $2`,
    [workspaceId, normalizedRoleName]
  )
  const organizationId = await resolveOrganizationIdForWorkspace(pool, workspaceId)
  await invalidateOrganizationMemberRbacCache(pool, organizationId)
  return { roleName: normalizedRoleName, deleted: true }
}

export async function unassignWorkspaceMemberRole (pool, workspaceId, targetUserId, roleName) {
  await ensureWorkspaceRbacTables(pool)
  const normalizedRoleName = normalizeRoleName(roleName)
  await pool.query(
    `DELETE FROM taxgpt.workspace_member_roles
     WHERE workspace_id = $1::uuid
       AND clerk_user_id = $2
       AND role_name = $3`,
    [workspaceId, targetUserId, normalizedRoleName]
  )
  const organizationId = await resolveOrganizationIdForWorkspace(pool, workspaceId)
  await invalidateOrganizationMemberRbacCache(pool, organizationId, targetUserId)
  return { workspaceId, clerkUserId: targetUserId, roleName: normalizedRoleName, unassigned: true }
}

export async function assignWorkspaceMemberRole (pool, workspaceId, actorUserId, targetUserId, roleName) {
  await ensureWorkspaceRbacTables(pool)
  const normalizedRoleName = normalizeRoleName(roleName)
  await pool.query(
    `INSERT INTO taxgpt.workspace_member_roles
     (workspace_id, clerk_user_id, role_name, created_by, created_at)
     VALUES ($1::uuid, $2, $3, $4, now())
     ON CONFLICT (workspace_id, clerk_user_id, role_name)
     DO NOTHING`,
    [workspaceId, targetUserId, normalizedRoleName, actorUserId]
  )
  const organizationId = await resolveOrganizationIdForWorkspace(pool, workspaceId)
  await invalidateOrganizationMemberRbacCache(pool, organizationId, targetUserId)
  return { workspaceId, clerkUserId: targetUserId, roleName: normalizedRoleName }
}

export async function getWorkspaceMemberCustomRoles (pool, workspaceId, clerkUserId) {
  await ensureWorkspaceRbacTables(pool)
  const { rows } = await pool.query(
    `SELECT role_name
     FROM taxgpt.workspace_member_roles
     WHERE workspace_id = $1::uuid
       AND clerk_user_id = $2
     ORDER BY role_name ASC`,
    [workspaceId, clerkUserId]
  )
  return rows.map((row) => row.role_name)
}

export async function assertWorkspacePermissionWithCustomRoles (pool, {
  workspaceId,
  organizationId = null,
  workspaceRole,
  clerkUserId,
  permission
}) {
  const resolved = await resolveEffectiveOrganizationMemberPermissions(pool, {
    organizationId,
    workspaceId,
    memberRole: workspaceRole,
    clerkUserId
  })
  if (!resolved.permissions.includes(permission) && !hasPermission(resolved.platformRole, permission)) {
    throw new Error(`Permission denied: ${permission}`)
  }
  return resolved
}

function assertWorkspaceMemberRole (role) {
  const normalized = String(role || '').trim().toLowerCase()
  if (!WORKSPACE_MEMBER_ROLES.has(normalized)) {
    throw new Error('Invalid workspace member role')
  }
  return normalized
}

async function fetchWorkspaceRecord (pool, workspaceId) {
  const { rows } = await pool.query(
    `SELECT id, organization_id, role, owner_user_id
     FROM taxgpt.accounting_workspaces
     WHERE id = $1::uuid
     LIMIT 1`,
    [workspaceId]
  )
  if (!rows[0]) throw new Error('Workspace not found')
  return rows[0]
}

export async function getOrganizationRbacSnapshot (pool, workspaceId) {
  await ensureWorkspaceRbacTables(pool)
  const workspace = await fetchWorkspaceRecord(pool, workspaceId)
  const customRoles = await listWorkspaceRoles(pool, workspace.id)
  const { rows: memberRows } = await pool.query(
    `SELECT clerk_user_id, role, status
     FROM taxgpt.accounting_workspace_members
     WHERE workspace_id = $1::uuid
     ORDER BY created_at ASC`,
    [workspace.id]
  )
  const members = []
  for (const row of memberRows) {
    const clerkUserId = String(row.clerk_user_id || '')
    const customRoleNames = await getWorkspaceMemberCustomRoles(pool, workspace.id, clerkUserId)
    members.push({
      clerk_user_id: clerkUserId,
      role: String(row.role || ''),
      status: String(row.status || ''),
      custom_roles: customRoleNames
    })
  }
  return {
    workspace: {
      id: workspace.id,
      organization_id: workspace.organization_id,
      role: workspace.role
    },
    catalog: {
      permissions: getPermissionCatalog(),
      systemRoles: getSystemWorkspaceRoleDefinitions()
    },
    customRoles,
    members
  }
}

export async function updateMemberRbacAssignments (pool, actorUserId, workspaceId, memberUserId, payload = {}) {
  await ensureWorkspaceRbacTables(pool)
  const workspace = await fetchWorkspaceRecord(pool, workspaceId)
  const targetUserId = String(memberUserId || '').trim()
  if (!targetUserId) throw new Error('Member user id is required')

  const { rows: targetRows } = await pool.query(
    `SELECT role
     FROM taxgpt.accounting_workspace_members
     WHERE workspace_id = $1::uuid
       AND clerk_user_id = $2
     LIMIT 1`,
    [workspace.id, targetUserId]
  )
  if (!targetRows[0]) throw new Error('Workspace member not found')

  const nextRole = payload.role != null ? assertWorkspaceMemberRole(payload.role) : null
  if (nextRole === 'owner' && workspace.role !== 'owner') {
    throw new Error('Only the workspace owner can assign the owner role')
  }
  if (String(targetRows[0].role) === 'owner' && workspace.role !== 'owner') {
    throw new Error('Only the workspace owner can change the owner role assignment')
  }

  if (nextRole) {
    await pool.query(
      `UPDATE taxgpt.accounting_workspace_members
       SET role = $3, updated_at = now()
       WHERE workspace_id = $1::uuid
         AND clerk_user_id = $2`,
      [workspace.id, targetUserId, nextRole]
    )
    await pool.query(
      `UPDATE taxgpt.accounting_organization_members
       SET role = $3, updated_at = now()
       WHERE organization_id = $1::uuid
         AND clerk_user_id = $2`,
      [workspace.organization_id, targetUserId, nextRole === 'owner' || nextRole === 'admin' ? 'admin' : 'member']
    )
  }

  if (Array.isArray(payload.customRoles)) {
    const normalizedCustomRoles = [...new Set(payload.customRoles.map((entry) => normalizeRoleName(entry)))]
    await pool.query(
      `DELETE FROM taxgpt.workspace_member_roles
       WHERE workspace_id = $1::uuid
         AND clerk_user_id = $2`,
      [workspace.id, targetUserId]
    )
    for (const roleName of normalizedCustomRoles) {
      await assignWorkspaceMemberRole(pool, workspace.id, actorUserId, targetUserId, roleName)
    }
  }

  await invalidateOrganizationMemberRbacCache(pool, workspace.organization_id, targetUserId)
  const customRoleNames = await getWorkspaceMemberCustomRoles(pool, workspace.id, targetUserId)
  const { rows: updatedRows } = await pool.query(
    `SELECT clerk_user_id, role, status
     FROM taxgpt.accounting_workspace_members
     WHERE workspace_id = $1::uuid
       AND clerk_user_id = $2
     LIMIT 1`,
    [workspace.id, targetUserId]
  )
  return {
    clerk_user_id: targetUserId,
    role: String(updatedRows[0]?.role || nextRole || targetRows[0].role),
    status: String(updatedRows[0]?.status || 'active'),
    custom_roles: customRoleNames
  }
}

export async function assertAnyWorkspacePermissionWithCustomRoles (pool, {
  workspaceId,
  organizationId = null,
  workspaceRole,
  clerkUserId,
  permissions
}) {
  const permissionList = Array.isArray(permissions) ? permissions.filter(Boolean) : []
  if (permissionList.length === 0) {
    throw new Error('Permission required')
  }
  const resolved = await resolveEffectiveOrganizationMemberPermissions(pool, {
    organizationId,
    workspaceId,
    memberRole: workspaceRole,
    clerkUserId
  })
  for (const permission of permissionList) {
    if (resolved.permissions.includes(permission) || hasPermission(resolved.platformRole, permission)) {
      return resolved
    }
  }
  throw new Error('Permission denied')
}
