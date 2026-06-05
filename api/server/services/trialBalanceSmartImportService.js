const MAPPING_TARGETS = [
  'accountNumber',
  'accountName',
  'accountType',
  'currentBalance',
  'priorBalance',
  'debit',
  'credit',
  'normalBalance'
]

function sanitizeText (value) {
  return String(value ?? '').replace(/[\u0000-\u001f]/g, '').trim()
}

function parseNumber (value) {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const normalized = String(value).replace(/[,$\s]/g, '').replace(/^\((.*)\)$/, '-$1').trim()
  if (!normalized.length) return null
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

function isNumericCell (value) {
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

function trialBalanceHeaderBonus (cells) {
  const normalized = cells.map((cell) => sanitizeText(cell).toLowerCase()).filter(Boolean)
  if (normalized.length < 2) return 0

  let bonus = 0
  const joined = normalized.join(' ')
  if (/account/.test(joined) && /(debit|credit|balance|amount)/.test(joined)) bonus += 24
  if (normalized.some((cell) => /account\s*(number|no|#|code)/.test(cell))) bonus += 10
  if (normalized.some((cell) => /^accounts?$|^account name$|^description$/.test(cell))) bonus += 8
  if (normalized.some((cell) => /^debit$|\bdr\b/.test(cell))) bonus += 10
  if (normalized.some((cell) => /^credit$|\bcr\b/.test(cell))) bonus += 10
  if (normalized.some((cell) => /current|prior|balance/.test(cell))) bonus += 6
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

  return textCells * 3 + numericFollow * 4 - numericCells + trialBalanceHeaderBonus(cells)
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

export function buildFilePreview (grid, maxRows = 15) {
  return grid.slice(0, maxRows).map((cells, index) => ({
    rowNumber: index + 1,
    cells: (cells || []).map((cell) => sanitizeText(cell))
  }))
}

export function buildHeaderRowCandidates (grid, limit = 12) {
  if (!Array.isArray(grid) || !grid.length) return []

  const candidates = []
  const scanLimit = Math.min(grid.length, 40)
  for (let i = 0; i < scanLimit; i++) {
    const structure = detectGridStructure(grid, { headerRowIndex: i })
    if (structure.columns.length < 2) continue
    const heuristic = inferHeuristicMapping(structure.columns, structure.rows)
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
      confidence: heuristic.confidence,
      usable: mappingIsUsable(heuristic.mapping)
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

function inferPositionalMapping (columns, rows) {
  if (columns.length < 2 || !rows.length) return {}

  const stats = columnStats(columns, rows)
  const mapping = {}
  const ordered = [...stats].sort((a, b) => columns.indexOf(a.column) - columns.indexOf(b.column))

  const combinedCol = ordered.find((stat) => stat.combinedAccountRate >= 0.2)
  const identityStats = ordered.filter((stat) => !isAmountColumn(stat) || stat.combinedAccountRate >= 0.2)
  const amountStats = ordered.filter(isAmountColumn)

  if (combinedCol) {
    mapping.accountName = combinedCol.column
  } else if (identityStats.length >= 2) {
    const numberLike = identityStats.find((stat) => stat.accountNumberRate >= 0.35)
    const nameLike = identityStats.find((stat) => (
      stat.column !== numberLike?.column && stat.numericRate < 0.35
    ))
    if (numberLike) mapping.accountNumber = numberLike.column
    if (nameLike) mapping.accountName = nameLike.column
    else if (!mapping.accountNumber) mapping.accountName = identityStats[0].column
  } else if (identityStats.length === 1) {
    mapping.accountName = identityStats[0].column
  }

  if (amountStats.length >= 2 && columns.length >= 4) {
    mapping.debit = amountStats[amountStats.length - 2].column
    mapping.credit = amountStats[amountStats.length - 1].column
  } else if (amountStats.length >= 2) {
    mapping.priorBalance = amountStats[amountStats.length - 2].column
    mapping.currentBalance = amountStats[amountStats.length - 1].column
  } else if (amountStats.length === 1) {
    mapping.currentBalance = amountStats[0].column
  }

  return sanitizeMapping(mapping, columns, rows)
}

export function detectBestGridStructure (grid) {
  if (!Array.isArray(grid) || !grid.length) {
    return detectGridStructure(grid)
  }

  const candidates = []
  const scanLimit = Math.min(grid.length, 40)
  for (let i = 0; i < scanLimit; i++) {
    const structure = detectGridStructure(grid, { headerRowIndex: i })
    if (structure.columns.length < 2 || structure.rows.length === 0) continue
    const heuristic = inferHeuristicMapping(structure.columns, structure.rows)
    candidates.push({
      structure,
      confidence: heuristic.confidence,
      usable: mappingIsUsable(heuristic.mapping)
    })
  }

  const usable = candidates
    .filter((candidate) => candidate.usable)
    .sort((a, b) => b.confidence - a.confidence)
  if (usable.length) return usable[0].structure

  const best = candidates.sort((a, b) => b.confidence - a.confidence)[0]
  return best?.structure || detectGridStructure(grid)
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

function columnStats (columns, rows) {
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

function pickBestColumn (stats, predicate) {
  const ranked = stats.filter(predicate).sort((a, b) => b.fillRate - a.fillRate)
  return ranked[0]?.column || null
}

function isIdentityColumn (stat) {
  if (isNamedIdentityColumn(stat.column)) return true
  if (stat.combinedAccountRate >= 0.25) return true
  return stat.accountNumberRate >= 0.6 && /number|#/i.test(stat.column)
}

function isAmountColumn (stat) {
  return stat.numericRate >= 0.45 && !isIdentityColumn(stat)
}

export function sanitizeMapping (mapping, columns, rows) {
  const stats = columnStats(columns, rows)
  const statByColumn = Object.fromEntries(stats.map((entry) => [entry.column, entry]))
  const cleaned = { ...mapping }
  const identityCols = new Set([cleaned.accountNumber, cleaned.accountName].filter(Boolean))
  const hasExplicitPrior = columns.some((column) => /prior|previous|py|comparative|last year|\bly\b/i.test(column))

  for (const key of ['currentBalance', 'priorBalance', 'debit', 'credit']) {
    const column = cleaned[key]
    if (!column) continue
    const stat = statByColumn[column]
    if (identityCols.has(column) || (stat && isIdentityColumn(stat))) {
      delete cleaned[key]
    }
  }

  if (cleaned.debit && cleaned.credit) {
    if (cleaned.currentBalance === cleaned.credit || cleaned.currentBalance === cleaned.debit) {
      delete cleaned.currentBalance
    }
    if (!hasExplicitPrior) {
      delete cleaned.priorBalance
    }
  }

  if (cleaned.priorBalance && statByColumn[cleaned.priorBalance] && isIdentityColumn(statByColumn[cleaned.priorBalance])) {
    delete cleaned.priorBalance
  }

  return cleaned
}

function isNamedIdentityColumn (column) {
  return /account\s*(number|no|#|code)|\bacct\b|^code$|^gl$/i.test(column)
    || /^accounts?$|^account\s*name$|^description$|^name$|^gl\s*account$/i.test(column)
}

export function inferHeuristicMapping (columns, rows) {
  const stats = columnStats(columns, rows)
  const mapping = {}

  const accountNumberCol = pickBestColumn(stats, (s) => (
    /account\s*(number|no|#|code)|\bacct\b|^code$/i.test(s.column)
    || (s.accountNumberRate >= 0.45 && s.numericRate < 0.8 && !/^accounts?$/i.test(s.column))
  ))
  const combinedAccountCol = pickBestColumn(stats, (s) => s.combinedAccountRate >= 0.35)
  const namedAccountNameCol = pickBestColumn(stats, (s) => (
    /^accounts?$|^account\s*name$|^description$|^name$|^gl\s*account$/i.test(s.column)
    && s.column !== accountNumberCol
  ))
  const accountNameCol = namedAccountNameCol || pickBestColumn(stats, (s) => (
    !isIdentityColumn(s)
    && /accounts?|description|name/i.test(s.column)
    && s.numericRate < 0.35
    && s.column !== accountNumberCol
  )) || pickBestColumn(stats, (s) => (
    !isIdentityColumn(s)
    && s.column !== accountNumberCol
    && !isNamedIdentityColumn(s.column)
    && s.numericRate < 0.2
    && s.avgLength >= 3
    && s.fillRate >= 0.4
  ))

  if (accountNumberCol) mapping.accountNumber = accountNumberCol
  if (combinedAccountCol) {
    mapping.accountName = combinedAccountCol
  } else if (accountNameCol && accountNameCol !== accountNumberCol) {
    mapping.accountName = accountNameCol
  }

  const amountStats = stats.filter(isAmountColumn)
  const debitCol = pickBestColumn(stats, (s) => /debit|\bdr\b/i.test(s.column) && isAmountColumn(s))
  const creditCol = pickBestColumn(stats, (s) => /credit|\bcr\b/i.test(s.column) && isAmountColumn(s))
  const currentCol = pickBestColumn(stats, (s) => /current|ending|closing|cy|amount|balance/i.test(s.column) && isAmountColumn(s))
  const priorCol = pickBestColumn(stats, (s) => /prior|previous|py|comparative|last year|\bly\b/i.test(s.column) && isAmountColumn(s))

  if (debitCol) mapping.debit = debitCol
  if (creditCol) mapping.credit = creditCol

  if (debitCol && creditCol) {
    // Classic debit/credit trial balance: derive net balance from both columns.
  } else if (currentCol) {
    mapping.currentBalance = currentCol
    if (priorCol && priorCol !== currentCol) mapping.priorBalance = priorCol
  } else if (amountStats.length === 1) {
    mapping.currentBalance = amountStats[0].column
  } else if (amountStats.length >= 2) {
    mapping.priorBalance = priorCol || amountStats[0].column
    mapping.currentBalance = amountStats[amountStats.length - 1].column
  }

  let sanitized = sanitizeMapping(mapping, columns, rows)

  if (!mappingIsUsable(sanitized)) {
    const positional = inferPositionalMapping(columns, rows)
    sanitized = sanitizeMapping({ ...sanitized, ...positional }, columns, rows)
  }

  let confidence = 0.2
  if (sanitized.accountName || sanitized.accountNumber) confidence += 0.25
  if (sanitized.currentBalance || (sanitized.debit && sanitized.credit)) confidence += 0.35
  if (sanitized.accountName && (sanitized.currentBalance || sanitized.debit)) confidence += 0.15
  if (!mappingIsUsable(sanitized)) confidence = Math.min(confidence, 0.45)

  return {
    mapping: sanitized,
    confidence: Math.min(confidence, 0.95),
    source: 'heuristic'
  }
}

export function mappingIsUsable (mapping = {}) {
  const hasIdentity = Boolean(mapping.accountName || mapping.accountNumber)
  const hasBalance = Boolean(mapping.currentBalance || (mapping.debit && mapping.credit))
  return hasIdentity && hasBalance
}

function splitCombinedAccountValue (value) {
  const text = sanitizeText(value)
  const match = text.match(/^(\d[\d.-]{1,})\s*[-–:]\s*(.+)$/)
  if (!match) return { accountNumber: null, accountName: text }
  return { accountNumber: match[1], accountName: sanitizeText(match[2]) }
}

export function normalizeMappedRow (row, mapping) {
  let accountNumber = mapping.accountNumber ? sanitizeText(row[mapping.accountNumber]) : ''
  let accountName = mapping.accountName ? sanitizeText(row[mapping.accountName]) : ''

  if (!accountNumber && mapping.accountName) {
    const split = splitCombinedAccountValue(row[mapping.accountName])
    accountNumber = split.accountNumber || accountNumber
    accountName = split.accountName || accountName
  }

  return {
    accountNumber: accountNumber || null,
    accountName,
    accountType: mapping.accountType ? sanitizeText(row[mapping.accountType]) || 'other' : 'other',
    normalBalance: mapping.normalBalance ? sanitizeText(row[mapping.normalBalance]) || null : null,
    currentBalance: mapping.currentBalance ? parseNumber(row[mapping.currentBalance]) : null,
    priorBalance: mapping.priorBalance ? parseNumber(row[mapping.priorBalance]) : null,
    debit: mapping.debit ? parseNumber(row[mapping.debit]) : null,
    credit: mapping.credit ? parseNumber(row[mapping.credit]) : null
  }
}

function safeJsonParse (text) {
  try {
    return JSON.parse(text)
  } catch {
    const match = String(text || '').match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

export async function inferAiMapping (grid, columns, rows) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const sample = gridToTable(grid, 20)
  const columnList = columns.map((c, idx) => `${idx + 1}. ${c}`).join('\n')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You map trial balance spreadsheet columns for accounting imports.',
            'Return JSON only with keys:',
            'mapping (object using optional keys accountNumber, accountName, accountType, currentBalance, priorBalance, debit, credit, normalBalance; values must exactly match provided column names),',
            'confidence (0-1 number),',
            'notes (short string).',
            'Choose accountName OR accountNumber (or both).',
            'Choose currentBalance OR debit+credit for the current period amount.',
            'Ignore title rows, blank rows, and total/subtotal rows.'
          ].join(' ')
        },
        {
          role: 'user',
          content: [
            'Map this trial balance file to import fields.',
            '',
            'Detected columns:',
            columnList,
            '',
            'Sample grid (header row may not be row 1):',
            sample,
            '',
            `Parsed data row count: ${rows.length}`
          ].join('\n')
        }
      ]
    })
  })

  if (!response.ok) return null
  const payload = await response.json()
  const content = payload?.choices?.[0]?.message?.content
  const parsed = safeJsonParse(content)
  if (!parsed?.mapping || typeof parsed.mapping !== 'object') return null

  const mapping = {}
  for (const key of MAPPING_TARGETS) {
    const columnName = parsed.mapping[key]
    if (columnName && columns.includes(columnName)) {
      mapping[key] = columnName
    }
  }
  const sanitized = sanitizeMapping(mapping, columns, rows)
  if (!mappingIsUsable(sanitized)) return null

  return {
    mapping: sanitized,
    confidence: Number(parsed.confidence) || 0.8,
    source: 'ai',
    notes: sanitizeText(parsed.notes) || 'AI column mapping applied.'
  }
}

export async function resolveSmartMapping ({ grid, columns, rows, useAi = true }) {
  const heuristic = inferHeuristicMapping(columns, rows)
  if (mappingIsUsable(heuristic.mapping) && heuristic.confidence >= 0.7) {
    return heuristic
  }

  if (useAi) {
    try {
      const ai = await inferAiMapping(grid, columns, rows)
      if (ai && mappingIsUsable(ai.mapping)) return ai
    } catch {
      // Fall back to heuristics when AI is unavailable.
    }
  }

  return heuristic
}
