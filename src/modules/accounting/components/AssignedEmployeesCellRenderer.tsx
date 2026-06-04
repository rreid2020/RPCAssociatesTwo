import type { ICellRendererParams } from 'ag-grid-community'
import { normalizeAssignedEmployeeIds } from '../utils/normalizeAssignedEmployeeIds'

type WorkspaceMember = {
  clerk_user_id: string
  display_name?: string
  email?: string
}

type RendererContext = {
  activeMembers?: WorkspaceMember[]
}

function labelForMember (
  clerkUserId: string,
  memberLabelByUserId: Map<string, string>
): string {
  return memberLabelByUserId.get(clerkUserId) || clerkUserId
}

const AssignedEmployeesCellRenderer = (
  params: ICellRendererParams<unknown, string[] | undefined, RendererContext>
) => {
  const ids = normalizeAssignedEmployeeIds(
    params.value ?? params.data?.assigned_employee_ids
  )
  const memberLabelByUserId = new Map<string, string>()
  for (const member of params.context?.activeMembers || []) {
    const key = String(member.clerk_user_id || '')
    if (!key) continue
    memberLabelByUserId.set(key, String(member.display_name || member.email || key))
  }

  if (ids.length === 0) {
    return (
      <span className="text-text-light text-sm italic">
        Click to assign employees
      </span>
    )
  }

  const labels = ids.map((id) => labelForMember(id, memberLabelByUserId))
  const summary = labels.join(', ')

  return (
    <div className="flex h-full min-h-[2rem] flex-col justify-center gap-0.5 py-0.5">
      <span className="text-xs font-medium text-primary-dark">
        {ids.length} {ids.length === 1 ? 'employee' : 'employees'}
      </span>
      <span className="text-sm leading-snug truncate" title={summary}>
        {summary}
      </span>
    </div>
  )
}

export default AssignedEmployeesCellRenderer
