import XLSX from 'xlsx'
import { calculateVarianceMetrics, logAccountingAudit } from './workingPapersService.js'
import {
  detectGridStructure,
  inferHeuristicMapping,
  mappingIsUsable,
  normalizeMappedRow,
  parseCsvToGrid,
  resolveSmartMapping
} from './trialBalanceSmartImportService.js'

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
  const normalized = String(value).replace(/[,$\s]/g, '').replace(/^\((.*)\)$/, '-$1').trim()
  if (!normalized.length) return null
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

function parseXlsxToGrid (buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) return []
  const sheet = workbook.Sheets[firstSheetName]
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
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

function computeBalances (normalized) {
  let current = normalized.currentBalance
  if (current == null && (normalized.debit != null || normalized.credit != null)) {
    current = (normalized.debit || 0) - (normalized.credit || 0)
  }
  return {
    currentBalance: current ?? 0,
    priorBalance: normalized.priorBalance
  }
}

function validateRows (rows, mapping, materialityAmount = null, thresholdPercent = 20) {
  const warnings = []
  const parsedRows = []
  const accountNumberCounts = new Map()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const normalized = normalizeMappedRow(row, mapping)
    const balances = computeBalances(normalized)
    const accountName = normalized.accountName
    const accountNumber = normalized.accountNumber
    const metrics = calculateVarianceMetrics(balances.currentBalance, balances.priorBalance, materialityAmount, thresholdPercent)

    if (!accountName && !accountNumber) {
      warnings.push({ type: 'missing_account_identity', rowNumber: i + 2, message: 'Row skipped: no account name or number' })
      continue
    }
    if (!accountName) {
      warnings.push({ type: 'missing_account_name', rowNumber: i + 2, message: 'Account name missing; imported using account number only' })
    }
    if (accountNumber) {
      accountNumberCounts.set(accountNumber, (accountNumberCounts.get(accountNumber) || 0) + 1)
    }

    parsedRows.push({
      sourceRowNumber: i + 2,
      accountNumber,
      accountName: accountName || accountNumber || 'Unnamed account',
      accountType: normalized.accountType || 'other',
      normalBalance: normalized.normalBalance,
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

  const grid = safeName.endsWith('.csv') ? parseCsvToGrid(buffer) : parseXlsxToGrid(buffer)
  const structure = detectGridStructure(grid)

  return {
    fileType: safeName.endsWith('.csv') ? 'csv' : 'xlsx',
    grid,
    ...structure
  }
}

function mappingWarnings (inferredMapping) {
  const warnings = []
  if (!inferredMapping.accountName && !inferredMapping.accountNumber) {
    warnings.push({ type: 'missing_mapping', message: 'Map an account name or account number column.' })
  }
  if (!inferredMapping.currentBalance && !(inferredMapping.debit && inferredMapping.credit)) {
    warnings.push({ type: 'missing_mapping', message: 'Map current balance or both debit and credit columns.' })
  }
  return warnings
}

async function buildDetectedMapping ({ columns, rows, grid, mapping, useSmartImport = true, headerRowIndex = 0 }) {
  const manual = mapping && Object.keys(mapping).length ? mapping : null
  const aliasMapping = buildSuggestedMapping(columns)
  const heuristic = inferHeuristicMapping(columns, rows)

  let smart = null
  if (useSmartImport) {
    smart = await resolveSmartMapping({ grid, columns, rows, useAi: true })
  }

  const inferredMapping = {
    ...aliasMapping,
    ...heuristic.mapping,
    ...(smart?.mapping || {}),
    ...(manual || {})
  }

  return {
    inferredMapping,
    mappingSource: manual ? 'manual' : (smart?.source || heuristic.source || 'heuristic'),
    mappingConfidence: smart?.confidence ?? heuristic.confidence ?? null,
    mappingNotes: smart?.notes || null,
    headerRowIndex
  }
}

export async function previewTrialBalanceImport ({
  rows,
  columns,
  grid = [],
  headerRowIndex = 0,
  mapping,
  materialityAmount,
  thresholdPercent,
  useSmartImport = true
}) {
  const detection = await buildDetectedMapping({ columns, rows, grid, mapping, useSmartImport, headerRowIndex })
  const inferredMapping = detection.inferredMapping
  const mappingIssues = mappingWarnings(inferredMapping)

  if (mappingIssues.length) {
    return {
      columns,
      detectedMapping: inferredMapping,
      needsMapping: true,
      mappingSource: detection.mappingSource,
      mappingConfidence: detection.mappingConfidence,
      mappingNotes: detection.mappingNotes,
      headerRowIndex: detection.headerRowIndex,
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
    mappingSource: detection.mappingSource,
    mappingConfidence: detection.mappingConfidence,
    mappingNotes: detection.mappingNotes,
    headerRowIndex: detection.headerRowIndex,
    previewRows: parsedRows.slice(0, MAX_PREVIEW_ROWS),
    summary: {
      totalRows: parsedRows.length,
      previewRows: Math.min(parsedRows.length, MAX_PREVIEW_ROWS),
      warningCount: warnings.length
    },
    warnings
  }
}

async function getEngagementForImport (pool, engagementId, workspaceId) {
  const { rows } = await pool.query(
    `SELECT * FROM taxgpt.accounting_engagements
     WHERE id = $1::uuid
       AND workspace_id = $2::uuid`,
    [engagementId, workspaceId]
  )
  return rows[0] || null
}

export async function saveTrialBalanceImport (pool, clerkUserId, actorId, engagementId, payload) {
  if (!payload?.workspaceId) {
    throw new Error('Workspace context is required for trial balance import')
  }

  const engagement = await getEngagementForImport(pool, engagementId, payload.workspaceId)
  if (!engagement) return null

  const parsed = parseTrialBalanceFile({
    fileName: payload.fileName,
    base64Content: payload.base64Content
  })
  const preview = await previewTrialBalanceImport({
    rows: parsed.rows,
    columns: parsed.columns,
    grid: parsed.grid,
    headerRowIndex: parsed.headerRowIndex,
    mapping: payload.mapping || null,
    materialityAmount: engagement.materiality_amount,
    thresholdPercent: payload.thresholdPercent || 20,
    useSmartImport: payload.useSmartImport !== false
  })

  if (preview.needsMapping || !mappingIsUsable(preview.detectedMapping)) {
    throw new Error('Trial balance import mapping is incomplete. Preview and map columns before importing.')
  }

  const warningSummary = {
    count: preview.warnings.length,
    warnings: preview.warnings.slice(0, 100),
    mappingSource: preview.mappingSource,
    mappingConfidence: preview.mappingConfidence
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
    accountCount: detail.parsedRows.length,
    mappingSource: preview.mappingSource
  })

  return {
    importBatch,
    trialBalance,
    summary: {
      warningCount: detail.warnings.length,
      accountCount: detail.parsedRows.length,
      mappingSource: preview.mappingSource
    },
    warnings: detail.warnings
  }
}
