import {
  createAuditEvent,
  createEvidenceLink,
  createReviewSignoff,
  createWorkingPaperRowTickmark,
  fetchEngagementByIdForUser,
  fetchLeadSheetByIdForUser,
  listAuditEventsByEngagement,
  listEvidenceLinksByLeadSheet,
  listLeadSheetsWithRowsForEngagement,
  listReviewSignoffsByEngagement,
  listTickmarksByWorkingPaperRow,
  listWorkflowQueueByEngagement,
  listWorkingPaperRowsForLeadSheet
} from './repositories/workingPapersExecutionRepository.js'

const aiHooks = {
  reconciliationAssistant: null,
  anomalyDetector: null,
  notesGenerator: null,
  adjustmentSuggester: null,
  documentExtractor: null,
  accountMapper: null
}

export function configureWorkingPaperAiHooks (hooks = {}) {
  Object.assign(aiHooks, hooks || {})
}

async function dispatchAiHook (hookName, payload) {
  const hook = aiHooks[hookName]
  if (typeof hook !== 'function') return null
  try {
    return await hook(payload)
  } catch {
    return null
  }
}

export async function getWorkingPaperExecutionTree (pool, clerkUserId, engagementId) {
  const engagement = await fetchEngagementByIdForUser(pool, engagementId, clerkUserId)
  if (!engagement) return null
  const sheets = await listLeadSheetsWithRowsForEngagement(pool, engagementId)
  const sections = []
  for (const sheet of sheets) {
    const rows = await listWorkingPaperRowsForLeadSheet(pool, sheet.id)
    sections.push({
      ...sheet,
      rows
    })
  }
  return {
    engagement,
    sections
  }
}

export async function getEngagementWorkflowQueue (pool, clerkUserId, engagementId) {
  const engagement = await fetchEngagementByIdForUser(pool, engagementId, clerkUserId)
  if (!engagement) return null
  const queue = await listWorkflowQueueByEngagement(pool, engagementId)
  return {
    engagementId,
    dueDate: engagement.due_date,
    reviewFlowStatus: engagement.review_flow_status,
    queue
  }
}

export async function getEngagementAuditEvents (pool, clerkUserId, engagementId) {
  const engagement = await fetchEngagementByIdForUser(pool, engagementId, clerkUserId)
  if (!engagement) return null
  return listAuditEventsByEngagement(pool, engagementId)
}

export async function createTickmarkForWorkingPaperRow (pool, clerkUserId, actorId, workingPaperRowId, payload = {}) {
  const { rows } = await pool.query(
    `SELECT wpr.id AS working_paper_row_id,
            wpr.lead_sheet_id,
            ls.engagement_id,
            e.organization_id,
            e.workspace_id,
            e.clerk_user_id
     FROM taxgpt.working_paper_rows wpr
     INNER JOIN taxgpt.lead_sheets ls ON ls.id = wpr.lead_sheet_id
     INNER JOIN taxgpt.accounting_engagements e ON e.id = ls.engagement_id
     WHERE wpr.id = $1::uuid`,
    [workingPaperRowId]
  )
  const row = rows[0]
  if (!row || row.clerk_user_id !== clerkUserId) return null
  const tickmark = await createWorkingPaperRowTickmark(pool, {
    organizationId: row.organization_id,
    workspaceId: row.workspace_id,
    engagementId: row.engagement_id,
    leadSheetId: row.lead_sheet_id,
    workingPaperRowId,
    tickmarkCode: String(payload.tickmarkCode || 'TB').trim().toUpperCase(),
    label: payload.label || null,
    color: payload.color || null,
    note: payload.note || null,
    createdBy: actorId
  })
  await createAuditEvent(pool, {
    organizationId: row.organization_id,
    workspaceId: row.workspace_id,
    engagementId: row.engagement_id,
    leadSheetId: row.lead_sheet_id,
    workingPaperRowId,
    eventType: 'tickmark_created',
    entityType: 'tickmark',
    entityId: tickmark?.id,
    actorId,
    afterValue: tickmark
  })
  return tickmark
}

