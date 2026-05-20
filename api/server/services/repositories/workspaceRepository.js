export async function fetchWorkspaceMembers (pool, workspaceId) {
  const { rows } = await pool.query(
    `SELECT workspace_id, clerk_user_id, role, status, invited_by, created_at, updated_at
     FROM taxgpt.accounting_workspace_members
     WHERE workspace_id = $1::uuid
     ORDER BY created_at ASC`,
    [workspaceId]
  )
  return rows
}

export async function fetchWorkspaceInvites (pool, workspaceId) {
  const { rows } = await pool.query(
    `SELECT id, workspace_id, invite_email, invite_token, role, status, invited_by, accepted_by, expires_at, created_at, updated_at
     FROM taxgpt.accounting_workspace_invites
     WHERE workspace_id = $1::uuid
     ORDER BY created_at DESC`,
    [workspaceId]
  )
  return rows
}

