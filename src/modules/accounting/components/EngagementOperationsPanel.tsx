import { FC, FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AgGridTable from '../../working-papers/components/grid/AgGridTable'
import { portalFetch } from '../../../lib/portalApi'

const engagementTypeOptions = [
  'year_end_working_papers',
  'review_engagement',
  'compilation',
  'tax_engagement',
  'audit',
  'other'
]

const sourceTypeOptions = ['qbo', 'excel', 'csv', 'google_sheets', 'manual']
const statusOptions = ['draft', 'active', 'in_review', 'completed', 'archived']

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
  due_date?: string
  source_type?: string
  deliverables?: string[]
  assigned_employee_ids?: string[]
  assigned_employee_count?: number
}

type ClientRecord = { id: string; name: string }
type WorkspaceMember = { clerk_user_id: string; display_name?: string; email?: string; role?: string; status?: string }

export type EngagementEditorMode = 'create' | 'edit' | null

export type EngagementFormState = {
  clientId: string
  name: string
  engagementType: string
  fiscalYear: number
  periodStart: string
  periodEnd: string
  dueDate: string
  sourceType: string
  status: string
  reviewFlowStatus: string
  deliverablesText: string
  assignedEmployeeIds: string[]
}

const defaultEngagementForm = (): EngagementFormState => ({
  clientId: '',
  name: '',
  engagementType: 'year_end_working_papers',
  fiscalYear: new Date().getFullYear(),
  periodStart: `${new Date().getFullYear()}-01-01`,
  periodEnd: `${new Date().getFullYear()}-12-31`,
  dueDate: '',
  sourceType: 'csv',
  status: 'draft',
  reviewFlowStatus: 'not_started',
  deliverablesText: '',
  assignedEmployeeIds: []
})

