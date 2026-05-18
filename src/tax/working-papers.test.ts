import { describe, expect, it } from 'vitest'
import {
  calculateVarianceMetrics,
  validateAdjustmentBalance
} from '../../api/server/services/workingPapersService.js'
import {
  parseTrialBalanceFile,
  previewTrialBalanceImport
} from '../../api/server/services/trialBalanceImportService.js'
import {
  GoogleSheetsProvider,
  QuickBooksOnlineProvider
} from '../../api/server/services/accountingProviders.js'

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

