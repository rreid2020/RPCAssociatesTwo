import { FC, useCallback, useMemo } from 'react'
import type { CellEditingStoppedEvent, ColDef } from 'ag-grid-community'
import AgGridTable from '../../working-papers/components/grid/AgGridTable'
import { CHECKLIST_STATUSES, type ChecklistItem } from '../services/executionApi'

type ChecklistExecutionGridProps = {
  items: ChecklistItem[]
  saving: boolean
  onUpdate: (itemId: string, patch: Partial<ChecklistItem>) => void | Promise<void>
}

const ChecklistExecutionGrid: FC<ChecklistExecutionGridProps> = ({ items, saving, onUpdate }) => {
  const columnDefs = useMemo<ColDef<ChecklistItem>[]>(() => [
    {
      field: 'checklist_title',
      headerName: 'Checklist',
      flex: 1,
      minWidth: 120,
      editable: false
    },
    {
      field: 'title',
      headerName: 'Item',
      flex: 1.4,
      minWidth: 160,
      editable: false
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 130,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: CHECKLIST_STATUSES }
    },
    {
      field: 'assigned_to',
      headerName: 'Assigned to',
      flex: 1,
      minWidth: 120,
      editable: true
    },
    {
      field: 'due_date',
      headerName: 'Due date',
      flex: 0.8,
      minWidth: 110,
      editable: true
    },
    {
      field: 'notes',
      headerName: 'Notes',
      flex: 1.2,
      minWidth: 140,
      editable: true,
      cellEditor: 'agLargeTextCellEditor'
    }
  ], [])

  const onCellEditingStopped = useCallback(async (event: CellEditingStoppedEvent<ChecklistItem>) => {
    const row = event.data
    if (!row || saving) return
    const field = event.colDef.field as keyof ChecklistItem
    if (!field) return
    await onUpdate(row.id, { [field]: event.newValue ?? row[field] })
  }, [onUpdate, saving])

  const gridOptions = useMemo(() => ({
    singleClickEdit: true,
    onCellEditingStopped: (event: CellEditingStoppedEvent<ChecklistItem>) => {
      void onCellEditingStopped(event)
    },
    getRowId: (params: { data: ChecklistItem }) => params.data.id
  }), [onCellEditingStopped])

  if (items.length === 0) {
    return (
      <p className="text-sm text-text-light py-6 text-center border border-dashed border-border rounded-md">
        No checklist items yet. Apply an engagement template or create an engagement to initialize execution structure.
      </p>
    )
  }

  return (
    <AgGridTable
      rowData={items}
      height={Math.min(360, Math.max(200, items.length * 42 + 100))}
      columnDefs={columnDefs}
      gridOptions={gridOptions}
      defaultColDef={{ sortable: true, filter: true, resizable: true, floatingFilter: false }}
      fitColumnsToViewport
    />
  )
}

export default ChecklistExecutionGrid
