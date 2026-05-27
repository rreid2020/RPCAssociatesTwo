import { type FC, type FormEvent, useMemo, useState } from 'react'
import type { ColDef } from 'ag-grid-community'
import AgGridTable from './grid/AgGridTable'

type AdjustmentWorkspacePanelProps = {
  entries: any[]
  saving: boolean
  onCreateEntry: (payload: { entryNumber: string, description: string }) => Promise<void>
  onUpdateLines: (adjustmentId: string, lines: Array<{ accountName: string, debitAmount: number, creditAmount: number, memo?: string }>) => Promise<void>
}

const AdjustmentWorkspacePanel: FC<AdjustmentWorkspacePanelProps> = ({ entries, saving, onCreateEntry, onUpdateLines }) => {
  const columnDefs = useMemo<Array<ColDef<any>>>(
    () => [
      { field: 'entry_number', headerName: 'Entry Number', minWidth: 150 },
      { field: 'description', headerName: 'Description', minWidth: 220 },
      { field: 'status', headerName: 'Status', minWidth: 130 },
      {
        field: 'created_at',
        headerName: 'Created',
        minWidth: 140,
        valueFormatter: (params) => (params.value ? new Date(params.value).toLocaleDateString() : '')
      }
    ],
    []
  )

  const [entryNumber, setEntryNumber] = useState('')
  const [entryDescription, setEntryDescription] = useState('')
  const [lineDraft, setLineDraft] = useState<Record<string, string>>({})

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!entryNumber.trim() || !entryDescription.trim()) return
    await onCreateEntry({ entryNumber: entryNumber.trim(), description: entryDescription.trim() })
    setEntryNumber('')
    setEntryDescription('')
  }

  return (
    <div className="rounded-lg border border-border p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-primary-dark">Journal Adjustments Workspace</h3>
        <p className="text-xs text-text-light">Create, balance, and post adjustment entries.</p>
      </div>
      <form className="grid grid-cols-1 md:grid-cols-3 gap-2" onSubmit={onSubmit}>
        <input
          className="border border-border rounded-md px-3 py-2 text-sm"
          placeholder="Entry number (e.g. JE-001)"
          value={entryNumber}
          onChange={(e) => setEntryNumber(e.target.value)}
        />
        <input
          className="border border-border rounded-md px-3 py-2 text-sm"
          placeholder="Description"
          value={entryDescription}
          onChange={(e) => setEntryDescription(e.target.value)}
        />
        <button className="btn btn--primary text-sm py-2 px-4" disabled={saving} type="submit">
          Create Entry
        </button>
      </form>
      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-text-light">No journal entries yet.</p>
        ) : (
          <>
            <AgGridTable rowData={entries} columnDefs={columnDefs} height={260} />
            {entries.slice(0, 20).map((entry) => (
              <div key={entry.id} className="rounded border border-border/70 p-3 space-y-2">
                <p className="text-sm text-primary-dark">{entry.entry_number} - {entry.description}</p>
                <p className="text-[11px] text-text-light">Status: {entry.status}</p>
                <div className="flex flex-wrap gap-2">
                  <input
                    className="border border-border rounded-md px-2 py-1 text-xs"
                    placeholder="Account name"
                    value={lineDraft[entry.id] || ''}
                    onChange={(e) => setLineDraft((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="text-xs text-primary-dark underline"
                    onClick={() => {
                      const accountName = (lineDraft[entry.id] || '').trim()
                      if (!accountName) return
                      void onUpdateLines(entry.id, [{ accountName, debitAmount: 0, creditAmount: 0, memo: 'Placeholder line' }])
                    }}
                  >
                    Save Placeholder Lines
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

export default AdjustmentWorkspacePanel
