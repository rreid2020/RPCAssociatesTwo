const WORKSPACE_ROLES = new Set(['owner', 'admin', 'manager', 'reviewer', 'preparer', 'read_only', 'client'])

function assertRole (role) {
  if (!WORKSPACE_ROLES.has(role)) {
    throw new Error('Invalid workspace role')
  }
}

function slugifyWorkspaceName (name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'workspace'
}

export async function ensureWorkspaceTables (pool) {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS taxgpt.accounting_workspaces (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       owner_user_id TEXT NOT NULL,
       name TEXT NOT NULL,
       slug TEXT NOT NULL UNIQUE,
       is_personal BOOLEAN NOT NULL DEFAULT false,
       created_at TIMESTAMP NOT NULL DEFAULT now(),
       updated_at TIMESTAMP NOT NULL DEFAULT now()
     )`
  )
  await pool.query(
    `CREATE TABLE IF NOT EXISTS taxgpt.accounting_workspace_members (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
       clerk_user_id TEXT NOT NULL,
       role VARCHAR(24) NOT NULL DEFAULT 'preparer',
       status VARCHAR(24) NOT NULL DEFAULT 'active',
       invited_by TEXT,
       created_at TIMESTAMP NOT NULL DEFAULT now(),
       updated_at TIMESTAMP NOT NULL DEFAULT now(),
       UNIQUE (workspace_id, clerk_user_id)
     )`
  )
}

export async function ensurePersonalWorkspace (pool, clerkUserId) {
  await ensureWorkspaceTables(pool)
  const { rows: existing } = await pool.query(
    `SELECT w.*
     FROM taxgpt.accounting_workspaces w
     INNER JOIN taxgpt.accounting_workspace_members m ON m.workspace_id = w.id
     WHERE w.is_personal = true
       AND w.owner_user_id = $1
       AND m.clerk_user_id = $1
       AND m.status = 'active'
     LIMIT 1`,
    [clerkUserId]
  )
  if (existing[0]) return existing[0]

  const baseSlug = `personal-${slugifyWorkspaceName(clerkUserId)}`
  const slug = `${baseSlug}-${Date.now().toString(36)}`
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.accounting_workspaces
     (owner_user_id, name, slug, is_personal, created_at, updated_at)
     VALUES ($1, $2, $3, true, now(), now())
     RETURNING *`,
    [clerkUserId, 'My Accounting Workspace', slug]
  )
  const workspace = rows[0]
  await pool.query(
    `INSERT INTO taxgpt.accounting_workspace_members
     (workspace_id, clerk_user_id, role, status, invited_by, created_at, updated_at)
     VALUES ($1::uuid, $2, 'owner', 'active', $2, now(), now())
     ON CONFLICT (workspace_id, clerk_user_id)
     DO UPDATE SET role = 'owner', status = 'active', updated_at = now()`,
    [workspace.id, clerkUserId]
  )
  return workspace
}

export async function getWorkspaceContext (pool, clerkUserId, requestedWorkspaceId = null) {
  await ensurePersonalWorkspace(pool, clerkUserId)
  if (requestedWorkspaceId) {
    const { rows } = await pool.query(
      `SELECT w.*, m.role, m.status
       FROM taxgpt.accounting_workspaces w
       INNER JOIN taxgpt.accounting_workspace_members m ON m.workspace_id = w.id
       WHERE w.id = $1::uuid
         AND m.clerk_user_id = $2
         AND m.status = 'active'
       LIMIT 1`,
      [requestedWorkspaceId, clerkUserId]
    )
    if (!rows[0]) throw new Error('Workspace access denied')
    return rows[0]
  }

  const { rows } = await pool.query(
    `SELECT w.*, m.role, m.status
     FROM taxgpt.accounting_workspaces w
     INNER JOIN taxgpt.accounting_workspace_members m ON m.workspace_id = w.id
     WHERE m.clerk_user_id = $1
       AND m.status = 'active'
     ORDER BY CASE WHEN m.role = 'owner' THEN 0 ELSE 1 END, w.created_at ASC
     LIMIT 1`,
    [clerkUserId]
  )
  if (!rows[0]) throw new Error('Workspace not found')
  return rows[0]
}

