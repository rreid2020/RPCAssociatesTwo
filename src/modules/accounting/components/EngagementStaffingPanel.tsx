import { FC, useCallback, useMemo, useRef } from 'react'
import type { CellEditingStoppedEvent, ColDef, GridApi, ICellRendererParams } from 'ag-grid-community'
import AgGridTable from '../../working-papers/components/grid/AgGridTable'
import {
  ENGAGEMENT_ASSIGNMENT_ROLES,
  dedupeStaffAssignments,
  formatEngagementAssignmentRole,
  normalizeEngagementAssignmentRole,
  type EngagementStaffAssignment
} from '../utils/engagementStaffAssignments'

type WorkspaceMember = {
  clerk_user_id: string
  display_name?: string
  email?: string
  role?: string
}

export type StaffingGridRow = EngagementStaffAssignment & {
  display_name: string
}

type StaffingGridContext = {
  onRemove: (clerkUserId: string) => void
  saving: boolean
}

const StaffingRemoveCell: FC<ICellRendererParams<StaffingGridRow, unknown, StaffingGridContext>> = (params) => {
  const row = params.data
  const context = params.context
  if (!row || !context) return null

  return (
    <button
      type="button"
      className="text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
      disabled={context.saving}
      onClick={() => context.onRemove(row.clerk_user_id)}
    >
      Remove
    </button>
  )
}

type EngagementStaffingPanelProps = {
  engagementName: string | null
  engagementIsDraft: boolean
  engagementReady: boolean
  activeMembers: WorkspaceMember[]
  memberLabelByUserId: Map<string, string>
  assignments: EngagementStaffAssignment[]
  onAssignmentsChange: (assignments: EngagementStaffAssignment[]) => void
  saving: boolean
  onSave: () => void | Promise<void>
}

function toStaffingRows (
  assignments: EngagementStaffAssignment[],
  memberLabelByUserId: Map<string, string>
): StaffingGridRow[] {
  return dedupeStaffAssignments(assignments).map((assignment) => ({
    ...assignment,
    display_name: memberLabelByUserId.get(assignment.clerk_user_id) || assignment.clerk_user_id
  }))
}

/** AG Grid needs header + row area; previous formula clipped the last row. */
function staffingGridHeight (rowCount: number): number {
  if (rowCount <= 0) return 0
  const headerPx = 56
  const rowPx = 48
  const paddingPx = 28
  return Math.min(420, Math.max(228, headerPx + rowCount * rowPx + paddingPx))
}

