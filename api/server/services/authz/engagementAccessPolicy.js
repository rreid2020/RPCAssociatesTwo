export function hasUnrestrictedEngagementAccess (workspaceRole) {
  const normalized = String(workspaceRole || '').trim().toLowerCase()
  return normalized === 'owner' || normalized === 'admin'
}

export async function isActorAssignedToEngagement (pool, engagementId, clerkUserId) {
  const { rows } = await pool.query(
    `SELECT 1
     FROM taxgpt.engagement_employee_assignments
     WHERE engagement_id = $1::uuid
       AND clerk_user_id = $2
       AND status = 'active'
     LIMIT 1`,
    [engagementId, clerkUserId]
  )
  return Boolean(rows[0])
}

export async function requireEngagementAssignment (pool, workspace, engagementId, clerkUserId) {
  if (hasUnrestrictedEngagementAccess(workspace?.role)) return

  const { rows: engagementRows } = await pool.query(
    `SELECT id, workspace_id
     FROM taxgpt.accounting_engagements
     WHERE id = $1::uuid
     LIMIT 1`,
    [engagementId]
  )
  const engagement = engagementRows[0]
  if (!engagement) {
    const error = new Error('Engagement not found')
    error.code = 'ENGAGEMENT_NOT_FOUND'
    throw error
  }
  if (workspace?.id && String(engagement.workspace_id || '') !== String(workspace.id)) {
    const error = new Error('Engagement not found in active workspace')
    error.code = 'ENGAGEMENT_NOT_FOUND'
    throw error
  }

  const assigned = await isActorAssignedToEngagement(pool, engagementId, clerkUserId)
  if (!assigned) {
    const error = new Error('Assignment denied: engagement')
    error.code = 'ASSIGNMENT_DENIED_ENGAGEMENT'
    throw error
  }
}
