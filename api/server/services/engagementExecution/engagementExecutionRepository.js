import { assertWorkspacePermissionWithCustomRoles } from '../authz/workspaceRbacService.js'
import { mapWorkspaceRoleToPlatformRole } from '../authz/rolePermissions.js'

export async function assertEngagementExecutionAccess (pool, workspace, clerkUserId, permission) {
  await assertWorkspacePermissionWithCustomRoles(pool, {
    workspaceId: workspace.id,
    workspaceRole: workspace.role,
    clerkUserId,
    permission
  })
}

export async function getEngagementForExecution (pool, engagementId, workspaceId) {
  const { rows } = await pool.query(
    `SELECT e.*, c.name AS client_name
     FROM taxgpt.accounting_engagements e
     INNER JOIN taxgpt.accounting_clients c ON c.id = e.client_id
     WHERE e.id = $1::uuid
       AND e.workspace_id = $2::uuid`,
    [engagementId, workspaceId]
  )
  return rows[0] || null
}

export async function updateEngagementExecutionFields (pool, engagementId, workspaceId, fields) {
  const { rows } = await pool.query(
    `UPDATE taxgpt.accounting_engagements
     SET execution_phase = COALESCE($3, execution_phase),
         execution_locked_at = COALESCE($4, execution_locked_at),
         execution_template_id = COALESCE($5::uuid, execution_template_id),
         execution_completion_pct = COALESCE($6, execution_completion_pct),
         updated_at = now()
     WHERE id = $1::uuid AND workspace_id = $2::uuid
     RETURNING *`,
    [
      engagementId,
      workspaceId,
      fields.executionPhase ?? null,
      fields.executionLockedAt ?? null,
      fields.executionTemplateId ?? null,
      fields.executionCompletionPct ?? null
    ]
  )
  return rows[0] || null
}

export async function listEngagementSections (pool, engagementId) {
  const { rows } = await pool.query(
    `SELECT * FROM taxgpt.engagement_sections
     WHERE engagement_id = $1::uuid AND deleted_at IS NULL
     ORDER BY sort_order ASC`,
    [engagementId]
  )
  return rows
}

export async function listEngagementChecklists (pool, engagementId) {
  const { rows } = await pool.query(
    `SELECT * FROM taxgpt.engagement_checklists
     WHERE engagement_id = $1::uuid AND deleted_at IS NULL
     ORDER BY sort_order ASC`,
    [engagementId]
  )
  return rows
}

export async function listEngagementChecklistItems (pool, engagementId) {
  const { rows } = await pool.query(
    `SELECT i.*, c.title AS checklist_title, c.checklist_key
     FROM taxgpt.engagement_checklist_items i
     INNER JOIN taxgpt.engagement_checklists c ON c.id = i.checklist_id
     WHERE i.engagement_id = $1::uuid AND i.deleted_at IS NULL
     ORDER BY c.sort_order ASC, i.sort_order ASC`,
    [engagementId]
  )
  return rows
}

export async function getChecklistItem (pool, itemId, engagementId, workspaceId) {
  const { rows } = await pool.query(
    `SELECT i.*
     FROM taxgpt.engagement_checklist_items i
     INNER JOIN taxgpt.accounting_engagements e ON e.id = i.engagement_id
     WHERE i.id = $1::uuid AND i.engagement_id = $2::uuid AND e.workspace_id = $3::uuid AND i.deleted_at IS NULL`,
    [itemId, engagementId, workspaceId]
  )
  return rows[0] || null
}

export async function updateChecklistItem (pool, itemId, payload) {
  const { rows } = await pool.query(
    `UPDATE taxgpt.engagement_checklist_items
     SET status = COALESCE($2, status),
         assigned_to = COALESCE($3, assigned_to),
         due_date = COALESCE($4::date, due_date),
         notes = COALESCE($5, notes),
         signed_off_by = COALESCE($6, signed_off_by),
         signed_off_at = COALESCE($7::timestamp, signed_off_at),
         updated_by = $8,
         updated_at = now()
     WHERE id = $1::uuid AND deleted_at IS NULL
     RETURNING *`,
    [
      itemId,
      payload.status ?? null,
      payload.assignedTo ?? null,
      payload.dueDate ?? null,
      payload.notes ?? null,
      payload.signedOffBy ?? null,
      payload.signedOffAt ?? null,
      payload.updatedBy ?? null
    ]
  )
  return rows[0] || null
}

