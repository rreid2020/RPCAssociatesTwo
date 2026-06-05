function truthyUuid(value) {
  return String(value || '').trim() || null
}

export async function fetchEngagementForAccess(pool, engagementId, clerkUserId) {
  const { rows } = await pool.query(
    `SELECT e.*
     FROM taxgpt.accounting_engagements e
     LEFT JOIN taxgpt.accounting_workspace_members wm_actor
       ON wm_actor.workspace_id = e.workspace_id
      AND wm_actor.clerk_user_id = $2
      AND wm_actor.status = 'active'
     LEFT JOIN taxgpt.engagement_employee_assignments eea
       ON eea.engagement_id = e.id
      AND eea.clerk_user_id = $2
      AND eea.status = 'active'
     WHERE e.id = $1::uuid
       AND (
         wm_actor.role IN ('owner', 'admin')
         OR eea.id IS NOT NULL
       )
     LIMIT 1`,
    [engagementId, clerkUserId]
  )
  return rows[0] || null
}

export async function fetchLeadSheetForAccess(pool, leadSheetId, clerkUserId) {
  const { rows } = await pool.query(
    `SELECT ls.*, e.organization_id, e.workspace_id
     FROM taxgpt.lead_sheets ls
     INNER JOIN taxgpt.accounting_engagements e ON e.id = ls.engagement_id
     LEFT JOIN taxgpt.accounting_workspace_members wm_actor
       ON wm_actor.workspace_id = e.workspace_id
      AND wm_actor.clerk_user_id = $2
      AND wm_actor.status = 'active'
     LEFT JOIN taxgpt.engagement_employee_assignments eea
       ON eea.engagement_id = e.id
      AND eea.clerk_user_id = $2
      AND eea.status = 'active'
     WHERE ls.id = $1::uuid
       AND (
         wm_actor.role IN ('owner', 'admin')
         OR eea.id IS NOT NULL
       )
     LIMIT 1`,
    [leadSheetId, clerkUserId]
  )
  return rows[0] || null
}

const TRIAL_BALANCE_REVIEW_STATUSES = new Set(['needs_work', 'in_review', 'complete'])

export async function updateTrialBalanceAccountWorkingPaperRecord(pool, accountId, payload) {
  const sets = []
  const values = []
  let index = 1

  if (payload.adjustmentDebit !== undefined) {
    const adjustmentDebit = Number(payload.adjustmentDebit)
    if (!Number.isFinite(adjustmentDebit) || adjustmentDebit < 0) {
      throw new Error('Adjustment debit must be zero or greater')
    }
    sets.push(`adjustment_debit = $${index++}`)
    values.push(adjustmentDebit)
  }

  if (payload.adjustmentCredit !== undefined) {
    const adjustmentCredit = Number(payload.adjustmentCredit)
    if (!Number.isFinite(adjustmentCredit) || adjustmentCredit < 0) {
      throw new Error('Adjustment credit must be zero or greater')
    }
    sets.push(`adjustment_credit = $${index++}`)
    values.push(adjustmentCredit)
  }

  if (payload.reviewStatus !== undefined) {
    const reviewStatus = String(payload.reviewStatus || '').trim()
    if (!TRIAL_BALANCE_REVIEW_STATUSES.has(reviewStatus)) {
      throw new Error('Invalid review status')
    }
    sets.push(`review_status = $${index++}`)
    values.push(reviewStatus)
  }

  if (payload.workpaperNote !== undefined) {
    const workpaperNote = payload.workpaperNote == null ? null : String(payload.workpaperNote).trim()
    sets.push(`workpaper_note = $${index++}`)
    values.push(workpaperNote || null)
  }

  if (sets.length === 0) {
    const { rows } = await pool.query('SELECT * FROM taxgpt.trial_balance_accounts WHERE id = $1::uuid', [accountId])
    return rows[0] || null
  }

  sets.push('updated_at = now()')
  values.push(accountId)
  const { rows } = await pool.query(
    `UPDATE taxgpt.trial_balance_accounts
     SET ${sets.join(', ')}
     WHERE id = $${index}::uuid
     RETURNING *`,
    values
  )
  return rows[0] || null
}

export async function fetchTrialBalanceAccountEngagementId(pool, accountId) {
  const { rows } = await pool.query(
    `SELECT tb.engagement_id
     FROM taxgpt.trial_balance_accounts tba
     INNER JOIN taxgpt.trial_balances tb ON tb.id = tba.trial_balance_id
     WHERE tba.id = $1::uuid
     LIMIT 1`,
    [accountId]
  )
  return rows[0]?.engagement_id || null
}

