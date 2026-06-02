import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import type { CellEditingStoppedEvent, ColDef, ValueParserParams } from 'ag-grid-community'
import AgGridTable from './grid/AgGridTable'
import {
  patchTrialBalanceAccountWorkingPaperDomain,
  type TrialBalanceAccount,
  type TrialBalanceReviewStatus
} from '../../../domains/trial-balance'

const reviewStatusOptions: TrialBalanceReviewStatus[] = ['needs_work', 'in_review', 'complete']

const reviewStatusLabels: Record<TrialBalanceReviewStatus, string> = {
  needs_work: 'Needs work',
  in_review: 'In review',
  complete: 'Complete'
}

function parseAmount (value: unknown): number {
  if (value == null || value === '') return 0
  const parsed = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function formatAmount (value: unknown): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function adjustedBalance (row: TrialBalanceAccount): number {
  const current = Number(row.current_period_balance || 0)
  const debit = Number(row.adjustment_debit || 0)
  const credit = Number(row.adjustment_credit || 0)
  return current + debit - credit
}

function mapPatchField (field?: string) {
  if (field === 'adjustment_debit') return 'adjustmentDebit' as const
  if (field === 'adjustment_credit') return 'adjustmentCredit' as const
  if (field === 'review_status') return 'reviewStatus' as const
  if (field === 'workpaper_note') return 'workpaperNote' as const
  return null
}

type TrialBalanceGridPanelProps = {
  getToken: () => Promise<string | null>
  accounts: TrialBalanceAccount[]
  saving: boolean
  onReload: () => Promise<void>
  onError: (message: string | null) => void
  onNotice: (message: string | null) => void
  onSavingChange: (saving: boolean) => void
}

const TrialBalanceGridPanel: FC<TrialBalanceGridPanelProps> = ({
  getToken,
  accounts,
  saving,
  onReload,
  onError,
  onNotice,
  onSavingChange
}) => {
  const [gridHeight, setGridHeight] = useState(520)

  useEffect(() => {
    const updateHeight = () => setGridHeight(Math.max(480, window.innerHeight - 340))
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  const persistCell = useCallback(async (row: TrialBalanceAccount, field?: string) => {
    const patchKey = mapPatchField(field)
    if (!patchKey || !row?.id) return

    const patch = {
      adjustmentDebit: parseAmount(row.adjustment_debit),
      adjustmentCredit: parseAmount(row.adjustment_credit),
      reviewStatus: (row.review_status || 'needs_work') as TrialBalanceReviewStatus,
      workpaperNote: row.workpaper_note ?? null
    }

    onSavingChange(true)
    onError(null)
    try {
      await patchTrialBalanceAccountWorkingPaperDomain(getToken, row.id, {
        [patchKey]: patch[patchKey]
      })
      onNotice('Trial balance row saved.')
      await onReload()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not save trial balance row')
      await onReload()
    } finally {
      onSavingChange(false)
    }
  }, [getToken, onError, onNotice, onReload, onSavingChange])

  const onCellEditingStopped = useCallback(async (event: CellEditingStoppedEvent<TrialBalanceAccount>) => {
    const row = event.data
    if (!row) return
    await persistCell(row, event.colDef.field)
  }, [persistCell])

  const columnDefs = useMemo(() => ([
    {
      headerName: 'Account #',
      field: 'account_number',
      minWidth: 110,
      flex: 0.7,
      editable: false,
      valueFormatter: (params: { value: unknown }) => String(params.value || '—')
    },
    {
      headerName: 'Account name',
      field: 'account_name',
      minWidth: 200,
      flex: 1.4,
      editable: false
    },
    {
      field: 'current_period_balance',
      headerName: 'Current',
      minWidth: 120,
      flex: 0.9,
      editable: false,
      valueFormatter: (params: { value: unknown }) => formatAmount(params.value)
    },
    {
      field: 'prior_period_balance',
      headerName: 'Prior',
      minWidth: 120,
      flex: 0.9,
      editable: false,
      valueFormatter: (params: { value: unknown }) => formatAmount(params.value)
    },
    {
      field: 'variance_amount',
      headerName: 'Variance',
      minWidth: 120,
      flex: 0.9,
      editable: false,
      valueFormatter: (params: { value: unknown }) => formatAmount(params.value)
    },
    {
      field: 'adjustment_debit',
      headerName: 'Adj. DR',
      minWidth: 110,
      flex: 0.8,
      editable: true,
      valueParser: (params: ValueParserParams) => parseAmount(params.newValue),
      valueFormatter: (params: { value: unknown }) => formatAmount(params.value)
    },
    {
      field: 'adjustment_credit',
      headerName: 'Adj. CR',
      minWidth: 110,
      flex: 0.8,
      editable: true,
      valueParser: (params: ValueParserParams) => parseAmount(params.newValue),
      valueFormatter: (params: { value: unknown }) => formatAmount(params.value)
    },
    {
      headerName: 'Adjusted',
      minWidth: 120,
      flex: 0.9,
      editable: false,
      valueGetter: (params: { data?: TrialBalanceAccount }) => (params.data ? adjustedBalance(params.data) : null),
      valueFormatter: (params: { value: unknown }) => formatAmount(params.value)
    },
    {
      field: 'review_status',
      headerName: 'Tick mark',
      minWidth: 130,
      flex: 0.9,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: reviewStatusOptions },
      valueFormatter: (params: { value: unknown }) => {
        const key = String(params.value || 'needs_work') as TrialBalanceReviewStatus
        return reviewStatusLabels[key] || key
      },
      cellClassRules: {
        'text-amber-700 font-medium': (params: { value: unknown }) => params.value === 'needs_work',
        'text-sky-700 font-medium': (params: { value: unknown }) => params.value === 'in_review',
        'text-emerald-700 font-medium': (params: { value: unknown }) => params.value === 'complete'
      }
    },
    {
      field: 'workpaper_note',
      headerName: 'Note',
      minWidth: 220,
      flex: 1.6,
      editable: true,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorPopup: true,
      wrapText: true,
      autoHeight: false
    },
    {
      headerName: 'Flags',
      minWidth: 100,
      flex: 0.7,
      editable: false,
      valueGetter: (params: { data?: TrialBalanceAccount }) => {
        if (!params.data) return '—'
        if (params.data.is_material) return 'Material'
        if (params.data.is_unusual) return 'Unusual'
        return '—'
      }
    }
  ] as ColDef<TrialBalanceAccount>[]), [])

  const gridDefaultColDef = useMemo<ColDef<TrialBalanceAccount>>(
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
    singleClickEdit: true,
    stopEditingWhenCellsLoseFocus: true,
    getRowId: (params: { data: TrialBalanceAccount }) => String(params.data.id),
    onCellEditingStopped: (event: CellEditingStoppedEvent<TrialBalanceAccount>) => {
      void onCellEditingStopped(event)
    }
  }), [onCellEditingStopped])

  return (
    <div className="space-y-2 min-w-0">
      <p className="text-xs text-text-light">
        Click Adj. DR, Adj. CR, Tick mark, or Note to edit. Changes save when you leave the cell.
      </p>
      <AgGridTable
        rowData={accounts}
        height={gridHeight}
        columnDefs={columnDefs}
        defaultColDef={gridDefaultColDef}
        gridOptions={gridOptions}
        fitColumnsToViewport={false}
      />
      {saving && (
        <p className="text-xs text-text-light" role="status">Saving…</p>
      )}
    </div>
  )
}

export default TrialBalanceGridPanel
