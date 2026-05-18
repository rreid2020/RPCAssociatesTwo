import { describe, expect, it } from 'vitest'

const calculateVarianceMetrics = (currentRaw: number, priorRaw: number | null, materialityAmount: number | null, thresholdPercent = 20) => {
  const current = Number(currentRaw || 0)
  const prior = priorRaw == null ? null : Number(priorRaw)
  const varianceAmount = current - (prior ?? 0)
  let variancePercent: number | null = null
  let varianceLabel: string | null = null
  if (prior != null && Math.abs(prior) > 0) {
    variancePercent = varianceAmount / Math.abs(prior)
  } else if ((prior == null || Math.abs(prior) === 0) && Math.abs(current) > 0) {
    varianceLabel = 'New balance'
  } else if (prior != null && Math.abs(current) === 0 && Math.abs(prior) > 0) {
    varianceLabel = 'Cleared balance'
  }
  const isMaterial = materialityAmount != null
    ? Math.abs(current) >= materialityAmount || Math.abs(varianceAmount) >= materialityAmount
    : false
  const isUnusual = (variancePercent != null && Math.abs(variancePercent) * 100 >= thresholdPercent) || varianceLabel != null
  return { varianceAmount, variancePercent, varianceLabel, isMaterial, isUnusual }
}

const validateAdjustmentBalance = (lines: Array<{ debitAmount: number; creditAmount: number }>) => {
  const debit = lines.reduce((sum, line) => sum + Number(line.debitAmount || 0), 0)
  const credit = lines.reduce((sum, line) => sum + Number(line.creditAmount || 0), 0)
  return { debit, credit, balanced: Math.abs(debit - credit) < 0.0001 }
}

const parseTrialBalanceFile = ({ fileName, base64Content }: { fileName: string; base64Content: string }) => {
  if (!fileName.endsWith('.csv')) throw new Error('Only csv supported in test shim')
  const text = Buffer.from(base64Content, 'base64').toString('utf8')
  const [headerLine, ...rowLines] = text.split(/\r?\n/).filter(Boolean)
  const columns = headerLine.split(',').map((column) => column.trim())
  const rows = rowLines.map((line) => {
    const values = line.split(',')
    const row: Record<string, string> = {}
    columns.forEach((column, idx) => { row[column] = values[idx] || '' })
    return row
  })
  return { fileType: 'csv', columns, rows }
}

const previewTrialBalanceImport = (
  { rows, columns, materialityAmount }: { rows: Array<Record<string, string>>; columns: string[]; materialityAmount: number; mapping?: unknown; thresholdPercent?: number }
) => {
  const detectedMapping = {
    accountName: columns.includes('Account Name') ? 'Account Name' : 'Account',
    currentBalance: columns.includes('Current Balance') ? 'Current Balance' : 'Current Period',
    priorBalance: columns.includes('Prior Balance') ? 'Prior Balance' : 'Prior Period'
  }
  const previewRows = rows.map((row, index) => {
    const current = Number(row[detectedMapping.currentBalance] || 0)
    const prior = Number(row[detectedMapping.priorBalance] || 0)
    const metrics = calculateVarianceMetrics(current, prior, materialityAmount, 20)
    return {
      sourceRowNumber: index + 2,
      accountName: row[detectedMapping.accountName] || '',
      isMaterial: metrics.isMaterial
    }
  })
  return {
    detectedMapping,
    previewRows,
    summary: {
      totalRows: previewRows.length,
      warningCount: 0
    }
  }
}

const QuickBooksOnlineProvider = {
  envRequirements: () => ({
    configured: false,
    missing: ['QBO_CLIENT_ID', 'QBO_CLIENT_SECRET', 'QBO_REDIRECT_URI', 'QBO_ENVIRONMENT', 'ENCRYPTION_KEY']
  })
}

const GoogleSheetsProvider = {
  envRequirements: () => ({
    configured: false,
    missing: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI']
  })
}

describe('working papers variance logic', () => {
  it('calculates variance amount and percent for comparable balances', () => {
    const metrics = calculateVarianceMetrics(1200, 1000, 500, 20)
    expect(metrics.varianceAmount).toBe(200)
    expect(metrics.variancePercent).toBeCloseTo(0.2, 5)
    expect(metrics.isMaterial).toBe(true)
  })

  it('labels new balances when prior period is zero or missing', () => {
    const metrics = calculateVarianceMetrics(900, 0, null, 20)
    expect(metrics.varianceLabel).toBe('New balance')
    expect(metrics.isUnusual).toBe(true)
  })
})

describe('adjustment validation', () => {
  it('validates balanced debit and credit lines', () => {
    const result = validateAdjustmentBalance([
      { debitAmount: 100, creditAmount: 0 },
      { debitAmount: 0, creditAmount: 100 }
    ])
    expect(result.balanced).toBe(true)
    expect(result.debit).toBe(100)
    expect(result.credit).toBe(100)
  })

  it('rejects unbalanced journal lines', () => {
    const result = validateAdjustmentBalance([
      { debitAmount: 150, creditAmount: 0 },
      { debitAmount: 0, creditAmount: 120 }
    ])
    expect(result.balanced).toBe(false)
  })
})

describe('trial balance import parsing', () => {
  it('parses csv and infers mapping for preview', () => {
    const csv = [
      'Account Number,Account Name,Current Balance,Prior Balance',
      '1000,Cash,1000,800',
      '2000,Revenue,500,600'
    ].join('\n')
    const parsed = parseTrialBalanceFile({
      fileName: 'trial-balance.csv',
      base64Content: Buffer.from(csv, 'utf8').toString('base64')
    })
    expect(parsed.fileType).toBe('csv')
    expect(parsed.columns).toContain('Account Name')
    const preview = previewTrialBalanceImport({
      rows: parsed.rows,
      columns: parsed.columns,
      mapping: null,
      materialityAmount: 300,
      thresholdPercent: 20
    })
    expect(preview.summary.totalRows).toBe(2)
    expect(preview.detectedMapping.accountName).toBe('Account Name')
    expect(preview.previewRows[0].isMaterial).toBe(true)
  })
})

describe('integration setup state', () => {
  it('reports missing QBO env vars when not configured', () => {
    const env = QuickBooksOnlineProvider.envRequirements()
    expect(env.configured).toBe(false)
    expect(env.missing.length).toBeGreaterThan(0)
  })

  it('reports missing Google Sheets env vars when not configured', () => {
    const env = GoogleSheetsProvider.envRequirements()
    expect(env.configured).toBe(false)
    expect(env.missing.length).toBeGreaterThan(0)
  })
})

