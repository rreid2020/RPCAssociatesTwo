import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ColDef, GridOptions } from 'ag-grid-community'
import AgGridTable from './grid/AgGridTable'
import PageLoadingSkeleton from '../../../shared/loading/PageLoadingSkeleton'
import { portalFetch } from '../../../lib/portalApi'
import { fetchEngagementDashboardDomain } from '../../../domains/Accounting'
import { downloadBase64File, exportEngagementWorkbookDomain } from '../../../domains/import-export'

type EngagementRecord = {
  id: string
  name: string
  client_name?: string
  engagement_type?: string
  status?: string
  review_flow_status?: string | null
  period_end?: string | null
  due_date?: string | null
  open_review_note_count?: number | null
  unreviewed_lead_sheet_count?: number | null
}

type WorkingPapersWorkspacePanelProps = {
  getToken: () => Promise<string | null>
  clientLabel: string
  engagements: EngagementRecord[]
  listLoading: boolean
  onError: (message: string | null) => void
  onNotice: (message: string | null) => void
}

function formatWorkflowLabel (value: string): string {
  return String(value || 'not_started').replace(/_/g, ' ')
}

const WorkingPapersWorkspacePanel: FC<WorkingPapersWorkspacePanelProps> = ({
  getToken,
  clientLabel,
  engagements,
  listLoading,
  onError,
  onNotice
}) => {
  const [activeEngagementId, setActiveEngagementId] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dashboard, setDashboard] = useState<any | null>(null)

  const activeEngagement = useMemo(
    () => engagements.find((row) => row.id === activeEngagementId) || null,
    [activeEngagementId, engagements]
  )

  const engagementBasePath = activeEngagementId
    ? `/portal/accounting/working-papers/engagements/${activeEngagementId}`
    : null

  const nextReviewFlowStatuses: string[] = useMemo(() => {
    const current = String(dashboard?.engagement?.review_flow_status || activeEngagement?.review_flow_status || 'not_started')
    const fromDashboard = Array.isArray(dashboard?.nextReviewFlowStatuses) ? dashboard.nextReviewFlowStatuses : []
    if (fromDashboard.length > 0) return fromDashboard
    const transitions: Record<string, string[]> = {
      not_started: ['preparer_in_progress'],
      preparer_in_progress: ['reviewer_in_progress', 'review_notes_open'],
      reviewer_in_progress: ['review_notes_open', 'approved'],
      review_notes_open: ['preparer_in_progress', 'reviewer_in_progress', 'approved'],
      approved: ['review_notes_open']
    }
    return transitions[current] || []
  }, [activeEngagement?.review_flow_status, dashboard])

  const loadEngagementDetail = useCallback(async (engagementId: string) => {
    setDetailLoading(true)
    onError(null)
    try {
      const dash = await fetchEngagementDashboardDomain(getToken, engagementId)
      setDashboard(dash)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not load engagement summary')
      setDashboard(null)
    } finally {
      setDetailLoading(false)
    }
  }, [getToken, onError])

  useEffect(() => {
    if (engagements.length === 0) {
      setActiveEngagementId(null)
      return
    }
    if (!activeEngagementId || !engagements.some((row) => row.id === activeEngagementId)) {
      setActiveEngagementId(engagements[0].id)
    }
  }, [activeEngagementId, engagements])

  useEffect(() => {
    if (!activeEngagementId) return
    void loadEngagementDetail(activeEngagementId)
  }, [activeEngagementId, loadEngagementDetail])

  const pickerColumnDefs = useMemo<Array<ColDef<EngagementRecord>>>(
    () => [
      { field: 'name', headerName: 'Engagement', minWidth: 200 },
      { field: 'client_name', headerName: clientLabel, minWidth: 160 },
      { field: 'engagement_type', headerName: 'Type', minWidth: 140 },
      { field: 'status', headerName: 'Status', minWidth: 110 },
      {
        field: 'review_flow_status',
        headerName: 'Review flow',
        minWidth: 140,
        valueGetter: (params) => formatWorkflowLabel(String(params.data?.review_flow_status || 'not_started'))
      },
      {
        headerName: 'Blockers',
        minWidth: 120,
        valueGetter: (params) => {
          const notes = Number(params.data?.open_review_note_count || 0)
          const sheets = Number(params.data?.unreviewed_lead_sheet_count || 0)
          return notes + sheets > 0 ? `${notes} notes / ${sheets} sheets` : 'None'
        }
      }
    ],
    [clientLabel]
  )

  const pickerGridOptions = useMemo<GridOptions<EngagementRecord>>(
    () => ({
      rowSelection: { mode: 'singleRow' },
      onRowClicked: (event) => {
        const id = String(event.data?.id || '')
        if (id) setActiveEngagementId(id)
      },
      onFirstDataRendered: (event) => {
        if (!activeEngagementId && event.api.getDisplayedRowCount() > 0) {
          const first = event.api.getDisplayedRowAtIndex(0)
          if (first) {
            first.setSelected(true)
            setActiveEngagementId(String(first.data?.id || ''))
          }
        }
      }
    }),
    [activeEngagementId]
  )

  const onGenerateLeadSheets = async () => {
    if (!activeEngagementId) return
    setSaving(true)
    onError(null)
    try {
      const result = await portalFetch<{
        summary?: { leadSheetCount?: number; accountCount?: number }
      }>(`/v1/accounting/engagements/${activeEngagementId}/lead-sheets/generate`, getToken, { method: 'POST' })
      const leadSheetCount = result.summary?.leadSheetCount ?? 0
      const accountCount = result.summary?.accountCount ?? 0
      onNotice(
        leadSheetCount > 0
          ? `Generated ${leadSheetCount} lead sheet${leadSheetCount === 1 ? '' : 's'} from ${accountCount} account${accountCount === 1 ? '' : 's'}.`
          : 'No lead sheets were generated.'
      )
      await loadEngagementDetail(activeEngagementId)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not generate lead sheets')
    } finally {
      setSaving(false)
    }
  }

  const onExportWorkbook = async () => {
    if (!activeEngagementId) return
    setSaving(true)
    onError(null)
    try {
      const workbook = await exportEngagementWorkbookDomain(getToken, activeEngagementId)
      downloadBase64File(workbook)
      onNotice('Workbook export downloaded.')
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not export workbook')
    } finally {
      setSaving(false)
    }
  }

  const onAdvanceReviewFlow = async (nextStatus: string) => {
    if (!activeEngagementId) return
    setSaving(true)
    onError(null)
    try {
      await portalFetch(`/v1/accounting/engagements/${activeEngagementId}`, getToken, {
        method: 'PATCH',
        body: JSON.stringify({ reviewFlowStatus: nextStatus })
      })
      onNotice(`Review flow moved to ${formatWorkflowLabel(nextStatus)}.`)
      await loadEngagementDetail(activeEngagementId)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not update review flow')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-primary-dark">Active engagement</h3>
            <p className="text-sm text-text-light">
              Select an engagement, then open trial balance, lead sheets, review, and adjustments from the actions below.
            </p>
          </div>
          <Link
            to="/portal/accounting/working-papers/engagements"
            className="text-sm text-primary-dark underline"
          >
            Manage engagements
          </Link>
        </div>
        {listLoading ? (
          <PageLoadingSkeleton variant="table" />
        ) : engagements.length === 0 ? (
          <p className="text-sm text-text-light">
            No engagements yet. Create one from the Engagements page to start working papers.
          </p>
        ) : (
          <AgGridTable
            rowData={engagements}
            columnDefs={pickerColumnDefs}
            gridOptions={pickerGridOptions}
            height={220}
          />
        )}
      </div>

      {activeEngagement && engagementBasePath && (
        <div className="rounded-lg border border-border bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-primary-dark">{activeEngagement.name}</h3>
              <p className="text-sm text-text-light">
                {activeEngagement.client_name || '—'} · {formatWorkflowLabel(String(activeEngagement.review_flow_status || 'not_started'))} · {activeEngagement.status}
              </p>
              <p className="text-xs text-text-light mt-1">
                Period end: {activeEngagement.period_end ? new Date(activeEngagement.period_end).toLocaleDateString() : '—'}
                {' '}| Due: {activeEngagement.due_date ? new Date(activeEngagement.due_date).toLocaleDateString() : '—'}
                {' '}| Open notes: {Number(dashboard?.workflowHealth?.openReviewNotes ?? activeEngagement.open_review_note_count ?? 0)}
                {' '}| Unreviewed sheets: {Number(dashboard?.workflowHealth?.unreviewedLeadSheets ?? activeEngagement.unreviewed_lead_sheet_count ?? 0)}
              </p>
            </div>
            {detailLoading && (
              <span className="text-xs text-text-light">Refreshing engagement summary…</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to={engagementBasePath} className="btn btn--primary text-sm py-2 px-3">Engagement dashboard</Link>
            <Link to={`${engagementBasePath}/execution`} className="btn btn--primary text-sm py-2 px-3">Execution</Link>
            <Link to={`${engagementBasePath}/trial-balance`} className="btn btn--secondary text-sm py-2 px-3">Trial balance</Link>
            <Link to={`${engagementBasePath}/lead-sheets`} className="btn btn--secondary text-sm py-2 px-3">Lead sheets</Link>
            <Link to={`${engagementBasePath}/documents`} className="btn btn--secondary text-sm py-2 px-3">Documents</Link>
            <Link to={`${engagementBasePath}/review`} className="btn btn--secondary text-sm py-2 px-3">Review notes</Link>
            <Link to={`${engagementBasePath}/adjustments`} className="btn btn--secondary text-sm py-2 px-3">Adjustments</Link>
            <Link to={`${engagementBasePath}/settings`} className="btn btn--secondary text-sm py-2 px-3">Workflow settings</Link>
            <button type="button" className="btn btn--secondary text-sm py-2 px-3" disabled={saving} onClick={() => { void onGenerateLeadSheets() }}>
              Generate lead sheets
            </button>
            <button type="button" className="btn btn--secondary text-sm py-2 px-3" disabled={saving} onClick={() => { void onExportWorkbook() }}>
              Export workbook
            </button>
          </div>

          {nextReviewFlowStatuses.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
              {nextReviewFlowStatuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  className="btn btn--secondary text-sm py-2 px-3"
                  disabled={saving || detailLoading}
                  onClick={() => { void onAdvanceReviewFlow(status) }}
                >
                  Move to {formatWorkflowLabel(status)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default WorkingPapersWorkspacePanel
