import XLSX from 'xlsx'
import { calculateVarianceMetrics, logAccountingAudit } from './workingPapersService.js'

const MAX_PREVIEW_ROWS = 50

const COLUMN_ALIASES = {
  accountNumber: [
    'account number', 'acct number', 'account no', 'account #', 'gl code', 'gl account number',
    'account code', 'acct no', 'acct #', 'gl account', 'ledger account number', 'code'
  ],
  accountName: [
    'account', 'account name', 'name', 'description', 'account description', 'acct name',
    'gl account name', 'ledger account', 'title', 'account title', 'line description'
  ],
  accountType: ['account type', 'type', 'category', 'class', 'account class', 'fs line'],
  currentBalance: [
    'current balance', 'current period', 'current', 'net balance', 'ending balance', 'balance',
    'amount', 'current amount', 'ending', 'closing balance', 'net', 'balance current', 'cy balance'
  ],
  priorBalance: [
    'prior balance', 'prior period', 'prior', 'previous balance', 'comparative balance',
    'py balance', 'prior amount', 'opening comparative', 'last year', 'ly balance'
  ],
  debit: ['debit', 'debits', 'dr', 'debit amount'],
  credit: ['credit', 'credits', 'cr', 'credit amount'],
  normalBalance: ['normal balance', 'normal', 'balance type']
}

function normalizeHeader (value) {
  return String(value || '').trim().toLowerCase().replace(/[_-]+/g, ' ')
}

function sanitizeText (value) {
  return String(value ?? '').replace(/[\u0000-\u001f]/g, '').trim()
}

function parseNumber (value) {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const normalized = String(value).replace(/,/g, '').replace(/\$/g, '').trim()
  if (!normalized.length) return null
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

function parseCsvBuffer (buffer) {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '')
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (!lines.length) return { columns: [], rows: [] }
  const splitRow = (line) => {
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
        out.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    out.push(current.trim())
    return out.map((v) => v.replace(/^"|"$/g, ''))
  }
  const headers = splitRow(lines[0]).map((h) => sanitizeText(h))
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const rowValues = splitRow(lines[i])
    const row = {}
    for (let c = 0; c < headers.length; c++) {
      row[headers[c] || `column_${c + 1}`] = rowValues[c] ?? ''
    }
    rows.push(row)
  }
  return { columns: headers, rows }
}

function parseXlsxBuffer (buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) return { columns: [], rows: [] }
  const sheet = workbook.Sheets[firstSheetName]
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  if (!raw.length) return { columns: [], rows: [] }
  const columns = Object.keys(raw[0]).map((header) => sanitizeText(header))
  const rows = raw.map((row) => {
    const normalized = {}
    for (const [key, value] of Object.entries(row)) {
      normalized[sanitizeText(key)] = value
    }
    return normalized
  })
  return { columns, rows }
}

function buildSuggestedMapping (columns) {
  const normalized = columns.map((col) => ({ original: col, normalized: normalizeHeader(col) }))
  const mapping = {}
  for (const [target, aliases] of Object.entries(COLUMN_ALIASES)) {
    let match = normalized.find((col) => aliases.includes(col.normalized))
    if (!match) {
      match = normalized.find((col) => aliases.some((alias) => (
        col.normalized.includes(alias) || alias.includes(col.normalized)
      )))
    }
    if (match) mapping[target] = match.original
  }
  return mapping
}

function computeBalances (rawRow, mapping) {
  const currentDirect = parseNumber(rawRow[mapping.currentBalance])
  const priorDirect = parseNumber(rawRow[mapping.priorBalance])
  const debit = parseNumber(rawRow[mapping.debit])
  const credit = parseNumber(rawRow[mapping.credit])

  let current = currentDirect
  if (current == null && (debit != null || credit != null)) {
    current = (debit || 0) - (credit || 0)
  }
  return {
    currentBalance: current ?? 0,
    priorBalance: priorDirect
  }
}

