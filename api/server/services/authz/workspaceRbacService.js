import { PERMISSION_KEYS, hasPermission, listPermissionsForRole, mapWorkspaceRoleToPlatformRole } from './rolePermissions.js'
import { ensurePortalSchema } from '../../db/ensurePortalSchema.js'

const ROLE_NAME_RE = /^[a-z0-9_]{2,48}$/

function normalizeRoleName (value) {
  const roleName = String(value || '').trim().toLowerCase()
  if (!ROLE_NAME_RE.test(roleName)) {
    throw new Error('Role name must be 2-48 characters and contain only a-z, 0-9, and underscores')
  }
  return roleName
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

let workspaceRbacTablesEnsurePromise = null

export async function ensureWorkspaceRbacTables (pool) {
  if (!workspaceRbacTablesEnsurePromise) {
    workspaceRbacTablesEnsurePromise = (async () => {
      const { rows } = await pool.query(
        `SELECT to_regclass('taxgpt.workspace_custom_roles') IS NOT NULL AS ok`
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
  return { roleName, sourceRole, displayName, permissions }
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

export async function resolveEffectiveWorkspacePermissions (pool, workspaceId, workspaceRole, clerkUserId) {
  await ensureWorkspaceRbacTables(pool)
  const platformRole = mapWorkspaceRoleToPlatformRole(workspaceRole)
  const effective = new Set(listPermissionsForRole(platformRole))
  const customRoleNames = await getWorkspaceMemberCustomRoles(pool, workspaceId, clerkUserId)
  if (customRoleNames.length > 0) {
    const { rows } = await pool.query(
      `SELECT permission_key
       FROM taxgpt.workspace_role_permissions
       WHERE workspace_id = $1::uuid
         AND role_name = ANY($2::text[])`,
      [workspaceId, customRoleNames]
    )
    for (const row of rows) effective.add(row.permission_key)
  }
  return {
    platformRole,
    customRoles: customRoleNames,
    permissions: [...effective].sort()
  }
}

export async function assertWorkspacePermissionWithCustomRoles (pool, { workspaceId, workspaceRole, clerkUserId, permission }) {
  const normalizedRole = String(workspaceRole || '').trim().toLowerCase()
  if (normalizedRole === 'owner' || normalizedRole === 'admin') {
    return buildResolvedWorkspacePermissions(workspaceRole)
  }
  const resolved = await resolveEffectiveWorkspacePermissions(pool, workspaceId, workspaceRole, clerkUserId)
  if (!resolved.permissions.includes(permission) && !hasPermission(resolved.platformRole, permission)) {
    throw new Error(`Permission denied: ${permission}`)
  }
  return resolved
}

export async function assertAnyWorkspacePermissionWithCustomRoles (pool, { workspaceId, workspaceRole, clerkUserId, permissions }) {
  const permissionList = Array.isArray(permissions) ? permissions.filter(Boolean) : []
  if (permissionList.length === 0) {
    throw new Error('Permission required')
  }
  let lastError = null
  for (const permission of permissionList) {
    try {
      return await assertWorkspacePermissionWithCustomRoles(pool, {
        workspaceId,
        workspaceRole,
        clerkUserId,
        permission
      })
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Permission denied')
}
