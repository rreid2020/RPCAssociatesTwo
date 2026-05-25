function mapClerkRoleToWorkspaceRole (role) {
  const normalized = String(role || '').trim().toLowerCase()
  if (normalized === 'org:admin') return 'admin'
  return 'preparer'
}

function mapWorkspaceRoleToOrgRole (workspaceRole) {
  const normalized = String(workspaceRole || '').trim().toLowerCase()
  if (normalized === 'owner' || normalized === 'admin' || normalized === 'manager') return 'admin'
  return 'member'
}

function resolveUserIdFromPayload (payload = {}) {
  return String(
    payload.public_user_data?.user_id ||
    payload.publicUserData?.userId ||
    payload.publicUserData?.user_id ||
    payload.user_id ||
    payload.userId ||
    ''
  ).trim()
}

function resolveOrganizationIdFromPayload (payload = {}) {
  return String(
    payload.organization?.id ||
    payload.organization_id ||
    payload.organizationId ||
    ''
  ).trim()
}

export async function syncClerkMembershipEvent (pool, payload = {}, options = {}) {
  const clerkUserId = resolveUserIdFromPayload(payload)
  const clerkOrgId = resolveOrganizationIdFromPayload(payload)
  if (!clerkUserId || !clerkOrgId) return { ok: true, ignored: true, reason: 'missing_user_or_org' }

  const { rows: workspaceRows } = await pool.query(
    `SELECT id, organization_id
     FROM taxgpt.accounting_workspaces
     WHERE clerk_org_id = $1
     LIMIT 1`,
    [clerkOrgId]
  )
  const workspace = workspaceRows[0]
  if (!workspace?.organization_id) {
    return { ok: true, ignored: true, reason: 'workspace_org_not_linked' }
  }

  const isDeleted = Boolean(options.deleted)
  const membershipRole = mapClerkRoleToWorkspaceRole(payload.role)
  const orgRole = mapWorkspaceRoleToOrgRole(membershipRole)
  const memberStatus = isDeleted ? 'inactive' : 'active'
  const orgStatus = isDeleted ? 'inactive' : 'active'

  await pool.query(
    `INSERT INTO taxgpt.accounting_organization_members
     (organization_id, clerk_user_id, role, status, invited_by, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, $4, $2, now(), now())
     ON CONFLICT (organization_id, clerk_user_id)
     DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status, updated_at = now()`,
    [workspace.organization_id, clerkUserId, orgRole, orgStatus]
  )

  await pool.query(
    `INSERT INTO taxgpt.accounting_workspace_members
     (workspace_id, clerk_user_id, role, status, clerk_org_membership_id, invited_by, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, $4, $5, $2, now(), now())
     ON CONFLICT (workspace_id, clerk_user_id)
     DO UPDATE SET role = EXCLUDED.role,
                   status = EXCLUDED.status,
                   clerk_org_membership_id = EXCLUDED.clerk_org_membership_id,
                   updated_at = now()`,
    [workspace.id, clerkUserId, membershipRole, memberStatus, payload.id || null]
  )

  await pool.query(
    `INSERT INTO taxgpt.workspace_employee_assignments
     (organization_id, workspace_id, clerk_user_id, assignment_role, status, assigned_by, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3, 'member', $4, $3, now(), now())
     ON CONFLICT (workspace_id, clerk_user_id)
     DO UPDATE SET status = EXCLUDED.status, updated_at = now()`,
    [workspace.organization_id, workspace.id, clerkUserId, memberStatus]
  )

  return { ok: true, ignored: false, workspaceId: workspace.id, organizationId: workspace.organization_id, clerkUserId, status: memberStatus }
}
