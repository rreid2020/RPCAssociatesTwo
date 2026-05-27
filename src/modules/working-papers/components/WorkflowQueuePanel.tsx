import { type FC, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import AgGridTable from './grid/AgGridTable'

type WorkflowQueuePanelProps = {
  queue: any[]
}

const WorkflowQueuePanel: FC<WorkflowQueuePanelProps> = ({ queue }) => {
  const columnDefs = useMemo<Array<ColDef<any>>>(
    () => [
      {
        headerName: 'Section',
        valueGetter: (params) => `${params.data?.section_code || ''} - ${params.data?.section_name || ''}`
      },
      { field: 'lead_sheet_status', headerName: 'Lead Sheet Status' },
      {
        field: 'open_note_count',
        headerName: 'Open Notes',
        valueFormatter: (params) => String(Number(params.value || 0))
      },
      {
        field: 'unreviewed_row_count',
        headerName: 'Unreviewed Rows',
        valueFormatter: (params) => String(Number(params.value || 0))
      },
      {
        field: 'due_date',
        headerName: 'Due Date',
        valueFormatter: (params) => (params.value ? new Date(params.value).toLocaleDateString() : '—')
      }
    ],
    []
  )

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-primary-dark">Reviewer Queue</h3>
        <p className="text-xs text-text-light">Due-date ordered review workload and blockers.</p>
      </div>
      {queue.length === 0 ? (
        <p className="text-sm text-text-light">No review queue items for this engagement.</p>
      ) : (
        <AgGridTable rowData={queue} columnDefs={columnDefs} height={300} />
      )}
    </div>
  )
}

export default WorkflowQueuePanel
