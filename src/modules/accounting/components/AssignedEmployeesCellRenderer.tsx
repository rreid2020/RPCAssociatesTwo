import type { ICellRendererParams } from 'ag-grid-community'
import {
  formatStaffAssignmentLabels,
  normalizeEngagementStaffAssignments,
  staffAssignmentsFromEmployeeIds,
  type EngagementStaffAssignment
} from '../utils/engagementStaffAssignments'

type WorkspaceMember = {
  clerk_user_id: string
  display_name?: string
  email?: string
}

type EngagementRow = {
  assigned_employees?: EngagementStaffAssignment[]
  assigned_employee_ids?: string[]
}

type RendererContext = {
  activeMembers?: WorkspaceMember[]
}

const AssignedEmployeesCellRenderer = (
  params: ICellRendererParams<EngagementRow, EngagementStaffAssignment[] | undefined, RendererContext>
) => {
  const row = params.data
  const assignments = normalizeEngagementStaffAssignments(
    params.value ?? row?.assigned_employees
  )
  const resolved = assignments.length > 0
    ? assignments
    : staffAssignmentsFromEmployeeIds(row?.assigned_employee_ids)

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
