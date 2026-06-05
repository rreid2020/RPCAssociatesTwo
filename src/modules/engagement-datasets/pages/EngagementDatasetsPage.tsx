import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  archiveDatasetViewDomain,
  createDatasetViewDomain,
  createEngagementDatasetDomain,
  EngagementDataset,
  executeDatasetViewDomain,
  listDatasetRowsDomain,
  listDatasetViewsDomain,
  listEngagementDatasetsDomain
} from '../../../domains/engagement-datasets'
import DatasetImportPanel from '../components/DatasetImportPanel'

type EngagementDatasetsPageProps = {
  getToken: () => Promise<string | null>
}

const DATASET_TYPES = [
  { value: 'custom', label: 'Custom schedule' },
  { value: 'ar_aging', label: 'AR aging' },
  { value: 'fixed_assets', label: 'Fixed assets' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'gl_detail', label: 'GL detail' },
  { value: 'bank_transactions', label: 'Bank transactions' },
  { value: 'other', label: 'Other' }
]

const EngagementDatasetsPage: FC<EngagementDatasetsPageProps> = ({ getToken }) => {
  const { engagementId = '' } = useParams()
  const [datasets, setDatasets] = useState<EngagementDataset[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rows, setRows] = useState<Array<{ id: string; source_row_number: number; row_data: Record<string, unknown> }>>([])
  const [rowTotal, setRowTotal] = useState(0)
  const [views, setViews] = useState<Array<{ id: string; name: string; config: Record<string, unknown> }>>([])
  const [viewRows, setViewRows] = useState<Array<{ sourceRowNumber: number; rowData: Record<string, unknown> }>>([])
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('custom')
  const [newViewName, setNewViewName] = useState('')
  const [filterColumn, setFilterColumn] = useState('')
  const [filterValue, setFilterValue] = useState('')
  const [groupByColumn, setGroupByColumn] = useState('')
  const [aggColumn, setAggColumn] = useState('')
  const [aggFn, setAggFn] = useState('sum')
  const [joinDatasetId, setJoinDatasetId] = useState('')
  const [joinLocalColumn, setJoinLocalColumn] = useState('')
  const [joinForeignColumn, setJoinForeignColumn] = useState('')

  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedId) || null,
    [datasets, selectedId]
  )

  const loadDatasets = useCallback(async () => {
    if (!engagementId) return
    setLoading(true)
    setError(null)
    try {
      const result = await listEngagementDatasetsDomain(getToken, engagementId)
      setDatasets(result.datasets || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load datasets')
    } finally {
      setLoading(false)
    }
  }, [engagementId, getToken])

  const loadDatasetDetail = useCallback(async (datasetId: string) => {
    if (!engagementId) return
    try {
      const [rowsResult, viewsResult] = await Promise.all([
        listDatasetRowsDomain(getToken, engagementId, datasetId, { limit: 100 }),
        listDatasetViewsDomain(getToken, engagementId, datasetId)
      ])
      setRows(rowsResult.rows || [])
      setRowTotal(rowsResult.total || 0)
      setViews(viewsResult.views || [])
      setViewRows([])
      setActiveViewId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load dataset rows')
    }
  }, [engagementId, getToken])

  useEffect(() => {
    void loadDatasets()
  }, [loadDatasets])

  useEffect(() => {
    if (selectedId) void loadDatasetDetail(selectedId)
  }, [selectedId, loadDatasetDetail])

  const onCreateDataset = async () => {
    if (!newName.trim()) {
      setError('Enter a dataset name.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const result = await createEngagementDatasetDomain(getToken, engagementId, {
        name: newName.trim(),
        datasetType: newType
      })
      setNewName('')
      setNotice('Dataset created. Import a spreadsheet to add data.')
      await loadDatasets()
      setSelectedId(result.dataset.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create dataset')
    } finally {
      setSaving(false)
    }
  }

  const onImported = async () => {
    setNotice('Dataset imported successfully.')
    await loadDatasets()
    if (selectedId) await loadDatasetDetail(selectedId)
  }

  const onCreateView = async () => {
    if (!selectedId || !newViewName.trim()) return
    setSaving(true)
    setError(null)
    try {
      const config: Record<string, unknown> = {}
      if (filterColumn.trim()) {
        config.filters = [{ column: filterColumn.trim(), op: 'contains', value: filterValue }]
      }
      if (groupByColumn.trim()) {
        config.groupBy = [groupByColumn.trim()]
        if (aggColumn.trim()) {
          config.aggregations = [{ column: aggColumn.trim(), fn: aggFn, alias: `${aggFn}_${aggColumn.trim()}` }]
        }
      }
      if (joinDatasetId && joinLocalColumn.trim() && joinForeignColumn.trim()) {
        config.joins = [{
          targetDatasetId: joinDatasetId,
          type: 'left',
          localColumn: joinLocalColumn.trim(),
          foreignColumn: joinForeignColumn.trim()
        }]
      }
      await createDatasetViewDomain(getToken, engagementId, selectedId, {
        name: newViewName.trim(),
        config
      })
      setNewViewName('')
      setFilterColumn('')
      setFilterValue('')
      setGroupByColumn('')
      setAggColumn('')
      setJoinDatasetId('')
      setJoinLocalColumn('')
      setJoinForeignColumn('')
      setNotice('Analysis view saved.')
      await loadDatasetDetail(selectedId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create view')
    } finally {
      setSaving(false)
    }
  }

  const onDeleteView = async (viewId: string) => {
    if (!selectedId) return
    setSaving(true)
    setError(null)
    try {
      await archiveDatasetViewDomain(getToken, engagementId, selectedId, viewId)
      if (activeViewId === viewId) {
        setActiveViewId(null)
        setViewRows([])
      }
      setNotice('View archived.')
      await loadDatasetDetail(selectedId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete view')
    } finally {
      setSaving(false)
    }
  }

  const onExecuteView = async (viewId: string) => {
    if (!selectedId) return
    setSaving(true)
    setError(null)
    try {
      const result = await executeDatasetViewDomain(getToken, engagementId, selectedId, viewId)
      setActiveViewId(viewId)
      setViewRows(result.rows || [])
      setNotice(`View executed (${result.summary?.outputRows ?? 0} rows).`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not execute view')
    } finally {
      setSaving(false)
    }
  }

  const columnKeys = selectedDataset?.column_schema?.map((col) => col.key) || []
  const joinDataset = datasets.find((dataset) => dataset.id === joinDatasetId) || null
  const joinColumnKeys = joinDataset?.column_schema?.map((col) => col.key) || []

  const displayColumns = useMemo(() => {
    const base = selectedDataset?.column_schema || []
    if (!activeViewId || !viewRows.length) return base
    const sample = viewRows[0]?.rowData || {}
    const extraKeys = Object.keys(sample).filter((key) => !base.some((col) => col.key === key))
    return [
      ...base,
      ...extraKeys.map((key) => ({ key, label: key, dataType: 'text' as const, sourceColumn: key }))
    ]
  }, [activeViewId, selectedDataset?.column_schema, viewRows])

  const tableRows = activeViewId ? viewRows : rows.map((row) => ({
    sourceRowNumber: row.source_row_number,
    rowData: row.row_data
  }))

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-700">{error}</p>}
      {notice && <p className="text-sm text-emerald-800">{notice}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border p-4 space-y-3">
          <p className="font-semibold text-primary-dark">Datasets</p>
          <p className="text-xs text-text-light">Import any supporting spreadsheet for custom analysis.</p>
          {loading && <p className="text-sm text-text-light">Loading…</p>}
          <ul className="space-y-1">
            {datasets.map((dataset) => (
              <li key={dataset.id}>
                <button
                  type="button"
                  className={`w-full text-left px-2 py-1.5 rounded text-sm ${selectedId === dataset.id ? 'bg-sky-50 text-sky-900' : 'hover:bg-background'}`}
                  onClick={() => setSelectedId(dataset.id)}
                >
                  <span className="font-medium">{dataset.name}</span>
                  <span className="block text-xs text-text-light">
                    {dataset.dataset_type} · {dataset.row_count} rows · {dataset.status}
                  </span>
                </button>
              </li>
            ))}
            {!loading && datasets.length === 0 && (
              <li className="text-sm text-text-light">No datasets yet.</li>
            )}
          </ul>
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-sm font-medium">New dataset</p>
            <input
              className="w-full border border-border rounded-md px-2 py-1.5 text-sm"
              placeholder="Dataset name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <select
              className="w-full border border-border rounded-md px-2 py-1.5 text-sm"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
            >
              {DATASET_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn--primary text-sm py-2 px-4"
              disabled={saving}
              onClick={() => { void onCreateDataset() }}
            >
              Create dataset
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selectedDataset ? (
            <>
              <div className="rounded-lg border border-border p-4">
                <h3 className="font-semibold text-primary-dark">{selectedDataset.name}</h3>
                <p className="text-xs text-text-light mt-1">
                  {selectedDataset.row_count} rows
                  {selectedDataset.source_file_name ? ` · ${selectedDataset.source_file_name}` : ''}
                </p>
              </div>

              <DatasetImportPanel
                engagementId={engagementId}
                datasetId={selectedDataset.id}
                getToken={getToken}
                saving={saving}
                onSavingChange={setSaving}
                onError={setError}
                onNotice={setNotice}
                onImported={onImported}
                initialColumnSchema={selectedDataset.column_schema || []}
              />

              <div className="rounded-lg border border-border p-4 space-y-3">
                <p className="text-sm font-medium text-text">Saved analysis views</p>
                <div className="flex flex-wrap gap-2">
                  {views.map((view) => (
                    <div key={view.id} className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        className={`btn btn--secondary text-sm py-1 px-3 ${activeViewId === view.id ? 'ring-2 ring-sky-400' : ''}`}
                        onClick={() => { void onExecuteView(view.id) }}
                      >
                        {view.name}
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-700 px-1"
                        disabled={saving}
                        onClick={() => { void onDeleteView(view.id) }}
                        aria-label={`Delete ${view.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {views.length === 0 && <p className="text-xs text-text-light">No saved views yet.</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    className="border border-border rounded-md px-2 py-1.5 text-sm"
                    placeholder="View name"
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                  />
                  <select
                    className="border border-border rounded-md px-2 py-1.5 text-sm"
                    value={filterColumn}
                    onChange={(e) => setFilterColumn(e.target.value)}
                  >
                    <option value="">Filter column (optional)</option>
                    {columnKeys.map((key) => <option key={`f-${key}`} value={key}>{key}</option>)}
                  </select>
                  <input
                    className="border border-border rounded-md px-2 py-1.5 text-sm"
                    placeholder="Filter contains"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <select
                    className="border border-border rounded-md px-2 py-1.5 text-sm"
                    value={groupByColumn}
                    onChange={(e) => setGroupByColumn(e.target.value)}
                  >
                    <option value="">Group by (optional)</option>
                    {columnKeys.map((key) => <option key={`g-${key}`} value={key}>{key}</option>)}
                  </select>
                  <select
                    className="border border-border rounded-md px-2 py-1.5 text-sm"
                    value={aggColumn}
                    onChange={(e) => setAggColumn(e.target.value)}
                  >
                    <option value="">Aggregate column (optional)</option>
                    {columnKeys.map((key) => <option key={`a-${key}`} value={key}>{key}</option>)}
                  </select>
                  <select
                    className="border border-border rounded-md px-2 py-1.5 text-sm"
                    value={aggFn}
                    onChange={(e) => setAggFn(e.target.value)}
                  >
                    <option value="sum">Sum</option>
                    <option value="count">Count</option>
                    <option value="avg">Average</option>
                    <option value="min">Min</option>
                    <option value="max">Max</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <select
                    className="border border-border rounded-md px-2 py-1.5 text-sm"
                    value={joinDatasetId}
                    onChange={(e) => setJoinDatasetId(e.target.value)}
                  >
                    <option value="">Join dataset (optional)</option>
                    {datasets.filter((dataset) => dataset.id !== selectedId).map((dataset) => (
                      <option key={`j-${dataset.id}`} value={dataset.id}>{dataset.name}</option>
                    ))}
                  </select>
                  <select
                    className="border border-border rounded-md px-2 py-1.5 text-sm"
                    value={joinLocalColumn}
                    onChange={(e) => setJoinLocalColumn(e.target.value)}
                    disabled={!joinDatasetId}
                  >
                    <option value="">Local join key</option>
                    {columnKeys.map((key) => <option key={`jl-${key}`} value={key}>{key}</option>)}
                  </select>
                  <select
                    className="border border-border rounded-md px-2 py-1.5 text-sm"
                    value={joinForeignColumn}
                    onChange={(e) => setJoinForeignColumn(e.target.value)}
                    disabled={!joinDatasetId}
                  >
                    <option value="">Foreign join key</option>
                    {joinColumnKeys.map((key) => <option key={`jf-${key}`} value={key}>{key}</option>)}
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn--secondary text-sm py-2 px-4"
                  disabled={saving || !newViewName.trim()}
                  onClick={() => { void onCreateView() }}
                >
                  Save analysis view
                </button>
              </div>

              <div className="rounded-lg border border-border p-4 overflow-x-auto">
                <p className="text-sm font-medium text-text mb-2">
                  {activeViewId ? 'View results' : `Imported rows (${rowTotal})`}
                </p>
                {displayColumns.length > 0 && tableRows.length > 0 ? (
                  <table className="min-w-full text-xs border border-border">
                    <thead>
                      <tr className="bg-background">
                        <th className="px-2 py-1 text-left">#</th>
                        {displayColumns.map((col) => (
                          <th key={col.key} className="px-2 py-1 text-left">{col.label || col.key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.slice(0, 50).map((row) => (
                        <tr key={`${row.sourceRowNumber}-${JSON.stringify(row.rowData)}`} className="border-t border-border">
                          <td className="px-2 py-1">{row.sourceRowNumber}</td>
                          {displayColumns.map((col) => (
                            <td key={`${row.sourceRowNumber}-${col.key}`} className="px-2 py-1">
                              {row.rowData[col.key] == null ? '—' : String(row.rowData[col.key])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-text-light">Import data to see rows here.</p>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-border p-6 text-sm text-text-light">
              Select a dataset or create one to import a spreadsheet and build custom analysis.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EngagementDatasetsPage