function validateRows (rows, mapping, materialityAmount = null, thresholdPercent = 20) {
  const warnings = []
  const parsedRows = []
  const accountNumberCounts = new Map()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const accountNumber = sanitizeText(row[mapping.accountNumber])
    const accountName = sanitizeText(row[mapping.accountName])
    const accountType = sanitizeText(row[mapping.accountType]) || 'other'
    const normalBalance = sanitizeText(row[mapping.normalBalance]) || null
    const balances = computeBalances(row, mapping)
    const metrics = calculateVarianceMetrics(balances.currentBalance, balances.priorBalance, materialityAmount, thresholdPercent)

    if (!accountName) warnings.push({ type: 'missing_account_name', rowNumber: i + 2, message: 'Account name is missing' })
    if (accountNumber) {
      accountNumberCounts.set(accountNumber, (accountNumberCounts.get(accountNumber) || 0) + 1)
    }
    if (balances.currentBalance == null) {
      warnings.push({ type: 'invalid_balance', rowNumber: i + 2, message: 'Current balance is invalid' })
    }
    parsedRows.push({
      sourceRowNumber: i + 2,
      accountNumber: accountNumber || null,
      accountName,
      accountType,
      normalBalance,
      currentPeriodBalance: balances.currentBalance,
      priorPeriodBalance: balances.priorBalance,
      varianceAmount: metrics.varianceAmount,
      variancePercent: metrics.variancePercent,
      varianceLabel: metrics.varianceLabel,
      isMaterial: metrics.isMaterial,
      isUnusual: metrics.isUnusual,
      flags: {
        warnings: [],
        raw: row
      }
    })
  }

  for (const [number, count] of accountNumberCounts.entries()) {
    if (count > 1) warnings.push({ type: 'duplicate_account_number', accountNumber: number, message: `Duplicate account number: ${number}` })
  }

  return { parsedRows, warnings }
}

export function parseTrialBalanceFile ({ fileName, base64Content }) {
  const safeName = sanitizeText(fileName).toLowerCase()
  if (!safeName.endsWith('.csv') && !safeName.endsWith('.xlsx')) {
    throw new Error('Unsupported file type. Only CSV and XLSX are allowed.')
  }
  const buffer = Buffer.from(String(base64Content || ''), 'base64')
  if (!buffer.length) throw new Error('No file data was provided')
  if (safeName.endsWith('.csv')) {
    return { fileType: 'csv', ...parseCsvBuffer(buffer) }
  }
  return { fileType: 'xlsx', ...parseXlsxBuffer(buffer) }
}

function mappingWarnings (inferredMapping) {
  const warnings = []
  if (!inferredMapping.accountName) {
    warnings.push({ type: 'missing_mapping', message: 'Map the Account name column before preview.' })
  }
  if (!inferredMapping.currentBalance && !(inferredMapping.debit && inferredMapping.credit)) {
    warnings.push({ type: 'missing_mapping', message: 'Map Current balance or both Debit and Credit columns.' })
  }
  return warnings
}

export function previewTrialBalanceImport ({ rows, columns, mapping, materialityAmount, thresholdPercent }) {
  const inferredMapping = {
    ...buildSuggestedMapping(columns),
    ...(mapping || {})
  }
  const mappingIssues = mappingWarnings(inferredMapping)
  if (mappingIssues.length) {
    return {
      columns,
      detectedMapping: inferredMapping,
      needsMapping: true,
      previewRows: [],
      summary: {
        totalRows: rows.length,
        previewRows: 0,
        warningCount: mappingIssues.length
      },
      warnings: mappingIssues
    }
  }

  const { parsedRows, warnings } = validateRows(rows, inferredMapping, materialityAmount, thresholdPercent)
  return {
    columns,
    detectedMapping: inferredMapping,
    needsMapping: false,
    previewRows: parsedRows.slice(0, MAX_PREVIEW_ROWS),
    summary: {
      totalRows: parsedRows.length,
      previewRows: Math.min(parsedRows.length, MAX_PREVIEW_ROWS),
      warningCount: warnings.length
    },
    warnings
  }
}

