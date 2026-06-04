import { recordAuditEvent } from '../repositories/auditWorkflowRepository.js'
import { getWorkspaceContext } from '../accountingWorkspaceService.js'
import {
  canTransitionExecutionPhase,
  normalizeExecutionPhase
} from './executionConstants.js'
import {
  assertEngagementExecutionAccess,
  getEngagementForExecution,
  resolvePlatformRole,
  updateEngagementExecutionFields
} from './engagementExecutionRepository.js'
import { deriveExecutionCompletion, suggestExecutionPhase } from './executionPhaseDerivationService.js'

async function logPhaseTransition (pool, engagement, fromPhase, toPhase, actorUserId, reason) {
  await pool.query(
    `INSERT INTO taxgpt.workflow_transitions
     (organization_id, workspace_id, engagement_id, from_state, to_state, transition_reason, metadata, created_by, updated_by, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7::jsonb, $8, $8, now(), now())`,
    [
      engagement.organization_id,
      engagement.workspace_id,
      engagement.id,
      fromPhase,
      toPhase,
      reason || null,
      JSON.stringify({ domain: 'execution_phase' }),
      actorUserId
    ]
  )
  await recordAuditEvent(pool, {
    organizationId: engagement.organization_id,
    workspaceId: engagement.workspace_id,
    engagementId: engagement.id,
    eventType: 'execution_phase_changed',
    entityType: 'execution_phase',
    entityId: engagement.id,
    actorId: actorUserId,
    beforeValue: { execution_phase: fromPhase },
    afterValue: { execution_phase: toPhase },
    metadata: { reason: reason || null }
  })
}

export async function transitionExecutionPhase (pool, actorUserId, engagementId, payload = {}) {
  const workspace = await getWorkspaceContext(pool, actorUserId, payload.workspaceId || null)
  await assertEngagementExecutionAccess(pool, workspace, actorUserId, 'execution.manage')

  const engagement = await getEngagementForExecution(pool, engagementId, workspace.id)
  if (!engagement) throw new Error('Engagement not found')

  const toPhase = normalizeExecutionPhase(payload.executionPhase || payload.toPhase)
  const fromPhase = normalizeExecutionPhase(engagement.execution_phase)
  const platformRole = resolvePlatformRole(workspace)

  if (toPhase === fromPhase) return engagement

  if (!canTransitionExecutionPhase(fromPhase, toPhase, platformRole)) {
    throw new Error(`Role ${platformRole} cannot transition execution phase from ${fromPhase} to ${toPhase}`)
  }

  const lockedAt = toPhase === 'locked' ? new Date() : (fromPhase === 'locked' ? null : engagement.execution_locked_at)
  const completionPct = await deriveExecutionCompletion(pool, engagementId)

  const updated = await updateEngagementExecutionFields(pool, engagementId, workspace.id, {
    executionPhase: toPhase,
    executionLockedAt: lockedAt,
    executionCompletionPct: completionPct
  })

  await logPhaseTransition(pool, engagement, fromPhase, toPhase, actorUserId, payload.reason)
  return updated
}

export async function refreshExecutionMetrics (pool, actorUserId, engagementId, options = {}) {
  const workspace = await getWorkspaceContext(pool, actorUserId, options.workspaceId || null)
  const engagement = await getEngagementForExecution(pool, engagementId, workspace.id)
  if (!engagement) return null

  const completionPct = await deriveExecutionCompletion(pool, engagementId)
  const suggestedPhase = await suggestExecutionPhase(pool, engagement)

  return updateEngagementExecutionFields(pool, engagementId, workspace.id, {
    executionCompletionPct: completionPct,
    executionPhase: options.autoApplySuggestedPhase ? suggestedPhase : undefined
  })
}

export async function lockEngagementExecution (pool, actorUserId, engagementId, workspaceId) {
  return transitionExecutionPhase(pool, actorUserId, engagementId, {
    workspaceId,
    executionPhase: 'locked',
    reason: 'Execution file locked'
  })
}
