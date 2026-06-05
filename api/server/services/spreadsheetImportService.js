/**
 * Format-agnostic spreadsheet import engine (CSV/XLSX grid parsing and structure detection).
 * Domain adapters (trial balance, engagement datasets) supply mapping evaluation callbacks.
 */

export function sanitizeText (value) {
  return String(value ?? '').replace(/[\u0000-\u001f]/g, '').trim()
}

export function parseNumber (value) {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const normalized = String(value).replace(/[,$\s]/g, '').replace(/^\((.*)\)$/, '-$1').trim()
  if (!normalized.length) return null
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

export function isNumericCell (value) {
  return parseNumber(value) != null
}

function splitCsvLine (line) {
  const delimiter = (line.split('\t').length > line.split(',').length) ? '\t' : ','
  if (delimiter === '\t') {
    return line.split('\t').map((v) => sanitizeText(v.replace(/^"|"$/g, '')))
  }
  const out = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"' && line[i + 1] === '"') {
      current += '"'
      i++
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      out.push(sanitizeText(current.replace(/^"|"$/g, '')))
      current = ''
    } else {
      current += char
    }
  }
  out.push(sanitizeText(current.replace(/^"|"$/g, '')))
  return out
}

export function parseCsvToGrid (buffer) {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '')
  const lines = text.split(/\r?\n/)
  return lines.map((line) => (line.trim().length === 0 ? [''] : splitCsvLine(line)))
}

export function gridToTable (grid, maxRows = 18) {
  const slice = grid.slice(0, maxRows)
  return slice.map((row) => row.map((cell) => sanitizeText(cell)).join(' | ')).join('\n')
}

export function buildFilePreview (grid, maxRows = 15) {
  return grid.slice(0, maxRows).map((cells, index) => ({
    rowNumber: index + 1,
    cells: (cells || []).map((cell) => sanitizeText(cell))
  }))
}

