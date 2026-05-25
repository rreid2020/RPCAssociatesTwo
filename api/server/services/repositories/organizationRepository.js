export async function fetchOrganizationById (pool, organizationId) {
  const { rows } = await pool.query(
    `SELECT *
     FROM taxgpt.accounting_organizations
     WHERE id = $1::uuid
     LIMIT 1`,
    [organizationId]
  )
  return rows[0] || null
}

export async function fetchOrganizationMembers (pool, organizationId) {
  const { rows } = await pool.query(
    `SELECT organization_id, clerk_user_id, role, status, invited_by, created_at, updated_at
     FROM taxgpt.accounting_organization_members
     WHERE organization_id = $1::uuid
     ORDER BY created_at ASC`,
    [organizationId]
  )
  return rows
}

export async function upsertInvitedOrganizationMember (pool, organizationId, inviteEmail, role, invitedBy) {
  await pool.query(
    `INSERT INTO taxgpt.accounting_organization_members
     (organization_id, clerk_user_id, role, status, invited_by, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, 'invited', $4, now(), now())
     ON CONFLICT (organization_id, clerk_user_id)
     DO UPDATE SET role = EXCLUDED.role, status = 'invited', invited_by = EXCLUDED.invited_by, updated_at = now()`,
    [organizationId, `invite:${String(inviteEmail || '').trim().toLowerCase()}`, role, invitedBy]
  )
}

export async function updateOrganizationMemberByUserId (pool, organizationId, clerkUserId, role = null, status = null) {
  const { rows } = await pool.query(
    `UPDATE taxgpt.accounting_organization_members
     SET role = COALESCE($1, role),
         status = COALESCE($2, status),
         updated_at = now()
     WHERE organization_id = $3::uuid
       AND clerk_user_id = $4
     RETURNING organization_id, clerk_user_id, role, status, invited_by, created_at, updated_at`,
    [role, status, organizationId, clerkUserId]
  )
  return rows[0] || null
}

export async function deactivateOrganizationMemberHierarchy (pool, organizationId, clerkUserId) {
  await pool.query(
    `UPDATE taxgpt.accounting_organization_members
     SET status = 'inactive',
         updated_at = now()
     WHERE organization_id = $1::uuid
       AND clerk_user_id = $2`,
    [organizationId, clerkUserId]
  )

  await pool.query(
    `UPDATE taxgpt.accounting_workspace_members
     SET status = 'inactive',
         updated_at = now()
     WHERE workspace_id IN (
       SELECT id FROM taxgpt.accounting_workspaces WHERE organization_id = $1::uuid
     )
       AND clerk_user_id = $2`,
    [organizationId, clerkUserId]
  )

  await pool.query(
    `UPDATE taxgpt.workspace_employee_assignments
     SET status = 'inactive',
         updated_at = now()
     WHERE organization_id = $1::uuid
       AND clerk_user_id = $2`,
    [organizationId, clerkUserId]
  )

  await pool.query(
    `UPDATE taxgpt.engagement_employee_assignments
     SET status = 'inactive',
         updated_at = now()
     WHERE organization_id = $1::uuid
       AND clerk_user_id = $2`,
    [organizationId, clerkUserId]
  )

  await pool.query(
    `UPDATE taxgpt.working_paper_employee_assignments
     SET status = 'inactive',
         updated_at = now()
     WHERE organization_id = $1::uuid
       AND clerk_user_id = $2`,
    [organizationId, clerkUserId]
  )
}

export async function fetchOrganizationAssignmentCounts (pool, organizationId) {
  const [{ rows: workspaceCounts }, { rows: engagementCounts }, { rows: paperCounts }] = await Promise.all([
    pool.query(
      `SELECT clerk_user_id, count(*)::int AS c
       FROM taxgpt.workspace_employee_assignments
       WHERE organization_id = $1::uuid AND status = 'active'
       GROUP BY clerk_user_id`,
      [organizationId]
    ),
    pool.query(
      `SELECT clerk_user_id, count(*)::int AS c
       FROM taxgpt.engagement_employee_assignments
       WHERE organization_id = $1::uuid AND status = 'active'
       GROUP BY clerk_user_id`,
      [organizationId]
    ),
    pool.query(
      `SELECT clerk_user_id, count(*)::int AS c
       FROM taxgpt.working_paper_employee_assignments
       WHERE organization_id = $1::uuid AND status = 'active'
       GROUP BY clerk_user_id`,
      [organizationId]
    )
  ])
  return { workspaceCounts, engagementCounts, paperCounts }
}
