import { useCallback, useEffect, useMemo, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ModuleRegistry, type ColDef, type GridApi, type GridOptions, type GridReadyEvent } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import 'ag-grid-community/styles/agGridQuartzFont.css'

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
  defaultColDef?: ColDef<any>
  fitColumnsToViewport?: boolean
}

const AgGridTable = ({
  rowData,
  columnDefs,
  height = 320,
  quickFilterText = '',
  gridOptions,
  defaultColDef: defaultColDefOverride,
  fitColumnsToViewport = true
}: AgGridTableProps) => {
  const gridApiRef = useRef<GridApi | null>(null)

  const defaultColDef = useMemo<ColDef<any>>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 100,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      ...defaultColDefOverride
    }),
    [defaultColDefOverride]
  )

  const fitColumns = useCallback(() => {
    if (!fitColumnsToViewport || !gridApiRef.current) return
    gridApiRef.current.sizeColumnsToFit({ defaultMinWidth: 90 })
  }, [fitColumnsToViewport])

  const onGridReady = useCallback((event: GridReadyEvent) => {
    gridApiRef.current = event.api
    fitColumns()
    gridOptions?.onGridReady?.(event)
  }, [fitColumns, gridOptions])

  useEffect(() => {
    if (!fitColumnsToViewport) return
    const onResize = () => fitColumns()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [fitColumns, fitColumnsToViewport])

  useEffect(() => {
    fitColumns()
  }, [columnDefs, fitColumns, rowData])

  const mergedGridOptions = useMemo<GridOptions<any>>(() => ({
    ...gridOptions,
    onGridReady,
    suppressHorizontalScroll: fitColumnsToViewport
  }), [fitColumnsToViewport, gridOptions, onGridReady])

  return (
    <div className="ag-theme-quartz w-full min-w-0 overflow-hidden" style={{ height }}>
      <AgGridReact<any>
        theme="legacy"
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows
        suppressCellFocus={false}
        quickFilterText={quickFilterText}
        {...mergedGridOptions}
      />
    </div>
  )
}

export default AgGridTable