function spreadsheetHeaderBonus (cells) {
  const normalized = cells.map((cell) => sanitizeText(cell).toLowerCase()).filter(Boolean)
  if (normalized.length < 2) return 0

  let bonus = 0
  const joined = normalized.join(' ')
  if (/account/.test(joined) && /(debit|credit|balance|amount)/.test(joined)) bonus += 24
  if (normalized.some((cell) => /account\s*(number|no|#|code)/.test(cell))) bonus += 10
  if (normalized.some((cell) => /^accounts?$|^account name$|^description$|^name$/.test(cell))) bonus += 8
  if (normalized.some((cell) => /^debit$|\bdr\b/.test(cell))) bonus += 10
  if (normalized.some((cell) => /^credit$|\bcr\b/.test(cell))) bonus += 10
  if (normalized.some((cell) => /current|prior|balance|amount|date|total/.test(cell))) bonus += 6
  return bonus
}

function scoreHeaderCandidate (row, followingRows) {
  const cells = row.map(sanitizeText)
  const nonEmpty = cells.filter(Boolean)
  if (nonEmpty.length < 2) return -1

  const numericCells = nonEmpty.filter(isNumericCell).length
  const textCells = nonEmpty.length - numericCells
  if (textCells < 2) return -1

  let numericFollow = 0
  let samples = 0
  for (const sample of followingRows.slice(0, 8)) {
    const sampleCells = sample.map(sanitizeText).filter(Boolean)
    if (!sampleCells.length) continue
    samples++
    const numericCount = sampleCells.filter(isNumericCell).length
    if (numericCount >= 1) numericFollow++
  }
  if (!samples) return textCells

  return textCells * 3 + numericFollow * 4 - numericCells + spreadsheetHeaderBonus(cells)
}

function isSkippableDataRow (cells) {
  const joined = cells.map(sanitizeText).join(' ').trim()
  if (!joined) return true
  const lower = joined.toLowerCase()
  const hasNumber = cells.some((cell) => isNumericCell(cell))
  if (!hasNumber && /^(total|subtotal|grand total|report total|balance sheet|income statement)/i.test(lower)) {
    return true
  }
  return false
}

function uniqueColumnLabels (labels) {
  const columns = []
  const seen = new Map()
  for (const label of labels) {
    const base = sanitizeText(label) || 'Column'
    const count = seen.get(base) || 0
    seen.set(base, count + 1)
    columns.push(count ? `${base} (${count + 1})` : base)
  }
  return columns
}

function detectHeaderRowIndex (grid) {
  let headerRowIndex = 0
  let bestScore = -Infinity
  const scanLimit = Math.min(grid.length, 30)
  for (let i = 0; i < scanLimit; i++) {
    const score = scoreHeaderCandidate(grid[i], grid.slice(i + 1, i + 10))
    if (score > bestScore) {
      bestScore = score
      headerRowIndex = i
    }
  }
  return headerRowIndex
}

export function detectGridStructure (grid, options = {}) {
  if (!Array.isArray(grid) || !grid.length) {
    return { headerRowIndex: 0, columns: [], rows: [], dataStartRowIndex: 1 }
  }

  const forcedHeader = Number.isInteger(options.headerRowIndex)
    ? Math.max(0, Math.min(options.headerRowIndex, grid.length - 1))
    : null
  const headerRowIndex = forcedHeader ?? detectHeaderRowIndex(grid)

  const headerCells = (grid[headerRowIndex] || []).map((cell, idx) => sanitizeText(cell) || `Column ${idx + 1}`)
  const customHeaders = Array.isArray(options.columnHeaders)
    ? options.columnHeaders.map((label, idx) => sanitizeText(label) || headerCells[idx] || `Column ${idx + 1}`)
    : null
  const columns = uniqueColumnLabels(customHeaders || headerCells)

  const rows = []
  for (let i = headerRowIndex + 1; i < grid.length; i++) {
    const cells = grid[i] || []
    if (isSkippableDataRow(cells)) continue
    const row = {}
    let hasContent = false
    for (let c = 0; c < columns.length; c++) {
      const value = cells[c] ?? ''
      row[columns[c]] = value
      if (sanitizeText(value)) hasContent = true
    }
    if (hasContent) rows.push(row)
  }

  return {
    headerRowIndex,
    dataStartRowIndex: headerRowIndex + 1,
    columns,
    rows
  }
}

export function columnStats (columns, rows) {
  return columns.map((column) => {
    const values = rows.map((row) => row[column]).filter((value) => sanitizeText(value))
    const numericValues = values.filter((value) => isNumericCell(value))
    const accountNumberHits = values.filter((value) => /^\d{2,}[\d.-]*$/.test(sanitizeText(value))).length
    const combinedAccountHits = values.filter((value) => /^\d{2,}\s*[-–:]\s*.+/.test(sanitizeText(value))).length
    const avgLength = values.reduce((sum, value) => sum + sanitizeText(value).length, 0) / Math.max(values.length, 1)

    return {
      column,
      fillRate: values.length / Math.max(rows.length, 1),
      numericRate: numericValues.length / Math.max(values.length, 1),
      accountNumberRate: accountNumberHits / Math.max(values.length, 1),
      combinedAccountRate: combinedAccountHits / Math.max(values.length, 1),
      avgLength
    }
  })
}

export function pickBestColumn (stats, predicate) {
  const ranked = stats.filter(predicate).sort((a, b) => b.fillRate - a.fillRate)
  return ranked[0]?.column || null
}

export function normalizeHeader (value) {
  return String(value || '').trim().toLowerCase().replace(/[_-]+/g, ' ')
}

export function buildSuggestedMapping (columns, aliasMap = {}) {
  const normalized = columns.map((col) => ({ original: col, normalized: normalizeHeader(col) }))
  const mapping = {}
  const usedColumns = new Set()

  for (const [target, aliases] of Object.entries(aliasMap)) {
    let match = normalized.find((col) => (
      !usedColumns.has(col.original) && aliases.includes(col.normalized)
    ))
    if (!match) {
      match = normalized.find((col) => (
        !usedColumns.has(col.original) && aliases.some((alias) => (
          col.normalized === alias
          || col.normalized.startsWith(`${alias} `)
          || col.normalized.endsWith(` ${alias}`)
        ))
      ))
    }
    if (match) {
      mapping[target] = match.original
      usedColumns.add(match.original)
    }
  }
  return mapping
}

export function mappingIsComplete (mapping = {}, rules = {}) {
  const identityKeys = rules.identityKeys || []
  const balanceKeys = rules.balanceKeys || []
  const hasIdentity = identityKeys.some((key) => Boolean(mapping[key]))
  const hasBalance = balanceKeys.some((key) => Boolean(mapping[key]))
    || (rules.requireDebitCredit && mapping[rules.debitKey] && mapping[rules.creditKey])
  return hasIdentity && hasBalance
}

export function detectBestGridStructure (grid, evaluateMapping) {
  if (!Array.isArray(grid) || !grid.length) {
    return detectGridStructure(grid)
  }

  const evaluator = typeof evaluateMapping === 'function'
    ? evaluateMapping
    : () => ({ confidence: 0, mapping: {}, usable: false })

  const candidates = []
  const scanLimit = Math.min(grid.length, 40)
  for (let i = 0; i < scanLimit; i++) {
    const structure = detectGridStructure(grid, { headerRowIndex: i })
    if (structure.columns.length < 2 || structure.rows.length === 0) continue
    const result = evaluator(structure.columns, structure.rows)
    candidates.push({
      structure,
      confidence: result.confidence ?? 0,
      usable: Boolean(result.usable)
    })
  }

  const usable = candidates
    .filter((candidate) => candidate.usable)
    .sort((a, b) => b.confidence - a.confidence)
  if (usable.length) return usable[0].structure

  const best = candidates.sort((a, b) => b.confidence - a.confidence)[0]
  return best?.structure || detectGridStructure(grid)
}

export function buildHeaderRowCandidates (grid, evaluateMapping, limit = 12) {
  if (!Array.isArray(grid) || !grid.length) return []

  const evaluator = typeof evaluateMapping === 'function'
    ? evaluateMapping
    : () => ({ confidence: 0, mapping: {}, usable: false })

  const candidates = []
  const scanLimit = Math.min(grid.length, 40)
  for (let i = 0; i < scanLimit; i++) {
    const structure = detectGridStructure(grid, { headerRowIndex: i })
    if (structure.columns.length < 2) continue
    const result = evaluator(structure.columns, structure.rows)
    const cells = (grid[i] || []).map((cell) => sanitizeText(cell)).filter(Boolean)
    const label = cells.length
      ? cells.slice(0, 5).join(' | ')
      : `Row ${i + 1} (blank)`

    candidates.push({
      rowIndex: i,
      rowNumber: i + 1,
      label,
      columns: structure.columns,
      rowCount: structure.rows.length,
      confidence: result.confidence ?? 0,
      usable: Boolean(result.usable)
    })
  }

  return candidates
    .sort((a, b) => {
      if (a.usable !== b.usable) return a.usable ? -1 : 1
      if (b.confidence !== a.confidence) return b.confidence - a.confidence
      return b.rowCount - a.rowCount
    })
    .slice(0, limit)
}

export function coerceCellValue (value, dataType = 'text') {
  const text = sanitizeText(value)
  if (!text) return null
  if (dataType === 'number' || dataType === 'currency') return parseNumber(value)
  if (dataType === 'date') {
    const parsed = Date.parse(text)
    return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : text
  }
  if (dataType === 'boolean') {
    const lower = text.toLowerCase()
    if (['true', 'yes', 'y', '1'].includes(lower)) return true
    if (['false', 'no', 'n', '0'].includes(lower)) return false
    return text
  }
  return text
}

export function mapRowToSchema (row, columnSchema = []) {
  const mapped = {}
  for (const column of columnSchema) {
    const source = column.sourceColumn
    if (!source) continue
    mapped[column.key] = coerceCellValue(row[source], column.dataType || 'text')
  }
  return mapped
}

export function schemaMappingIsUsable (columnSchema = []) {
  return columnSchema.length > 0 && columnSchema.every((col) => col.key && col.sourceColumn)
}
