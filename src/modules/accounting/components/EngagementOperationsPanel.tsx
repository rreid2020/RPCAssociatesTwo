import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { CellEditingStoppedEvent, ColDef, GridApi, ICellRendererParams, RowClassParams, RowSelectedEvent } from 'ag-grid-community'
import AgGridTable, { isActiveGridApi } from '../../working-papers/components/grid/AgGridTable'
import EngagementDateCellEditor from './EngagementDateCellEditor'
import EngagementStaffingPanel from './EngagementStaffingPanel'
import { toEngagementDateInput } from '../utils/engagementDateInput'
import {
  dedupeStaffAssignments,
  normalizeEngagementStaffAssignments,
  staffAssignmentsFromEmployeeIds,
  toAssignmentApiPayload,
  type EngagementStaffAssignment
} from '../utils/engagementStaffAssignments'
import PageLoadingSkeleton from '../../../shared/loading/PageLoadingSkeleton'
import { portalFetch } from '../../../lib/portalApi'
import { useAccountContext } from '../../../platform/account/AccountContextProvider'

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
  canDeleteEngagements: boolean
  saving: boolean
}

function resolveRowStaffing (row: EngagementRecord): EngagementStaffAssignment[] {
  const assignments = normalizeEngagementStaffAssignments(row.assigned_employees)
  if (assignments.length > 0) return assignments
  return staffAssignmentsFromEmployeeIds(row.assigned_employee_ids)
}

