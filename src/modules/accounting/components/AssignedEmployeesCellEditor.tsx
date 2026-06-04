import { forwardRef, useImperativeHandle, useState } from 'react'
import type { ICellEditorParams } from 'ag-grid-community'
import { normalizeAssignedEmployeeIds } from '../utils/normalizeAssignedEmployeeIds'

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

const AssignedEmployeesCellEditor = forwardRef((
  props: ICellEditorParams<unknown, string[] | undefined, EditorContext> & EditorParams,
  ref
) => {
  const initial = normalizeAssignedEmployeeIds(props.value)
  const [selected, setSelected] = useState<string[]>(initial)
  const members = props.activeMembers || props.context?.activeMembers || []

  useImperativeHandle(ref, () => ({
    getValue: () => [...selected],
    isPopup: () => true
  }))

  const toggleMember = (clerkUserId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(clerkUserId)) next.delete(clerkUserId)
      else next.add(clerkUserId)
      return Array.from(next)
    })
  }

  return (
    <div
      className="min-w-[240px] max-h-56 overflow-y-auto bg-white border border-border rounded-md p-3 shadow-lg"
      role="listbox"
      aria-label="Assigned employees"
    >
      {members.length === 0 ? (
        <p className="text-sm text-text-light">No active employees available.</p>
      ) : (
        members.map((member) => (
          <label
            key={member.clerk_user_id}
            className="flex items-center gap-2 text-sm py-1 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(member.clerk_user_id)}
              onChange={() => toggleMember(member.clerk_user_id)}
            />
            <span>{member.display_name || member.email || member.clerk_user_id}</span>
          </label>
        ))
      )}
      <div className="flex items-center justify-between gap-2 mt-2 border-t border-border pt-2">
        <p className="text-xs text-text-light">
          {selected.length} selected
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
