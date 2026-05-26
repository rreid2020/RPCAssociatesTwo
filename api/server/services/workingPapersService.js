import { encryptSecret } from './tokenEncryption.js'

const ENGAGEMENT_TYPES = new Set([
  'month_end_close',
  'year_end_working_papers',
  'compilation_support',
  'review_support',
  'tax_support',
  'custom'
])

const ENGAGEMENT_STATUSES = new Set(['draft', 'active', 'in_review', 'completed', 'archived'])
const REVIEW_FLOW_STATUSES = new Set(['not_started', 'preparer_in_progress', 'reviewer_in_progress', 'review_notes_open', 'approved'])
const REVIEW_FLOW_TRANSITIONS = {
  not_started: new Set(['preparer_in_progress']),
  preparer_in_progress: new Set(['reviewer_in_progress', 'review_notes_open']),
  reviewer_in_progress: new Set(['review_notes_open', 'approved']),
  review_notes_open: new Set(['preparer_in_progress', 'reviewer_in_progress', 'approved']),
  approved: new Set(['review_notes_open'])
}
const SOURCE_TYPES = new Set(['qbo', 'excel', 'csv', 'google_sheets', 'manual'])
const REVIEW_NOTE_STATUSES = new Set(['open', 'addressed', 'cleared', 'reopened'])
const REVIEW_NOTE_PRIORITIES = new Set(['low', 'medium', 'high'])
const LEAD_SHEET_STATUSES = new Set(['not_started', 'in_progress', 'prepared', 'in_review', 'reviewed', 'cleared'])
const LEAD_SHEET_RISK_LEVELS = new Set(['low', 'medium', 'high'])
const TASK_STATUSES = new Set(['not_started', 'in_progress', 'blocked', 'completed', 'reviewed'])
const ADJUSTMENT_STATUSES = new Set(['draft', 'proposed', 'approved', 'posted', 'rejected'])
const ADJUSTMENT_SOURCES = new Set(['manual', 'ai_suggested', 'import', 'qbo'])
const CONNECTION_STATUSES = new Set(['connected', 'disconnected', 'expired', 'error', 'pending'])

const PROVIDER_TO_SOURCE = {
  quickbooks_online: 'qbo',
  google_sheets: 'google_sheets',
  excel_upload: 'excel',
  csv_upload: 'csv',
  manual: 'manual'
}

const LEAD_SHEET_SECTIONS = [
  { code: 'A', name: 'Cash', area: 'cash' },
  { code: 'B', name: 'Accounts Receivable', area: 'accounts_receivable' },
  { code: 'C', name: 'Inventory', area: 'inventory' },
  { code: 'D', name: 'Prepaids', area: 'prepaid_expenses' },
  { code: 'E', name: 'Fixed Assets', area: 'fixed_assets' },
  { code: 'F', name: 'Accounts Payable', area: 'accounts_payable' },
  { code: 'G', name: 'Accruals', area: 'accrued_liabilities' },
  { code: 'H', name: 'Debt', area: 'debt' },
  { code: 'I', name: 'Equity', area: 'equity' },
  { code: 'J', name: 'Revenue', area: 'revenue' },
  { code: 'K', name: 'Cost of Sales', area: 'cost_of_sales' },
  { code: 'L', name: 'Operating Expenses', area: 'operating_expenses' },
  { code: 'M', name: 'Taxes', area: 'taxes' },
  { code: 'Z', name: 'Other', area: 'other' }
]

function assertAllowed (value, allowed, field) {
  if (!allowed.has(value)) throw new Error(`Invalid ${field}`)
}

