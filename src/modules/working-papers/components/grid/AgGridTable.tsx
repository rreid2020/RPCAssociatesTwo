import { useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ModuleRegistry, type ColDef, type GridOptions } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'

let agGridModulesRegistered = false
if (!agGridModulesRegistered) {
  ModuleRegistry.registerModules([AllCommunityModule])
  agGridModulesRegistered = true
}

type AgGridTableProps = {
  rowData: any[]
  columnDefs: Array<ColDef<any>>
  height?: number
  quickFilterText?: string
  gridOptions?: GridOptions<any>
}

const AgGridTable = ({ rowData, columnDefs, height = 320, quickFilterText = '', gridOptions }: AgGridTableProps) => {
  const defaultColDef = useMemo<ColDef<any>>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 120
    }),
    []
  )

  return (
    <div className="ag-theme-quartz w-full" style={{ height }}>
      <AgGridReact<any>
        theme="legacy"
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowSelection={{ mode: 'singleRow' }}
        animateRows
        suppressCellFocus={false}
        quickFilterText={quickFilterText}
        {...gridOptions}
      />
    </div>
  )
}

export default AgGridTable