export async function listWorkspacesForUser (pool, clerkUserId) {
  await ensurePersonalWorkspace(pool, clerkUserId)
  const { rows } = await pool.query(
    `SELECT w.*, m.role, m.status
     FROM taxgpt.accounting_workspaces w
     INNER JOIN taxgpt.accounting_workspace_members m ON m.workspace_id = w.id
     WHERE m.clerk_user_id = $1
       AND m.status = 'active'
     ORDER BY w.created_at ASC`,
    [clerkUserId]
  )
  return rows
}

export async function createWorkspace (pool, clerkUserId, payload) {
  await ensureWorkspaceTables(pool)
  const name = String(payload?.name || '').trim()
  if (!name) throw new Error('Workspace name is required')
  const baseSlug = slugifyWorkspaceName(name)
  const slug = `${baseSlug}-${Date.now().toString(36)}`
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.accounting_workspaces
     (owner_user_id, name, slug, is_personal, created_at, updated_at)
     VALUES ($1, $2, $3, false, now(), now())
     RETURNING *`,
    [clerkUserId, name, slug]
  )
  const workspace = rows[0]
  await pool.query(
    `INSERT INTO taxgpt.accounting_workspace_members
     (workspace_id, clerk_user_id, role, status, invited_by, created_at, updated_at)
     VALUES ($1::uuid, $2, 'owner', 'active', $2, now(), now())`,
    [workspace.id, clerkUserId]
  )
  return workspace
}

export async function listWorkspaceMembers (pool, actorUserId, workspaceId) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  const { rows } = await pool.query(
    `SELECT m.workspace_id, m.clerk_user_id, m.role, m.status, m.invited_by, m.created_at, m.updated_at
     FROM taxgpt.accounting_workspace_members m
     WHERE m.workspace_id = $1::uuid
     ORDER BY m.created_at ASC`,
    [workspace.id]
  )
  return { workspace, members: rows }
}

export async function addWorkspaceMember (pool, actorUserId, workspaceId, payload) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  if (!(workspace.role === 'owner' || workspace.role === 'admin')) {
    throw new Error('Only owner/admin can add members')
  }
  const clerkUserId = String(payload?.clerkUserId || '').trim()
  if (!clerkUserId) throw new Error('clerkUserId is required')
  const role = String(payload?.role || 'preparer')
  assertRole(role)
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.accounting_workspace_members
     (workspace_id, clerk_user_id, role, status, invited_by, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, 'active', $4, now(), now())
     ON CONFLICT (workspace_id, clerk_user_id)
     DO UPDATE SET role = EXCLUDED.role, status = 'active', invited_by = EXCLUDED.invited_by, updated_at = now()
     RETURNING workspace_id, clerk_user_id, role, status, invited_by, created_at, updated_at`,
    [workspace.id, clerkUserId, role, actorUserId]
  )
  return rows[0]
}

export async function updateWorkspaceMember (pool, actorUserId, workspaceId, memberUserId, payload) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  if (!(workspace.role === 'owner' || workspace.role === 'admin')) {
    throw new Error('Only owner/admin can update members')
  }
  const role = payload?.role ? String(payload.role) : null
  const status = payload?.status ? String(payload.status) : null
  if (role) assertRole(role)
  if (status && !['active', 'inactive'].includes(status)) throw new Error('Invalid member status')

  const { rows } = await pool.query(
    `UPDATE taxgpt.accounting_workspace_members
     SET role = COALESCE($1, role),
         status = COALESCE($2, status),
         updated_at = now()
     WHERE workspace_id = $3::uuid
       AND clerk_user_id = $4
     RETURNING workspace_id, clerk_user_id, role, status, invited_by, created_at, updated_at`,
    [role, status, workspace.id, memberUserId]
  )
  if (!rows[0]) throw new Error('Member not found')
  return rows[0]
}

