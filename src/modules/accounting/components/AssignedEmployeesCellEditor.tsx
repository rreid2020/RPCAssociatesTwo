import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import type { ICellEditorParams } from 'ag-grid-community'
import {
  ENGAGEMENT_ASSIGNMENT_ROLES,
  dedupeStaffAssignments,
  formatEngagementAssignmentRole,
  normalizeEngagementStaffAssignments,
  staffAssignmentsFromEmployeeIds,
  type EngagementStaffAssignment
} from '../utils/engagementStaffAssignments'

type WorkspaceMember = {
  clerk_user_id: string
  display_name?: string
  email?: string
}

type EditorContext = {
  activeMembers?: WorkspaceMember[]
}

type EditorParams = {
  activeMembers?: WorkspaceMember[]
}

function resolveInitialAssignments (value: unknown): EngagementStaffAssignment[] {
  const normalized = normalizeEngagementStaffAssignments(value)
  if (normalized.length > 0) return normalized
  return staffAssignmentsFromEmployeeIds(value)
}

const AssignedEmployeesCellEditor = forwardRef((
  props: ICellEditorParams<unknown, EngagementStaffAssignment[] | undefined, EditorContext> & EditorParams,
  ref
) => {
  const members = props.activeMembers || props.context?.activeMembers || []
  const [assignments, setAssignments] = useState<EngagementStaffAssignment[]>(
    () => resolveInitialAssignments(props.value)
  )

  const memberLabelByUserId = useMemo(() => {
    const map = new Map<string, string>()
    for (const member of members) {
      const key = String(member.clerk_user_id || '')
      if (!key) continue
      map.set(key, String(member.display_name || member.email || key))
    }
    return map
  }, [members])

  const assignedUserIds = useMemo(
    () => new Set(assignments.map((entry) => entry.clerk_user_id)),
    [assignments]
  )

  const availableToAdd = useMemo(
    () => members.filter((member) => !assignedUserIds.has(member.clerk_user_id)),
    [assignedUserIds, members]
  )

  useImperativeHandle(ref, () => ({
    getValue: () => dedupeStaffAssignments(assignments),
    isPopup: () => true
  }))

  const updateRole = (clerkUserId: string, assignment_role: EngagementStaffAssignment['assignment_role']) => {
    setAssignments((prev) => prev.map((entry) => (
      entry.clerk_user_id === clerkUserId ? { ...entry, assignment_role } : entry
    )))
  }

  const removeAssignment = (clerkUserId: string) => {
    setAssignments((prev) => prev.filter((entry) => entry.clerk_user_id !== clerkUserId))
  }

  const addAssignment = (clerkUserId: string) => {
    if (!clerkUserId || assignedUserIds.has(clerkUserId)) return
    setAssignments((prev) => dedupeStaffAssignments([
      ...prev,
      { clerk_user_id: clerkUserId, assignment_role: 'member' }
    ]))
  }

  return (
    <div
      className="min-w-[320px] max-w-[420px] max-h-72 overflow-y-auto bg-white border border-border rounded-md p-3 shadow-lg"
      role="dialog"
      aria-label="Engagement staffing"
    >
      {members.length === 0 ? (
        <p className="text-sm text-text-light">No active employees available.</p>
      ) : assignments.length === 0 ? (
        <p className="text-sm text-text-light">Add at least one employee to this engagement.</p>
      ) : (
        <div className="space-y-2">
          {assignments.map((assignment) => (
            <div
              key={assignment.clerk_user_id}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border border-border rounded-md px-2 py-1.5"
            >
              <span className="text-sm truncate" title={memberLabelByUserId.get(assignment.clerk_user_id)}>
                {memberLabelByUserId.get(assignment.clerk_user_id) || assignment.clerk_user_id}
              </span>
              <select
                className="border border-border rounded px-2 py-1 text-xs"
                value={assignment.assignment_role}
                onChange={(event) => updateRole(
                  assignment.clerk_user_id,
                  event.target.value as EngagementStaffAssignment['assignment_role']
                )}
                aria-label={`Role for ${memberLabelByUserId.get(assignment.clerk_user_id) || assignment.clerk_user_id}`}
              >
                {ENGAGEMENT_ASSIGNMENT_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {formatEngagementAssignmentRole(role)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="text-xs text-red-700 hover:underline"
                onClick={() => removeAssignment(assignment.clerk_user_id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {availableToAdd.length > 0 && (
        <label className="flex items-center gap-2 mt-3 text-sm">
          <span className="text-text-light shrink-0">Add employee</span>
          <select
            className="flex-1 border border-border rounded-md px-2 py-1 text-sm"
            defaultValue=""
            onChange={(event) => {
              addAssignment(event.target.value)
              event.target.value = ''
            }}
          >
            <option value="" disabled>Select employee</option>
            {availableToAdd.map((member) => (
              <option key={member.clerk_user_id} value={member.clerk_user_id}>
                {member.display_name || member.email || member.clerk_user_id}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex items-center justify-between gap-2 mt-3 border-t border-border pt-2">
        <p className="text-xs text-text-light">
          {assignments.length} assigned · Preparer/reviewer sync to engagement workflow
        </p>
        <button
          type="button"
          className="text-xs font-medium text-primary-dark hover:underline"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => props.api?.stopEditing()}
        >
          Apply
        </button>
      </div>
    </div>
  )
})

AssignedEmployeesCellEditor.displayName = 'AssignedEmployeesCellEditor'

export default AssignedEmployeesCellEditor
