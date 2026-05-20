import { randomBytes } from 'crypto'

const WORKSPACE_ROLES = new Set(['owner', 'admin', 'manager', 'reviewer', 'preparer', 'read_only', 'client'])
const WORKSPACE_TYPES = new Set(['business', 'firm'])

function assertRole (role) {
  if (!WORKSPACE_ROLES.has(role)) {
    throw new Error('Invalid workspace role')
  }
}

function normalizeWorkspaceType (value) {
  const type = String(value || 'business').trim().toLowerCase()
  if (!WORKSPACE_TYPES.has(type)) {
    throw new Error('Invalid workspace type')
  }
  return type
}

function canManageWorkspace (workspace) {
  return workspace.role === 'owner' || workspace.role === 'admin'
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
       workspace_type VARCHAR(16) NOT NULL DEFAULT 'business',
       is_personal BOOLEAN NOT NULL DEFAULT false,
       created_at TIMESTAMP NOT NULL DEFAULT now(),
       updated_at TIMESTAMP NOT NULL DEFAULT now()
     )`
  )
  await pool.query('ALTER TABLE taxgpt.accounting_workspaces ADD COLUMN IF NOT EXISTS workspace_type VARCHAR(16)')
  await pool.query("UPDATE taxgpt.accounting_workspaces SET workspace_type = 'business' WHERE workspace_type IS NULL")
  await pool.query("ALTER TABLE taxgpt.accounting_workspaces ALTER COLUMN workspace_type SET DEFAULT 'business'")
  await pool.query('ALTER TABLE taxgpt.accounting_workspaces ALTER COLUMN workspace_type SET NOT NULL')
  await pool.query(
    `DO $$
     BEGIN
       IF NOT EXISTS (
         SELECT 1 FROM pg_constraint WHERE conname = 'accounting_workspaces_workspace_type_chk'
       ) THEN
         ALTER TABLE taxgpt.accounting_workspaces
           ADD CONSTRAINT accounting_workspaces_workspace_type_chk
           CHECK (workspace_type IN ('business', 'firm'));
       END IF;
     END $$`
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
  await pool.query(
    `CREATE TABLE IF NOT EXISTS taxgpt.accounting_workspace_invites (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
       invite_email TEXT,
       invite_token TEXT NOT NULL UNIQUE,
       role VARCHAR(24) NOT NULL DEFAULT 'preparer',
       status VARCHAR(24) NOT NULL DEFAULT 'pending',
       invited_by TEXT NOT NULL,
       accepted_by TEXT,
       expires_at TIMESTAMP NOT NULL,
       created_at TIMESTAMP NOT NULL DEFAULT now(),
       updated_at TIMESTAMP NOT NULL DEFAULT now()
     )`
  )
  await pool.query('CREATE INDEX IF NOT EXISTS accounting_workspace_invites_workspace_idx ON taxgpt.accounting_workspace_invites(workspace_id, status, created_at DESC)')
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
     (owner_user_id, name, slug, workspace_type, is_personal, created_at, updated_at)
     VALUES ($1, $2, $3, 'business', true, now(), now())
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
  const workspaceType = normalizeWorkspaceType(payload?.workspaceType)
  const baseSlug = slugifyWorkspaceName(name)
  const slug = `${baseSlug}-${Date.now().toString(36)}`
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.accounting_workspaces
     (owner_user_id, name, slug, workspace_type, is_personal, created_at, updated_at)
     VALUES ($1, $2, $3, $4, false, now(), now())
     RETURNING *`,
    [clerkUserId, name, slug, workspaceType]
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
  if (!canManageWorkspace(workspace)) {
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
  if (!canManageWorkspace(workspace)) {
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

export async function listWorkspaceInvites (pool, actorUserId, workspaceId) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  const { rows } = await pool.query(
    `SELECT id, workspace_id, invite_email, invite_token, role, status, invited_by, accepted_by, expires_at, created_at, updated_at
     FROM taxgpt.accounting_workspace_invites
     WHERE workspace_id = $1::uuid
     ORDER BY created_at DESC`,
    [workspace.id]
  )
  return { workspace, invites: rows }
}

export async function createWorkspaceInvite (pool, actorUserId, workspaceId, payload = {}) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  if (!canManageWorkspace(workspace)) {
    throw new Error('Only owner/admin can invite members')
  }
  const role = String(payload?.role || 'preparer')
  assertRole(role)
  const inviteEmail = payload?.email ? String(payload.email).trim().toLowerCase() : null
  const token = randomBytes(24).toString('hex')
  const expiresAt = payload?.expiresAt || new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString()

  const { rows } = await pool.query(
    `INSERT INTO taxgpt.accounting_workspace_invites
     (workspace_id, invite_email, invite_token, role, status, invited_by, expires_at, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, $4, 'pending', $5, $6::timestamp, now(), now())
     RETURNING id, workspace_id, invite_email, invite_token, role, status, invited_by, accepted_by, expires_at, created_at, updated_at`,
    [workspace.id, inviteEmail, token, role, actorUserId, expiresAt]
  )
  return rows[0]
}

export async function acceptWorkspaceInvite (pool, actorUserId, actorEmail, inviteToken) {
  const token = String(inviteToken || '').trim()
  if (!token) throw new Error('Invite token is required')

  const { rows: inviteRows } = await pool.query(
    `SELECT i.*, w.name AS workspace_name
     FROM taxgpt.accounting_workspace_invites i
     INNER JOIN taxgpt.accounting_workspaces w ON w.id = i.workspace_id
     WHERE i.invite_token = $1
     LIMIT 1`,
    [token]
  )
  const invite = inviteRows[0]
  if (!invite) throw new Error('Invite not found')
  if (invite.status !== 'pending') throw new Error('Invite is no longer pending')
  if (new Date(invite.expires_at).getTime() < Date.now()) throw new Error('Invite has expired')
  if (invite.invite_email) {
    if (!actorEmail) throw new Error('Signed-in account email unavailable; please contact workspace admin')
    if (String(actorEmail).trim().toLowerCase() !== String(invite.invite_email).trim().toLowerCase()) {
      throw new Error('Signed-in account email does not match this invite')
    }
  }

  await pool.query(
    `INSERT INTO taxgpt.accounting_workspace_members
     (workspace_id, clerk_user_id, role, status, invited_by, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, 'active', $4, now(), now())
     ON CONFLICT (workspace_id, clerk_user_id)
     DO UPDATE SET role = EXCLUDED.role, status = 'active', invited_by = EXCLUDED.invited_by, updated_at = now()`,
    [invite.workspace_id, actorUserId, invite.role, invite.invited_by]
  )

  const { rows: updatedInvite } = await pool.query(
    `UPDATE taxgpt.accounting_workspace_invites
     SET status = 'accepted', accepted_by = $1, updated_at = now()
     WHERE id = $2::uuid
     RETURNING id, workspace_id, invite_email, invite_token, role, status, invited_by, accepted_by, expires_at, created_at, updated_at`,
    [actorUserId, invite.id]
  )

  const workspace = await getWorkspaceContext(pool, actorUserId, invite.workspace_id)
  return { invite: updatedInvite[0], workspace }
}

