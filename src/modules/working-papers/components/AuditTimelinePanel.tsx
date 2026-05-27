import { type FC, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import AgGridTable from './grid/AgGridTable'

type AuditTimelinePanelProps = {
  events: any[]
}

const AuditTimelinePanel: FC<AuditTimelinePanelProps> = ({ events }) => {
  const columnDefs = useMemo<Array<ColDef<any>>>(
    () => [
      { field: 'event_type', headerName: 'Event', minWidth: 170 },
      { field: 'entity_type', headerName: 'Entity', minWidth: 130 },
      { field: 'entity_id', headerName: 'Entity ID', minWidth: 170 },
      {
        headerName: 'Actor',
        minWidth: 140,
        valueGetter: (params) => params.data?.actor_id || params.data?.clerk_user_id || 'system'
      },
      {
        field: 'created_at',
        headerName: 'Timestamp',
        minWidth: 170,
        valueFormatter: (params) => (params.value ? new Date(params.value).toLocaleString() : '')
      }
    ],
    []
  )

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-primary-dark">Audit Timeline</h3>
        <p className="text-xs text-text-light">Immutable workflow and execution event history.</p>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-text-light">No audit events yet.</p>
      ) : (
        <AgGridTable rowData={events} columnDefs={columnDefs} height={300} />
      )}
    </div>
  )
}

export default AuditTimelinePanel
