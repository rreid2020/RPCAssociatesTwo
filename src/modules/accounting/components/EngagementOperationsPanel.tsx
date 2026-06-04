import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { CellEditingStoppedEvent, ColDef, GridApi, ICellRendererParams, RowClassParams } from 'ag-grid-community'
import AgGridTable from '../../working-papers/components/grid/AgGridTable'
import AssignedEmployeesCellEditor from './AssignedEmployeesCellEditor'
import AssignedEmployeesCellRenderer from './AssignedEmployeesCellRenderer'
import EngagementDateCellEditor from './EngagementDateCellEditor'
import { toEngagementDateInput } from '../utils/engagementDateInput'
import {
  dedupeStaffAssignments,
  formatStaffAssignmentLabels,
  normalizeEngagementStaffAssignments,
  staffAssignmentsFromEmployeeIds,
  toAssignmentApiPayload,
  type EngagementStaffAssignment
} from '../utils/engagementStaffAssignments'
import PageLoadingSkeleton from '../../../shared/loading/PageLoadingSkeleton'
import { portalFetch } from '../../../lib/portalApi'

const engagementTypeOptions = [
  'year_end_working_papers',
  'review_engagement',
  'compilation',
  'tax_engagement',
  'audit',
  'other'
]

const statusOptions = ['draft', 'active', 'in_review', 'completed', 'archived']

const formatTypeLabel = (value: string) => String(value || '').replace(/_/g, ' ')

type EngagementRecord = {
  id: string
  name: string
  client_id?: string
  client_name?: string
  engagement_type?: string
  status?: string
  review_flow_status?: string | null
  fiscal_year?: number
  period_start?: string | null
  period_end?: string | null
  due_date?: string | null
  source_type?: string
  deliverables?: string[] | null
  assigned_employees?: EngagementStaffAssignment[]
  assigned_employee_ids?: string[]
  isNew?: boolean
}

type ClientRecord = { id: string; name: string }
type WorkspaceMember = { clerk_user_id: string; display_name?: string; email?: string; role?: string; status?: string }

type EngagementGridContext = {
  onEdit: (row: EngagementRecord) => void
  onDelete: (row: EngagementRecord) => void
  activeMembers: WorkspaceMember[]
  saving: boolean
}

function resolveRowStaffing (row: EngagementRecord): EngagementStaffAssignment[] {
  const assignments = normalizeEngagementStaffAssignments(row.assigned_employees)
  if (assignments.length > 0) return assignments
  return staffAssignmentsFromEmployeeIds(row.assigned_employee_ids)
}

function createDraftRow (): EngagementRecord {
  const year = new Date().getFullYear()
  return {
    id: `draft-${Date.now()}`,
    isNew: true,
    name: '',
    client_id: '',
    client_name: '',
    engagement_type: 'year_end_working_papers',
    status: 'draft',
    review_flow_status: 'not_started',
    fiscal_year: year,
    period_start: `${year}-01-01`,
    period_end: `${year}-12-31`,
    due_date: null,
    source_type: 'csv',
    assigned_employees: [],
    assigned_employee_ids: []
  }
}

const EngagementActionsCell: FC<ICellRendererParams<EngagementRecord, unknown, EngagementGridContext>> = (params) => {
  const row = params.data
  const context = params.context
  if (!row || !context) return null

  return (
    <div className="flex h-full items-center gap-2">
      <button
        type="button"
        className="text-xs font-medium text-primary-dark hover:underline disabled:opacity-50"
        disabled={context.saving}
        onClick={() => context.onEdit(row)}
      >
        Edit
      </button>
      <button
        type="button"
        className="text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
        disabled={context.saving}
        onClick={() => context.onDelete(row)}
      >
        {row.isNew ? 'Cancel' : 'Delete'}
      </button>
    </div>
  )
}