export async function listTrialBalanceAccountsForEngagement(pool, engagementId) {
  const { rows } = await pool.query(
    `SELECT tba.*, tb.name AS trial_balance_name
     FROM taxgpt.trial_balance_accounts tba
     INNER JOIN taxgpt.trial_balances tb ON tb.id = tba.trial_balance_id
     WHERE tb.engagement_id = $1::uuid
     ORDER BY COALESCE(tba.account_number, ''), tba.account_name`,
    [engagementId]
  )
  return rows
}

export async function listLeadSheetsForEngagement(pool, engagementId) {
  const { rows } = await pool.query(
    `SELECT ls.*,
            count(distinct lsa.id)::int AS account_count,
            count(distinct rn.id)::int AS open_note_count,
            count(distinct wpd.id)::int AS document_count
     FROM taxgpt.lead_sheets ls
     LEFT JOIN taxgpt.lead_sheet_accounts lsa ON lsa.lead_sheet_id = ls.id
     LEFT JOIN taxgpt.review_notes rn ON rn.lead_sheet_id = ls.id AND rn.status IN ('open', 'reopened')
     LEFT JOIN taxgpt.working_paper_documents wpd ON wpd.lead_sheet_id = ls.id
     WHERE ls.engagement_id = $1::uuid
     GROUP BY ls.id
     ORDER BY ls.section_code ASC`,
    [engagementId]
  )
  return rows
}

export async function fetchLeadSheetDetailRows(pool, leadSheetId) {
  const [accounts, notes, documents, tasks] = await Promise.all([
    pool.query(
      `SELECT tba.*
       FROM taxgpt.lead_sheet_accounts lsa
       INNER JOIN taxgpt.trial_balance_accounts tba ON tba.id = lsa.trial_balance_account_id
       WHERE lsa.lead_sheet_id = $1::uuid
       ORDER BY lsa.sort_order ASC`,
      [leadSheetId]
    ),
    pool.query('SELECT * FROM taxgpt.review_notes WHERE lead_sheet_id = $1::uuid AND deleted_at IS NULL ORDER BY created_at DESC', [leadSheetId]),
    pool.query('SELECT * FROM taxgpt.working_paper_documents WHERE lead_sheet_id = $1::uuid ORDER BY uploaded_at DESC', [leadSheetId]),
    pool.query('SELECT * FROM taxgpt.engagement_tasks WHERE lead_sheet_id = $1::uuid ORDER BY sort_order ASC, created_at DESC', [leadSheetId])
  ])
  return { accounts: accounts.rows, notes: notes.rows, documents: documents.rows, tasks: tasks.rows }
}

