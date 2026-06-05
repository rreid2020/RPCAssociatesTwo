import { FC, useCallback, useMemo, useState } from 'react'
import { portalFetch } from '../../../lib/portalApi'

type TrialBalancePreview = {
  columns: string[]
  detectedMapping: Record<string, string>
  needsMapping?: boolean
  mappingSource?: 'heuristic' | 'ai' | 'manual'
  mappingConfidence?: number | null
  mappingNotes?: string | null
  headerRowIndex?: number
  previewRows: Array<{
    sourceRowNumber: number
    accountNumber: string | null
    accountName: string
    currentPeriodBalance: number
    priorPeriodBalance: number | null
  }>
  summary: { totalRows: number; previewRows: number; warningCount: number }
  warnings: Array<{ type: string; message: string }>
}

const MAPPING_FIELDS = [
  { key: 'accountNumber', label: 'Account number', required: false },
  { key: 'accountName', label: 'Account name', required: false },
  { key: 'accountType', label: 'Account type', required: false },
  { key: 'currentBalance', label: 'Current balance', required: false },
  { key: 'priorBalance', label: 'Prior balance', required: false },
  { key: 'debit', label: 'Debit', required: false },
  { key: 'credit', label: 'Credit', required: false }
] as const

type MappingKey = typeof MAPPING_FIELDS[number]['key']