type EngagementOperationsPanelProps = {
  getToken: () => Promise<string | null>
  accountReady: boolean
  clientLabel: string
  clientLabelPlural: string
  clients: ClientRecord[]
  workspaceMembers: WorkspaceMember[]
  engagements: EngagementRecord[]
  loading: boolean
  saving: boolean
  onReloadEngagements: () => Promise<void>
  onDeleteEngagement: (engagementId: string) => Promise<void>
  onError: (message: string | null) => void
  onNotice: (message: string | null) => void
  onSavingChange: (saving: boolean) => void
}

const EngagementOperationsPanel: FC<EngagementOperationsPanelProps> = ({
  getToken,
  accountReady,
  clientLabel,
  clientLabelPlural,
  clients,
  workspaceMembers,
  engagements,
  loading,
  saving,
  onReloadEngagements,
  onDeleteEngagement,
  onError,
  onNotice,
  onSavingChange
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const gridApiRef = useRef<GridApi<EngagementRecord> | null>(null)
  const [draftRows, setDraftRows] = useState<EngagementRecord[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [gridHeight, setGridHeight] = useState(560)
  const createRowRequestedRef = useRef(false)

  const activeMembers = useMemo(
    () => workspaceMembers.filter((member) => member.status === 'active'),
    [workspaceMembers]
  )

  const defaultAssigneeIds = useMemo(
    () => activeMembers.map((member) => member.clerk_user_id).filter(Boolean),
    [activeMembers]
  )

  const memberLabelByUserId = useMemo(() => {
    const map = new Map<string, string>()
    for (const member of activeMembers) {
      const key = String(member.clerk_user_id || '')
      if (!key) continue
      map.set(key, String(member.display_name || member.email || member.clerk_user_id))
    }
    return map
  }, [activeMembers])

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const client of clients) {
      map.set(client.id, client.name)
    }
    return map
  }, [clients])

  const clientIds = useMemo(
    () => (Array.isArray(clients) ? clients : []).map((client) => client.id),
    [clients]
  )

  const filteredEngagements = useMemo(() => {
    const term = search.trim().toLowerCase()
    const rows = Array.isArray(engagements) ? engagements : []
    return rows.filter((engagement) => {
      if (statusFilter && engagement.status !== statusFilter) return false
      if (clientFilter && engagement.client_id !== clientFilter) return false
      if (!term) return true
      return (
        String(engagement.name || '').toLowerCase().includes(term) ||
        String(engagement.client_name || '').toLowerCase().includes(term)
      )
    })
  }, [clientFilter, engagements, search, statusFilter])

  const gridRows = useMemo(
    () => [
      ...(Array.isArray(draftRows) ? draftRows : []),
      ...(Array.isArray(filteredEngagements) ? filteredEngagements : []).map((engagement) => ({
        ...engagement,
        ...(() => {
          const assigned_employees = normalizeEngagementStaffAssignments(engagement.assigned_employees).length > 0
            ? normalizeEngagementStaffAssignments(engagement.assigned_employees)
            : staffAssignmentsFromEmployeeIds(engagement.assigned_employee_ids)
          return {
            assigned_employees,
            assigned_employee_ids: assigned_employees.map((entry) => entry.clerk_user_id)
          }
        })(),
        period_end: toEngagementDateInput(engagement.period_end) ?? engagement.period_end,
        due_date: toEngagementDateInput(engagement.due_date)
      }))
    ],
    [draftRows, filteredEngagements]
  )

  const addDraftRow = useCallback(() => {
    setDraftRows((prev) => [createDraftRow(), ...prev])
    onError(null)
  }, [onError])

  useEffect(() => {
    const updateHeight = () => setGridHeight(Math.max(520, window.innerHeight - 260))
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  useEffect(() => {
    if (createRowRequestedRef.current) return
    if (searchParams.get('create') !== '1') return
    createRowRequestedRef.current = true
    addDraftRow()
    const next = new URLSearchParams(searchParams)
    next.delete('create')
    setSearchParams(next, { replace: true })
  }, [addDraftRow, searchParams, setSearchParams])

  const saveEngagementStaffing = async (
    engagementId: string,
    assignments: EngagementStaffAssignment[]
  ) => {
    await portalFetch(`/v1/accounting/engagements/${engagementId}/assignments`, getToken, {
      method: 'PUT',
      body: JSON.stringify({ assignments: toAssignmentApiPayload(assignments) })
    })
  }

  const persistStaffingOnly = useCallback(async (
    row: EngagementRecord,
    assignments: EngagementStaffAssignment[]
  ) => {
    if (!accountReady) {
      onError('Your account is still loading. Try again in a moment.')
      return false
    }
    if (row.isNew) {
      setDraftRows((prev) => prev.map((draft) => (
        draft.id === row.id
          ? {
            ...draft,
            assigned_employees: assignments,
            assigned_employee_ids: assignments.map((entry) => entry.clerk_user_id)
          }
          : draft
      )))
      if (!String(row.name || '').trim() || !String(row.client_id || '').trim()) return true
    }
    if (assignments.length === 0) {
      onError('Assign at least one employee to the engagement.')
      return false
    }

    onSavingChange(true)
    onError(null)
    try {
      if (!row.isNew) {
        await saveEngagementStaffing(row.id, assignments)
      }
      row.assigned_employees = assignments
      row.assigned_employee_ids = assignments.map((entry) => entry.clerk_user_id)
      if (!row.isNew) {
        onNotice('Engagement staffing updated.')
        await onReloadEngagements()
      }
      return true
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not update engagement staffing')
      return false
    } finally {
      onSavingChange(false)
    }
  }, [accountReady, getToken, onError, onNotice, onReloadEngagements, onSavingChange])

  const persistEngagementDates = useCallback(async (
    row: EngagementRecord,
    field: 'period_end' | 'due_date'
  ) => {
    if (!accountReady || row.isNew) return

    const body: { periodEnd?: string | null; dueDate?: string | null } = {}
    if (field === 'period_end') {
      body.periodEnd = toEngagementDateInput(row.period_end)
    }
    if (field === 'due_date') {
      body.dueDate = toEngagementDateInput(row.due_date)
    }

    onSavingChange(true)
    onError(null)
    try {
      await portalFetch(`/v1/accounting/engagements/${row.id}`, getToken, {
        method: 'PATCH',
        body: JSON.stringify(body)
      })
      onNotice(field === 'due_date' ? 'Due date updated.' : 'Period end updated.')
      await onReloadEngagements()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not save engagement dates')
    } finally {
      onSavingChange(false)
    }
  }, [accountReady, getToken, onError, onNotice, onReloadEngagements, onSavingChange])

  const persistRow = useCallback(async (row: EngagementRecord) => {
    if (!accountReady) {
      onError('Your account is still loading. Try again in a moment.')
      return
    }

    const resolvedClientId = String(row.client_id || '').trim()
    if (!resolvedClientId) {
      onError(`Select a ${clientLabel.toLowerCase()} for this engagement.`)
      return
    }
    if (!String(row.name || '').trim()) {
      onError('Engagement name is required.')
      return
    }

    onSavingChange(true)
    onError(null)
    try {
      if (row.isNew) {
        const staffing = resolveRowStaffing(row)
        const resolvedStaffing = staffing.length > 0
          ? staffing
          : defaultAssigneeIds.map((clerk_user_id) => ({
            clerk_user_id,
            assignment_role: 'preparer' as const
          }))
        if (resolvedStaffing.length === 0) {
          onError('Assign at least one employee to the engagement.')
          return
        }
        await portalFetch<{ engagement: { id: string } }>('/v1/accounting/engagements', getToken, {
          method: 'POST',
          body: JSON.stringify({
            clientId: resolvedClientId,
            name: String(row.name).trim(),
            engagementType: row.engagement_type || 'year_end_working_papers',
            fiscalYear: Number(row.fiscal_year || new Date().getFullYear()),
            periodStart: toEngagementDateInput(row.period_start) || `${new Date().getFullYear()}-01-01`,
            periodEnd: toEngagementDateInput(row.period_end) || `${new Date().getFullYear()}-12-31`,
            dueDate: toEngagementDateInput(row.due_date),
            sourceType: row.source_type || 'csv',
            status: row.status || 'draft',
            reviewFlowStatus: row.review_flow_status || 'not_started',
            deliverables: [],
            assignments: toAssignmentApiPayload(resolvedStaffing)
          })
        })
        setDraftRows((prev) => prev.filter((draft) => draft.id !== row.id))
        onNotice('Engagement created.')
      } else {
        await portalFetch(`/v1/accounting/engagements/${row.id}`, getToken, {
          method: 'PATCH',
          body: JSON.stringify({
            clientId: row.client_id,
            name: String(row.name).trim(),
            engagementType: row.engagement_type,
            fiscalYear: Number(row.fiscal_year || new Date().getFullYear()),
            periodStart: toEngagementDateInput(row.period_start),
            periodEnd: toEngagementDateInput(row.period_end),
            dueDate: toEngagementDateInput(row.due_date),
            sourceType: row.source_type || 'csv',
            status: row.status || 'draft',
            reviewFlowStatus: row.review_flow_status || 'not_started',
            deliverables: Array.isArray(row.deliverables) ? row.deliverables : []
          })
        })
        const staffing = resolveRowStaffing(row)
        if (staffing.length > 0) {
          await saveEngagementStaffing(row.id, staffing)
        }
        onNotice('Engagement updated.')
      }
      await onReloadEngagements()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not save engagement')
    } finally {
      onSavingChange(false)
    }
  }, [
    accountReady,
    clientLabel,
    defaultAssigneeIds,
    getToken,
    onError,
    onNotice,
    onReloadEngagements,
    onSavingChange
  ])

  const onCellEditingStopped = useCallback(async (event: CellEditingStoppedEvent<EngagementRecord>) => {
    const row = event.data
    if (!row) return

    const field = event.colDef.field

    if (field === 'client_id') {
      row.client_name = clientNameById.get(String(row.client_id || '')) || row.client_name
    }

    if (field === 'period_end' || field === 'due_date') {
      const parsedDate = toEngagementDateInput(event.newValue ?? row[field])
      row[field] = parsedDate
      if (!row.isNew) {
        await persistEngagementDates(row, field)
        return
      }
    }

    if (field === 'assigned_employees') {
      const assignments = dedupeStaffAssignments(
        normalizeEngagementStaffAssignments(event.newValue ?? row.assigned_employees)
      )
      row.assigned_employees = assignments
      row.assigned_employee_ids = assignments.map((entry) => entry.clerk_user_id)
      if (row.isNew && String(row.name || '').trim() && String(row.client_id || '').trim()) {
        await persistRow({ ...row, assigned_employees: assignments })
        return
      }
      await persistStaffingOnly(row, assignments)
      return
    }

    if (row.isNew) {
      if (!String(row.name || '').trim() || !String(row.client_id || '').trim()) return
      await persistRow(row)
      return
    }

    await persistRow(row)
  }, [clientNameById, persistEngagementDates, persistRow, persistStaffingOnly])

  const handleDelete = useCallback(async (row: EngagementRecord) => {
    if (row.isNew) {
      setDraftRows((prev) => prev.filter((draft) => draft.id !== row.id))
      return
    }
    if (!window.confirm(`Delete "${row.name}" and all related working papers?`)) return
    onSavingChange(true)
    onError(null)
    try {
      await onDeleteEngagement(String(row.id))
      onNotice('Engagement deleted.')
      await onReloadEngagements()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not delete engagement')
    } finally {
      onSavingChange(false)
    }
  }, [onDeleteEngagement, onError, onNotice, onReloadEngagements, onSavingChange])

  const handleEdit = useCallback((row: EngagementRecord) => {
    const api = gridApiRef.current
    if (!api) return
    const rowNode = api.getRowNode(String(row.id))
    if (!rowNode || rowNode.rowIndex == null) return
    api.startEditingCell({ rowIndex: rowNode.rowIndex, colKey: 'name' })
  }, [])

  const gridContext = useMemo<EngagementGridContext>(() => ({
    onEdit: handleEdit,
    onDelete: (row) => { void handleDelete(row) },
    activeMembers,
    saving
  }), [activeMembers, handleDelete, handleEdit, saving])

  const columnDefs = useMemo(() => ([
    {
      field: 'name',
      headerName: 'Engagement',
      editable: true,
      flex: 1.4,
      minWidth: 160,
      filter: 'agTextColumnFilter'
    },
    {
      field: 'client_id',
      headerName: clientLabel,
      editable: true,
      flex: 1.2,
      minWidth: 140,
      filter: 'agTextColumnFilter',
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['', ...clientIds] },
      valueFormatter: (params) => clientNameById.get(String(params.value || '')) || params.data?.client_name || '—',
      filterValueGetter: (params) => clientNameById.get(String(params.data?.client_id || '')) || params.data?.client_name || ''
    },
    {
      field: 'engagement_type',
      headerName: 'Type',
      editable: true,
      flex: 1,
      minWidth: 130,
      filter: 'agTextColumnFilter',
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: engagementTypeOptions },
      valueFormatter: (params) => formatTypeLabel(String(params.value || '')),
      filterValueGetter: (params) => formatTypeLabel(String(params.data?.engagement_type || ''))
    },
    {
      field: 'status',
      headerName: 'Status',
      editable: true,
      flex: 0.8,
      minWidth: 110,
      filter: 'agTextColumnFilter',
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: statusOptions }
    },
    {
      field: 'assigned_employees',
      headerName: 'Assigned employees',
      flex: 1.6,
      minWidth: 220,
      editable: true,
      filter: 'agTextColumnFilter',
      cellRenderer: AssignedEmployeesCellRenderer,
      cellEditor: AssignedEmployeesCellEditor,
      cellEditorPopup: true,
      cellEditorParams: {
        activeMembers: activeMembers
      },
      valueSetter: (params) => {
        if (!params.data) return false
        const assignments = normalizeEngagementStaffAssignments(params.newValue)
        params.data.assigned_employees = assignments
        params.data.assigned_employee_ids = assignments.map((entry) => entry.clerk_user_id)
        return true
      },
      valueParser: (params) => normalizeEngagementStaffAssignments(params.newValue),
      valueFormatter: (params) => formatStaffAssignmentLabels(
        normalizeEngagementStaffAssignments(params.value ?? params.data?.assigned_employees).length > 0
          ? normalizeEngagementStaffAssignments(params.value ?? params.data?.assigned_employees)
          : staffAssignmentsFromEmployeeIds(params.data?.assigned_employee_ids),
        memberLabelByUserId
      ),
      filterValueGetter: (params) => formatStaffAssignmentLabels(
        resolveRowStaffing((params.data || {}) as EngagementRecord),
        memberLabelByUserId
      ),
      comparator: (valueA, valueB) => formatStaffAssignmentLabels(
        normalizeEngagementStaffAssignments(valueA),
        memberLabelByUserId
      ).localeCompare(formatStaffAssignmentLabels(
        normalizeEngagementStaffAssignments(valueB),
        memberLabelByUserId
      ))
    },
    {
      field: 'period_end',
      headerName: 'Period end',
      editable: true,
      flex: 0.9,
      minWidth: 120,
      floatingFilter: false,
      filter: 'agTextColumnFilter',
      cellEditor: EngagementDateCellEditor,
      valueFormatter: (params) => {
        const iso = toEngagementDateInput(params.value)
        return iso ? new Date(`${iso}T12:00:00`).toLocaleDateString() : '—'
      },
      filterValueGetter: (params) => {
        const iso = toEngagementDateInput(params.data?.period_end)
        return iso ? new Date(`${iso}T12:00:00`).toLocaleDateString() : ''
      },
      valueSetter: (params) => {
        if (!params.data) return false
        params.data.period_end = toEngagementDateInput(params.newValue)
        return true
      },
      valueParser: (params) => toEngagementDateInput(params.newValue)
    },
    {
      field: 'due_date',
      headerName: 'Due date',
      editable: true,
      flex: 0.9,
      minWidth: 120,
      floatingFilter: false,
      filter: 'agTextColumnFilter',
      cellEditor: EngagementDateCellEditor,
      valueFormatter: (params) => {
        const iso = toEngagementDateInput(params.value)
        return iso ? new Date(`${iso}T12:00:00`).toLocaleDateString() : '—'
      },
      filterValueGetter: (params) => {
        const iso = toEngagementDateInput(params.data?.due_date)
        return iso ? new Date(`${iso}T12:00:00`).toLocaleDateString() : ''
      },
      valueSetter: (params) => {
        if (!params.data) return false
        params.data.due_date = toEngagementDateInput(params.newValue)
        return true
      },
      valueParser: (params) => toEngagementDateInput(params.newValue)
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      width: 120,
      maxWidth: 130,
      pinned: 'right',
      sortable: false,
      filter: false,
      floatingFilter: false,
      editable: false,
      resizable: false,
      suppressHeaderMenuButton: true,
      cellRenderer: EngagementActionsCell
    }
  ] as ColDef<EngagementRecord>[]), [activeMembers, clientIds, clientLabel, clientNameById, memberLabelByUserId])

  const gridDefaultColDef = useMemo<ColDef<EngagementRecord>>(
    () => ({
      sortable: true,
      filter: true,
      floatingFilter: true,
      resizable: true,
      suppressHeaderMenuButton: false,
      suppressHeaderFilterButton: false
    }),
    []
  )

  const gridOptions = useMemo(() => ({
    context: gridContext,
    singleClickEdit: true,
    stopEditingWhenCellsLoseFocus: false,
    onGridReady: (event: { api: GridApi<EngagementRecord> }) => {
      gridApiRef.current = event.api
    },
    onCellEditingStopped: (event: CellEditingStoppedEvent<EngagementRecord>) => {
      void onCellEditingStopped(event)
    },
    getRowId: (params: { data: EngagementRecord }) => String(params.data.id),
    getRowClass: (params: RowClassParams<EngagementRecord>) => (params.data?.isNew ? 'engagement-draft-row' : '')
  }), [gridContext, onCellEditingStopped])

  return (
    <div className="space-y-3 min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn--primary text-sm py-2 px-4"
          disabled={saving}
          onClick={addDraftRow}
        >
          Add engagement row
        </button>
        <input
          className="border border-border rounded-md px-3 py-2 text-sm min-w-[12rem] flex-1 max-w-md"
          placeholder={`Search engagement or ${clientLabel.toLowerCase()}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="border border-border rounded-md px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select className="border border-border rounded-md px-3 py-2 text-sm" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
          <option value="">{`All ${clientLabelPlural.toLowerCase()}`}</option>
          {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
        </select>
        <p className="text-xs text-text-light w-full sm:w-auto">
          Click a cell to edit, or use Edit in the actions column. Assigned employees: add staff, set role (Preparer, Reviewer, Manager, Member), then Apply. Dates use a standard date picker. Use column headers to sort; use the filter row under headers for column filters.
        </p>
      </div>

      {loading ? (
        <PageLoadingSkeleton variant="table" />
      ) : (
        <AgGridTable
          rowData={gridRows}
          height={gridHeight}
          columnDefs={columnDefs}
          defaultColDef={gridDefaultColDef}
          gridOptions={gridOptions}
          quickFilterText={search}
          fitColumnsToViewport
        />
      )}
      {!loading && gridRows.length === 0 && (
        <p className="text-sm text-text-light">No engagements match the current filters.</p>
      )}
    </div>
  )
}

export default EngagementOperationsPanel
