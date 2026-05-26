import type { FC } from 'react'

type WorkflowQueuePanelProps = {
  queue: any[]
}

const WorkflowQueuePanel: FC<WorkflowQueuePanelProps> = ({ queue }) => {
  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-primary-dark">Reviewer Queue</h3>
        <p className="text-xs text-text-light">Due-date ordered review workload and blockers.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-light">
              <th className="py-2">Section</th>
              <th className="py-2">Lead Sheet Status</th>
              <th className="py-2">Open Notes</th>
              <th className="py-2">Unreviewed Rows</th>
              <th className="py-2">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 ? (
              <tr>
                <td className="py-3 text-text-light" colSpan={5}>No review queue items for this engagement.</td>
              </tr>
            ) : queue.map((item) => (
              <tr key={item.lead_sheet_id} className="border-b border-border/70">
                <td className="py-2">{item.section_code} - {item.section_name}</td>
                <td className="py-2">{item.lead_sheet_status}</td>
                <td className="py-2">{Number(item.open_note_count || 0)}</td>
                <td className="py-2">{Number(item.unreviewed_row_count || 0)}</td>
                <td className="py-2">{item.due_date ? new Date(item.due_date).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default WorkflowQueuePanel