export async function listEngagementProcedures (pool, engagementId) {
  const { rows } = await pool.query(
    `SELECT * FROM taxgpt.engagement_procedures
     WHERE engagement_id = $1::uuid AND deleted_at IS NULL
     ORDER BY sort_order ASC`,
    [engagementId]
  )
  return rows
}

export async function getProcedure (pool, procedureId, engagementId, workspaceId) {
  const { rows } = await pool.query(
    `SELECT p.*
     FROM taxgpt.engagement_procedures p
     INNER JOIN taxgpt.accounting_engagements e ON e.id = p.engagement_id
     WHERE p.id = $1::uuid AND p.engagement_id = $2::uuid AND e.workspace_id = $3::uuid AND p.deleted_at IS NULL`,
    [procedureId, engagementId, workspaceId]
  )
  return rows[0] || null
}

export async function updateProcedure (pool, procedureId, payload) {
  const { rows } = await pool.query(
    `UPDATE taxgpt.engagement_procedures
     SET title = COALESCE($2, title),
         description = COALESCE($3, description),
         objective = COALESCE($4, objective),
         expected_result = COALESCE($5, expected_result),
         status = COALESCE($6, status),
         assigned_to = COALESCE($7, assigned_to),
         prepared_by = COALESCE($8, prepared_by),
         prepared_at = COALESCE($9::timestamp, prepared_at),
         reviewed_by = COALESCE($10, reviewed_by),
         reviewed_at = COALESCE($11::timestamp, reviewed_at),
         lead_sheet_id = COALESCE($12::uuid, lead_sheet_id),
         updated_by = $13,
         updated_at = now()
     WHERE id = $1::uuid AND deleted_at IS NULL
     RETURNING *`,
    [
      procedureId,
      payload.title ?? null,
      payload.description ?? null,
      payload.objective ?? null,
      payload.expectedResult ?? null,
      payload.status ?? null,
      payload.assignedTo ?? null,
      payload.preparedBy ?? null,
      payload.preparedAt ?? null,
      payload.reviewedBy ?? null,
      payload.reviewedAt ?? null,
      payload.leadSheetId ?? null,
      payload.updatedBy ?? null
    ]
  )
  return rows[0] || null
}

export async function insertProcedureSignoff (pool, payload) {
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.procedure_signoffs
     (organization_id, workspace_id, engagement_id, procedure_id, signoff_type, signed_by, signed_at, role_at_signoff, metadata)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, now(), $7, $8::jsonb)
     RETURNING *`,
    [
      payload.organizationId,
      payload.workspaceId,
      payload.engagementId,
      payload.procedureId,
      payload.signoffType || 'approval',
      payload.signedBy,
      payload.roleAtSignoff || null,
      JSON.stringify(payload.metadata || {})
    ]
  )
  return rows[0] || null
}

export async function countOpenReviewNotes (pool, engagementId) {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS count
     FROM taxgpt.review_notes
     WHERE engagement_id = $1::uuid AND status IN ('open', 'reopened')`,
    [engagementId]
  )
  return Number(rows[0]?.count || 0)
}

export async function countExecutionStats (pool, engagementId) {
  const { rows } = await pool.query(
    `SELECT
       (SELECT count(*)::int FROM taxgpt.engagement_checklist_items WHERE engagement_id = $1::uuid AND deleted_at IS NULL) AS checklist_total,
       (SELECT count(*)::int FROM taxgpt.engagement_checklist_items WHERE engagement_id = $1::uuid AND deleted_at IS NULL AND status IN ('completed', 'reviewed', 'approved')) AS checklist_done,
       (SELECT count(*)::int FROM taxgpt.engagement_procedures WHERE engagement_id = $1::uuid AND deleted_at IS NULL) AS procedure_total,
       (SELECT count(*)::int FROM taxgpt.engagement_procedures WHERE engagement_id = $1::uuid AND deleted_at IS NULL AND status = 'approved') AS procedure_approved,
       (SELECT count(*)::int FROM taxgpt.engagement_procedures WHERE engagement_id = $1::uuid AND deleted_at IS NULL AND status IN ('in_progress', 'prepared', 'pending_review', 'review_notes_issued')) AS procedure_in_progress`,
    [engagementId]
  )
  return rows[0] || {}
}

export function resolvePlatformRole (workspace) {
  return mapWorkspaceRoleToPlatformRole(workspace?.role)
}
