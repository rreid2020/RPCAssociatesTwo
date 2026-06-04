export const ENGAGEMENT_ASSIGNMENT_ROLES = new Set(['preparer', 'reviewer', 'manager', 'member'])

export function normalizeEngagementAssignmentRole (role) {
  const normalized = String(role || 'member').trim().toLowerCase()
  if (!ENGAGEMENT_ASSIGNMENT_ROLES.has(normalized)) {
    throw new Error(`Invalid engagement assignment role: ${role}`)
  }
  return normalized
}

export function parseEngagementAssignmentsPayload (payload = {}) {
  if (Array.isArray(payload.assignments) && payload.assignments.length > 0) {
    const parsed = payload.assignments.map((entry) => ({
      clerkUserId: String(entry?.clerkUserId || entry?.clerk_user_id || '').trim(),
      assignmentRole: normalizeEngagementAssignmentRole(entry?.assignmentRole || entry?.assignment_role || 'member')
    })).filter((entry) => entry.clerkUserId)
    return dedupeEngagementAssignments(parsed)
  }

  const clerkUserIds = Array.isArray(payload.clerkUserIds)
    ? payload.clerkUserIds.map((value) => String(value || '').trim()).filter(Boolean)
    : []
  return dedupeEngagementAssignments(clerkUserIds.map((clerkUserId) => ({
    clerkUserId,
    assignmentRole: 'member'
  })))
}

export function dedupeEngagementAssignments (assignments) {
  const byUserId = new Map()
  for (const assignment of assignments) {
    byUserId.set(assignment.clerkUserId, assignment)
  }
  return Array.from(byUserId.values())
}

export function resolveEngagementWorkflowLeadIds (assignments) {
  const preparer = assignments.find((entry) => entry.assignmentRole === 'preparer')?.clerkUserId || null
  const reviewer = assignments.find((entry) => entry.assignmentRole === 'reviewer')?.clerkUserId || null
  return { preparer, reviewer }
}
