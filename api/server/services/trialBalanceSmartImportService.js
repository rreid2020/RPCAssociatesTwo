import {
  buildFilePreview,
  buildHeaderRowCandidates as buildHeaderRowCandidatesGeneric,
  columnStats,
  detectBestGridStructure as detectBestGridStructureGeneric,
  detectGridStructure,
  gridToTable,
  isNumericCell,
  parseCsvToGrid,
  parseNumber,
  pickBestColumn,
  sanitizeText
} from './spreadsheetImportService.js'

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

function evaluateTrialBalanceMapping (columns, rows) {
  const heuristic = inferHeuristicMapping(columns, rows)
  return {
    mapping: heuristic.mapping,
    confidence: heuristic.confidence,
    usable: mappingIsUsable(heuristic.mapping)
  }
}

export function detectBestGridStructure (grid) {
  return detectBestGridStructureGeneric(grid, evaluateTrialBalanceMapping)
}

export function buildHeaderRowCandidates (grid, limit = 12) {
  return buildHeaderRowCandidatesGeneric(grid, evaluateTrialBalanceMapping, limit)
}

export {
  buildFilePreview,
  detectGridStructure,
  gridToTable,
  parseCsvToGrid
}

function isNamedIdentityColumn (column) {
  return /account\s*(number|no|#|code)|\bacct\b|^code$|^gl$/i.test(column)
    || /^accounts?$|^account\s*name$|^description$|^name$|^gl\s*account$/i.test(column)
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
