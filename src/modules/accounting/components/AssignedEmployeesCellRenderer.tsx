import type { ICellRendererParams } from 'ag-grid-community'
import {
  formatStaffAssignmentLabels,
  normalizeEngagementStaffAssignments,
  staffAssignmentsFromEmployeeIds
} from '../utils/engagementStaffAssignments'

type WorkspaceMember = {
  clerk_user_id: string
  display_name?: string
  email?: string
}

type RendererContext = {
  activeMembers?: WorkspaceMember[]
}

const AssignedEmployeesCellRenderer = (
  params: ICellRendererParams<unknown, unknown, RendererContext>
) => {
  const assignments = normalizeEngagementStaffAssignments(
    params.value ?? params.data?.assigned_employees
  )
  const resolved = assignments.length > 0
    ? assignments
    : staffAssignmentsFromEmployeeIds(params.data?.assigned_employee_ids)

  const memberLabelByUserId = new Map<string, string>()
  for (const member of params.context?.activeMembers || []) {
    const key = String(member.clerk_user_id || '')
    if (!key) continue
    memberLabelByUserId.set(key, String(member.display_name || member.email || key))
  }

  if (resolved.length === 0) {
    return (
      <span className="text-text-light text-sm italic">
        Click to assign employees and roles
      </span>
    )
  }

  const summary = formatStaffAssignmentLabels(resolved, memberLabelByUserId)

  return (
    <div className="flex h-full min-h-[2rem] flex-col justify-center gap-0.5 py-0.5">
      <span className="text-xs font-medium text-primary-dark">
        {resolved.length} {resolved.length === 1 ? 'assignment' : 'assignments'}
      </span>
      <span className="text-sm leading-snug truncate" title={summary}>
        {summary}
      </span>
    </div>
  )
}

export default AssignedEmployeesCellRenderer
