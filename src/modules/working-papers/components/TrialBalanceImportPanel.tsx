import { FC, useCallback, useMemo, useState } from 'react'
import { portalFetch } from '../../../lib/portalApi'

type TrialBalancePreviewRow = {
  sourceRowNumber: number
  accountNumber: string | null
  accountName: string
  debitAmount?: number | null
  creditAmount?: number | null
  currentPeriodBalance: number
  priorPeriodBalance: number | null
}

type FilePreviewRow = {
  rowNumber: number
  cells: string[]
}

type HeaderRowCandidate = {
  rowIndex: number
  rowNumber: number
  label: string
  columns: string[]
  rowCount: number
  confidence: number
  usable: boolean
}

type MappingStatus = {
  hasIdentity: boolean
  hasBalance: boolean
  isComplete: boolean
  missingFields: string[]
}

type TrialBalancePreview = {
  columns: string[]
  detectedMapping: Record<string, string>
  needsMapping?: boolean
  mappingSource?: 'heuristic' | 'ai' | 'manual'
  mappingConfidence?: number | null
  mappingNotes?: string | null
  headerRowIndex?: number
  mappingStatus?: MappingStatus
  filePreview?: FilePreviewRow[]
  headerRowCandidates?: HeaderRowCandidate[]
  previewRows: TrialBalancePreviewRow[]
  summary: { totalRows: number; previewRows: number; warningCount: number }
  warnings: Array<{ type: string; message: string }>
}