export async function saveTrialBalanceImport (pool, clerkUserId, actorId, engagementId, payload) {
  const { rows: engagementRows } = await pool.query(
    'SELECT * FROM taxgpt.accounting_engagements WHERE id = $1::uuid AND clerk_user_id = $2',
    [engagementId, clerkUserId]
  )
  if (!engagementRows[0]) return null
  const engagement = engagementRows[0]

  const parsed = parseTrialBalanceFile({
    fileName: payload.fileName,
    base64Content: payload.base64Content
  })
  const preview = previewTrialBalanceImport({
    rows: parsed.rows,
    columns: parsed.columns,
    mapping: payload.mapping || null,
    materialityAmount: engagement.materiality_amount,
    thresholdPercent: payload.thresholdPercent || 20
  })

  const warningSummary = {
    count: preview.warnings.length,
    warnings: preview.warnings.slice(0, 100)
  }
  const { rows: batchRows } = await pool.query(
    `INSERT INTO taxgpt.trial_balance_import_batches
     (engagement_id, clerk_user_id, file_name, file_type, column_mapping, warning_summary, total_rows, imported_rows, created_by, created_at)
     VALUES ($1::uuid, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, now())
     RETURNING *`,
    [
      engagementId,
      clerkUserId,
      payload.fileName,
      parsed.fileType,
      JSON.stringify(preview.detectedMapping),
      JSON.stringify(warningSummary),
      preview.summary.totalRows,
      preview.summary.totalRows,
      actorId
    ]
  )

  const importBatch = batchRows[0]
  const { rows: trialBalanceRows } = await pool.query(
    `INSERT INTO taxgpt.trial_balances
     (engagement_id, source_connection_id, import_batch_id, name, period_start, period_end, imported_at, imported_by, status, created_at, updated_at)
     VALUES ($1::uuid, NULL, $2::uuid, $3, $4, $5, now(), $6, 'imported', now(), now())
     RETURNING *`,
    [
      engagementId,
      importBatch.id,
      payload.name || `${engagement.name} Trial Balance`,
      payload.periodStart || engagement.period_start,
      payload.periodEnd || engagement.period_end,
      actorId
    ]
  )
  const trialBalance = trialBalanceRows[0]

  const detail = validateRows(parsed.rows, preview.detectedMapping, engagement.materiality_amount, payload.thresholdPercent || 20)
  for (const account of detail.parsedRows) {
    await pool.query(
      `INSERT INTO taxgpt.trial_balance_accounts
       (trial_balance_id, source_account_id, account_number, account_name, account_type, normal_balance, current_period_balance, prior_period_balance, variance_amount, variance_percent, variance_label, mapped_group_id, lead_sheet_section, is_material, is_unusual, flags, created_at, updated_at)
       VALUES ($1::uuid, NULL, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, NULL, $11, $12, $13::jsonb, now(), now())`,
      [
        trialBalance.id,
        account.accountNumber,
        account.accountName,
        account.accountType,
        account.normalBalance,
        account.currentPeriodBalance,
        account.priorPeriodBalance,
        account.varianceAmount,
        account.variancePercent,
        account.varianceLabel,
        account.isMaterial,
        account.isUnusual,
        JSON.stringify(account.flags)
      ]
    )
  }

  await logAccountingAudit(pool, clerkUserId, actorId, 'trial_balance', trialBalance.id, 'imported', null, {
    importBatchId: importBatch.id,
    warningCount: detail.warnings.length,
    accountCount: detail.parsedRows.length
  })

  return {
    importBatch,
    trialBalance,
    summary: {
      warningCount: detail.warnings.length,
      accountCount: detail.parsedRows.length
    },
    warnings: detail.warnings
  }
}