function fileToBase64 (file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const [, base64 = ''] = result.split(',')
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

function mappingIsComplete (mapping: Record<string, string>) {
  const hasIdentity = Boolean(mapping.accountName || mapping.accountNumber)
  const hasBalance = Boolean(mapping.currentBalance || (mapping.debit && mapping.credit))
  return hasIdentity && hasBalance
}

type TrialBalanceImportPanelProps = {
  engagementId: string
  getToken: () => Promise<string | null>
  saving: boolean
  onSavingChange: (saving: boolean) => void
  onError: (message: string | null) => void
  onNotice: (message: string | null) => void
  onImported: () => Promise<void>
  onGenerateLeadSheets: () => Promise<void>
}

const TrialBalanceImportPanel: FC<TrialBalanceImportPanelProps> = ({
  engagementId,
  getToken,
  saving,
  onSavingChange,
  onError,
  onNotice,
  onImported,
  onGenerateLeadSheets
}) => {
  const [importPayload, setImportPayload] = useState<{ fileName: string; base64Content: string } | null>(null)
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [parsedColumns, setParsedColumns] = useState<string[]>([])
  const [preview, setPreview] = useState<TrialBalancePreview | null>(null)

  const runPreview = useCallback(async (
    fileName: string,
    base64Content: string,
    mapping: Record<string, string>
  ) => {
    return portalFetch<TrialBalancePreview>(
      `/v1/accounting/engagements/${engagementId}/trial-balance/preview`,
      getToken,
      {
        method: 'POST',
        body: JSON.stringify({ fileName, base64Content, mapping, useSmartImport: true })
      }
    )
  }, [engagementId, getToken])

  const onFileSelected = async (file: File | null) => {
    setPreview(null)
    setImportPayload(null)
    setParsedColumns([])
    setColumnMapping({})
    if (!file) return

    onSavingChange(true)
    onError(null)
    try {
      const base64Content = await fileToBase64(file)
      setImportPayload({ fileName: file.name, base64Content })
      const result = await runPreview(file.name, base64Content, {})
      setParsedColumns(result.columns || [])
      setColumnMapping(result.detectedMapping || {})
      setPreview(result)
      if (result.needsMapping) {
        onNotice('Smart import could not fully detect columns. Adjust mapping below, then preview again.')
      } else {
        const source = result.mappingSource === 'ai' ? 'AI smart import' : 'Smart import'
        onNotice(`${source} mapped ${result.summary.totalRows} rows. Review before import.`)
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not read trial balance file')
    } finally {
      onSavingChange(false)
    }
  }

  const onPreviewImport = async () => {
    if (!importPayload) {
      onError('Choose a file first to preview trial balance import.')
      return
    }
    if (!mappingIsComplete(columnMapping)) {
      onError('Map account name or number, plus current balance or debit and credit columns.')
      return
    }
    onSavingChange(true)
    onError(null)
    try {
      const result = await runPreview(importPayload.fileName, importPayload.base64Content, columnMapping)
      setParsedColumns(result.columns || [])
      setColumnMapping(result.detectedMapping || columnMapping)
      setPreview(result)
      if (result.needsMapping) {
        onError('Column mapping is incomplete. Update the mappings below and preview again.')
      } else {
        onNotice('Preview generated. Review warnings before import.')
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not preview import')
    } finally {
      onSavingChange(false)
    }
  }

  const onImportTrialBalance = async () => {
    if (!importPayload) {
      onError('Choose a file and complete column mapping before import.')
      return
    }
    if (!preview || preview.needsMapping || !mappingIsComplete(columnMapping)) {
      onError('Generate a successful preview before importing.')
      return
    }
    onSavingChange(true)
    onError(null)
    try {
      await portalFetch(`/v1/accounting/engagements/${engagementId}/trial-balance/import`, getToken, {
        method: 'POST',
        body: JSON.stringify({
          fileName: importPayload.fileName,
          base64Content: importPayload.base64Content,
          mapping: columnMapping,
          useSmartImport: true
        })
      })
      onNotice('Trial balance imported')
      setPreview(null)
      setImportPayload(null)
      setParsedColumns([])
      setColumnMapping({})
      await onImported()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not import trial balance')
    } finally {
      onSavingChange(false)
    }
  }

  const canImport = Boolean(preview && !preview.needsMapping && mappingIsComplete(columnMapping))

  const columnOptions = useMemo(() => {
    const options = parsedColumns.map((column) => ({ value: column, label: column }))
    return [{ value: '', label: '— Not mapped —' }, ...options]
  }, [parsedColumns])

  const updateMapping = (key: MappingKey, value: string) => {
    setColumnMapping((current) => {
      const next = { ...current }
      if (!value) delete next[key]
      else next[key] = value
      return next
    })
    setPreview(null)
  }

  return (
    <div className="rounded-lg border border-border p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-primary-dark">Import Trial Balance (CSV/XLSX)</h3>
        <p className="text-xs text-text-light mt-1">
          Smart import detects headers, maps columns automatically, and uses AI when needed for unfamiliar formats.
        </p>
      </div>
      <input
        type="file"
        accept=".csv,.xlsx"
        onChange={(e) => { void onFileSelected(e.target.files?.[0] || null) }}
      />

      {parsedColumns.length > 0 && (
        <div className="rounded-md border border-border bg-background p-3 space-y-3">
          <p className="text-sm font-medium text-text">Column mapping</p>
          <p className="text-xs text-text-light">
            Required: account name or account number, plus current balance or both debit and credit.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MAPPING_FIELDS.map((field) => (
              <label key={field.key} className="text-sm space-y-1">
                <span className="text-text-light">
                  {field.label}
                  {field.required ? ' *' : ''}
                </span>
                <select
                  className="w-full border border-border rounded-md px-2 py-1.5"
                  value={columnMapping[field.key] || ''}
                  onChange={(e) => updateMapping(field.key, e.target.value)}
                >
                  {columnOptions.map((option) => (
                    <option key={`${field.key}-${option.value || 'none'}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn--primary text-sm py-2 px-4"
          disabled={!importPayload || saving}
          onClick={() => { void onPreviewImport() }}
        >
          Preview Import
        </button>
        <button
          type="button"
          className="btn btn--primary text-sm py-2 px-4"
          disabled={!canImport || saving}
          onClick={() => { void onImportTrialBalance() }}
        >
          Import Trial Balance
        </button>
        <button
          type="button"
          className="btn btn--primary text-sm py-2 px-4"
          disabled={saving}
          onClick={() => { void onGenerateLeadSheets() }}
        >
          Generate Lead Sheets
        </button>
      </div>

      {preview && (
        <div className="rounded-lg border border-border p-4 space-y-2">
          {preview.needsMapping ? (
            <p className="text-sm text-amber-800">Complete column mapping and preview again before import.</p>
          ) : (
            <>
              <p className="text-sm text-text">Rows: {preview.summary.totalRows}</p>
              <p className="text-sm text-text">Warnings: {preview.summary.warningCount}</p>
              {preview.mappingSource && (
                <p className="text-xs text-text-light">
                  Mapping: {preview.mappingSource}
                  {preview.mappingConfidence != null ? ` (${Math.round(preview.mappingConfidence * 100)}% confidence)` : ''}
                  {preview.headerRowIndex != null ? ` · header row ${preview.headerRowIndex + 1}` : ''}
                </p>
              )}
              {preview.mappingNotes && (
                <p className="text-xs text-text-light">{preview.mappingNotes}</p>
              )}
            </>
          )}
          {preview.warnings.slice(0, 8).map((warning, idx) => (
            <p key={`${warning.type}-${idx}`} className="text-xs text-text-light">{warning.message}</p>
          ))}
          {!preview.needsMapping && preview.previewRows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-border">
                <thead>
                  <tr className="bg-background">
                    <th className="px-2 py-1 text-left">Account #</th>
                    <th className="px-2 py-1 text-left">Account name</th>
                    <th className="px-2 py-1 text-right">Current</th>
                    <th className="px-2 py-1 text-right">Prior</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.previewRows.slice(0, 10).map((row) => (
                    <tr key={row.sourceRowNumber} className="border-t border-border">
                      <td className="px-2 py-1">{row.accountNumber || '—'}</td>
                      <td className="px-2 py-1">{row.accountName || '—'}</td>
                      <td className="px-2 py-1 text-right">{row.currentPeriodBalance.toFixed(2)}</td>
                      <td className="px-2 py-1 text-right">
                        {row.priorPeriodBalance == null ? '—' : row.priorPeriodBalance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TrialBalanceImportPanel
