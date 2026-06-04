import { recordAuditEvent } from '../repositories/auditWorkflowRepository.js'
import { getWorkspaceContext } from '../accountingWorkspaceService.js'
import { normalizeProcedureStatus } from './executionConstants.js'
import {
  assertEngagementExecutionAccess,
  getEngagementForExecution,
  getProcedure,
  insertProcedureSignoff,
  listEngagementProcedures,
  updateEngagementExecutionFields,
  updateProcedure
} from './engagementExecutionRepository.js'
import { deriveExecutionCompletion } from './executionPhaseDerivationService.js'

export async function listEngagementProcedureBundle (pool, actorUserId, engagementId, workspaceId) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  await assertEngagementExecutionAccess(pool, workspace, actorUserId, 'execution.read')

  const engagement = await getEngagementForExecution(pool, engagementId, workspace.id)
  if (!engagement) return null

  const procedures = await listEngagementProcedures(pool, engagementId)
  return { procedures }
}

export async function updateEngagementProcedure (pool, actorUserId, engagementId, procedureId, payload = {}) {
  const workspace = await getWorkspaceContext(pool, actorUserId, payload.workspaceId || null)
  await assertEngagementExecutionAccess(pool, workspace, actorUserId, 'execution.manage')

  const before = await getProcedure(pool, procedureId, engagementId, workspace.id)
  if (!before) throw new Error('Procedure not found')

  let preparedBy = before.prepared_by
  let preparedAt = before.prepared_at
  let reviewedBy = before.reviewed_by
  let reviewedAt = before.reviewed_at

  const status = payload.status != null ? normalizeProcedureStatus(payload.status) : undefined
  if (status === 'prepared' || status === 'pending_review' || status === 'approved') {
    preparedBy = actorUserId
    preparedAt = new Date()
  }
  if (status === 'approved') {
    reviewedBy = actorUserId
    reviewedAt = new Date()
  }

  const updated = await updateProcedure(pool, procedureId, {
    title: payload.title,
    description: payload.description,
    objective: payload.objective,
    expectedResult: payload.expectedResult,
    status,
    assignedTo: payload.assignedTo,
    preparedBy,
    preparedAt,
    reviewedBy,
    reviewedAt,
    leadSheetId: payload.leadSheetId,
    updatedBy: actorUserId
  })

  const engagement = await getEngagementForExecution(pool, engagementId, workspace.id)
  const completionPct = await deriveExecutionCompletion(pool, engagementId)
  await updateEngagementExecutionFields(pool, engagementId, workspace.id, { executionCompletionPct: completionPct })

  await recordAuditEvent(pool, {
    organizationId: engagement.organization_id,
    workspaceId: workspace.id,
    engagementId,
    eventType: 'procedure_updated',
    entityType: 'execution_procedure',
    entityId: procedureId,
    actorId: actorUserId,
    beforeValue: before,
    afterValue: updated
  })

  return updated
}

export async function signoffEngagementProcedure (pool, actorUserId, engagementId, procedureId, payload = {}) {
  const workspace = await getWorkspaceContext(pool, actorUserId, payload.workspaceId || null)
  await assertEngagementExecutionAccess(pool, workspace, actorUserId, 'signoff.perform')

  const engagement = await getEngagementForExecution(pool, engagementId, workspace.id)
  if (!engagement) throw new Error('Engagement not found')

  const procedure = await getProcedure(pool, procedureId, engagementId, workspace.id)
  if (!procedure) throw new Error('Procedure not found')

  const signoff = await insertProcedureSignoff(pool, {
    organizationId: engagement.organization_id,
    workspaceId: workspace.id,
    engagementId,
    procedureId,
    signoffType: payload.signoffType || 'approval',
    signedBy: actorUserId,
    roleAtSignoff: workspace.role,
    metadata: payload.metadata || {}
  })

  const updated = await updateEngagementProcedure(pool, actorUserId, engagementId, procedureId, {
    workspaceId: workspace.id,
    status: 'approved'
  })

  await recordAuditEvent(pool, {
    organizationId: engagement.organization_id,
    workspaceId: workspace.id,
    engagementId,
    eventType: 'procedure_signed_off',
    entityType: 'execution_procedure',
    entityId: procedureId,
    actorId: actorUserId,
    afterValue: { signoff, procedure: updated }
  })

  return { signoff, procedure: updated }
}
