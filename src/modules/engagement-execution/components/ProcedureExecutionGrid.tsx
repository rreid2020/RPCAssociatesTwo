import { FC, useMemo } from 'react'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import AgGridTable from '../../working-papers/components/grid/AgGridTable'
import { PROCEDURE_STATUSES, type Procedure } from '../services/executionApi'

type ProcedureGridContext = {
  onSignoff: (procedureId: string) => void
  saving: boolean
}

const ProcedureSignoffCell: FC<ICellRendererParams<Procedure, unknown, ProcedureGridContext>> = (params) => {
  const row = params.data
  const ctx = params.context
  if (!row || !ctx) return null
  return (
    <button
      type="button"
      className="text-xs font-medium text-primary-dark hover:underline disabled:opacity-50"
      disabled={ctx.saving || row.status === 'approved'}
      onClick={() => ctx.onSignoff(row.id)}
    >
      Sign off
    </button>
  )
}

type ProcedureExecutionGridProps = {
  procedures: Procedure[]
  saving: boolean
  onUpdate: (procedureId: string, patch: Partial<Procedure>) => void | Promise<void>
  onSignoff: (procedureId: string) => void | Promise<void>
}

const ProcedureExecutionGrid: FC<ProcedureExecutionGridProps> = ({
  procedures,
  saving,
  onUpdate,
  onSignoff
}) => {
  const gridContext = useMemo<ProcedureGridContext>(() => ({
    onSignoff: (id) => { void onSignoff(id) },
    saving
  }), [onSignoff, saving])

  const columnDefs = useMemo<ColDef<Procedure>[]>(() => [
    { field: 'title', headerName: 'Procedure', flex: 1.4, minWidth: 180, editable: false },
    { field: 'objective', headerName: 'Objective', flex: 1.6, minWidth: 200, editable: false },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 140,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: PROCEDURE_STATUSES }
    },
    {
      field: 'assigned_to',
      headerName: 'Assigned to',
      flex: 1,
      minWidth: 120,
      editable: true
    },
    {
      colId: 'signoff',
      headerName: 'Signoff',
      width: 90,
      sortable: false,
      filter: false,
      editable: false,
      cellRenderer: ProcedureSignoffCell
    }
  ], [])

  const gridOptions = useMemo(() => ({
    context: gridContext,
    singleClickEdit: true,
    onCellEditingStopped: (event: { data?: Procedure; colDef: { field?: string }; newValue: unknown }) => {
      const row = event.data
      if (!row || saving) return
      const field = event.colDef.field as keyof Procedure | undefined
      if (!field) return
      void onUpdate(row.id, { [field]: event.newValue as Procedure[keyof Procedure] })
    },
    getRowId: (params: { data: Procedure }) => params.data.id
  }), [gridContext, onUpdate, saving])

  if (procedures.length === 0) {
    return (
      <p className="text-sm text-text-light py-6 text-center border border-dashed border-border rounded-md">
        No procedures defined for this engagement yet.
      </p>
    )
  }

  return (
    <AgGridTable
      rowData={procedures}
      height={Math.min(400, Math.max(220, procedures.length * 42 + 100))}
      columnDefs={columnDefs}
      gridOptions={gridOptions}
      defaultColDef={{ sortable: true, filter: true, resizable: true, floatingFilter: false }}
      fitColumnsToViewport
    />
  )
}

export default ProcedureExecutionGrid
