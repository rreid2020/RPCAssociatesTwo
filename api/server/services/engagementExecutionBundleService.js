import {
  getAiExecutionFoundations,
  getEngagementAuditEvents,
  getEngagementWorkflowQueue,
  getReviewSignoffTimeline,
  getWorkingPaperExecutionTree
} from './workingPapersExecutionService.js'
import { getEngagementDashboard, listAdjustmentEntries } from './workingPapersService.js'
import { getEngagementExecutionSnapshot } from './engagementExecution/engagementExecutionService.js'
import { getWorkspaceContext } from './accountingWorkspaceService.js'

export async function getEngagementExecutionBundle (pool, clerkUserId, engagementId, options = {}) {
  const tree = await getWorkingPaperExecutionTree(pool, clerkUserId, engagementId)
  if (!tree) return null

  let execution = null
  if (options.includeExecution !== false) {
    try {
      const workspace = options.workspace || await getWorkspaceContext(pool, clerkUserId, options.workspaceId || null)
      execution = await getEngagementExecutionSnapshot(pool, clerkUserId, engagementId, workspace.id, {
        workspace
      })
    } catch {
      execution = null
    }
  }

  const queue = await getEngagementWorkflowQueue(pool, clerkUserId, engagementId)
  const entries = await listAdjustmentEntries(pool, clerkUserId, engagementId)
  const events = await getEngagementAuditEvents(pool, clerkUserId, engagementId)
  const signoffs = await getReviewSignoffTimeline(pool, clerkUserId, engagementId)
  const aiFoundations = await getAiExecutionFoundations(pool, clerkUserId, engagementId)
  const dashboard = options.includeDashboard
    ? await getEngagementDashboard(pool, clerkUserId, engagementId)
    : null

  return {
    tree,
    queue,
    adjustments: { entries: Array.isArray(entries) ? entries : [] },
    audit: { events: Array.isArray(events) ? events : [] },
    signoffs: { signoffs: Array.isArray(signoffs) ? signoffs : [] },
    aiFoundations,
    dashboard,
    execution
  }
}
