export async function fetchEngagementByIdForUser (pool, engagementId, clerkUserId) {
  const { rows } = await pool.query(
    `SELECT e.*
     FROM taxgpt.accounting_engagements e
     WHERE e.id = $1::uuid
       AND e.clerk_user_id = $2
     LIMIT 1`,
    [engagementId, clerkUserId]
  )
  return rows[0] || null
}

export async function fetchLeadSheetByIdForUser (pool, leadSheetId, clerkUserId) {
  const { rows } = await pool.query(
    `SELECT ls.*, e.workspace_id, e.organization_id, e.clerk_user_id
     FROM taxgpt.lead_sheets ls
     INNER JOIN taxgpt.accounting_engagements e ON e.id = ls.engagement_id
     WHERE ls.id = $1::uuid
       AND e.clerk_user_id = $2
     LIMIT 1`,
    [leadSheetId, clerkUserId]
  )
  return rows[0] || null
}

export async function listLeadSheetsWithRowsForEngagement (pool, engagementId) {
  const { rows } = await pool.query(
    `SELECT ls.id,
            ls.section_code,
            ls.section_name,
            ls.status,
            ls.risk_level,
            ls.preparer_id,
            ls.reviewer_id,
            count(DISTINCT lsa.id)::int AS row_count,
            count(DISTINCT rn.id)::int AS open_note_count
     FROM taxgpt.lead_sheets ls
     LEFT JOIN taxgpt.lead_sheet_accounts lsa ON lsa.lead_sheet_id = ls.id
     LEFT JOIN taxgpt.review_notes rn ON rn.lead_sheet_id = ls.id AND rn.status IN ('open', 'reopened')
     WHERE ls.engagement_id = $1::uuid
     GROUP BY ls.id
     ORDER BY ls.section_code ASC`,
    [engagementId]
  )
  return rows
}

export async function listWorkingPaperRowsForLeadSheet (pool, leadSheetId) {
  const { rows } = await pool.query(
    `SELECT wpr.*,
            tba.account_number,
            tba.account_name,
            tba.current_period_balance,
            tba.prior_period_balance,
            tba.variance_amount,
            tba.variance_percent,
            tba.is_material,
            tba.is_unusual
     FROM taxgpt.working_paper_rows wpr
     INNER JOIN taxgpt.trial_balance_accounts tba ON tba.id = wpr.trial_balance_account_id
     WHERE wpr.lead_sheet_id = $1::uuid
     ORDER BY wpr.sort_order ASC, wpr.created_at ASC`,
    [leadSheetId]
  )
  return rows
}

export async function listWorkflowQueueByEngagement (pool, engagementId) {
  const { rows } = await pool.query(
    `SELECT ls.id AS lead_sheet_id,
            ls.section_code,
            ls.section_name,
            ls.status AS lead_sheet_status,
            ls.preparer_id,
            ls.reviewer_id,
            e.review_flow_status,
            e.due_date,
            count(DISTINCT rn.id)::int AS open_note_count,
            count(DISTINCT CASE WHEN wpr.review_status <> 'reviewed' THEN wpr.id END)::int AS unreviewed_row_count
     FROM taxgpt.lead_sheets ls
     INNER JOIN taxgpt.accounting_engagements e ON e.id = ls.engagement_id
     LEFT JOIN taxgpt.review_notes rn ON rn.lead_sheet_id = ls.id AND rn.status IN ('open', 'reopened')
     LEFT JOIN taxgpt.working_paper_rows wpr ON wpr.lead_sheet_id = ls.id
     WHERE ls.engagement_id = $1::uuid
     GROUP BY ls.id, e.review_flow_status, e.due_date
     ORDER BY e.due_date NULLS LAST, ls.section_code ASC`,
    [engagementId]
  )
  return rows
}

export async function listAuditEventsByEngagement (pool, engagementId) {
  const { rows } = await pool.query(
    `SELECT ae.*
     FROM taxgpt.audit_events ae
     WHERE ae.engagement_id = $1::uuid
     ORDER BY ae.created_at DESC
     LIMIT 250`,
    [engagementId]
  )
  return rows
}

export async function createWorkingPaperRowTickmark (pool, payload = {}) {
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.tickmarks
     (organization_id, workspace_id, engagement_id, lead_sheet_id, working_paper_row_id, tickmark_code, label, color, note, created_by, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6, $7, $8, $9, $10, now(), now())
     RETURNING *`,
    [
      payload.organizationId || null,
      payload.workspaceId || null,
      payload.engagementId,
      payload.leadSheetId,
      payload.workingPaperRowId,
      payload.tickmarkCode,
      payload.label || null,
      payload.color || null,
      payload.note || null,
      payload.createdBy
    ]
  )
  return rows[0] || null
}

export async function listTickmarksByWorkingPaperRow (pool, workingPaperRowId) {
  const { rows } = await pool.query(
    `SELECT *
     FROM taxgpt.tickmarks
     WHERE working_paper_row_id = $1::uuid
     ORDER BY created_at DESC`,
    [workingPaperRowId]
  )
  return rows
}

export async function createEvidenceLink (pool, payload = {}) {
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.evidence_links
     (organization_id, workspace_id, engagement_id, lead_sheet_id, working_paper_row_id, document_id, link_type, label, source_url, metadata, created_by, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6::uuid, $7, $8, $9, $10::jsonb, $11, now(), now())
     RETURNING *`,
    [
      payload.organizationId || null,
      payload.workspaceId || null,
      payload.engagementId,
      payload.leadSheetId,
      payload.workingPaperRowId || null,
      payload.documentId || null,
      payload.linkType || 'document',
      payload.label || null,
      payload.sourceUrl || null,
      JSON.stringify(payload.metadata || {}),
      payload.createdBy
    ]
  )
  return rows[0] || null
}

export async function listEvidenceLinksByLeadSheet (pool, leadSheetId) {
  const { rows } = await pool.query(
    `SELECT *
     FROM taxgpt.evidence_links
     WHERE lead_sheet_id = $1::uuid
     ORDER BY created_at DESC`,
    [leadSheetId]
  )
  return rows
}

export async function listReviewSignoffsByEngagement (pool, engagementId) {
  const { rows } = await pool.query(
    `SELECT *
     FROM taxgpt.review_signoffs
     WHERE engagement_id = $1::uuid
     ORDER BY signed_at DESC`,
    [engagementId]
  )
  return rows
}

export async function createReviewSignoff (pool, payload = {}) {
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.review_signoffs
     (organization_id, workspace_id, engagement_id, lead_sheet_id, signoff_type, signoff_state, signed_by, signed_at, metadata, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, now(), $8::jsonb, now(), now())
     RETURNING *`,
    [
      payload.organizationId || null,
      payload.workspaceId || null,
      payload.engagementId,
      payload.leadSheetId || null,
      payload.signoffType,
      payload.signoffState,
      payload.signedBy,
      JSON.stringify(payload.metadata || {})
    ]
  )
  return rows[0] || null
}

export async function createAuditEvent (pool, payload = {}) {
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