function engagementStaffCount (row: EngagementRecord): number {
  return resolveRowStaffing(row).length
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

function isEngagementReadyForStaffing (row: EngagementRecord): boolean {
  return Boolean(String(row.name || '').trim() && String(row.client_id || '').trim())
}

const EngagementActionsCell: FC<ICellRendererParams<EngagementRecord, unknown, EngagementGridContext>> = (params) => {
  const row = params.data
  const context = params.context
  if (!row || !context) return null

  const engagementPath = row.isNew
    ? null
    : `/portal/accounting/working-papers/engagements/${row.id}`

  return (
    <div className="flex h-full items-center gap-2">
      {engagementPath && (
        <Link
          to={engagementPath}
          className="text-xs font-medium text-primary-dark hover:underline"
        >
          Dashboard
        </Link>
      )}
      <button
        type="button"
        className="text-xs font-medium text-primary-dark hover:underline disabled:opacity-50"
        disabled={context.saving}
        onClick={() => context.onEdit(row)}
      >
        Edit
      </button>
      {(context.canDeleteEngagements || row.isNew) && (
        <button
          type="button"
          className="text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
          disabled={context.saving}
          onClick={() => context.onDelete(row)}
        >
          {row.isNew ? 'Cancel' : 'Delete'}
        </button>
      )}
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
  const { account } = useAccountContext()
  const canManageAllEngagements = account?.role === 'owner' || account?.role === 'admin'
  const [searchParams, setSearchParams] = useSearchParams()
  const gridApiRef = useRef<GridApi<EngagementRecord> | null>(null)
  const [draftRows, setDraftRows] = useState<EngagementRecord[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [engagementGridHeight, setEngagementGridHeight] = useState(420)
  const [selectedEngagementId, setSelectedEngagementId] = useState<string | null>(null)
  const [staffingAssignments, setStaffingAssignments] = useState<EngagementStaffAssignment[]>([])
  const createRowRequestedRef = useRef(false)

  const activeMembers = useMemo(
    () => workspaceMembers.filter((member) => member.status === 'active'),
    [workspaceMembers]
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

  const selectedEngagement = useMemo(
    () => gridRows.find((row) => row.id === selectedEngagementId) || null,
    [gridRows, selectedEngagementId]
  )

  const syncSelectionToGrid = useCallback((engagementId: string | null) => {
    const api = gridApiRef.current
    if (!isActiveGridApi(api)) return
    api.forEachNode((node) => {
      const shouldSelect = engagementId != null && String(node.data?.id) === engagementId
      node.setSelected(Boolean(shouldSelect))
    })
  }, [])

  useEffect(() => {
    if (!selectedEngagementId) {
      setStaffingAssignments([])
      return
    }
    const row = gridRows.find((entry) => entry.id === selectedEngagementId)
    setStaffingAssignments(row ? resolveRowStaffing(row) : [])
  }, [gridRows, selectedEngagementId])

  useEffect(() => {
    syncSelectionToGrid(selectedEngagementId)
  }, [gridRows, selectedEngagementId, syncSelectionToGrid])

  useEffect(() => () => {
    gridApiRef.current = null
  }, [])

  const addDraftRow = useCallback(() => {
    const draft = createDraftRow()
    setDraftRows((prev) => [draft, ...prev])
    setSelectedEngagementId(draft.id)
    onError(null)
  }, [onError])

  useEffect(() => {
    const updateHeight = () => {
      const available = window.innerHeight - 560
      setEngagementGridHeight(Math.min(420, Math.max(280, Math.floor(available * 0.38))))
    }
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

  const saveEngagementStaffing = useCallback(async (
    engagementId: string,
    assignments: EngagementStaffAssignment[]
  ) => {
    const result = await portalFetch<{
      assignment?: { assignments?: Array<{ clerk_user_id: string; assignment_role: string }> }
    }>(`/v1/accounting/engagements/${engagementId}/assignments`, getToken, {
      method: 'PUT',
      body: JSON.stringify({ assignments: toAssignmentApiPayload(assignments) })
    })
    const saved = normalizeEngagementStaffAssignments(result?.assignment?.assignments)
    return saved.length > 0 ? saved : assignments
  }, [getToken])

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

  const persistRow = useCallback(async (
    row: EngagementRecord,
    options?: { staffing?: EngagementStaffAssignment[]; selectAfterCreate?: boolean }
  ) => {
    if (!accountReady) {
      onError('Your account is still loading. Try again in a moment.')
      return null
    }

    const resolvedClientId = String(row.client_id || '').trim()
    if (!resolvedClientId) {
      onError(`Select a ${clientLabel.toLowerCase()} for this engagement.`)
      return null
    }
    if (!String(row.name || '').trim()) {
      onError('Engagement name is required.')
      return null
    }

    onSavingChange(true)
    onError(null)
    try {
      if (row.isNew) {
        const staffing = dedupeStaffAssignments(options?.staffing ?? resolveRowStaffing(row))
        const body: Record<string, unknown> = {
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
          deliverables: []
        }
        if (staffing.length > 0) {
          body.assignments = toAssignmentApiPayload(staffing)
        }
        const created = await portalFetch<{ engagement: { id: string } }>('/v1/accounting/engagements', getToken, {
          method: 'POST',
          body: JSON.stringify(body)
        })
        const createdId = String(created?.engagement?.id || '')
        setDraftRows((prev) => prev.filter((draft) => draft.id !== row.id))
        onNotice('Engagement created.')
        await onReloadEngagements()
        if (options?.selectAfterCreate !== false && createdId) {
          setSelectedEngagementId(createdId)
        }
        return createdId || null
      }

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
      onNotice('Engagement updated.')
      await onReloadEngagements()
      return row.id
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not save engagement')
      return null
    } finally {
      onSavingChange(false)
    }
  }, [
    accountReady,
    clientLabel,
    getToken,
    onError,
    onNotice,
    onReloadEngagements,
    onSavingChange
  ])

  const handleSaveStaffing = useCallback(async () => {
    if (!selectedEngagement) {
      onError('Select an engagement first.')
      return
    }
    if (!isEngagementReadyForStaffing(selectedEngagement)) {
      onError(`Enter an engagement name and select a ${clientLabel.toLowerCase()} before saving assignments.`)
      return
    }
    const assignments = dedupeStaffAssignments(staffingAssignments)
    if (assignments.length === 0) {
      onError('Add at least one employee before saving assignments.')
      return
    }

    onSavingChange(true)
    onError(null)
    try {
      if (selectedEngagement.isNew) {
        const createdId = await persistRow(selectedEngagement, {
          staffing: assignments,
          selectAfterCreate: true
        })
        if (createdId) {
          setStaffingAssignments(assignments)
          onNotice('Engagement created with employee assignments.')
        }
        return
      }

      const saved = await saveEngagementStaffing(selectedEngagement.id, assignments)
      setStaffingAssignments(saved)
      onNotice('Engagement staffing updated.')
      await onReloadEngagements()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not save engagement staffing')
    } finally {
      onSavingChange(false)
    }
  }, [
    clientLabel,
    onError,
    onNotice,
    onReloadEngagements,
    onSavingChange,
    persistRow,
    saveEngagementStaffing,
    selectedEngagement,
    staffingAssignments
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

    if (row.isNew) {
      if (!isEngagementReadyForStaffing(row)) return
      await persistRow(row, { staffing: staffingAssignments, selectAfterCreate: true })
      return
    }

    await persistRow(row)
  }, [clientNameById, persistEngagementDates, persistRow, staffingAssignments])

  const handleDelete = useCallback(async (row: EngagementRecord) => {
    if (row.isNew) {
      setDraftRows((prev) => prev.filter((draft) => draft.id !== row.id))
      if (selectedEngagementId === row.id) {
        setSelectedEngagementId(null)
      }
      return
    }
    if (!window.confirm(`Delete "${row.name}" and all related working papers?`)) return
    onSavingChange(true)
    onError(null)
    try {
      await onDeleteEngagement(String(row.id))
      if (selectedEngagementId === row.id) {
        setSelectedEngagementId(null)
      }
      onNotice('Engagement deleted.')
      await onReloadEngagements()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not delete engagement')
    } finally {
      onSavingChange(false)
    }
  }, [onDeleteEngagement, onError, onNotice, onReloadEngagements, onSavingChange, selectedEngagementId])

  const handleEdit = useCallback((row: EngagementRecord) => {
    const api = gridApiRef.current
    if (!isActiveGridApi(api)) return
    const rowNode = api.getRowNode(String(row.id))
    if (!rowNode || rowNode.rowIndex == null) return
    api.startEditingCell({ rowIndex: rowNode.rowIndex, colKey: 'name' })
  }, [])

  const handleRowSelected = useCallback((event: RowSelectedEvent<EngagementRecord>) => {
    if (!event.node.isSelected()) return
    const row = event.data
    if (!row) return
    setSelectedEngagementId(String(row.id))
  }, [])

  const gridContext = useMemo<EngagementGridContext>(() => ({
    onEdit: handleEdit,
    onDelete: (row) => { void handleDelete(row) },
    canDeleteEngagements: canManageAllEngagements,
    saving
  }), [canManageAllEngagements, handleDelete, handleEdit, saving])

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
      colId: 'staff_count',
      headerName: 'Staff',
      flex: 0.5,
      minWidth: 72,
      maxWidth: 90,
      editable: false,
      sortable: true,
      filter: 'agNumberColumnFilter',
      valueGetter: (params) => engagementStaffCount((params.data || {}) as EngagementRecord),
      valueFormatter: (params) => String(params.value ?? 0)
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
      width: 168,
      maxWidth: 180,
      pinned: 'right',
      sortable: false,
      filter: false,
      floatingFilter: false,
      editable: false,
      resizable: false,
      suppressHeaderMenuButton: true,
      cellRenderer: EngagementActionsCell
    }
  ] as ColDef<EngagementRecord>[]), [clientIds, clientLabel, clientNameById])

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
    rowSelection: { mode: 'singleRow' as const, checkboxes: false, enableClickSelection: true },
    onGridReady: (event: { api: GridApi<EngagementRecord> }) => {
      gridApiRef.current = event.api
      syncSelectionToGrid(selectedEngagementId)
    },
    onGridPreDestroyed: () => {
      gridApiRef.current = null
    },
    onRowSelected: (event: RowSelectedEvent<EngagementRecord>) => {
      handleRowSelected(event)
    },
    onCellEditingStopped: (event: CellEditingStoppedEvent<EngagementRecord>) => {
      void onCellEditingStopped(event)
    },
    getRowId: (params: { data: EngagementRecord }) => String(params.data.id),
    getRowClass: (params: RowClassParams<EngagementRecord>) => {
      const classes = []
      if (params.data?.isNew) classes.push('engagement-draft-row')
      if (params.data?.id === selectedEngagementId) classes.push('engagement-selected-row')
      return classes.join(' ')
    }
  }), [gridContext, handleRowSelected, onCellEditingStopped, selectedEngagementId, syncSelectionToGrid])

  return (
    <div className="space-y-4 min-w-0 pb-8">
      <div className="flex flex-wrap items-center gap-2">
        {canManageAllEngagements && (
          <button
            type="button"
            className="btn btn--primary text-sm py-2 px-4"
            disabled={saving}
            onClick={addDraftRow}
          >
            Create New Engagement
          </button>
        )}
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
          Select an engagement row, then assign employees in the grid below. Edit engagement fields inline; use Save assignments for staffing.
        </p>
      </div>

      {loading ? (
        <PageLoadingSkeleton variant="table" />
      ) : (
        <AgGridTable
          rowData={gridRows}
          height={engagementGridHeight}
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

      {!loading && (
        <EngagementStaffingPanel
          engagementName={selectedEngagement ? (String(selectedEngagement.name || '').trim() || 'Untitled engagement') : null}
          engagementIsDraft={Boolean(selectedEngagement?.isNew)}
          engagementReady={selectedEngagement ? isEngagementReadyForStaffing(selectedEngagement) : false}
          activeMembers={activeMembers}
          memberLabelByUserId={memberLabelByUserId}
          assignments={staffingAssignments}
          onAssignmentsChange={setStaffingAssignments}
          saving={saving}
          onSave={handleSaveStaffing}
        />
      )}
    </div>
  )
}

export default EngagementOperationsPanel