function toNumber (value) {
  if (value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function normalizeDeliverables (value) {
  if (!Array.isArray(value)) return []
  const cleaned = value
    .map((entry) => String(entry || '').trim())
    .filter(Boolean)
    .slice(0, 50)
  return [...new Set(cleaned)]
}

function assertReviewFlowTransition (fromStatus, toStatus) {
  const from = String(fromStatus || 'not_started').trim().toLowerCase()
  const to = String(toStatus || 'not_started').trim().toLowerCase()
  if (from === to) return
  const allowed = REVIEW_FLOW_TRANSITIONS[from]
  if (!allowed || !allowed.has(to)) {
    throw new Error(`Invalid review flow transition: ${from} -> ${to}`)
  }
}

function deriveEngagementStatusFromReviewFlow (currentStatus, reviewFlowStatus) {
  const current = String(currentStatus || 'draft').trim().toLowerCase()
  const flow = String(reviewFlowStatus || 'not_started').trim().toLowerCase()
  if (current === 'archived') return 'archived'
  if (flow === 'approved') return 'completed'
  if (flow === 'reviewer_in_progress' || flow === 'review_notes_open') return 'in_review'
  if (flow === 'preparer_in_progress') return current === 'draft' ? 'active' : current
  return current
}

function getNextReviewFlowStatuses (reviewFlowStatus) {
  const current = String(reviewFlowStatus || 'not_started').trim().toLowerCase()
  const allowed = REVIEW_FLOW_TRANSITIONS[current]
  if (!allowed) return []
  return Array.from(allowed)
}

function getNextReviewFlowStatusesForEngagement (reviewFlowStatus, openReviewNoteCount = 0, unreviewedLeadSheetCount = 0) {
  const nextStatuses = getNextReviewFlowStatuses(reviewFlowStatus)
  const openNotes = Number(openReviewNoteCount || 0)
  const unreviewedSheets = Number(unreviewedLeadSheetCount || 0)
  if (openNotes > 0 || unreviewedSheets > 0) {
    return nextStatuses.filter((status) => status !== 'approved')
  }
  return nextStatuses
}

async function applyEngagementWorkflowSignal (pool, engagementId, reviewFlowStatus) {
  if (!engagementId || !reviewFlowStatus) return
  const nextFlow = String(reviewFlowStatus).trim().toLowerCase()
  if (!REVIEW_FLOW_STATUSES.has(nextFlow)) return
  const { rows: engagementRows } = await pool.query(
    `SELECT id, status, review_flow_status
     FROM taxgpt.accounting_engagements
     WHERE id = $1::uuid`,
    [engagementId]
  )
  const engagement = engagementRows[0]
  if (!engagement || engagement.status === 'archived') return
  const nextStatus = deriveEngagementStatusFromReviewFlow(engagement.status, nextFlow)
  await pool.query(
    `UPDATE taxgpt.accounting_engagements
     SET review_flow_status = $1,
         status = $2,
         updated_at = now()
     WHERE id = $3::uuid`,
    [nextFlow, nextStatus, engagementId]
  )
}

async function assertAssignableWorkspaceMember (pool, workspaceId, clerkUserId, fieldName) {
  if (!workspaceId || !clerkUserId) return
  const { rows } = await pool.query(
    `SELECT id
     FROM taxgpt.accounting_workspace_members
     WHERE workspace_id = $1::uuid
       AND clerk_user_id = $2
       AND status = 'active'
     LIMIT 1`,
    [workspaceId, clerkUserId]
  )
  if (!rows[0]) {
    throw new Error(`${fieldName} must be an active workspace member`)
  }
}

export function sanitizeFileName (name) {
  const str = String(name || '').replace(/[\u0000-\u001f]/g, '').trim()
  return str.slice(0, 255)
}

export function isReviewerRole (role) {
  return role === 'owner' || role === 'admin' || role === 'manager' || role === 'reviewer'
}

export function calculateVarianceMetrics (currentRaw, priorRaw, materialityAmount = null, thresholdPercent = 20) {
  const current = toNumber(currentRaw) || 0
  const prior = toNumber(priorRaw)
  const priorBase = prior == null ? 0 : prior
  const varianceAmount = current - priorBase
  let variancePercent = null
  let varianceLabel = null

  if (prior != null && Math.abs(prior) > 0) {
    variancePercent = varianceAmount / Math.abs(prior)
  } else if ((prior == null || Math.abs(prior) === 0) && Math.abs(current) > 0) {
    varianceLabel = 'New balance'
  } else if (prior != null && Math.abs(current) === 0 && Math.abs(prior) > 0) {
    varianceLabel = 'Cleared balance'
  }

  const materiality = toNumber(materialityAmount)
  const isMaterial = materiality != null
    ? Math.abs(current) >= materiality || Math.abs(varianceAmount) >= materiality
    : false
  const unusual = (variancePercent != null && Math.abs(variancePercent) * 100 >= thresholdPercent) ||
    varianceLabel != null

  return {
    varianceAmount,
    variancePercent,
    varianceLabel,
    isMaterial,
    isUnusual: unusual
  }
}

export async function logAccountingAudit (pool, clerkUserId, actorId, entityType, entityId, action, beforeValue = null, afterValue = null) {
  await pool.query(
    `INSERT INTO taxgpt.accounting_audit_log
     (clerk_user_id, entity_type, entity_id, action, actor_id, before_value, after_value, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
    [clerkUserId, entityType, String(entityId), action, actorId, beforeValue, afterValue]
  )
}

export async function ensureStandardMappingGroups (pool, clerkUserId) {
  const groups = [
    ['A', 'Cash', 'cash'],
    ['B', 'Accounts Receivable', 'accounts_receivable'],
    ['C', 'Inventory', 'inventory'],
    ['D', 'Prepaid Expenses', 'prepaid_expenses'],
    ['E', 'Fixed Assets', 'fixed_assets'],
    ['F', 'Accounts Payable', 'accounts_payable'],
    ['G', 'Accrued Liabilities', 'accrued_liabilities'],
    ['H', 'Debt', 'debt'],
    ['I', 'Equity', 'equity'],
    ['J', 'Revenue', 'revenue'],
    ['K', 'Cost of Sales', 'cost_of_sales'],
    ['L', 'Operating Expenses', 'operating_expenses'],
    ['M', 'Taxes', 'taxes'],
    ['Z', 'Other', 'other']
  ]
  for (let i = 0; i < groups.length; i++) {
    const [code, name, area] = groups[i]
    await pool.query(
      `INSERT INTO taxgpt.account_mapping_groups
       (clerk_user_id, code, name, financial_statement_area, default_lead_sheet_section, sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $2, $5, now(), now())
       ON CONFLICT (clerk_user_id, code) DO UPDATE
       SET name = EXCLUDED.name,
           financial_statement_area = EXCLUDED.financial_statement_area,
           default_lead_sheet_section = EXCLUDED.default_lead_sheet_section,
           sort_order = EXCLUDED.sort_order,
           updated_at = now()`,
      [clerkUserId, code, name, area, i]
    )
  }
}

export async function listClients (pool, clerkUserId) {
  const { rows } = await pool.query(
    `SELECT * FROM taxgpt.accounting_clients
     WHERE clerk_user_id = $1
     ORDER BY lower(name) ASC, created_at DESC`,
    [clerkUserId]
  )
  return rows
}

export async function createClient (pool, clerkUserId, actorId, payload) {
  const name = String(payload.name || '').trim()
  if (!name) throw new Error('Client name is required')
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.accounting_clients
     (clerk_user_id, name, legal_name, business_number, fiscal_year_end_month, fiscal_year_end_day, default_currency, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
     RETURNING *`,
    [
      clerkUserId,
      name,
      payload.legalName || null,
      payload.businessNumber || null,
      payload.fiscalYearEndMonth || null,
      payload.fiscalYearEndDay || null,
      payload.defaultCurrency || 'CAD',
      actorId
    ]
  )
  await logAccountingAudit(pool, clerkUserId, actorId, 'client', rows[0].id, 'created', null, rows[0])
  return rows[0]
}

export async function updateClient (pool, clerkUserId, actorId, clientId, payload) {
  const { rows: beforeRows } = await pool.query(
    'SELECT * FROM taxgpt.accounting_clients WHERE id = $1::uuid AND clerk_user_id = $2',
    [clientId, clerkUserId]
  )
  if (!beforeRows[0]) return null
  const before = beforeRows[0]
  const { rows } = await pool.query(
    `UPDATE taxgpt.accounting_clients
     SET name = $1, legal_name = $2, business_number = $3, fiscal_year_end_month = $4, fiscal_year_end_day = $5, default_currency = $6, updated_at = now()
     WHERE id = $7::uuid AND clerk_user_id = $8
     RETURNING *`,
    [
      payload.name || before.name,
      payload.legalName ?? before.legal_name,
      payload.businessNumber ?? before.business_number,
      payload.fiscalYearEndMonth ?? before.fiscal_year_end_month,
      payload.fiscalYearEndDay ?? before.fiscal_year_end_day,
      payload.defaultCurrency || before.default_currency,
      clientId,
      clerkUserId
    ]
  )
  await logAccountingAudit(pool, clerkUserId, actorId, 'client', clientId, 'updated', before, rows[0])
  return rows[0]
}

export async function getClientDetails (pool, clerkUserId, clientId) {
  const { rows } = await pool.query(
    'SELECT * FROM taxgpt.accounting_clients WHERE id = $1::uuid AND clerk_user_id = $2',
    [clientId, clerkUserId]
  )
  return rows[0] || null
}

export async function listEngagements (pool, clerkUserId, query = {}) {
  const where = ['e.clerk_user_id = $1']
  const values = [clerkUserId]

  if (query.status) {
    values.push(query.status)
    where.push(`e.status = $${values.length}`)
  }
  if (query.clientId) {
    values.push(query.clientId)
    where.push(`e.client_id = $${values.length}::uuid`)
  }
  if (query.engagementType) {
    values.push(query.engagementType)
    where.push(`e.engagement_type = $${values.length}`)
  }
  if (query.reviewFlowStatus) {
    values.push(query.reviewFlowStatus)
    where.push(`e.review_flow_status = $${values.length}`)
  }
  if (query.search) {
    values.push(`%${String(query.search).trim().toLowerCase()}%`)
    where.push(`(lower(e.name) LIKE $${values.length} OR lower(c.name) LIKE $${values.length})`)
  }
  if (query.workspaceId) {
    values.push(query.workspaceId)
    where.push(`e.workspace_id = $${values.length}::uuid`)
  }

  const { rows } = await pool.query(
    `SELECT
       e.*,
       c.name AS client_name,
       (
         SELECT count(*)::int
         FROM taxgpt.review_notes rn
         WHERE rn.engagement_id = e.id
           AND rn.status IN ('open', 'reopened')
       ) AS open_review_note_count,
       (
         SELECT count(*)::int
         FROM taxgpt.lead_sheets ls
         WHERE ls.engagement_id = e.id
           AND ls.status <> 'reviewed'
       ) AS unreviewed_lead_sheet_count
     FROM taxgpt.accounting_engagements e
     INNER JOIN taxgpt.accounting_clients c ON c.id = e.client_id
     WHERE ${where.join(' AND ')}
     ORDER BY e.period_end DESC, e.updated_at DESC`,
    values
  )
  return rows.map((row) => ({
    ...row,
    next_review_flow_statuses: getNextReviewFlowStatusesForEngagement(
      row.review_flow_status,
      row.open_review_note_count,
      row.unreviewed_lead_sheet_count
    )
  }))
}

export async function createEngagement (pool, clerkUserId, actorId, payload) {
  assertAllowed(payload.engagementType, ENGAGEMENT_TYPES, 'engagement_type')
  const requestedStatus = payload.status || 'draft'
  assertAllowed(requestedStatus, ENGAGEMENT_STATUSES, 'status')
  assertAllowed(payload.sourceType || 'manual', SOURCE_TYPES, 'source_type')
  const name = String(payload.name || '').trim()
  if (!name) throw new Error('Engagement name is required')
  const reviewFlowStatus = String(payload.reviewFlowStatus || 'not_started').trim().toLowerCase()
  assertAllowed(reviewFlowStatus, REVIEW_FLOW_STATUSES, 'review_flow_status')
  const normalizedStatus = deriveEngagementStatusFromReviewFlow(requestedStatus, reviewFlowStatus)
  const deliverables = normalizeDeliverables(payload.deliverables)
  const assignedPreparerId = payload.assignedPreparerId ?? null
  const assignedReviewerId = payload.assignedReviewerId ?? null

  await ensureStandardMappingGroups(pool, clerkUserId)
  await assertAssignableWorkspaceMember(pool, payload.workspaceId || null, assignedPreparerId, 'assignedPreparerId')
  await assertAssignableWorkspaceMember(pool, payload.workspaceId || null, assignedReviewerId, 'assignedReviewerId')

  const { rows } = await pool.query(
    `INSERT INTO taxgpt.accounting_engagements
     (organization_id, workspace_id, clerk_user_id, client_id, name, engagement_type, fiscal_year, period_start, period_end, due_date, status, source_type, review_flow_status, deliverables, materiality_amount, reporting_currency, created_by, assigned_preparer_id, assigned_reviewer_id, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3, $4::uuid, $5, $6, $7, $8, $9, $10::date, $11, $12, $13, $14::jsonb, $15, $16, $17, $18, $19, now(), now())
     RETURNING *`,
    [
      payload.organizationId || null,
      payload.workspaceId || null,
      clerkUserId,
      payload.clientId,
      name,
      payload.engagementType,
      payload.fiscalYear,
      payload.periodStart,
      payload.periodEnd,
      payload.dueDate || null,
      normalizedStatus,
      payload.sourceType || 'manual',
      reviewFlowStatus,
      JSON.stringify(deliverables),
      payload.materialityAmount ?? null,
      payload.reportingCurrency || 'CAD',
      actorId,
      assignedPreparerId,
      assignedReviewerId
    ]
  )
  await logAccountingAudit(pool, clerkUserId, actorId, 'engagement', rows[0].id, 'created', null, rows[0])
  return rows[0]
}

export async function updateEngagement (pool, clerkUserId, actorId, engagementId, payload) {
  const { rows: beforeRows } = await pool.query(
    'SELECT * FROM taxgpt.accounting_engagements WHERE id = $1::uuid AND clerk_user_id = $2',
    [engagementId, clerkUserId]
  )
  if (!beforeRows[0]) return null
  const before = beforeRows[0]
  const requestedStatus = payload.status || before.status
  const sourceType = payload.sourceType || before.source_type
  const reviewFlowStatus = String(payload.reviewFlowStatus || before.review_flow_status || 'not_started').trim().toLowerCase()
  assertAllowed(requestedStatus, ENGAGEMENT_STATUSES, 'status')
  assertAllowed(sourceType, SOURCE_TYPES, 'source_type')
  assertAllowed(reviewFlowStatus, REVIEW_FLOW_STATUSES, 'review_flow_status')
  assertReviewFlowTransition(before.review_flow_status || 'not_started', reviewFlowStatus)
  const status = payload.status ? requestedStatus : deriveEngagementStatusFromReviewFlow(requestedStatus, reviewFlowStatus)
  const deliverables = payload.deliverables == null
    ? (Array.isArray(before.deliverables) ? before.deliverables : [])
    : normalizeDeliverables(payload.deliverables)
  const assignedPreparerId = payload.assignedPreparerId ?? before.assigned_preparer_id ?? null
  const assignedReviewerId = payload.assignedReviewerId ?? before.assigned_reviewer_id ?? null
  await assertAssignableWorkspaceMember(pool, before.workspace_id || null, assignedPreparerId, 'assignedPreparerId')
  await assertAssignableWorkspaceMember(pool, before.workspace_id || null, assignedReviewerId, 'assignedReviewerId')

  const { rows } = await pool.query(
    `UPDATE taxgpt.accounting_engagements
     SET name = $1,
         engagement_type = $2,
         fiscal_year = $3,
         period_start = $4,
         period_end = $5,
        due_date = $6,
        status = $7,
        source_type = $8,
        review_flow_status = $9,
        deliverables = $10::jsonb,
        materiality_amount = $11,
        reporting_currency = $12,
        assigned_preparer_id = $13,
        assigned_reviewer_id = $14,
         updated_at = now()
     WHERE id = $15::uuid AND clerk_user_id = $16
     RETURNING *`,
    [
      payload.name || before.name,
      payload.engagementType || before.engagement_type,
      payload.fiscalYear || before.fiscal_year,
      payload.periodStart || before.period_start,
      payload.periodEnd || before.period_end,
      payload.dueDate ?? before.due_date,
      status,
      sourceType,
      reviewFlowStatus,
      JSON.stringify(deliverables),
      payload.materialityAmount ?? before.materiality_amount,
      payload.reportingCurrency || before.reporting_currency,
      assignedPreparerId,
      assignedReviewerId,
      engagementId,
      clerkUserId
    ]
  )
  await logAccountingAudit(pool, clerkUserId, actorId, 'engagement', engagementId, 'updated', before, rows[0])
  return rows[0]
}

export async function archiveEngagement (pool, clerkUserId, actorId, engagementId) {
  const { rows: beforeRows } = await pool.query(
    'SELECT * FROM taxgpt.accounting_engagements WHERE id = $1::uuid AND clerk_user_id = $2',
    [engagementId, clerkUserId]
  )
  if (!beforeRows[0]) return null
  const { rows } = await pool.query(
    `UPDATE taxgpt.accounting_engagements
     SET status = 'archived', updated_at = now()
     WHERE id = $1::uuid AND clerk_user_id = $2
     RETURNING *`,
    [engagementId, clerkUserId]
  )
  await logAccountingAudit(pool, clerkUserId, actorId, 'engagement', engagementId, 'archived', beforeRows[0], rows[0])
  return rows[0]
}

export async function deleteEngagement (pool, clerkUserId, actorId, engagementId) {
  const { rows: beforeRows } = await pool.query(
    'SELECT * FROM taxgpt.accounting_engagements WHERE id = $1::uuid AND clerk_user_id = $2',
    [engagementId, clerkUserId]
  )
  if (!beforeRows[0]) return false
  await pool.query('DELETE FROM taxgpt.accounting_engagements WHERE id = $1::uuid AND clerk_user_id = $2', [engagementId, clerkUserId])
  await logAccountingAudit(pool, clerkUserId, actorId, 'engagement', engagementId, 'deleted', beforeRows[0], null)
  return true
}

export async function getEngagementDashboard (pool, clerkUserId, engagementId) {
  const { rows: engagementRows } = await pool.query(
    `SELECT e.*, c.name AS client_name
     FROM taxgpt.accounting_engagements e
     INNER JOIN taxgpt.accounting_clients c ON c.id = e.client_id
     WHERE e.id = $1::uuid AND e.clerk_user_id = $2`,
    [engagementId, clerkUserId]
  )
  const engagement = engagementRows[0]
  if (!engagement) return null

  const [{ rows: notes }, { rows: tasks }, { rows: leadSheets }, { rows: trialBalances }] = await Promise.all([
    pool.query('SELECT status, count(*)::int AS c FROM taxgpt.review_notes WHERE engagement_id = $1::uuid GROUP BY status', [engagementId]),
    pool.query('SELECT status, count(*)::int AS c FROM taxgpt.engagement_tasks WHERE engagement_id = $1::uuid GROUP BY status', [engagementId]),
    pool.query('SELECT status, count(*)::int AS c FROM taxgpt.lead_sheets WHERE engagement_id = $1::uuid GROUP BY status', [engagementId]),
    pool.query('SELECT status, count(*)::int AS c FROM taxgpt.trial_balances WHERE engagement_id = $1::uuid GROUP BY status', [engagementId])
  ])
  const [openNoteCount, unreviewedLeadSheetCount] = await Promise.all([
    pool.query(
      `SELECT count(*)::int AS c
       FROM taxgpt.review_notes
       WHERE engagement_id = $1::uuid
         AND status IN ('open', 'reopened')`,
      [engagementId]
    ),
    pool.query(
      `SELECT count(*)::int AS c
       FROM taxgpt.lead_sheets
       WHERE engagement_id = $1::uuid
         AND status <> 'reviewed'`,
      [engagementId]
    )
  ])

  const { rows: materialRows } = await pool.query(
    `SELECT count(*)::int AS c
     FROM taxgpt.trial_balance_accounts tba
     INNER JOIN taxgpt.trial_balances tb ON tb.id = tba.trial_balance_id
     WHERE tb.engagement_id = $1::uuid AND (tba.is_material = true OR tba.is_unusual = true)`,
    [engagementId]
  )

  return {
    engagement,
    nextReviewFlowStatuses: getNextReviewFlowStatuses(engagement.review_flow_status),
    workflowHealth: {
      openReviewNotes: Number(openNoteCount.rows[0]?.c || 0),
      unreviewedLeadSheets: Number(unreviewedLeadSheetCount.rows[0]?.c || 0),
      canApprove: Number(openNoteCount.rows[0]?.c || 0) === 0 && Number(unreviewedLeadSheetCount.rows[0]?.c || 0) === 0
    },
    noteSummary: notes,
    taskSummary: tasks,
    leadSheetSummary: leadSheets,
    trialBalanceSummary: trialBalances,
    materialOrUnusualCount: Number(materialRows[0]?.c || 0)
  }
}

export async function getEngagementStatusSummary (pool, clerkUserId) {
  const { rows } = await pool.query(
    `SELECT status, count(*)::int AS c
     FROM taxgpt.accounting_engagements
     WHERE clerk_user_id = $1
     GROUP BY status`,
    [clerkUserId]
  )
  return rows
}

export async function listTrialBalanceAccounts (pool, clerkUserId, engagementId) {
  const { rows: ownershipRows } = await pool.query(
    'SELECT id FROM taxgpt.accounting_engagements WHERE id = $1::uuid AND clerk_user_id = $2',
    [engagementId, clerkUserId]
  )
  if (!ownershipRows[0]) return null

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

export async function updateTrialBalanceAccountMapping (pool, clerkUserId, actorId, accountId, payload) {
  const { rows: beforeRows } = await pool.query(
    `SELECT tba.*, e.clerk_user_id
     FROM taxgpt.trial_balance_accounts tba
     INNER JOIN taxgpt.trial_balances tb ON tb.id = tba.trial_balance_id
     INNER JOIN taxgpt.accounting_engagements e ON e.id = tb.engagement_id
     WHERE tba.id = $1::uuid`,
    [accountId]
  )
  if (!beforeRows[0] || beforeRows[0].clerk_user_id !== clerkUserId) return null
  const before = beforeRows[0]

  const { rows } = await pool.query(
    `UPDATE taxgpt.trial_balance_accounts
     SET mapped_group_id = $1::uuid,
         lead_sheet_section = $2,
         flags = COALESCE(flags, '{}'::jsonb) || $3::jsonb,
         updated_at = now()
     WHERE id = $4::uuid
     RETURNING *`,
    [payload.mappedGroupId || null, payload.leadSheetSection || null, JSON.stringify(payload.flags || {}), accountId]
  )
  await logAccountingAudit(pool, clerkUserId, actorId, 'trial_balance_account', accountId, 'mapping_updated', before, rows[0])
  return rows[0]
}

export async function calculateTrialBalanceVariances (pool, clerkUserId, actorId, engagementId, thresholdPercent = 20) {
  const { rows: engagementRows } = await pool.query(
    'SELECT id, materiality_amount FROM taxgpt.accounting_engagements WHERE id = $1::uuid AND clerk_user_id = $2',
    [engagementId, clerkUserId]
  )
  if (!engagementRows[0]) return null
  const materiality = engagementRows[0].materiality_amount
  const { rows } = await pool.query(
    `SELECT tba.id, tba.current_period_balance, tba.prior_period_balance
     FROM taxgpt.trial_balance_accounts tba
     INNER JOIN taxgpt.trial_balances tb ON tb.id = tba.trial_balance_id
     WHERE tb.engagement_id = $1::uuid`,
    [engagementId]
  )
  for (const account of rows) {
    const metrics = calculateVarianceMetrics(account.current_period_balance, account.prior_period_balance, materiality, thresholdPercent)
    await pool.query(
      `UPDATE taxgpt.trial_balance_accounts
       SET variance_amount = $1,
           variance_percent = $2,
           variance_label = $3,
           is_material = $4,
           is_unusual = $5,
           updated_at = now()
       WHERE id = $6::uuid`,
      [metrics.varianceAmount, metrics.variancePercent, metrics.varianceLabel, metrics.isMaterial, metrics.isUnusual, account.id]
    )
  }
  await logAccountingAudit(pool, clerkUserId, actorId, 'engagement', engagementId, 'variances_recalculated', null, { thresholdPercent })
  return { updatedCount: rows.length }
}

export async function generateLeadSheets (pool, clerkUserId, actorId, engagementId) {
  const { rows: engagementRows } = await pool.query(
    'SELECT id FROM taxgpt.accounting_engagements WHERE id = $1::uuid AND clerk_user_id = $2',
    [engagementId, clerkUserId]
  )
  if (!engagementRows[0]) return null

  const { rows: groups } = await pool.query(
    'SELECT * FROM taxgpt.account_mapping_groups WHERE clerk_user_id = $1 ORDER BY sort_order ASC',
    [clerkUserId]
  )
  const groupsById = new Map(groups.map((g) => [g.id, g]))

  const { rows: accounts } = await pool.query(
    `SELECT tba.*
     FROM taxgpt.trial_balance_accounts tba
     INNER JOIN taxgpt.trial_balances tb ON tb.id = tba.trial_balance_id
     WHERE tb.engagement_id = $1::uuid`,
    [engagementId]
  )

  const grouped = new Map()
  for (const account of accounts) {
    const group = account.mapped_group_id ? groupsById.get(account.mapped_group_id) : null
    const sectionCode = group?.default_lead_sheet_section || 'Z'
    if (!grouped.has(sectionCode)) grouped.set(sectionCode, [])
    grouped.get(sectionCode).push(account)
  }

  const createdOrUpdated = []
  for (const section of LEAD_SHEET_SECTIONS) {
    const rowsForSection = grouped.get(section.code) || []
    if (!rowsForSection.length) continue
    const { rows: upserted } = await pool.query(
      `INSERT INTO taxgpt.lead_sheets
       (engagement_id, section_code, section_name, financial_statement_area, status, risk_level, created_at, updated_at)
       VALUES ($1::uuid, $2, $3, $4, 'not_started', 'medium', now(), now())
       ON CONFLICT (engagement_id, section_code)
       DO UPDATE SET section_name = EXCLUDED.section_name, financial_statement_area = EXCLUDED.financial_statement_area, updated_at = now()
       RETURNING *`,
      [engagementId, section.code, section.name, section.area]
    )
    const leadSheet = upserted[0]
    await pool.query('DELETE FROM taxgpt.lead_sheet_accounts WHERE lead_sheet_id = $1::uuid', [leadSheet.id])
    for (let i = 0; i < rowsForSection.length; i++) {
      await pool.query(
        `INSERT INTO taxgpt.lead_sheet_accounts
         (lead_sheet_id, trial_balance_account_id, sort_order, created_at, updated_at)
         VALUES ($1::uuid, $2::uuid, $3, now(), now())`,
        [leadSheet.id, rowsForSection[i].id, i]
      )
    }
    createdOrUpdated.push(leadSheet)
  }

  await logAccountingAudit(pool, clerkUserId, actorId, 'engagement', engagementId, 'lead_sheets_generated', null, { count: createdOrUpdated.length })
  return createdOrUpdated
}

export async function listLeadSheets (pool, clerkUserId, engagementId) {
  const { rows } = await pool.query(
    `SELECT ls.*, 
            count(distinct lsa.id)::int AS account_count,
            count(distinct rn.id)::int AS open_note_count,
            count(distinct wpd.id)::int AS document_count
     FROM taxgpt.lead_sheets ls
     INNER JOIN taxgpt.accounting_engagements e ON e.id = ls.engagement_id
     LEFT JOIN taxgpt.lead_sheet_accounts lsa ON lsa.lead_sheet_id = ls.id
     LEFT JOIN taxgpt.review_notes rn ON rn.lead_sheet_id = ls.id AND rn.status IN ('open', 'reopened')
     LEFT JOIN taxgpt.working_paper_documents wpd ON wpd.lead_sheet_id = ls.id
     WHERE ls.engagement_id = $1::uuid AND e.clerk_user_id = $2
     GROUP BY ls.id
     ORDER BY ls.section_code ASC`,
    [engagementId, clerkUserId]
  )
  return rows
}

export async function getLeadSheetDetail (pool, clerkUserId, engagementId, leadSheetId) {
  const { rows: leadSheetRows } = await pool.query(
    `SELECT ls.*
     FROM taxgpt.lead_sheets ls
     INNER JOIN taxgpt.accounting_engagements e ON e.id = ls.engagement_id
     WHERE ls.id = $1::uuid AND ls.engagement_id = $2::uuid AND e.clerk_user_id = $3`,
    [leadSheetId, engagementId, clerkUserId]
  )
  if (!leadSheetRows[0]) return null
  const leadSheet = leadSheetRows[0]
  const [accounts, notes, documents, tasks] = await Promise.all([
    pool.query(
      `SELECT tba.*
       FROM taxgpt.lead_sheet_accounts lsa
       INNER JOIN taxgpt.trial_balance_accounts tba ON tba.id = lsa.trial_balance_account_id
       WHERE lsa.lead_sheet_id = $1::uuid
       ORDER BY lsa.sort_order ASC`,
      [leadSheetId]
    ),
    pool.query('SELECT * FROM taxgpt.review_notes WHERE lead_sheet_id = $1::uuid ORDER BY created_at DESC', [leadSheetId]),
    pool.query('SELECT * FROM taxgpt.working_paper_documents WHERE lead_sheet_id = $1::uuid ORDER BY uploaded_at DESC', [leadSheetId]),
    pool.query('SELECT * FROM taxgpt.engagement_tasks WHERE lead_sheet_id = $1::uuid ORDER BY sort_order ASC, created_at DESC', [leadSheetId])
  ])
  return { leadSheet, accounts: accounts.rows, notes: notes.rows, documents: documents.rows, tasks: tasks.rows }
}

export async function updateLeadSheetConclusion (pool, clerkUserId, actorId, leadSheetId, conclusionText) {
  const { rows: beforeRows } = await pool.query(
    `SELECT ls.*, e.clerk_user_id
     FROM taxgpt.lead_sheets ls
     INNER JOIN taxgpt.accounting_engagements e ON e.id = ls.engagement_id
     WHERE ls.id = $1::uuid`,
    [leadSheetId]
  )
  if (!beforeRows[0] || beforeRows[0].clerk_user_id !== clerkUserId) return null
  const before = beforeRows[0]
  const { rows } = await pool.query(
    `UPDATE taxgpt.lead_sheets
     SET conclusion_text = $1, updated_at = now()
     WHERE id = $2::uuid
     RETURNING *`,
    [conclusionText || null, leadSheetId]
  )
  await logAccountingAudit(pool, clerkUserId, actorId, 'lead_sheet', leadSheetId, 'conclusion_updated', before, rows[0])
  return rows[0]
}

export async function updateLeadSheetStatus (pool, clerkUserId, actorId, leadSheetId, status) {
  assertAllowed(status, LEAD_SHEET_STATUSES, 'lead sheet status')
  const { rows: beforeRows } = await pool.query(
    `SELECT ls.*, e.clerk_user_id
     FROM taxgpt.lead_sheets ls
     INNER JOIN taxgpt.accounting_engagements e ON e.id = ls.engagement_id
     WHERE ls.id = $1::uuid`,
    [leadSheetId]
  )
  if (!beforeRows[0] || beforeRows[0].clerk_user_id !== clerkUserId) return null
  const before = beforeRows[0]
  const { rows } = await pool.query(
    `UPDATE taxgpt.lead_sheets
     SET status = $1, updated_at = now()
     WHERE id = $2::uuid
     RETURNING *`,
    [status, leadSheetId]
  )
  await logAccountingAudit(pool, clerkUserId, actorId, 'lead_sheet', leadSheetId, 'status_updated', before, rows[0])
  return rows[0]
}

export async function preparerSignoff (pool, clerkUserId, actorId, leadSheetId) {
  const { rows: beforeRows } = await pool.query(
    `SELECT ls.*, e.clerk_user_id
     FROM taxgpt.lead_sheets ls
     INNER JOIN taxgpt.accounting_engagements e ON e.id = ls.engagement_id
     WHERE ls.id = $1::uuid`,
    [leadSheetId]
  )
  if (!beforeRows[0] || beforeRows[0].clerk_user_id !== clerkUserId) return null
  const { rows } = await pool.query(
    `UPDATE taxgpt.lead_sheets
     SET preparer_id = $1, prepared_at = now(), status = CASE WHEN status = 'not_started' THEN 'prepared' ELSE status END, updated_at = now()
     WHERE id = $2::uuid
     RETURNING *`,
    [actorId, leadSheetId]
  )
  await applyEngagementWorkflowSignal(pool, beforeRows[0].engagement_id, 'reviewer_in_progress')
  await logAccountingAudit(pool, clerkUserId, actorId, 'lead_sheet', leadSheetId, 'preparer_signoff', beforeRows[0], rows[0])
  return rows[0]
}

export async function reviewerSignoff (pool, clerkUserId, actorId, leadSheetId, canOverride = false) {
  const { rows: beforeRows } = await pool.query(
    `SELECT ls.*, e.clerk_user_id
     FROM taxgpt.lead_sheets ls
     INNER JOIN taxgpt.accounting_engagements e ON e.id = ls.engagement_id
     WHERE ls.id = $1::uuid`,
    [leadSheetId]
  )
  if (!beforeRows[0] || beforeRows[0].clerk_user_id !== clerkUserId) return null
  if (!beforeRows[0].preparer_id && !canOverride) {
    throw new Error('Preparer signoff is required before reviewer signoff')
  }
  const { rows } = await pool.query(
    `UPDATE taxgpt.lead_sheets
     SET reviewer_id = $1, reviewed_at = now(), status = 'reviewed', updated_at = now()
     WHERE id = $2::uuid
     RETURNING *`,
    [actorId, leadSheetId]
  )
  const engagementId = beforeRows[0].engagement_id
  const [{ rows: openNoteRows }, { rows: unreviewedRows }] = await Promise.all([
    pool.query(
      `SELECT count(*)::int AS c
       FROM taxgpt.review_notes
       WHERE engagement_id = $1::uuid
         AND status IN ('open', 'reopened')`,
      [engagementId]
    ),
    pool.query(
      `SELECT count(*)::int AS c
       FROM taxgpt.lead_sheets
       WHERE engagement_id = $1::uuid
         AND status <> 'reviewed'`,
      [engagementId]
    )
  ])
  const hasOpenNotes = Number(openNoteRows[0]?.c || 0) > 0
  const hasUnreviewedLeadSheets = Number(unreviewedRows[0]?.c || 0) > 0
  const nextFlow = hasOpenNotes ? 'review_notes_open' : (hasUnreviewedLeadSheets ? 'reviewer_in_progress' : 'approved')
  await applyEngagementWorkflowSignal(pool, engagementId, nextFlow)
  await logAccountingAudit(pool, clerkUserId, actorId, 'lead_sheet', leadSheetId, 'reviewer_signoff', beforeRows[0], rows[0])
  return rows[0]
}

export async function deleteLeadSheet (pool, clerkUserId, actorId, leadSheetId) {
  const { rows: beforeRows } = await pool.query(
    `SELECT ls.*, e.clerk_user_id
     FROM taxgpt.lead_sheets ls
     INNER JOIN taxgpt.accounting_engagements e ON e.id = ls.engagement_id
     WHERE ls.id = $1::uuid`,
    [leadSheetId]
  )
  if (!beforeRows[0] || beforeRows[0].clerk_user_id !== clerkUserId) return false
  await pool.query('DELETE FROM taxgpt.lead_sheets WHERE id = $1::uuid', [leadSheetId])
  await logAccountingAudit(pool, clerkUserId, actorId, 'lead_sheet', leadSheetId, 'deleted', beforeRows[0], null)
  return true
}

export async function listDocumentsByEngagement (pool, clerkUserId, engagementId, leadSheetId = null) {
  const values = [engagementId, clerkUserId]
  let leadFilter = ''
  if (leadSheetId) {
    values.push(leadSheetId)
    leadFilter = `AND d.lead_sheet_id = $${values.length}::uuid`
  }
  const { rows } = await pool.query(
    `SELECT d.*, p.file_name AS existing_repository_name
     FROM taxgpt.working_paper_documents d
     INNER JOIN taxgpt.accounting_engagements e ON e.id = d.engagement_id
     LEFT JOIN taxgpt.portal_client_files p ON p.id = d.existing_document_id
     WHERE d.engagement_id = $1::uuid AND e.clerk_user_id = $2 ${leadFilter}
     ORDER BY d.uploaded_at DESC`,
    values
  )
  return rows
}

export async function attachExistingDocument (pool, clerkUserId, actorId, payload) {
  const { rows: files } = await pool.query(
    'SELECT * FROM taxgpt.portal_client_files WHERE id = $1::uuid AND clerk_user_id = $2',
    [payload.existingDocumentId, clerkUserId]
  )
  if (!files[0]) throw new Error('Existing document not found')

  const sanitizedName = sanitizeFileName(payload.fileName || files[0].file_name)
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.working_paper_documents
     (engagement_id, lead_sheet_id, existing_document_id, file_name, file_type, storage_path, source, description, uploaded_by, uploaded_at, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, 'linked_existing_document', $7, $8, now(), now(), now())
     RETURNING *`,
    [
      payload.engagementId,
      payload.leadSheetId || null,
      payload.existingDocumentId,
      sanitizedName || files[0].file_name,
      files[0].mime || null,
      files[0].storage_key || null,
      payload.description || null,
      actorId
    ]
  )
  await logAccountingAudit(pool, clerkUserId, actorId, 'working_paper_document', rows[0].id, 'attached_existing_document', null, rows[0])
  return rows[0]
}

export async function detachDocument (pool, clerkUserId, actorId, documentId) {
  const { rows: beforeRows } = await pool.query(
    `SELECT d.*, e.clerk_user_id
     FROM taxgpt.working_paper_documents d
     INNER JOIN taxgpt.accounting_engagements e ON e.id = d.engagement_id
     WHERE d.id = $1::uuid`,
    [documentId]
  )
  if (!beforeRows[0] || beforeRows[0].clerk_user_id !== clerkUserId) return false
  await pool.query('DELETE FROM taxgpt.working_paper_documents WHERE id = $1::uuid', [documentId])
  await logAccountingAudit(pool, clerkUserId, actorId, 'working_paper_document', documentId, 'detached', beforeRows[0], null)
  return true
}

export async function createReviewNote (pool, clerkUserId, actorId, payload) {
  assertAllowed(payload.priority || 'medium', REVIEW_NOTE_PRIORITIES, 'note priority')
  const text = String(payload.noteText || '').trim()
  if (!text) throw new Error('noteText is required')
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.review_notes
     (engagement_id, lead_sheet_id, trial_balance_account_id, document_id, note_text, status, priority, created_by, assigned_to, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, 'open', $6, $7, $8, now(), now())
     RETURNING *`,
    [
      payload.engagementId,
      payload.leadSheetId || null,
      payload.trialBalanceAccountId || null,
      payload.documentId || null,
      text,
      payload.priority || 'medium',
      actorId,
      payload.assignedTo || null
    ]
  )
  await applyEngagementWorkflowSignal(pool, rows[0].engagement_id, 'review_notes_open')
  await logAccountingAudit(pool, clerkUserId, actorId, 'review_note', rows[0].id, 'created', null, rows[0])
  return rows[0]
}

export async function updateReviewNoteStatus (pool, clerkUserId, actorId, noteId, status, updates = {}) {
  assertAllowed(status, REVIEW_NOTE_STATUSES, 'review note status')
  const { rows: beforeRows } = await pool.query(
    `SELECT rn.*, e.clerk_user_id
     FROM taxgpt.review_notes rn
     INNER JOIN taxgpt.accounting_engagements e ON e.id = rn.engagement_id
     WHERE rn.id = $1::uuid`,
    [noteId]
  )
  if (!beforeRows[0] || beforeRows[0].clerk_user_id !== clerkUserId) return null
  const { rows } = await pool.query(
    `UPDATE taxgpt.review_notes
     SET status = $1,
         assigned_to = COALESCE($2, assigned_to),
         resolved_by = CASE WHEN $1 IN ('cleared', 'addressed') THEN $3 ELSE resolved_by END,
         resolved_at = CASE WHEN $1 IN ('cleared', 'addressed') THEN now() ELSE resolved_at END,
         updated_at = now()
     WHERE id = $4::uuid
     RETURNING *`,
    [status, updates.assignedTo || null, actorId, noteId]
  )
  const engagementId = beforeRows[0].engagement_id
  const { rows: openNoteRows } = await pool.query(
    `SELECT count(*)::int AS c
     FROM taxgpt.review_notes
     WHERE engagement_id = $1::uuid
       AND status IN ('open', 'reopened')`,
    [engagementId]
  )
  const hasOpenNotes = Number(openNoteRows[0]?.c || 0) > 0
  await applyEngagementWorkflowSignal(pool, engagementId, hasOpenNotes ? 'review_notes_open' : 'reviewer_in_progress')
  await logAccountingAudit(pool, clerkUserId, actorId, 'review_note', noteId, `status_${status}`, beforeRows[0], rows[0])
  return rows[0]
}

export async function listReviewNotes (pool, clerkUserId, engagementId, filters = {}) {
  const values = [engagementId, clerkUserId]
  const where = ['rn.engagement_id = $1::uuid', 'e.clerk_user_id = $2']
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
     INNER JOIN taxgpt.accounting_engagements e ON e.id = rn.engagement_id
     WHERE ${where.join(' AND ')}
     ORDER BY rn.created_at DESC`,
    values
  )
  return rows
}

export async function createTask (pool, clerkUserId, actorId, payload) {
  assertAllowed(payload.status || 'not_started', TASK_STATUSES, 'task status')
  const title = String(payload.title || '').trim()
  if (!title) throw new Error('Task title is required')
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.engagement_tasks
     (engagement_id, lead_sheet_id, title, description, status, assigned_to, due_date, sort_order, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, now(), now())
     RETURNING *`,
    [
      payload.engagementId,
      payload.leadSheetId || null,
      title,
      payload.description || null,
      payload.status || 'not_started',
      payload.assignedTo || null,
      payload.dueDate || null,
      payload.sortOrder || 0
    ]
  )
  await logAccountingAudit(pool, clerkUserId, actorId, 'task', rows[0].id, 'created', null, rows[0])
  return rows[0]
}

export async function updateTask (pool, clerkUserId, actorId, taskId, payload) {
  const { rows: beforeRows } = await pool.query(
    `SELECT t.*, e.clerk_user_id
     FROM taxgpt.engagement_tasks t
     INNER JOIN taxgpt.accounting_engagements e ON e.id = t.engagement_id
     WHERE t.id = $1::uuid`,
    [taskId]
  )
  if (!beforeRows[0] || beforeRows[0].clerk_user_id !== clerkUserId) return null
  const before = beforeRows[0]
  const status = payload.status || before.status
  assertAllowed(status, TASK_STATUSES, 'task status')
  const { rows } = await pool.query(
    `UPDATE taxgpt.engagement_tasks
     SET title = $1,
         description = $2,
         status = $3,
         assigned_to = $4,
         due_date = $5,
         sort_order = $6,
         updated_at = now()
     WHERE id = $7::uuid
     RETURNING *`,
    [
      payload.title || before.title,
      payload.description ?? before.description,
      status,
      payload.assignedTo ?? before.assigned_to,
      payload.dueDate ?? before.due_date,
      payload.sortOrder ?? before.sort_order,
      taskId
    ]
  )
  await logAccountingAudit(pool, clerkUserId, actorId, 'task', taskId, 'updated', before, rows[0])
  return rows[0]
}

export async function listTasks (pool, clerkUserId, engagementId) {
  const { rows } = await pool.query(
    `SELECT t.*
     FROM taxgpt.engagement_tasks t
     INNER JOIN taxgpt.accounting_engagements e ON e.id = t.engagement_id
     WHERE t.engagement_id = $1::uuid AND e.clerk_user_id = $2
     ORDER BY t.sort_order ASC, t.created_at DESC`,
    [engagementId, clerkUserId]
  )
  return rows
}

export function validateAdjustmentBalance (lines) {
  const debit = lines.reduce((sum, line) => sum + (toNumber(line.debitAmount) || 0), 0)
  const credit = lines.reduce((sum, line) => sum + (toNumber(line.creditAmount) || 0), 0)
  return {
    debit,
    credit,
    balanced: Math.abs(debit - credit) < 0.0001
  }
}

export async function createAdjustmentEntry (pool, clerkUserId, actorId, payload) {
  assertAllowed(payload.status || 'draft', ADJUSTMENT_STATUSES, 'adjustment status')
  assertAllowed(payload.source || 'manual', ADJUSTMENT_SOURCES, 'adjustment source')
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
      actorId
    ]
  )
  await logAccountingAudit(pool, clerkUserId, actorId, 'adjustment_entry', rows[0].id, 'created', null, rows[0])
  return rows[0]
}

