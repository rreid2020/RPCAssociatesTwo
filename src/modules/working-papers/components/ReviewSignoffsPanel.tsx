import { type FC, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import AgGridTable from './grid/AgGridTable'

type ReviewSignoffsPanelProps = {
  signoffs: any[]
}

const ReviewSignoffsPanel: FC<ReviewSignoffsPanelProps> = ({ signoffs }) => {
  const columnDefs = useMemo<Array<ColDef<any>>>(
    () => [
      { field: 'signoff_type', headerName: 'Type', minWidth: 120 },
      { field: 'signoff_state', headerName: 'State', minWidth: 120 },
      {
        field: 'lead_sheet_id',
        headerName: 'Lead sheet',
        minWidth: 160,
        valueFormatter: (params) => (params.value ? String(params.value) : 'Engagement-level')
      },
      {
        field: 'signed_by',
        headerName: 'Signed by',
        minWidth: 140,
        valueGetter: (params) => params.data?.signed_by || params.data?.clerk_user_id || '—'
      },
      {
        field: 'created_at',
        headerName: 'Timestamp',
        minWidth: 170,
        valueFormatter: (params) => (params.value ? new Date(params.value).toLocaleString() : '—')
      }
    ],
    []
  )

  return (
    <div className="rounded-lg border border-border bg-white p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-primary-dark">Review signoffs</h3>
        <p className="text-xs text-text-light">Preparer and reviewer signoff history for this engagement.</p>
      </div>
      {signoffs.length === 0 ? (
        <p className="text-sm text-text-light">No signoffs recorded yet.</p>
      ) : (
        <AgGridTable rowData={signoffs} columnDefs={columnDefs} height={280} />
      )}
    </div>
  )
}

export default ReviewSignoffsPanel
