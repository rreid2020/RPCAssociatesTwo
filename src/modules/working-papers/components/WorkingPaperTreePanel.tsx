import { type FC, useMemo } from 'react'
import type { ColDef, GridOptions } from 'ag-grid-community'
import AgGridTable from './grid/AgGridTable'

type WorkingPaperTreePanelProps = {
  sections: any[]
}

const WorkingPaperTreePanel: FC<WorkingPaperTreePanelProps> = ({ sections }) => {
  const rows = useMemo(() => {
    const flattened: any[] = []
    for (const section of sections || []) {
      const sectionCode = String(section.section_code || 'section').trim()
      flattened.push({
        id: `section-${section.id}`,
        type: 'section',
        section_label: `${sectionCode} - ${section.section_name || 'Section'}`,
        review_status: section.status || 'not_started',
        row_count: Array.isArray(section.rows) ? section.rows.length : Number(section.row_count || 0)
      })
      for (const row of Array.isArray(section.rows) ? section.rows : []) {
        flattened.push({
          id: row.id,
          type: 'row',
          section_label: `  ${row.row_label || row.account_name || 'Row'}`,
          review_status: row.review_status || 'pending',
          row_count: null
        })
      }
    }
    return flattened
  }, [sections])

  const columnDefs = useMemo<Array<ColDef<any>>>(
    () => [
      {
        field: 'section_label',
        headerName: 'Working Paper Node',
        minWidth: 280
      },
      { field: 'review_status', headerName: 'Status', minWidth: 140 },
      {
        field: 'row_count',
        headerName: 'Rows',
        minWidth: 100,
        valueFormatter: (params) => (params.value == null ? '' : String(params.value))
      }
    ],
    []
  )

  const gridOptions = useMemo<GridOptions<any>>(
    () => ({
      rowSelection: {
        mode: 'singleRow',
        checkboxes: false,
        enableClickSelection: false
      }
    }),
    []
  )

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-primary-dark">Working Paper Tree</h3>
        <p className="text-xs text-text-light">Execution structure by section and account rows.</p>
      </div>
      {sections.length === 0 ? (
        <p className="text-sm text-text-light">No working paper sections generated yet.</p>
      ) : (
        <AgGridTable rowData={rows} columnDefs={columnDefs} gridOptions={gridOptions} height={360} />
      )}
    </div>
  )
}

export default WorkingPaperTreePanel
