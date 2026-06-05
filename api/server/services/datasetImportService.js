import XLSX from 'xlsx'
import {
  buildFilePreview,
  buildHeaderRowCandidates,
  columnStats,
  detectBestGridStructure,
  detectGridStructure,
  mapRowToSchema,
  normalizeHeader,
  parseCsvToGrid,
  schemaMappingIsUsable
} from './spreadsheetImportService.js'

const DATASET_TYPES = new Set([
  'custom', 'ar_aging', 'fixed_assets', 'payroll', 'gl_detail', 'bank_transactions', 'other'
])

const DATA_TYPES = new Set(['text', 'number', 'currency', 'date', 'boolean'])

function sanitizeText (value) {
  return String(value ?? '').replace(/[\u0000-\u001f]/g, '').trim()
}

function parseXlsxToGrid (buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) return []
  const sheet = workbook.Sheets[firstSheetName]
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
}

function slugifyKey (value, index) {
  const base = normalizeHeader(value).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  return base || `column_${index + 1}`
}

export function inferColumnSchema (columns, rows) {
  const stats = columnStats(columns, rows)
  const usedKeys = new Set()

  return columns.map((column, index) => {
    const stat = stats.find((entry) => entry.column === column)
    let dataType = 'text'
    if (/date|period|as of/i.test(column)) dataType = 'date'
    else if (stat && stat.numericRate >= 0.75) dataType = 'currency'

    let key = slugifyKey(column, index)
    let suffix = 1
    while (usedKeys.has(key)) {
      suffix += 1
      key = `${slugifyKey(column, index)}_${suffix}`
    }
    usedKeys.add(key)

    return {
      key,
      label: column,
      dataType,
      sourceColumn: column
    }
  })
}

function evaluateDatasetStructure (columns, rows) {
  const schema = inferColumnSchema(columns, rows)
  const usable = schema.length > 0
  const numericCols = schema.filter((col) => col.dataType === 'currency' || col.dataType === 'number').length
  const confidence = Math.min(0.3 + schema.length * 0.05 + numericCols * 0.1, 0.9)
  return { schema, confidence, usable }
}

export function parseDatasetFile ({ fileName, base64Content, headerRowIndex = null }) {
  const safeName = sanitizeText(fileName).toLowerCase()
  if (!safeName.endsWith('.csv') && !safeName.endsWith('.xlsx')) {
    throw new Error('Unsupported file type. Only CSV and XLSX are allowed.')
  }
  const buffer = Buffer.from(String(base64Content || ''), 'base64')
  if (!buffer.length) throw new Error('No file data was provided')

  const grid = safeName.endsWith('.csv') ? parseCsvToGrid(buffer) : parseXlsxToGrid(buffer)
  const structure = Number.isInteger(headerRowIndex)
    ? detectGridStructure(grid, { headerRowIndex })
    : detectBestGridStructure(grid, evaluateDatasetStructure)

  return {
    fileType: safeName.endsWith('.csv') ? 'csv' : 'xlsx',
    grid,
    ...structure
  }
}

function schemaWarnings (columnSchema) {
  const warnings = []
  if (!schemaMappingIsUsable(columnSchema)) {
    warnings.push({ type: 'missing_mapping', message: 'Map at least one source column before import.' })
  }
  const keys = new Set()
  for (const col of columnSchema) {
    if (!col.key || !col.sourceColumn) {
      warnings.push({ type: 'invalid_column', message: 'Each column needs a field key and source column.' })
      break
    }
    if (keys.has(col.key)) {
      warnings.push({ type: 'duplicate_key', message: `Duplicate field key: ${col.key}` })
    }
    keys.add(col.key)
    if (col.dataType && !DATA_TYPES.has(col.dataType)) {
      warnings.push({ type: 'invalid_type', message: `Invalid data type for ${col.key}` })
    }
  }
  return warnings
}

export function previewDatasetImport ({
  rows,
  columns,
  grid = [],
  headerRowIndex = 0,
  columnSchema = [],
  materialityAmount = null
}) {
  let effectiveRows = rows
  let effectiveColumns = columns
  let effectiveHeaderRowIndex = headerRowIndex
  let effectiveSchema = Array.isArray(columnSchema) ? columnSchema : []

  if (grid.length && Number.isInteger(headerRowIndex)) {
    const structure = detectGridStructure(grid, { headerRowIndex })
    effectiveRows = structure.rows
    effectiveColumns = structure.columns
    effectiveHeaderRowIndex = structure.headerRowIndex
  }

  if (!effectiveSchema.length && effectiveColumns.length) {
    effectiveSchema = inferColumnSchema(effectiveColumns, effectiveRows)
  }

  const warnings = schemaWarnings(effectiveSchema)
  const filePreview = buildFilePreview(grid, 15)
  const headerRowCandidates = buildHeaderRowCandidates(grid, evaluateDatasetStructure, 12)

  const previewRows = effectiveSchema.length
    ? effectiveRows.slice(0, 50).map((row, index) => ({
      sourceRowNumber: effectiveHeaderRowIndex + index + 2,
      rowData: mapRowToSchema(row, effectiveSchema)
    }))
    : []

  return {
    columns: effectiveColumns,
    columnSchema: effectiveSchema,
    needsMapping: warnings.length > 0,
    headerRowIndex: effectiveHeaderRowIndex,
    filePreview,
    headerRowCandidates,
    previewRows,
    summary: {
      totalRows: effectiveRows.length,
      previewRows: previewRows.length,
      warningCount: warnings.length
    },
    warnings,
    mappingStatus: {
      isComplete: warnings.length === 0,
      missingFields: warnings.length ? ['columnSchema'] : []
    }
  }
}

export function validateDatasetType (value) {
  const normalized = sanitizeText(value).toLowerCase() || 'custom'
  return DATASET_TYPES.has(normalized) ? normalized : 'custom'
}

export { DATASET_TYPES, DATA_TYPES }
