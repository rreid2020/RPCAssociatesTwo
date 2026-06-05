import { getWorkspaceContext } from '../accountingWorkspaceService.js'
import {
  assertEngagementExecutionAccess,
  countExecutionStats,
  countOpenReviewNotes,
  getEngagementForExecution,
  listEngagementChecklistItems,
  listEngagementChecklists,
  listEngagementProcedures,
  listEngagementSections
} from './engagementExecutionRepository.js'
import {
  suggestExecutionPhaseFromContext,
  deriveExecutionCompletionFromStats
} from './executionPhaseDerivationService.js'
import { listEngagementChecklistBundle } from './checklistService.js'
import { listEngagementProcedureBundle } from './procedureService.js'

export async function getEngagementExecutionSnapshot (pool, actorUserId, engagementId, workspaceId) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  await assertEngagementExecutionAccess(pool, workspace, actorUserId, 'execution.read')

  const engagement = await getEngagementForExecution(pool, engagementId, workspace.id)
  if (!engagement) return null

  const [sections, checklists, checklistItems, procedures, stats, openReviewNotes] = await Promise.all([
    listEngagementSections(pool, engagementId),
    listEngagementChecklists(pool, engagementId),
    listEngagementChecklistItems(pool, engagementId),
    listEngagementProcedures(pool, engagementId),
    countExecutionStats(pool, engagementId),
    countOpenReviewNotes(pool, engagementId)
  ])

  const completionPct = deriveExecutionCompletionFromStats(stats)
  const suggestedPhase = suggestExecutionPhaseFromContext(engagement, stats, openReviewNotes)

  return {
    engagement: {
      id: engagement.id,
      name: engagement.name,
      engagement_type: engagement.engagement_type,
      status: engagement.status,
      review_flow_status: engagement.review_flow_status,
      execution_phase: engagement.execution_phase || 'planning',
      execution_locked_at: engagement.execution_locked_at,
      execution_template_id: engagement.execution_template_id,
      execution_completion_pct: completionPct
    },
    sections,
    checklists,
    checklistItems,
    procedures,
    metrics: {
      ...stats,
      open_review_notes: openReviewNotes,
      suggested_execution_phase: suggestedPhase
    }
  }
}

export async function getEngagementExecutionDashboard (pool, actorUserId, engagementId, workspaceId) {
  const snapshot = await getEngagementExecutionSnapshot(pool, actorUserId, engagementId, workspaceId)
  if (!snapshot) return null

  const procedureStatusCounts = {}
  for (const proc of snapshot.procedures) {
    const key = proc.status || 'not_started'
    procedureStatusCounts[key] = (procedureStatusCounts[key] || 0) + 1
  }

  const checklistStatusCounts = {}
  for (const item of snapshot.checklistItems) {
    const key = item.status || 'not_started'
    checklistStatusCounts[key] = (checklistStatusCounts[key] || 0) + 1
  }

  return {
    ...snapshot,
    dashboard: {
      procedure_status_counts: procedureStatusCounts,
      checklist_status_counts: checklistStatusCounts,
      completion_pct: snapshot.engagement.execution_completion_pct,
      suggested_phase: snapshot.metrics.suggested_execution_phase
    }
  }
}

export { listEngagementChecklistBundle, listEngagementProcedureBundle }
