import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import {
  createDatasetImportTemplateDomain,
  DatasetColumnSchema,
  DatasetImportTemplate,
  DatasetPreview,
  importDatasetRowsDomain,
  listDatasetImportTemplatesDomain,
  previewDatasetImportDomain
} from '../../../domains/engagement-datasets'

const DATA_TYPES = ['text', 'number', 'currency', 'date', 'boolean'] as const

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

type DatasetImportPanelProps = {
  engagementId: string
  datasetId: string
  getToken: () => Promise<string | null>
  saving: boolean
  onSavingChange: (saving: boolean) => void
  onError: (message: string | null) => void
  onNotice: (message: string | null) => void
  onImported: () => Promise<void>
  initialColumnSchema?: DatasetColumnSchema[]
}

const DatasetImportPanel: FC<DatasetImportPanelProps> = ({
  engagementId,
  datasetId,
  getToken,
  saving,
  onSavingChange,
  onError,
  onNotice,
  onImported,
  initialColumnSchema = []
}) => {
  const [importPayload, setImportPayload] = useState<{ fileName: string; base64Content: string } | null>(null)
  const [columnSchema, setColumnSchema] = useState<DatasetColumnSchema[]>(initialColumnSchema)
  const [headerRowNumber, setHeaderRowNumber] = useState<number | null>(null)
  const [preview, setPreview] = useState<DatasetPreview | null>(null)
  const [mappingDirty, setMappingDirty] = useState(false)
  const [templates, setTemplates] = useState<DatasetImportTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [templateName, setTemplateName] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const result = await listDatasetImportTemplatesDomain(getToken)
        setTemplates(result.templates || [])
      } catch {
        setTemplates([])
      }
    })()
  }, [getToken])

  const runPreview = useCallback(async (
    fileName: string,
    base64Content: string,
    options: { headerRowNumber?: number | null; autoDetect?: boolean } = {}
  ) => {
    return previewDatasetImportDomain(getToken, engagementId, {
      fileName,
      base64Content,
      columnSchema: options.autoDetect ? [] : columnSchema,
      headerRowNumber: options.autoDetect ? undefined : options.headerRowNumber ?? undefined
    })
  }, [columnSchema, engagementId, getToken])

  const applyPreview = (result: DatasetPreview) => {
    if (result.columnSchema?.length) setColumnSchema(result.columnSchema)
    if (result.headerRowIndex != null) setHeaderRowNumber(result.headerRowIndex + 1)
    setPreview(result)
    setMappingDirty(false)
  }

  const onFileSelected = async (file: File | null) => {
    setPreview(null)
    setImportPayload(null)
    setMappingDirty(false)
    if (!file) return
    onSavingChange(true)
    onError(null)
    try {
      const base64Content = await fileToBase64(file)
      setImportPayload({ fileName: file.name, base64Content })
      const result = await runPreview(file.name, base64Content, { autoDetect: true })
      applyPreview(result)
      onNotice(result.needsMapping
        ? 'File loaded. Review column mapping, then update preview.'
        : `Detected ${result.summary.totalRows} rows. Update preview, then import.`)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not read file')
    } finally {
      onSavingChange(false)
    }
  }

  const onUpdatePreview = async (autoDetect = false) => {
    if (!importPayload) {
      onError('Choose a file first.')
      return
    }
    onSavingChange(true)
    onError(null)
    try {
      const result = await runPreview(importPayload.fileName, importPayload.base64Content, {
        autoDetect,
        headerRowNumber: autoDetect ? null : headerRowNumber
      })
      applyPreview(result)
      if (result.needsMapping) onError('Fix column mapping issues below.')
      else onNotice('Preview updated.')
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not preview import')
    } finally {
      onSavingChange(false)
    }
  }

  const onImport = async () => {
    if (!importPayload || !preview || preview.needsMapping || mappingDirty) {
      onError('Update preview successfully before importing.')
      return
    }
    onSavingChange(true)
    onError(null)
    try {
      await importDatasetRowsDomain(getToken, engagementId, datasetId, {
        fileName: importPayload.fileName,
        base64Content: importPayload.base64Content,
        columnSchema,
        headerRowNumber: headerRowNumber ?? undefined
      })
      setPreview(null)
      setImportPayload(null)
      await onImported()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not import dataset')
    } finally {
      onSavingChange(false)
    }
  }

  const maxFileColumns = useMemo(() => {
    const rows = preview?.filePreview || []
    return rows.reduce((max, row) => Math.max(max, row.cells.length), 0)
  }, [preview?.filePreview])

  const updateColumn = (index: number, patch: Partial<DatasetColumnSchema>) => {
    setColumnSchema((current) => {
      const next = [...current]
      next[index] = { ...next[index], ...patch }
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
        const result = await runPreview(importPayload.fileName, importPayload.base64Content, { headerRowNumber: rowNumber })
        applyPreview(result)
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Could not update header row')
      } finally {
        onSavingChange(false)
      }
    })()
  }

  const onApplyTemplate = () => {
    const template = templates.find((entry) => entry.id === selectedTemplateId)
    if (!template) return
    if (template.column_schema?.length) {
      setColumnSchema(template.column_schema)
      setMappingDirty(true)
    }
    if (template.header_row_index != null) {
      setHeaderRowNumber(template.header_row_index + 1)
    }
    onNotice(`Applied template "${template.name}". Update preview before importing.`)
  }

  const onSaveTemplate = async () => {
    if (!templateName.trim() || !columnSchema.length) {
      onError('Enter a template name and map columns first.')
      return
    }
    onSavingChange(true)
    onError(null)
    try {
      const result = await createDatasetImportTemplateDomain(getToken, {
        name: templateName.trim(),
        headerRowIndex: headerRowNumber != null ? headerRowNumber - 1 : undefined,
        columnSchema
      })
      setTemplateName('')
      setTemplates((current) => [result.template, ...current])
      onNotice(`Saved template "${result.template.name}".`)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not save template')
    } finally {
      onSavingChange(false)
    }
  }

  const canImport = Boolean(preview && !preview.needsMapping && !mappingDirty && importPayload)

  return (
    <div className="rounded-lg border border-border p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-primary-dark">Import spreadsheet</h3>
        <p className="text-xs text-text-light mt-1">
          Upload any CSV/XLSX. Map columns to typed fields — your source file stays unchanged.
        </p>
      </div>
      <input type="file" accept=".csv,.xlsx" onChange={(e) => { void onFileSelected(e.target.files?.[0] || null) }} />

      {templates.length > 0 && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm space-y-1 block min-w-[220px]">
            <span className="text-text-light">Apply saved template</span>
            <select
              className="w-full border border-border rounded-md px-2 py-1.5 text-sm"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              <option value="">Choose template…</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn--secondary text-sm py-2 px-4"
            disabled={!selectedTemplateId || saving}
            onClick={onApplyTemplate}
          >
            Apply template
          </button>
        </div>
      )}

      {preview?.filePreview && preview.filePreview.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm space-y-1 block max-w-lg">
            <span className="text-text-light">Header row</span>
            <select
              className="w-full border border-border rounded-md px-2 py-1.5 text-sm"
              value={headerRowNumber ?? ''}
              onChange={(e) => onHeaderRowSelected(Number(e.target.value))}
            >
              {(preview.headerRowCandidates || []).map((candidate) => (
                <option key={`hdr-${candidate.rowNumber}`} value={candidate.rowNumber}>
                  Row {candidate.rowNumber}: {candidate.label}
                </option>
              ))}
            </select>
          </label>
          <div className="overflow-x-auto max-h-48">
            <table className="min-w-full text-xs border border-border">
              <tbody>
                {preview.filePreview.map((row) => (
                  <tr key={`f-${row.rowNumber}`} className={headerRowNumber === row.rowNumber ? 'bg-sky-50' : ''}>
                    <td className="px-2 py-1 font-medium">{row.rowNumber}</td>
                    {Array.from({ length: maxFileColumns }, (_, i) => (
                      <td key={`f-${row.rowNumber}-${i}`} className="px-2 py-1">{row.cells[i] || ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {columnSchema.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Column mapping</p>
          <div className="space-y-2">
            {columnSchema.map((column, index) => (
              <div key={`${column.sourceColumn}-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <input
                  className="border border-border rounded-md px-2 py-1.5 text-sm"
                  value={column.sourceColumn}
                  readOnly
                />
                <input
                  className="border border-border rounded-md px-2 py-1.5 text-sm"
                  value={column.key}
                  onChange={(e) => updateColumn(index, { key: e.target.value })}
                />
                <input
                  className="border border-border rounded-md px-2 py-1.5 text-sm"
                  value={column.label}
                  onChange={(e) => updateColumn(index, { label: e.target.value })}
                />
                <select
                  className="border border-border rounded-md px-2 py-1.5 text-sm"
                  value={column.dataType}
                  onChange={(e) => updateColumn(index, { dataType: e.target.value as DatasetColumnSchema['dataType'] })}
                >
                  {DATA_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {columnSchema.length > 0 && (
        <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-border">
          <label className="text-sm space-y-1 block min-w-[220px]">
            <span className="text-text-light">Save mapping as template</span>
            <input
              className="w-full border border-border rounded-md px-2 py-1.5 text-sm"
              placeholder="Template name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn btn--secondary text-sm py-2 px-4"
            disabled={saving || !templateName.trim()}
            onClick={() => { void onSaveTemplate() }}
          >
            Save template
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {importPayload && (
          <button type="button" className="btn btn--primary text-sm py-2 px-4" disabled={saving} onClick={() => { void onUpdatePreview(false) }}>
            Update preview
          </button>
        )}
        {importPayload && (
          <button type="button" className="btn btn--secondary text-sm py-2 px-4" disabled={saving} onClick={() => { void onUpdatePreview(true) }}>
            Re-detect
          </button>
        )}
        <button type="button" className="btn btn--primary text-sm py-2 px-4" disabled={!canImport || saving} onClick={() => { void onImport() }}>
          Import into dataset
        </button>
      </div>
    </div>
  )
}

export default DatasetImportPanel
