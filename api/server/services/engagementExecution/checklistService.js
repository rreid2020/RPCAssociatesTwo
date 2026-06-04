import { recordAuditEvent } from '../repositories/auditWorkflowRepository.js'
import { getWorkspaceContext } from '../accountingWorkspaceService.js'
import { normalizeChecklistItemStatus } from './executionConstants.js'
import {
  assertEngagementExecutionAccess,
  getChecklistItem,
  getEngagementForExecution,
  listEngagementChecklistItems,
  listEngagementChecklists,
  listEngagementSections,
  updateChecklistItem
} from './engagementExecutionRepository.js'
import { deriveExecutionCompletion } from './executionPhaseDerivationService.js'
import { updateEngagementExecutionFields } from './engagementExecutionRepository.js'

export async function listEngagementChecklistBundle (pool, actorUserId, engagementId, workspaceId) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  await assertEngagementExecutionAccess(pool, workspace, actorUserId, 'execution.read')

  const engagement = await getEngagementForExecution(pool, engagementId, workspace.id)
  if (!engagement) return null

  const [sections, checklists, items] = await Promise.all([
    listEngagementSections(pool, engagementId),
    listEngagementChecklists(pool, engagementId),
    listEngagementChecklistItems(pool, engagementId)
  ])

  return { sections, checklists, items }
}

export async function updateEngagementChecklistItem (pool, actorUserId, engagementId, itemId, payload = {}) {
  const workspace = await getWorkspaceContext(pool, actorUserId, payload.workspaceId || null)
  await assertEngagementExecutionAccess(pool, workspace, actorUserId, 'execution.manage')

  const before = await getChecklistItem(pool, itemId, engagementId, workspace.id)
  if (!before) throw new Error('Checklist item not found')

  const status = payload.status != null ? normalizeChecklistItemStatus(payload.status) : undefined
  const signedOffBy = status === 'approved' ? actorUserId : (payload.signedOffBy ?? undefined)
  const signedOffAt = status === 'approved' ? new Date() : (payload.signedOffAt ?? undefined)

  const updated = await updateChecklistItem(pool, itemId, {
    status,
    assignedTo: payload.assignedTo,
    dueDate: payload.dueDate,
    notes: payload.notes,
    signedOffBy,
    signedOffAt,
    updatedBy: actorUserId
  })

  const engagement = await getEngagementForExecution(pool, engagementId, workspace.id)
  const completionPct = await deriveExecutionCompletion(pool, engagementId)
  await updateEngagementExecutionFields(pool, engagementId, workspace.id, { executionCompletionPct: completionPct })

  await recordAuditEvent(pool, {
    organizationId: engagement.organization_id,
    workspaceId: workspace.id,
    engagementId,
    eventType: 'checklist_item_updated',
    entityType: 'execution_checklist_item',
    entityId: itemId,
    actorId: actorUserId,
    beforeValue: before,
    afterValue: updated
  })

  return updated
}