export async function upsertAdjustmentLines (pool, clerkUserId, actorId, adjustmentEntryId, lines) {
  const safeLines = Array.isArray(lines) ? lines : []
  const validation = validateAdjustmentBalance(safeLines)
  if (!validation.balanced) {
    throw new Error('Adjustment entry is not balanced (debits must equal credits)')
  }
  const { rows: entryRows } = await pool.query(
    `SELECT ae.*, e.clerk_user_id
     FROM taxgpt.adjustment_entries ae
     INNER JOIN taxgpt.accounting_engagements e ON e.id = ae.engagement_id
     WHERE ae.id = $1::uuid`,
    [adjustmentEntryId]
  )
  if (!entryRows[0] || entryRows[0].clerk_user_id !== clerkUserId) return null
  await pool.query('DELETE FROM taxgpt.adjustment_entry_lines WHERE adjustment_entry_id = $1::uuid', [adjustmentEntryId])
  for (const line of safeLines) {
    await pool.query(
      `INSERT INTO taxgpt.adjustment_entry_lines
       (adjustment_entry_id, account_number, account_name, debit_amount, credit_amount, memo, created_at, updated_at)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, now(), now())`,
      [adjustmentEntryId, line.accountNumber || null, line.accountName, line.debitAmount || 0, line.creditAmount || 0, line.memo || null]
    )
  }
  await logAccountingAudit(pool, clerkUserId, actorId, 'adjustment_entry', adjustmentEntryId, 'lines_updated', null, { lineCount: safeLines.length })
  return { lineCount: safeLines.length, validation }
}

