import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { CellEditingStoppedEvent, ColDef, GridApi, ICellRendererParams, RowClassParams } from 'ag-grid-community'
import AgGridTable from '../../working-papers/components/grid/AgGridTable'
import AssignedEmployeesCellEditor from './AssignedEmployeesCellEditor'
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
  period_start?: string
  period_end?: string
  due_date?: string | null
  source_type?: string
  deliverables?: string[] | null
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

function formatEmployeeLabels (
  employeeIds: string[] | undefined,
  memberLabelByUserId: Map<string, string>
): string {
  const ids = Array.isArray(employeeIds) ? employeeIds : []
  if (ids.length === 0) return '—'
  return ids.map((id) => memberLabelByUserId.get(id) || id).join(', ')
}

function toDateInput (value: unknown): string {
  if (!value) return ''
  return String(value).slice(0, 10)
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
      ...(Array.isArray(filteredEngagements) ? filteredEngagements : [])
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

  const saveEngagementAssignments = async (engagementId: string, clerkUserIds: string[]) => {
    await portalFetch(`/v1/accounting/engagements/${engagementId}/assignments`, getToken, {
      method: 'PUT',
      body: JSON.stringify({ clerkUserIds })
    })
  }

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
        const assignees = Array.isArray(row.assigned_employee_ids) && row.assigned_employee_ids.length > 0
          ? row.assigned_employee_ids
          : defaultAssigneeIds
        if (assignees.length === 0) {
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
            periodStart: toDateInput(row.period_start) || `${new Date().getFullYear()}-01-01`,
            periodEnd: toDateInput(row.period_end) || `${new Date().getFullYear()}-12-31`,
            dueDate: row.due_date ? toDateInput(row.due_date) : null,
            sourceType: row.source_type || 'csv',
            status: row.status || 'draft',
            reviewFlowStatus: row.review_flow_status || 'not_started',
            deliverables: [],
            clerkUserIds: assignees
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
            periodStart: toDateInput(row.period_start),
            periodEnd: toDateInput(row.period_end),
            dueDate: row.due_date ? toDateInput(row.due_date) : null,
            sourceType: row.source_type || 'csv',
            status: row.status || 'draft',
            reviewFlowStatus: row.review_flow_status || 'not_started',
            deliverables: Array.isArray(row.deliverables) ? row.deliverables : []
          })
        })
        if (Array.isArray(row.assigned_employee_ids) && row.assigned_employee_ids.length > 0) {
          await saveEngagementAssignments(row.id, row.assigned_employee_ids)
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

    if (event.colDef.field === 'client_id') {
      row.client_name = clientNameById.get(String(row.client_id || '')) || row.client_name
    }

    if (event.colDef.field === 'assigned_employee_ids') {
      const assignees = Array.isArray(row.assigned_employee_ids) ? row.assigned_employee_ids : []
      if (assignees.length === 0) {
        onError('Assign at least one employee to the engagement.')
        return
      }
      if (row.isNew) {
        setDraftRows((prev) => prev.map((draft) => (draft.id === row.id ? { ...row } : draft)))
        if (!String(row.name || '').trim() || !String(row.client_id || '').trim()) return
      }
      await persistRow(row)
      return
    }

    if (row.isNew) {
      if (!String(row.name || '').trim() || !String(row.client_id || '').trim()) return
      await persistRow(row)
      return
    }

    await persistRow(row)
  }, [clientNameById, onError, persistRow])

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
      colId: 'actions',
      headerName: 'Actions',
      width: 120,
      maxWidth: 130,
      pinned: 'right',
      sortable: false,
      filter: false,
      editable: false,
      resizable: false,
      suppressHeaderMenuButton: true,
      cellRenderer: EngagementActionsCell
    },
    {
      field: 'name',
      headerName: 'Engagement',
      editable: true,
      flex: 1.4,
      minWidth: 160
    },
    {
      field: 'client_id',
      headerName: clientLabel,
      editable: true,
      flex: 1.2,
      minWidth: 140,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['', ...clientIds] },
      valueFormatter: (params) => clientNameById.get(String(params.value || '')) || params.data?.client_name || '—'
    },
    {
      field: 'engagement_type',
      headerName: 'Type',
      editable: true,
      flex: 1,
      minWidth: 130,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: engagementTypeOptions },
      valueFormatter: (params) => formatTypeLabel(String(params.value || ''))
    },
    {
      field: 'status',
      headerName: 'Status',
      editable: true,
      flex: 0.8,
      minWidth: 110,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: statusOptions }
    },
    {
      field: 'assigned_employee_ids',
      headerName: 'Assigned employees',
      flex: 1.4,
      minWidth: 180,
      editable: true,
      sortable: false,
      filter: false,
      cellEditor: AssignedEmployeesCellEditor,
      cellEditorPopup: true,
      valueFormatter: (params) => formatEmployeeLabels(
        Array.isArray(params.value) ? params.value : params.data?.assigned_employee_ids,
        memberLabelByUserId
      )
    },
    {
      field: 'period_end',
      headerName: 'Period end',
      editable: true,
      flex: 0.9,
      minWidth: 120,
      cellEditor: 'agDateCellEditor',
      valueFormatter: (params) => (params.value ? new Date(params.value).toLocaleDateString() : '—'),
      valueParser: (params) => toDateInput(params.newValue)
    },
    {
      field: 'due_date',
      headerName: 'Due date',
      editable: true,
      flex: 0.9,
      minWidth: 120,
      cellEditor: 'agDateCellEditor',
      valueFormatter: (params) => (params.value ? new Date(params.value).toLocaleDateString() : '—'),
      valueParser: (params) => toDateInput(params.newValue) || null
    }
  ] as ColDef<EngagementRecord>[]), [clientIds, clientLabel, clientNameById, memberLabelByUserId])

  const gridDefaultColDef = useMemo<ColDef<EngagementRecord>>(
    () => ({
      sortable: true,
      filter: false,
      resizable: true,
      suppressHeaderMenuButton: true,
      suppressHeaderFilterButton: true
    }),
    []
  )

  const gridOptions = useMemo(() => ({
    context: gridContext,
    singleClickEdit: true,
    stopEditingWhenCellsLoseFocus: true,
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
          Click a cell to edit, or use Edit in the actions column. Click Assigned employees to select multiple staff.
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