function parseDeliverablesText (value: string): string[] {
  return String(value || '')
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function formatEmployeeLabels (
  employeeIds: string[] | undefined,
  memberLabelByUserId: Map<string, string>
): string {
  const ids = Array.isArray(employeeIds) ? employeeIds : []
  if (ids.length === 0) return '—'
  return ids.map((id) => memberLabelByUserId.get(id) || id).join(', ')
}

type EngagementOperationsPanelProps = {
  getToken: () => Promise<string | null>
  selectedWorkspaceId: string
  clientLabel: string
  clientLabelPlural: string
  clients: ClientRecord[]
  workspaceMembers: WorkspaceMember[]
  engagements: EngagementRecord[]
  loading: boolean
  saving: boolean
  initialEditorMode?: EngagementEditorMode
  onReloadEngagements: () => Promise<void>
  onCreateClient: (name: string) => Promise<ClientRecord | null>
  onDeleteSelected: (engagementIds: string[]) => Promise<void>
  onError: (message: string | null) => void
  onNotice: (message: string | null) => void
  onSavingChange: (saving: boolean) => void
}

const EngagementOperationsPanel: FC<EngagementOperationsPanelProps> = ({
  getToken,
  selectedWorkspaceId,
  clientLabel,
  clientLabelPlural,
  clients,
  workspaceMembers,
  engagements,
  loading,
  saving,
  initialEditorMode = null,
  onReloadEngagements,
  onCreateClient,
  onDeleteSelected,
  onError,
  onNotice,
  onSavingChange
}) => {
  const navigate = useNavigate()
  const [editorMode, setEditorMode] = useState<EngagementEditorMode>(initialEditorMode)
  const [editingEngagementId, setEditingEngagementId] = useState<string | null>(null)
  const [form, setForm] = useState<EngagementFormState>(defaultEngagementForm)
  const [newClientName, setNewClientName] = useState('')
  const [selectedEngagementIds, setSelectedEngagementIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')

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

  const filteredEngagements = useMemo(() => {
    const term = search.trim().toLowerCase()
    return engagements.filter((engagement) => {
      if (statusFilter && engagement.status !== statusFilter) return false
      if (clientFilter && engagement.client_id !== clientFilter) return false
      if (!term) return true
      return (
        String(engagement.name || '').toLowerCase().includes(term) ||
        String(engagement.client_name || '').toLowerCase().includes(term)
      )
    })
  }, [clientFilter, engagements, search, statusFilter])

  const primarySelectedEngagementId = selectedEngagementIds.length === 1 ? selectedEngagementIds[0] : null

  const resetEditor = useCallback(() => {
    setEditorMode(null)
    setEditingEngagementId(null)
    setForm(defaultEngagementForm())
    setNewClientName('')
  }, [])

  useEffect(() => {
    if (initialEditorMode === 'create') {
      setEditorMode('create')
      setEditingEngagementId(null)
      setForm(defaultEngagementForm())
    }
  }, [initialEditorMode])

  const openCreateEditor = () => {
    setEditorMode('create')
    setEditingEngagementId(null)
    setForm(defaultEngagementForm())
    onError(null)
  }

  const openEditEditor = async (engagementId: string) => {
    const engagement = engagements.find((row) => row.id === engagementId)
    if (!engagement) return
    onError(null)
    setEditorMode('edit')
    setEditingEngagementId(engagementId)
    let assignedEmployeeIds = Array.isArray(engagement.assigned_employee_ids)
      ? [...engagement.assigned_employee_ids]
      : []
    try {
      const assignmentData = await portalFetch<{ assignments: Array<{ clerk_user_id: string }> }>(
        `/v1/accounting/engagements/${engagementId}/assignments`,
        getToken
      )
      assignedEmployeeIds = (assignmentData.assignments || []).map((row) => row.clerk_user_id)
    } catch {
      // Fall back to list payload when assignment endpoint is unavailable.
    }
    setForm({
      clientId: engagement.client_id || '',
      name: engagement.name || '',
      engagementType: engagement.engagement_type || 'year_end_working_papers',
      fiscalYear: Number(engagement.fiscal_year || new Date().getFullYear()),
      periodStart: engagement.period_start ? String(engagement.period_start).slice(0, 10) : defaultEngagementForm().periodStart,
      periodEnd: engagement.period_end ? String(engagement.period_end).slice(0, 10) : defaultEngagementForm().periodEnd,
      dueDate: engagement.due_date ? String(engagement.due_date).slice(0, 10) : '',
      sourceType: engagement.source_type || 'csv',
      status: engagement.status || 'draft',
      reviewFlowStatus: engagement.review_flow_status || 'not_started',
      deliverablesText: Array.isArray(engagement.deliverables) ? engagement.deliverables.join('\n') : '',
      assignedEmployeeIds
    })
  }

  const toggleAssignedEmployee = (clerkUserId: string) => {
    setForm((prev) => {
      const set = new Set(prev.assignedEmployeeIds)
      if (set.has(clerkUserId)) set.delete(clerkUserId)
      else set.add(clerkUserId)
      return { ...prev, assignedEmployeeIds: Array.from(set) }
    })
  }

  const saveEngagementAssignments = async (engagementId: string, clerkUserIds: string[]) => {
    await portalFetch(`/v1/accounting/engagements/${engagementId}/assignments`, getToken, {
      method: 'PUT',
      body: JSON.stringify({ clerkUserIds })
    })
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedWorkspaceId) {
      onError('Select a workspace before saving an engagement.')
      return
    }
    const resolvedClientId = String(form.clientId || '').trim()
    if (!resolvedClientId) {
      onError(`Select a ${clientLabel.toLowerCase()} for this engagement.`)
      return
    }
    if (!form.name.trim()) {
      onError('Engagement name is required.')
      return
    }
    if (form.assignedEmployeeIds.length === 0) {
      onError('Assign at least one employee to the engagement.')
      return
    }

    onSavingChange(true)
    onError(null)
    try {
      if (editorMode === 'create') {
        await portalFetch<{ engagement: { id: string } }>('/v1/accounting/engagements', getToken, {
          method: 'POST',
          body: JSON.stringify({
            clientId: resolvedClientId,
            name: form.name.trim(),
            engagementType: form.engagementType,
            fiscalYear: form.fiscalYear,
            periodStart: form.periodStart,
            periodEnd: form.periodEnd,
            dueDate: form.dueDate || null,
            sourceType: form.sourceType,
            status: form.status,
            reviewFlowStatus: form.reviewFlowStatus,
            deliverables: parseDeliverablesText(form.deliverablesText),
            clerkUserIds: form.assignedEmployeeIds
          })
        })
        onNotice('Engagement created.')
        resetEditor()
        await onReloadEngagements()
        return
      }

      if (editorMode === 'edit' && editingEngagementId) {
        await portalFetch(`/v1/accounting/engagements/${editingEngagementId}`, getToken, {
          method: 'PATCH',
          body: JSON.stringify({
            clientId: resolvedClientId,
            name: form.name.trim(),
            engagementType: form.engagementType,
            fiscalYear: form.fiscalYear,
            periodStart: form.periodStart,
            periodEnd: form.periodEnd,
            dueDate: form.dueDate || null,
            sourceType: form.sourceType,
            status: form.status,
            reviewFlowStatus: form.reviewFlowStatus,
            deliverables: parseDeliverablesText(form.deliverablesText)
          })
        })
        await saveEngagementAssignments(editingEngagementId, form.assignedEmployeeIds)
        onNotice('Engagement updated.')
        resetEditor()
        await onReloadEngagements()
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not save engagement')
    } finally {
      onSavingChange(false)
    }
  }

  const columnDefs = useMemo(() => ([
    { field: 'name', headerName: 'Engagement', minWidth: 220 },
    { field: 'client_name', headerName: clientLabel, minWidth: 180 },
    { field: 'engagement_type', headerName: 'Type', minWidth: 160 },
    { field: 'status', headerName: 'Status', minWidth: 120 },
    {
      headerName: 'Assigned employees',
      minWidth: 220,
      valueGetter: (params: any) => formatEmployeeLabels(params.data?.assigned_employee_ids, memberLabelByUserId)
    },
    {
      field: 'period_end',
      headerName: 'Period end',
      minWidth: 130,
      valueFormatter: (params: any) => (params.value ? new Date(params.value).toLocaleDateString() : '—')
    },
    {
      field: 'due_date',
      headerName: 'Due date',
      minWidth: 130,
      valueFormatter: (params: any) => (params.value ? new Date(params.value).toLocaleDateString() : '—')
    }
  ]), [clientLabel, memberLabelByUserId])

  const gridOptions = useMemo(() => ({
    theme: 'legacy' as const,
    rowSelection: { mode: 'multiRow' as const },
    onSelectionChanged: (event: any) => {
      const selected = event.api.getSelectedRows().map((row: any) => String(row.id))
      setSelectedEngagementIds(selected)
    },
    onRowDoubleClicked: (event: any) => {
      const rowId = String(event.data?.id || '')
      if (!rowId) return
      void openEditEditor(rowId)
    }
  }), [])

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn--primary text-sm py-2 px-4" onClick={openCreateEditor}>
            New engagement
          </button>
          <button
            type="button"
            className="btn btn--secondary text-sm py-2 px-4"
            disabled={!primarySelectedEngagementId}
            onClick={() => {
              if (!primarySelectedEngagementId) return
              void openEditEditor(primarySelectedEngagementId)
            }}
          >
            Edit selected
          </button>
          <button
            type="button"
            className="btn btn--secondary text-sm py-2 px-4"
            disabled={selectedEngagementIds.length === 0 || saving}
            onClick={() => { void onDeleteSelected(selectedEngagementIds) }}
          >
            Delete selected
          </button>
          <button
            type="button"
            className="btn btn--secondary text-sm py-2 px-4"
            disabled={!primarySelectedEngagementId}
            onClick={() => {
              if (!primarySelectedEngagementId) return
              navigate(`/portal/accounting/working-papers/engagements/${primarySelectedEngagementId}`)
            }}
          >
            Open working papers
          </button>
          {editorMode && (
            <button type="button" className="btn btn--secondary text-sm py-2 px-4" onClick={resetEditor}>
              Close editor
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            className="border border-border rounded-md px-3 py-2 text-sm min-w-64"
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
        </div>
      </div>

      {editorMode && (
        <form className="rounded-lg border border-border bg-white p-5 space-y-4" onSubmit={(event) => { void onSubmit(event) }}>
          <h3 className="font-semibold text-primary-dark">
            {editorMode === 'create' ? 'Create engagement' : 'Edit engagement'}
          </h3>
          <p className="text-sm text-text-light">
            Select the {clientLabel.toLowerCase()} for this engagement and assign one or more employees. Employees can be assigned to multiple engagements.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-text-light mb-1">{clientLabel}</label>
              <select
                className="border border-border rounded-md px-3 py-2 text-sm w-full"
                value={form.clientId}
                onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
                required
              >
                <option value="">{`Select ${clientLabel.toLowerCase()}`}</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-light mb-1">Quick add {clientLabel.toLowerCase()}</label>
              <div className="flex gap-2">
                <input
                  className="border border-border rounded-md px-3 py-2 text-sm w-full"
                  placeholder={`New ${clientLabel.toLowerCase()} name`}
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn--secondary text-sm py-2 px-3"
                  disabled={saving}
                  onClick={() => {
                    void (async () => {
                      const created = await onCreateClient(newClientName)
                      if (created?.id) {
                        setForm((prev) => ({ ...prev, clientId: created.id }))
                        setNewClientName('')
                      }
                    })()
                  }}
                >
                  Add
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-light mb-1">Engagement name</label>
              <input className="border border-border rounded-md px-3 py-2 text-sm w-full" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs text-text-light mb-1">Engagement type</label>
              <select className="border border-border rounded-md px-3 py-2 text-sm w-full" value={form.engagementType} onChange={(e) => setForm((prev) => ({ ...prev, engagementType: e.target.value }))}>
                {engagementTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-light mb-1">Status</label>
              <select className="border border-border rounded-md px-3 py-2 text-sm w-full" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
                {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-light mb-1">Fiscal year</label>
              <input type="number" className="border border-border rounded-md px-3 py-2 text-sm w-full" value={form.fiscalYear} onChange={(e) => setForm((prev) => ({ ...prev, fiscalYear: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-xs text-text-light mb-1">Period start</label>
              <input type="date" className="border border-border rounded-md px-3 py-2 text-sm w-full" value={form.periodStart} onChange={(e) => setForm((prev) => ({ ...prev, periodStart: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-text-light mb-1">Period end</label>
              <input type="date" className="border border-border rounded-md px-3 py-2 text-sm w-full" value={form.periodEnd} onChange={(e) => setForm((prev) => ({ ...prev, periodEnd: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-text-light mb-1">Due date</label>
              <input type="date" className="border border-border rounded-md px-3 py-2 text-sm w-full" value={form.dueDate} onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-text-light mb-1">Source type</label>
              <select className="border border-border rounded-md px-3 py-2 text-sm w-full" value={form.sourceType} onChange={(e) => setForm((prev) => ({ ...prev, sourceType: e.target.value }))}>
                {sourceTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs text-text-light mb-1">Deliverables</label>
              <textarea className="border border-border rounded-md px-3 py-2 text-sm w-full min-h-[80px]" value={form.deliverablesText} onChange={(e) => setForm((prev) => ({ ...prev, deliverablesText: e.target.value }))} />
            </div>
          </div>
          <div className="rounded-md border border-border p-3 space-y-2">
            <p className="text-sm font-medium text-primary-dark">Assigned employees</p>
            {activeMembers.length === 0 ? (
              <p className="text-sm text-text-light">No active workspace employees available. Invite employees first.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {activeMembers.map((member) => (
                  <label key={member.clerk_user_id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.assignedEmployeeIds.includes(member.clerk_user_id)}
                      onChange={() => toggleAssignedEmployee(member.clerk_user_id)}
                    />
                    <span>{memberLabelByUserId.get(member.clerk_user_id) || member.clerk_user_id}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="btn btn--primary text-sm py-2 px-4" disabled={saving}>
            {saving ? 'Saving…' : editorMode === 'create' ? 'Create engagement' : 'Save changes'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-text-light">Loading engagements…</p>
      ) : (
        <AgGridTable
          rowData={filteredEngagements}
          height={420}
          columnDefs={columnDefs}
          gridOptions={gridOptions}
          quickFilterText={search}
        />
      )}
      {!loading && filteredEngagements.length === 0 && (
        <p className="text-sm text-text-light">No engagements match the current filters.</p>
      )}
    </div>
  )
}

export default EngagementOperationsPanel
