import type { FC } from 'react'

type WorkingPaperTreePanelProps = {
  sections: any[]
}

const WorkingPaperTreePanel: FC<WorkingPaperTreePanelProps> = ({ sections }) => {
  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-primary-dark">Working Paper Tree</h3>
        <p className="text-xs text-text-light">Execution structure by section and account rows.</p>
      </div>
      {sections.length === 0 ? (
        <p className="text-sm text-text-light">No working paper sections generated yet.</p>
      ) : (
        <div className="space-y-2">
          {sections.map((section) => (
            <details key={section.id} className="rounded border border-border/70 px-3 py-2">
              <summary className="cursor-pointer text-sm text-primary-dark font-medium">
                {section.section_code} - {section.section_name} ({Array.isArray(section.rows) ? section.rows.length : Number(section.row_count || 0)} rows)
              </summary>
              <div className="mt-2 space-y-1">
                {(Array.isArray(section.rows) ? section.rows : []).slice(0, 20).map((row: any) => (
                  <div key={row.id} className="text-xs text-text-light flex justify-between gap-2">
                    <span>{row.row_label || row.account_name || 'Row'}</span>
                    <span>{row.review_status || 'pending'}</span>
                  </div>
                ))}
                {Array.isArray(section.rows) && section.rows.length > 20 && (
                  <p className="text-[11px] text-text-light">+{section.rows.length - 20} more rows</p>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}

export default WorkingPaperTreePanel