export async function getTickmarksForWorkingPaperRow (pool, clerkUserId, workingPaperRowId) {
  const { rows } = await pool.query(
    `SELECT e.clerk_user_id
     FROM taxgpt.working_paper_rows wpr
     INNER JOIN taxgpt.lead_sheets ls ON ls.id = wpr.lead_sheet_id
     INNER JOIN taxgpt.accounting_engagements e ON e.id = ls.engagement_id
     WHERE wpr.id = $1::uuid`,
    [workingPaperRowId]
  )
  if (!rows[0] || rows[0].clerk_user_id !== clerkUserId) return null
  return listTickmarksByWorkingPaperRow(pool, workingPaperRowId)
}

export async function createEvidenceLinkForLeadSheet (pool, clerkUserId, actorId, leadSheetId, payload = {}) {
  const leadSheet = await fetchLeadSheetByIdForUser(pool, leadSheetId, clerkUserId)
  if (!leadSheet) return null
  const evidence = await createEvidenceLink(pool, {
    organizationId: leadSheet.organization_id,
    workspaceId: leadSheet.workspace_id,
    engagementId: leadSheet.engagement_id,
    leadSheetId,
    workingPaperRowId: payload.workingPaperRowId || null,
    documentId: payload.documentId || null,
    linkType: payload.linkType || 'document',
    label: payload.label || null,
    sourceUrl: payload.sourceUrl || null,
    metadata: payload.metadata || {},
    createdBy: actorId
  })
  await createAuditEvent(pool, {
    organizationId: leadSheet.organization_id,
    workspaceId: leadSheet.workspace_id,
    engagementId: leadSheet.engagement_id,
    leadSheetId,
    workingPaperRowId: payload.workingPaperRowId || null,
    eventType: 'evidence_linked',
    entityType: 'evidence_link',
    entityId: evidence?.id,
    actorId,
    afterValue: evidence
  })
  return evidence
}

export async function getEvidenceLinksForLeadSheet (pool, clerkUserId, leadSheetId) {
  const leadSheet = await fetchLeadSheetByIdForUser(pool, leadSheetId, clerkUserId)
  if (!leadSheet) return null
  return listEvidenceLinksByLeadSheet(pool, leadSheetId)
}

export async function captureReviewSignoff (pool, clerkUserId, actorId, payload = {}) {
  const engagement = await fetchEngagementByIdForUser(pool, payload.engagementId, clerkUserId)
  if (!engagement) return null
  const signoff = await createReviewSignoff(pool, {
    organizationId: engagement.organization_id,
    workspaceId: engagement.workspace_id,
    engagementId: payload.engagementId,
    leadSheetId: payload.leadSheetId || null,
    signoffType: payload.signoffType,
    signoffState: payload.signoffState || 'signed',
    signedBy: actorId,
    metadata: payload.metadata || {}
  })
  await createAuditEvent(pool, {
    organizationId: engagement.organization_id,
    workspaceId: engagement.workspace_id,
    engagementId: payload.engagementId,
    leadSheetId: payload.leadSheetId || null,
    eventType: 'review_signoff_captured',
    entityType: 'review_signoff',
    entityId: signoff?.id,
    actorId,
    afterValue: signoff
  })
  return signoff
}

export async function getReviewSignoffTimeline (pool, clerkUserId, engagementId) {
  const engagement = await fetchEngagementByIdForUser(pool, engagementId, clerkUserId)
  if (!engagement) return null
  return listReviewSignoffsByEngagement(pool, engagementId)
}

export async function getAiExecutionFoundations (pool, clerkUserId, engagementId) {
  const engagement = await fetchEngagementByIdForUser(pool, engagementId, clerkUserId)
  if (!engagement) return null
  const [reconciliation, anomalies, notes, adjustments, extraction, mapping] = await Promise.all([
    dispatchAiHook('reconciliationAssistant', { engagement }),
    dispatchAiHook('anomalyDetector', { engagement }),
    dispatchAiHook('notesGenerator', { engagement }),
    dispatchAiHook('adjustmentSuggester', { engagement }),
    dispatchAiHook('documentExtractor', { engagement }),
    dispatchAiHook('accountMapper', { engagement })
  ])
  return {
    engagementId,
    reconciliationAssistant: reconciliation ? 'available' : 'scaffolded',
    anomalyDetection: anomalies ? 'available' : 'scaffolded',
    notesGeneration: notes ? 'available' : 'scaffolded',
    adjustmentSuggestions: adjustments ? 'available' : 'scaffolded',
    documentExtraction: extraction ? 'available' : 'scaffolded',
    accountMapping: mapping ? 'available' : 'scaffolded'
  }
}