const MAPPING_FIELDS = [
  { key: 'accountNumber', label: 'Account number', group: 'identity' },
  { key: 'accountName', label: 'Account name', group: 'identity' },
  { key: 'accountType', label: 'Account type', group: 'optional' },
  { key: 'currentBalance', label: 'Current balance', group: 'balance' },
  { key: 'priorBalance', label: 'Prior balance', group: 'balance' },
  { key: 'debit', label: 'Debit', group: 'balance' },
  { key: 'credit', label: 'Credit', group: 'balance' }
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

function usesDebitCredit (mapping: Record<string, string>) {
  return Boolean(mapping.debit && mapping.credit && !mapping.currentBalance)
}

function missingFieldLabels (status?: MappingStatus) {
  if (!status || status.isComplete) return []
  const labels: string[] = []
  if (!status.hasIdentity) labels.push('account name or number')
  if (!status.hasBalance) labels.push('balance (current, or debit + credit)')
  return labels
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
  const [headerRowNumber, setHeaderRowNumber] = useState<number | null>(null)
  const [preview, setPreview] = useState<TrialBalancePreview | null>(null)
  const [mappingDirty, setMappingDirty] = useState(false)

  const runPreview = useCallback(async (
    fileName: string,
    base64Content: string,
    mapping: Record<string, string>,
    options: { headerRowNumber?: number | null; autoDetect?: boolean } = {}
  ) => {
    return portalFetch<TrialBalancePreview>(
      `/v1/accounting/engagements/${engagementId}/trial-balance/preview`,
      getToken,
      {
        method: 'POST',
        body: JSON.stringify({
          fileName,
          base64Content,
          mapping,
          useSmartImport: true,
          headerRowNumber: options.autoDetect ? undefined : options.headerRowNumber ?? undefined
        })
      }
    )
  }, [engagementId, getToken])

  const applyPreviewResult = (result: TrialBalancePreview, mapping: Record<string, string>) => {
    setParsedColumns(result.columns || [])
    setColumnMapping(result.detectedMapping || mapping)
    if (result.headerRowIndex != null) {
      setHeaderRowNumber(result.headerRowIndex + 1)
    }
    setPreview(result)
    setMappingDirty(false)
  }

  const onFileSelected = async (file: File | null) => {
    setPreview(null)
    setImportPayload(null)
    setParsedColumns([])
    setColumnMapping({})
    setHeaderRowNumber(null)
    setMappingDirty(false)
    if (!file) return

    onSavingChange(true)
    onError(null)
    try {
      const base64Content = await fileToBase64(file)
      setImportPayload({ fileName: file.name, base64Content })
      const result = await runPreview(file.name, base64Content, {}, { autoDetect: true })
      applyPreviewResult(result, {})
      if (result.needsMapping) {
        onNotice('File loaded. Review what we read below, adjust the header row or column mapping if needed, then update preview.')
      } else {
        onNotice(`Detected ${result.summary.totalRows} accounts. Review the preview, then import when ready.`)
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not read trial balance file')
    } finally {
      onSavingChange(false)
    }
  }

  const onPreviewImport = async (autoDetect = false) => {
    if (!importPayload) {
      onError('Choose a file first.')
      return
    }
    if (!autoDetect && !mappingIsComplete(columnMapping)) {
      onError('Select which file columns contain the account and balance fields, then update preview.')
      return
    }
    onSavingChange(true)
    onError(null)
    try {
      const result = await runPreview(
        importPayload.fileName,
        importPayload.base64Content,
        autoDetect ? {} : columnMapping,
        { autoDetect, headerRowNumber: autoDetect ? null : headerRowNumber }
      )
      applyPreviewResult(result, autoDetect ? {} : columnMapping)
      if (result.needsMapping) {
        onError('Some required fields are still unmapped. Adjust the selections below and update preview again.')
      } else {
        onNotice('Preview updated. Review the sample rows before importing.')
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not preview import')
    } finally {
      onSavingChange(false)
    }
  }

  const onImportTrialBalance = async () => {
    if (!importPayload) {
      onError('Choose a file before importing.')
      return
    }
    if (!preview || preview.needsMapping || !mappingIsComplete(columnMapping) || mappingDirty) {
      onError('Update preview successfully before importing.')
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
          useSmartImport: true,
          headerRowNumber: headerRowNumber ?? undefined
        })
      })
      onNotice('Trial balance imported')
      setPreview(null)
      setImportPayload(null)
      setParsedColumns([])
      setColumnMapping({})
      setHeaderRowNumber(null)
      setMappingDirty(false)
      await onImported()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not import trial balance')
    } finally {
      onSavingChange(false)
    }
  }

  const canImport = Boolean(
    preview && !preview.needsMapping && mappingIsComplete(columnMapping) && !mappingDirty
  )
  const showDebitCreditPreview = usesDebitCredit(columnMapping)
  const missingLabels = missingFieldLabels(preview?.mappingStatus)
  const activeHeaderRow = headerRowNumber ?? (preview?.headerRowIndex != null ? preview.headerRowIndex + 1 : null)

  const columnOptions = useMemo(() => {
    const options = parsedColumns.map((column) => ({ value: column, label: column }))
    return [{ value: '', label: '— Select a column —' }, ...options]
  }, [parsedColumns])

  const maxFileColumns = useMemo(() => {
    const rows = preview?.filePreview || []
    return rows.reduce((max, row) => Math.max(max, row.cells.length), 0)
  }, [preview?.filePreview])

  const updateMapping = (key: MappingKey, value: string) => {
    setColumnMapping((current) => {
      const next = { ...current }
      if (!value) delete next[key]
      else next[key] = value
      return next
    })
    setMappingDirty(true)
  }

  const onHeaderRowSelected = (rowNumber: number) => {
    if (!importPayload || rowNumber === headerRowNumber) return
    setHeaderRowNumber(rowNumber)
    setMappingDirty(true)
    void (async () => {
      onSavingChange(true)
      onError(null)
      try {
        const result = await runPreview(
          importPayload.fileName,
          importPayload.base64Content,
          columnMapping,
          { headerRowNumber: rowNumber }
        )
        applyPreviewResult(result, columnMapping)
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Could not update header row')
      } finally {
        onSavingChange(false)
      }
    })()
  }

  return (
    <div className="rounded-lg border border-border p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-primary-dark">Import Trial Balance (CSV/XLSX)</h3>
        <p className="text-xs text-text-light mt-1">
          Upload any trial balance export. The system auto-detects the layout, shows you what it read from your file,
          and lets you correct the header row or column mapping if needed — without editing your source file.
        </p>
      </div>
      <input
        type="file"
        accept=".csv,.xlsx"
        onChange={(e) => { void onFileSelected(e.target.files?.[0] || null) }}
      />

      {preview && !preview.needsMapping && !mappingDirty && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Ready to import. {preview.summary.totalRows} account rows detected
          {activeHeaderRow != null ? ` (header row ${activeHeaderRow})` : ''}.
        </div>
      )}

      {(preview?.needsMapping || mappingDirty) && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 space-y-1">
          <p>
            {mappingDirty
              ? 'Mapping changed — click Update preview to refresh the import preview.'
              : 'Automatic detection needs your help to finish mapping.'}
          </p>
          {missingLabels.length > 0 && (
            <p className="text-xs">Still needed: {missingLabels.join(' and ')}.</p>
          )}
        </div>
      )}

      {preview?.filePreview && preview.filePreview.length > 0 && (
        <div className="rounded-md border border-border bg-background p-3 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-text">What we read from your file</p>
              <p className="text-xs text-text-light">
                The highlighted row is treated as the column header. Click a row number or use the dropdown to change it.
              </p>
            </div>
            <label className="text-sm space-y-1 min-w-[280px]">
              <span className="text-text-light">Header row</span>
              <select
                className="w-full border border-border rounded-md px-2 py-1.5"
                value={activeHeaderRow ?? ''}
                onChange={(e) => onHeaderRowSelected(Number(e.target.value))}
              >
                {(preview.headerRowCandidates || []).map((candidate) => (
                  <option key={`header-${candidate.rowNumber}`} value={candidate.rowNumber}>
                    Row {candidate.rowNumber}: {candidate.label}
                    {candidate.usable ? ' ✓' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="min-w-full text-xs border border-border">
              <thead>
                <tr className="bg-background">
                  <th className="px-2 py-1 text-left w-12">Row</th>
                  {Array.from({ length: maxFileColumns }, (_, index) => (
                    <th key={`file-col-${index}`} className="px-2 py-1 text-left">
                      Col {index + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.filePreview.map((row) => {
                  const isHeader = activeHeaderRow === row.rowNumber
                  return (
                    <tr
                      key={`file-row-${row.rowNumber}`}
                      className={`border-t border-border ${isHeader ? 'bg-sky-50' : ''}`}
                    >
                      <td className="px-2 py-1">
                        <button
                          type="button"
                          className={`font-medium ${isHeader ? 'text-sky-800' : 'text-text hover:underline'}`}
                          onClick={() => onHeaderRowSelected(row.rowNumber)}
                        >
                          {row.rowNumber}
                        </button>
                      </td>
                      {Array.from({ length: maxFileColumns }, (_, index) => (
                        <td key={`file-row-${row.rowNumber}-col-${index}`} className="px-2 py-1 max-w-[200px] truncate">
                          {row.cells[index] || ''}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {parsedColumns.length > 0 && (
        <div className="rounded-md border border-border bg-background p-3 space-y-3">
          <div>
            <p className="text-sm font-medium text-text">Match file columns to import fields</p>
            <p className="text-xs text-text-light">
              Required: account name or number, plus either a current balance column or both debit and credit columns.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MAPPING_FIELDS.map((field) => {
              const isRequired = field.group === 'identity' || field.group === 'balance'
              const isMissing = preview?.mappingStatus && (
                (field.group === 'identity' && !preview.mappingStatus.hasIdentity && !columnMapping[field.key])
                || (field.group === 'balance' && !preview.mappingStatus.hasBalance
                  && !columnMapping.currentBalance
                  && !(columnMapping.debit && columnMapping.credit)
                  && (field.key === 'currentBalance' || field.key === 'debit' || field.key === 'credit'))
              )
              return (
                <label key={field.key} className="text-sm space-y-1">
                  <span className={`text-text-light ${isMissing ? 'text-amber-800' : ''}`}>
                    {field.label}
                    {isRequired && field.group !== 'optional' ? ' *' : ''}
                  </span>
                  <select
                    className={`w-full border rounded-md px-2 py-1.5 ${isMissing ? 'border-amber-400' : 'border-border'}`}
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
              )
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {importPayload && (
          <button
            type="button"
            className="btn btn--primary text-sm py-2 px-4"
            disabled={saving || (!mappingDirty && !preview?.needsMapping && Boolean(preview && !preview.needsMapping))}
            onClick={() => { void onPreviewImport(false) }}
          >
            Update preview
          </button>
        )}
        {importPayload && (
          <button
            type="button"
            className="btn btn--secondary text-sm py-2 px-4"
            disabled={saving}
            onClick={() => { void onPreviewImport(true) }}
          >
            Re-detect automatically
          </button>
        )}
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
          {!preview.needsMapping && !mappingDirty && (
            <>
              <p className="text-sm text-text">Rows: {preview.summary.totalRows}</p>
              <p className="text-sm text-text">Warnings: {preview.summary.warningCount}</p>
              {preview.mappingSource && (
                <p className="text-xs text-text-light">
                  Detection: {preview.mappingSource}
                  {preview.mappingConfidence != null ? ` (${Math.round(preview.mappingConfidence * 100)}% confidence)` : ''}
                  {activeHeaderRow != null ? ` · header row ${activeHeaderRow}` : ''}
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
          {preview.previewRows.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-text">
                {preview.needsMapping || mappingDirty ? 'Partial preview' : 'Import preview'}
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border border-border">
                  <thead>
                    <tr className="bg-background">
                      <th className="px-2 py-1 text-left">Account #</th>
                      <th className="px-2 py-1 text-left">Account name</th>
                      {showDebitCreditPreview ? (
                        <>
                          <th className="px-2 py-1 text-right">Debit</th>
                          <th className="px-2 py-1 text-right">Credit</th>
                          <th className="px-2 py-1 text-right">Net balance</th>
                        </>
                      ) : (
                        <>
                          <th className="px-2 py-1 text-right">Current</th>
                          <th className="px-2 py-1 text-right">Prior</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.previewRows.slice(0, 10).map((row) => (
                      <tr key={row.sourceRowNumber} className="border-t border-border">
                        <td className="px-2 py-1">{row.accountNumber || '—'}</td>
                        <td className="px-2 py-1">{row.accountName || '—'}</td>
                        {showDebitCreditPreview ? (
                          <>
                            <td className="px-2 py-1 text-right">
                              {row.debitAmount == null ? '—' : row.debitAmount.toFixed(2)}
                            </td>
                            <td className="px-2 py-1 text-right">
                              {row.creditAmount == null ? '—' : row.creditAmount.toFixed(2)}
                            </td>
                            <td className="px-2 py-1 text-right">{row.currentPeriodBalance.toFixed(2)}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-2 py-1 text-right">{row.currentPeriodBalance.toFixed(2)}</td>
                            <td className="px-2 py-1 text-right">
                              {row.priorPeriodBalance == null ? '—' : row.priorPeriodBalance.toFixed(2)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TrialBalanceImportPanel