export async function updateAdjustmentStatus (pool, clerkUserId, actorId, adjustmentEntryId, status) {
  assertAllowed(status, ADJUSTMENT_STATUSES, 'adjustment status')
  const { rows: beforeRows } = await pool.query(
    `SELECT ae.*, e.clerk_user_id
     FROM taxgpt.adjustment_entries ae
     INNER JOIN taxgpt.accounting_engagements e ON e.id = ae.engagement_id
     WHERE ae.id = $1::uuid`,
    [adjustmentEntryId]
  )
  if (!beforeRows[0] || beforeRows[0].clerk_user_id !== clerkUserId) return null
  const before = beforeRows[0]
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
  await logAccountingAudit(pool, clerkUserId, actorId, 'adjustment_entry', adjustmentEntryId, `status_${status}`, before, rows[0])
  return rows[0]
}

export async function listAdjustmentEntries (pool, clerkUserId, engagementId) {
  const { rows } = await pool.query(
    `SELECT ae.*
     FROM taxgpt.adjustment_entries ae
     INNER JOIN taxgpt.accounting_engagements e ON e.id = ae.engagement_id
     WHERE ae.engagement_id = $1::uuid AND e.clerk_user_id = $2
     ORDER BY ae.created_at DESC`,
    [engagementId, clerkUserId]
  )
  return rows
}

