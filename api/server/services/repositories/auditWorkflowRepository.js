export async function recordAuditEvent (pool, payload = {}) {
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.audit_events
     (organization_id, workspace_id, engagement_id, lead_sheet_id, working_paper_row_id, event_type, entity_type, entity_id, actor_id, before_value, after_value, metadata, created_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb, now())
     RETURNING *`,
    [
      payload.organizationId || null,
      payload.workspaceId || null,
      payload.engagementId || null,
      payload.leadSheetId || null,
      payload.workingPaperRowId || null,
      payload.eventType,
      payload.entityType || null,
      payload.entityId || null,
      payload.actorId || null,
      JSON.stringify(payload.beforeValue || null),
      JSON.stringify(payload.afterValue || null),
      JSON.stringify(payload.metadata || {})
    ]
  )
  return rows[0] || null
}

export async function appendWorkflowStatus (pool, payload = {}) {
  if (!payload.engagementId || !payload.statusType || !payload.statusValue || !payload.transitionedBy) return null
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.workflow_statuses
     (organization_id, workspace_id, engagement_id, lead_sheet_id, working_paper_row_id, status_type, status_value, transitioned_by, transitioned_at, notes, metadata, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6, $7, $8, now(), $9, $10::jsonb, now(), now())
     RETURNING *`,
    [
      payload.organizationId || null,
      payload.workspaceId || null,
      payload.engagementId,
      payload.leadSheetId || null,
      payload.workingPaperRowId || null,
      payload.statusType,
      payload.statusValue,
      payload.transitionedBy,
      payload.notes || null,
      JSON.stringify(payload.metadata || {})
    ]
  )
  return rows[0] || null
}

export async function upsertReviewAssignment (pool, payload = {}) {
  if (!payload.engagementId || !payload.assignedTo || !payload.assignmentType) return null
  await pool.query(
    `INSERT INTO taxgpt.review_assignments
     (organization_id, workspace_id, engagement_id, lead_sheet_id, review_note_id, assignment_type, assigned_to, assigned_by, assignment_state, due_date, metadata, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6, $7, $8, $9, $10::date, $11::jsonb, now(), now())`,
    [
      payload.organizationId || null,
      payload.workspaceId || null,
      payload.engagementId,
      payload.leadSheetId || null,
      payload.reviewNoteId || null,
      payload.assignmentType,
      payload.assignedTo,
      payload.assignedBy || null,
      payload.assignmentState || 'active',
      payload.dueDate || null,
      JSON.stringify(payload.metadata || {})
    ]
  )
  return true
}