const EngagementStaffingPanel: FC<EngagementStaffingPanelProps> = ({
  engagementName,
  engagementIsDraft,
  engagementReady,
  activeMembers,
  memberLabelByUserId,
  assignments,
  onAssignmentsChange,
  saving,
  onSave
}) => {
  const gridApiRef = useRef<GridApi<StaffingGridRow> | null>(null)

  const gridRows = useMemo(
    () => toStaffingRows(assignments, memberLabelByUserId),
    [assignments, memberLabelByUserId]
  )

  const assignedUserIds = useMemo(
    () => new Set(assignments.map((entry) => entry.clerk_user_id)),
    [assignments]
  )

  const availableToAdd = useMemo(
    () => activeMembers.filter((member) => !assignedUserIds.has(member.clerk_user_id)),
    [activeMembers, assignedUserIds]
  )

  const handleRemove = useCallback((clerkUserId: string) => {
    onAssignmentsChange(assignments.filter((entry) => entry.clerk_user_id !== clerkUserId))
  }, [assignments, onAssignmentsChange])

  const handleAddEmployee = useCallback((clerkUserId: string) => {
    if (!clerkUserId || assignedUserIds.has(clerkUserId)) return
    onAssignmentsChange(dedupeStaffAssignments([
      ...assignments,
      { clerk_user_id: clerkUserId, assignment_role: 'partner' }
    ]))
  }, [assignedUserIds, assignments, onAssignmentsChange])

  const onCellEditingStopped = useCallback((event: CellEditingStoppedEvent<StaffingGridRow>) => {
    const row = event.data
    if (!row || event.colDef.field !== 'assignment_role') return
    const role = normalizeEngagementAssignmentRole(event.newValue ?? row.assignment_role)
    onAssignmentsChange(assignments.map((entry) => (
      entry.clerk_user_id === row.clerk_user_id
        ? { ...entry, assignment_role: role }
        : entry
    )))
  }, [assignments, onAssignmentsChange])

  const gridContext = useMemo<StaffingGridContext>(() => ({
    onRemove: handleRemove,
    saving
  }), [handleRemove, saving])

  const columnDefs = useMemo<ColDef<StaffingGridRow>[]>(() => [
    {
      field: 'display_name',
      headerName: 'Employee',
      flex: 1.4,
      minWidth: 180,
      editable: false,
      filter: 'agTextColumnFilter'
    },
    {
      field: 'assignment_role',
      headerName: 'Engagement role',
      flex: 1,
      minWidth: 130,
      editable: true,
      filter: 'agTextColumnFilter',
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: [...ENGAGEMENT_ASSIGNMENT_ROLES] },
      valueFormatter: (params) => formatEngagementAssignmentRole(String(params.value || 'partner'))
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      width: 100,
      maxWidth: 110,
      sortable: false,
      filter: false,
      floatingFilter: false,
      editable: false,
      resizable: false,
      suppressHeaderMenuButton: true,
      cellRenderer: StaffingRemoveCell
    }
  ], [])

  const gridDefaultColDef = useMemo<ColDef<StaffingGridRow>>(
    () => ({
      sortable: true,
      filter: true,
      floatingFilter: false,
      resizable: true
    }),
    []
  )

  const staffingGridHeightPx = useMemo(() => staffingGridHeight(gridRows.length), [gridRows.length])

  const gridOptions = useMemo(() => ({
    context: gridContext,
    singleClickEdit: true,
    onGridReady: (event: { api: GridApi<StaffingGridRow> }) => {
      gridApiRef.current = event.api
    },
    onGridPreDestroyed: () => {
      gridApiRef.current = null
    },
    onCellEditingStopped: (event: CellEditingStoppedEvent<StaffingGridRow>) => {
      onCellEditingStopped(event)
    },
    getRowId: (params: { data: StaffingGridRow }) => params.data.clerk_user_id
  }), [gridContext, onCellEditingStopped])

  if (!engagementName) {
    return (
      <section className="rounded-lg border border-border bg-background p-4">
        <h3 className="text-sm font-semibold text-text">Engagement employees</h3>
        <p className="mt-2 text-sm text-text-light">
          Select an engagement in the table above to assign employees and roles.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-border bg-background p-4 space-y-3 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text">Engagement employees</h3>
          <p className="text-sm text-text-light mt-0.5">
            Staffing for <span className="font-medium text-text">{engagementName}</span>
            {engagementIsDraft ? ' (unsaved draft)' : ''}
          </p>
          <p className="text-xs text-text-light mt-1 max-w-3xl">
            Engagement roles control responsibilities on this engagement only. Organization portal roles are managed separately under Business/Firm Profile → Roles &amp; Permissions.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary text-sm py-2 px-4 disabled:opacity-50"
          disabled={saving || !engagementReady || assignments.length === 0}
          onClick={() => { void onSave() }}
        >
          Save assignments
        </button>
      </div>

      {!engagementReady && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Enter an engagement name and {engagementIsDraft ? 'select a client' : 'save engagement details'} before saving employee assignments.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-text-light shrink-0">Add employee</span>
          <select
            className="border border-border rounded-md px-2 py-1.5 text-sm min-w-[12rem]"
            defaultValue=""
            disabled={saving || availableToAdd.length === 0}
            onChange={(event) => {
              handleAddEmployee(event.target.value)
              event.target.value = ''
            }}
          >
            <option value="" disabled>
              {availableToAdd.length === 0 ? 'All employees assigned' : 'Select employee'}
            </option>
            {availableToAdd.map((member) => (
              <option key={member.clerk_user_id} value={member.clerk_user_id}>
                {member.display_name || member.email || member.clerk_user_id}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-text-light">
          {assignments.length} assigned · Set engagement preparer and reviewer roles to sync workflow leads
        </p>
      </div>

      {gridRows.length === 0 ? (
        <p className="text-sm text-text-light py-6 text-center border border-dashed border-border rounded-md">
          No employees assigned yet. Add at least one employee, then save assignments.
        </p>
      ) : (
        <div className="engagement-staffing-grid min-w-0 pb-1">
          <AgGridTable
            rowData={gridRows}
            height={staffingGridHeightPx}
            columnDefs={columnDefs}
            defaultColDef={gridDefaultColDef}
            gridOptions={gridOptions}
            fitColumnsToViewport
          />
        </div>
      )}
    </section>
  )
}

export default EngagementStaffingPanel