export async function listIntegrations (pool, clerkUserId, organizationId = null) {
  if (organizationId) {
    const { rows } = await pool.query(
      'SELECT * FROM taxgpt.source_connections WHERE organization_id = $1::uuid ORDER BY created_at DESC',
      [organizationId]
    )
    return rows.map((row) => ({ ...row, access_token_encrypted: null, refresh_token_encrypted: null }))
  }
  const { rows } = await pool.query(
    'SELECT * FROM taxgpt.source_connections WHERE clerk_user_id = $1 ORDER BY created_at DESC',
    [clerkUserId]
  )
  return rows.map((row) => ({ ...row, access_token_encrypted: null, refresh_token_encrypted: null }))
}

export async function upsertIntegrationConnection (pool, clerkUserId, actorId, payload) {
  if (!Object.hasOwn(PROVIDER_TO_SOURCE, payload.provider)) throw new Error('Unsupported provider')
  assertAllowed(payload.connectionStatus || 'pending', CONNECTION_STATUSES, 'connection_status')
  const encryptedAccessToken = payload.accessToken ? encryptSecret(payload.accessToken) : payload.accessTokenEncrypted || null
  const encryptedRefreshToken = payload.refreshToken ? encryptSecret(payload.refreshToken) : payload.refreshTokenEncrypted || null
  let rows
  if (payload.organizationId) {
    ({ rows } = await pool.query(
      `INSERT INTO taxgpt.source_connections
       (organization_id, clerk_user_id, client_id, provider, provider_realm_id, connection_status, access_token_encrypted, refresh_token_encrypted, token_expires_at, metadata, created_by, created_at, updated_at)
       VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, now(), now())
       ON CONFLICT (organization_id, provider)
       DO UPDATE SET
         clerk_user_id = EXCLUDED.clerk_user_id,
         client_id = EXCLUDED.client_id,
         provider_realm_id = EXCLUDED.provider_realm_id,
         connection_status = EXCLUDED.connection_status,
         access_token_encrypted = EXCLUDED.access_token_encrypted,
         refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
         token_expires_at = EXCLUDED.token_expires_at,
         metadata = EXCLUDED.metadata,
         updated_at = now()
       RETURNING *`,
      [
        payload.organizationId,
        clerkUserId,
        payload.clientId || null,
        payload.provider,
        payload.providerRealmId || null,
        payload.connectionStatus || 'pending',
        encryptedAccessToken,
        encryptedRefreshToken,
        payload.tokenExpiresAt || null,
        JSON.stringify(payload.metadata || {}),
        actorId
      ]
    ))
  } else {
    ({ rows } = await pool.query(
      `INSERT INTO taxgpt.source_connections
       (clerk_user_id, client_id, provider, provider_realm_id, connection_status, access_token_encrypted, refresh_token_encrypted, token_expires_at, metadata, created_by, created_at, updated_at)
       VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, now(), now())
       RETURNING *`,
      [
        clerkUserId,
        payload.clientId || null,
        payload.provider,
        payload.providerRealmId || null,
        payload.connectionStatus || 'pending',
        encryptedAccessToken,
        encryptedRefreshToken,
        payload.tokenExpiresAt || null,
        JSON.stringify(payload.metadata || {}),
        actorId
      ]
    ))
  }
  await logAccountingAudit(pool, clerkUserId, actorId, 'source_connection', rows[0].id, 'configured', null, rows[0])
  return { ...rows[0], access_token_encrypted: null, refresh_token_encrypted: null }
}

