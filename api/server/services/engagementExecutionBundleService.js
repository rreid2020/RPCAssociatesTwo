import {
  getAiExecutionFoundations,
  getEngagementAuditEvents,
  getEngagementWorkflowQueue,
  getReviewSignoffTimeline,
  getWorkingPaperExecutionTree
} from './workingPapersExecutionService.js'
import { getEngagementDashboard, listAdjustmentEntries } from './workingPapersService.js'
import { listReviewNotesForEngagement } from './repositories/workingPaperDomainRepository.js'
import { getEngagementExecutionSnapshot } from './engagementExecution/engagementExecutionService.js'
import { getWorkspaceContext } from './accountingWorkspaceService.js'

export async function getEngagementExecutionBundle (pool, clerkUserId, engagementId, options = {}) {
  const tree = await getWorkingPaperExecutionTree(pool, clerkUserId, engagementId)
  if (!tree) return null

  const workspace = options.workspace || await getWorkspaceContext(pool, clerkUserId, options.workspaceId || null)

  const [
    execution,
    queue,
    entries,
    events,
    signoffs,
    aiFoundations,
    dashboard,
    notes
  ] = await Promise.all([
    options.includeExecution === false
      ? Promise.resolve(null)
      : getEngagementExecutionSnapshot(pool, clerkUserId, engagementId, workspace.id, { workspace })
        .catch(() => null),
    getEngagementWorkflowQueue(pool, clerkUserId, engagementId),
    listAdjustmentEntries(pool, clerkUserId, engagementId),
    getEngagementAuditEvents(pool, clerkUserId, engagementId),
    getReviewSignoffTimeline(pool, clerkUserId, engagementId),
    getAiExecutionFoundations(pool, clerkUserId, engagementId),
    options.includeDashboard
      ? getEngagementDashboard(pool, clerkUserId, engagementId)
      : Promise.resolve(null),
    listReviewNotesForEngagement(pool, engagementId)
  ])

  return {
    tree,
    queue,
    adjustments: { entries: Array.isArray(entries) ? entries : [] },
    audit: { events: Array.isArray(events) ? events : [] },
    signoffs: { signoffs: Array.isArray(signoffs) ? signoffs : [] },
    aiFoundations,
    dashboard,
    reviewNotes: { notes: Array.isArray(notes) ? notes : [] },
    execution
  }
}
