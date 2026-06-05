export const ENGAGEMENT_ASSIGNMENT_ROLES = new Set(['preparer', 'reviewer', 'manager', 'member'])

export function normalizeEngagementAssignmentRole (role) {
  const normalized = String(role || 'member').trim().toLowerCase()
  if (!ENGAGEMENT_ASSIGNMENT_ROLES.has(normalized)) {
    throw new Error(`Invalid engagement assignment role: ${role}`)
  }
  return normalized
}

export function mapWorkspaceRoleToEngagementAssignmentRole (workspaceRole) {
  const normalized = String(workspaceRole || '').trim().toLowerCase()
  if (normalized === 'preparer') return 'preparer'
  if (normalized === 'reviewer') return 'reviewer'
  if (normalized === 'owner' || normalized === 'admin' || normalized === 'manager') return 'manager'
  return 'member'
}

export function inheritEngagementAssignmentRole (assignment, roleByUserId = {}) {
  const workspaceRole = roleByUserId[assignment.clerkUserId]
  if (!workspaceRole) return assignment
  const inheritedRole = mapWorkspaceRoleToEngagementAssignmentRole(workspaceRole)
  if (assignment.assignmentRole !== 'member' || inheritedRole === 'member') {
    return assignment
  }
  return {
    ...assignment,
    assignmentRole: inheritedRole
  }
}

export function applyWorkspaceRoleInheritance (assignments, roleByUserId = {}) {
  return assignments.map((assignment) => inheritEngagementAssignmentRole(assignment, roleByUserId))
}

export function parseEngagementAssignmentsPayload (payload = {}, roleByUserId = {}) {
  let parsed = []
  if (Array.isArray(payload.assignments) && payload.assignments.length > 0) {
    parsed = payload.assignments.map((entry) => ({
      clerkUserId: String(entry?.clerkUserId || entry?.clerk_user_id || '').trim(),
      assignmentRole: normalizeEngagementAssignmentRole(entry?.assignmentRole || entry?.assignment_role || 'member')
    })).filter((entry) => entry.clerkUserId)
    parsed = dedupeEngagementAssignments(parsed)
  } else {
    const clerkUserIds = Array.isArray(payload.clerkUserIds)
      ? payload.clerkUserIds.map((value) => String(value || '').trim()).filter(Boolean)
      : []
    parsed = dedupeEngagementAssignments(clerkUserIds.map((clerkUserId) => ({
      clerkUserId,
      assignmentRole: mapWorkspaceRoleToEngagementAssignmentRole(roleByUserId[clerkUserId])
    })))
  }
  return applyWorkspaceRoleInheritance(parsed, roleByUserId)
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
