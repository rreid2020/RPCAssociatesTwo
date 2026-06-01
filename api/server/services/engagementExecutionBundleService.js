import {
  getAiExecutionFoundations,
  getEngagementAuditEvents,
  getEngagementWorkflowQueue,
  getReviewSignoffTimeline,
  getWorkingPaperExecutionTree
} from './workingPapersExecutionService.js'
import { getEngagementDashboard, listAdjustmentEntries } from './workingPapersService.js'

export async function getEngagementExecutionBundle (pool, clerkUserId, engagementId, options = {}) {
  const tree = await getWorkingPaperExecutionTree(pool, clerkUserId, engagementId)
  if (!tree) return null

  const [queue, entries, events, signoffs, aiFoundations, dashboard] = await Promise.all([
    getEngagementWorkflowQueue(pool, clerkUserId, engagementId),
    listAdjustmentEntries(pool, clerkUserId, engagementId),
    getEngagementAuditEvents(pool, clerkUserId, engagementId),
    getReviewSignoffTimeline(pool, clerkUserId, engagementId),
    getAiExecutionFoundations(pool, clerkUserId, engagementId),
    options.includeDashboard
      ? getEngagementDashboard(pool, clerkUserId, engagementId)
      : Promise.resolve(null)
  ])

  return {
    tree,
    queue,
    adjustments: { entries: Array.isArray(entries) ? entries : [] },
    audit: { events: Array.isArray(events) ? events : [] },
    signoffs: { signoffs: Array.isArray(signoffs) ? signoffs : [] },
    aiFoundations,
    dashboard
  }
}
