export const ENGAGEMENT_ASSIGNMENT_ROLES = [
  'preparer',
  'reviewer',
  'manager',
  'member'
] as const

export type EngagementAssignmentRole = typeof ENGAGEMENT_ASSIGNMENT_ROLES[number]

export type EngagementStaffAssignment = {
  clerk_user_id: string
  assignment_role: EngagementAssignmentRole
}

const ROLE_SET = new Set<string>(ENGAGEMENT_ASSIGNMENT_ROLES)

export function formatEngagementAssignmentRole (role: string): string {
  const normalized = String(role || 'member').trim().toLowerCase()
  if (normalized === 'read_only') return 'Read only'
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

export function normalizeEngagementAssignmentRole (role: unknown): EngagementAssignmentRole {
  const normalized = String(role || 'member').trim().toLowerCase()
  if (ROLE_SET.has(normalized)) return normalized as EngagementAssignmentRole
  return 'member'
}

export function normalizeEngagementStaffAssignments (value: unknown): EngagementStaffAssignment[] {
  if (!value) return []
  if (Array.isArray(value)) {
    const parsed: EngagementStaffAssignment[] = []
    for (const entry of value) {
      if (!entry || typeof entry !== 'object') continue
      const record = entry as Record<string, unknown>
      const clerkUserId = String(record.clerk_user_id || record.clerkUserId || '').trim()
      if (!clerkUserId) continue
      parsed.push({
        clerk_user_id: clerkUserId,
        assignment_role: normalizeEngagementAssignmentRole(record.assignment_role || record.assignmentRole)
      })
    }
    return dedupeStaffAssignments(parsed)
  }
  return []
}

/** Legacy rows may only expose assigned_employee_ids without roles. */
export function staffAssignmentsFromEmployeeIds (ids: unknown): EngagementStaffAssignment[] {
  const clerkUserIds = Array.isArray(ids)
    ? ids.map((entry) => String(entry || '').trim()).filter(Boolean)
    : []
  return clerkUserIds.map((clerk_user_id) => ({
    clerk_user_id,
    assignment_role: 'member' as EngagementAssignmentRole
  }))
}

export function dedupeStaffAssignments (
  assignments: EngagementStaffAssignment[]
): EngagementStaffAssignment[] {
  const byUserId = new Map<string, EngagementStaffAssignment>()
  for (const assignment of assignments) {
    byUserId.set(assignment.clerk_user_id, assignment)
  }
  return Array.from(byUserId.values())
}

export function toAssignmentApiPayload (assignments: EngagementStaffAssignment[]) {
  return dedupeStaffAssignments(assignments).map((assignment) => ({
    clerkUserId: assignment.clerk_user_id,
    assignmentRole: assignment.assignment_role
  }))
}

export function formatStaffAssignmentLabels (
  assignments: EngagementStaffAssignment[],
  memberLabelByUserId: Map<string, string>
): string {
  if (assignments.length === 0) return '—'
  return assignments.map((assignment) => {
    const name = memberLabelByUserId.get(assignment.clerk_user_id) || assignment.clerk_user_id
    return `${name} (${formatEngagementAssignmentRole(assignment.assignment_role)})`
  }).join(', ')
}