export async function createReviewNoteRecord(pool, payload) {
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.review_notes
     (organization_id, workspace_id, engagement_id, lead_sheet_id, trial_balance_account_id, document_id, note_text, status, priority, created_by, updated_by, assigned_to, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6::uuid, $7, 'open', $8, $9, $9, $10, now(), now())
     RETURNING *`,
    [
      truthyUuid(payload.organizationId),
      truthyUuid(payload.workspaceId),
      truthyUuid(payload.engagementId),
      truthyUuid(payload.leadSheetId),
      truthyUuid(payload.trialBalanceAccountId),
      truthyUuid(payload.documentId),
      payload.noteText,
      payload.priority || 'medium',
      payload.actorId,
      payload.assignedTo || null
    ]
  )
  return rows[0] || null
}

export async function patchReviewNoteStatusRecord(pool, noteId, actorId, status, updates = {}) {
  const { rows: beforeRows } = await pool.query('SELECT * FROM taxgpt.review_notes WHERE id = $1::uuid AND deleted_at IS NULL', [noteId])
  if (!beforeRows[0]) return null
  const { rows } = await pool.query(
    `UPDATE taxgpt.review_notes
     SET status = $1,
         updated_by = $2,
         assigned_to = COALESCE($3, assigned_to),
         resolved_by = CASE WHEN $1 IN ('cleared', 'addressed') THEN $2 ELSE resolved_by END,
         resolved_at = CASE WHEN $1 IN ('cleared', 'addressed') THEN now() ELSE resolved_at END,
         updated_at = now()
     WHERE id = $4::uuid
     RETURNING *`,
    [status, actorId, updates.assignedTo || null, noteId]
  )
  return { before: beforeRows[0], current: rows[0] || null }
}

export async function listReviewNotesForEngagement(pool, engagementId, filters = {}) {
  const values = [engagementId]
  const where = ['rn.engagement_id = $1::uuid', 'rn.deleted_at IS NULL']
  if (filters.status) {
    values.push(filters.status)
    where.push(`rn.status = $${values.length}`)
  }
  if (filters.priority) {
    values.push(filters.priority)
    where.push(`rn.priority = $${values.length}`)
  }
  const { rows } = await pool.query(
    `SELECT rn.*
     FROM taxgpt.review_notes rn
     WHERE ${where.join(' AND ')}
     ORDER BY rn.created_at DESC`,
    values
  )
  return rows
}

export async function listAdjustmentEntriesForEngagement(pool, engagementId) {
  const { rows } = await pool.query(
    `SELECT ae.*,
            count(ael.id)::int AS line_count
     FROM taxgpt.adjustment_entries ae
     LEFT JOIN taxgpt.adjustment_entry_lines ael ON ael.adjustment_entry_id = ae.id
     WHERE ae.engagement_id = $1::uuid
     GROUP BY ae.id
     ORDER BY ae.created_at DESC`,
    [engagementId]
  )
  return rows
}

export async function createAdjustmentEntryRecord(pool, payload) {
  const { rows: engagementRows } = await pool.query(
    'SELECT organization_id, workspace_id FROM taxgpt.accounting_engagements WHERE id = $1::uuid LIMIT 1',
    [payload.engagementId]
  )
  const engagement = engagementRows[0] || {}
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.adjustment_entries
     (engagement_id, entry_number, description, status, source, created_by, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, $4, $5, $6, now(), now())
     RETURNING *`,
    [
      payload.engagementId,
      payload.entryNumber,
      payload.description,
      payload.status || 'draft',
      payload.source || 'manual',
      payload.actorId
    ]
  )
  const legacy = rows[0] || null
  if (!legacy) return null
  await pool.query(
    `INSERT INTO taxgpt.adjustments
     (organization_id, workspace_id, engagement_id, legacy_adjustment_entry_id, adjustment_number, description, status, source, created_by, updated_by, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, $9, $9, now(), now())
     ON CONFLICT (legacy_adjustment_entry_id)
     DO UPDATE SET
       adjustment_number = EXCLUDED.adjustment_number,
       description = EXCLUDED.description,
       status = EXCLUDED.status,
       source = EXCLUDED.source,
       updated_by = EXCLUDED.updated_by,
       updated_at = now()`,
    [
      truthyUuid(engagement.organization_id),
      truthyUuid(engagement.workspace_id),
      payload.engagementId,
      legacy.id,
      legacy.entry_number,
      legacy.description,
      legacy.status,
      legacy.source,
      payload.actorId
    ]
  )
  return legacy
}

export async function replaceAdjustmentLines(pool, adjustmentEntryId, lines = []) {
  await pool.query('DELETE FROM taxgpt.adjustment_entry_lines WHERE adjustment_entry_id = $1::uuid', [adjustmentEntryId])
  for (const line of lines) {
    await pool.query(
      `INSERT INTO taxgpt.adjustment_entry_lines
       (adjustment_entry_id, account_number, account_name, debit_amount, credit_amount, memo, created_at, updated_at)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, now(), now())`,
      [adjustmentEntryId, line.accountNumber || null, line.accountName, line.debitAmount || 0, line.creditAmount || 0, line.memo || null]
    )
  }
}

export async function updateAdjustmentStatusRecord(pool, adjustmentEntryId, actorId, status) {
  const { rows: beforeRows } = await pool.query('SELECT * FROM taxgpt.adjustment_entries WHERE id = $1::uuid', [adjustmentEntryId])
  if (!beforeRows[0]) return null
  const { rows } = await pool.query(
    `UPDATE taxgpt.adjustment_entries
     SET status = $1,
         approved_by = CASE WHEN $1 = 'approved' THEN $2 ELSE approved_by END,
         posted_at = CASE WHEN $1 = 'posted' THEN now() ELSE posted_at END,
         updated_at = now()
     WHERE id = $3::uuid
     RETURNING *`,
    [status, actorId, adjustmentEntryId]
  )
  const entry = rows[0] || null
  if (entry) {
    await pool.query(
      `UPDATE taxgpt.adjustments
       SET status = $1,
           approved_by = CASE WHEN $1 = 'approved' THEN $2 ELSE approved_by END,
           posted_at = CASE WHEN $1 = 'posted' THEN now() ELSE posted_at END,
           updated_by = $2,
           updated_at = now()
       WHERE legacy_adjustment_entry_id = $3::uuid`,
      [status, actorId, adjustmentEntryId]
    )
  }
  return { before: beforeRows[0], current: entry }
}

