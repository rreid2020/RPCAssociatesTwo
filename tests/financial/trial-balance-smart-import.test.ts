import { describe, expect, it } from 'vitest'
import {
  buildFilePreview,
  buildHeaderRowCandidates,
  detectBestGridStructure,
  detectGridStructure,
  inferHeuristicMapping,
  mappingIsUsable,
  normalizeMappedRow,
  parseCsvToGrid
} from '../../api/server/services/trialBalanceSmartImportService.js'
import { parseTrialBalanceFile, previewTrialBalanceImport } from '../../api/server/services/trialBalanceImportService.js'

describe('trial balance smart import', () => {
  it('detects header row after title rows', () => {
    const grid = [
      ['Company Trial Balance'],
      ['Period ending 2026-02-14'],
      ['Account Number', 'Description', 'Current', 'Prior'],
      ['1000', 'Cash', '1,000.00', '800.00'],
      ['2000', 'Revenue', '500.00', '600.00']
    ]
    const structure = detectGridStructure(grid)
    expect(structure.headerRowIndex).toBe(2)
    expect(structure.columns).toContain('Description')
    expect(structure.rows).toHaveLength(2)
  })

  it('infers mapping for description and balance columns', () => {
    const columns = ['Account Number', 'Description', 'Current', 'Prior']
    const rows = [
      { 'Account Number': '1000', Description: 'Cash', Current: '1000', Prior: '800' },
      { 'Account Number': '2000', Description: 'Revenue', Current: '500', Prior: '600' }
    ]
    const result = inferHeuristicMapping(columns, rows)
    expect(mappingIsUsable(result.mapping)).toBe(true)
    expect(result.mapping.accountName).toBe('Description')
    expect(result.mapping.currentBalance).toBe('Current')
  })

  it('splits combined account number and name values', () => {
    const normalized = normalizeMappedRow(
      { Account: '1000 - Cash on hand' },
      { accountName: 'Account' }
    )
    expect(normalized.accountNumber).toBe('1000')
    expect(normalized.accountName).toBe('Cash on hand')
  })

  it('previews csv import without manual mapping', async () => {
    const csv = [
      'Report title',
      'Account,Balance',
      '1000 - Cash,1000',
      '2000 - Revenue,500'
    ].join('\n')
    const parsed = parseTrialBalanceFile({
      fileName: 'trial-balance.csv',
      base64Content: Buffer.from(csv, 'utf8').toString('base64')
    })
    expect(parsed.grid.length).toBeGreaterThan(2)
    const preview = await previewTrialBalanceImport({
      rows: parsed.rows,
      columns: parsed.columns,
      grid: parsed.grid,
      headerRowIndex: parsed.headerRowIndex,
      useSmartImport: false
    })
    expect(preview.needsMapping).toBe(false)
    expect(preview.summary.totalRows).toBeGreaterThan(0)
  })

  it('parses tab-delimited files', () => {
    const grid = parseCsvToGrid(Buffer.from('Account\tAmount\n1000\t2500', 'utf8'))
    expect(grid[0]).toEqual(['Account', 'Amount'])
    expect(grid[1][1]).toBe('2500')
  })

  it('maps Wave-style debit and credit trial balance without using account numbers as balances', async () => {
    const csv = [
      'Trial Balance',
      '6824137 Canada Limited',
      'As of 2025-12-31',
      'Report Type: Accrual (Paid & Unpaid)',
      '',
      'ACCOUNT NUMBER,ACCOUNTS,DEBIT,CREDIT',
      '1000,Cash on Hand,"18,635.57",0',
      '1003,Other 1 PSN (410),0,"32,687.55"',
      '1800,RPC Associates,0,"1,897.03"'
    ].join('\n')

    const parsed = parseTrialBalanceFile({
      fileName: 'wave-trial-balance.csv',
      base64Content: Buffer.from(csv, 'utf8').toString('base64')
    })

    expect(parsed.headerRowIndex).toBe(5)
    expect(parsed.columns).toEqual(['ACCOUNT NUMBER', 'ACCOUNTS', 'DEBIT', 'CREDIT'])

    const heuristic = inferHeuristicMapping(parsed.columns, parsed.rows)
    expect(heuristic.mapping.accountNumber).toBe('ACCOUNT NUMBER')
    expect(heuristic.mapping.accountName).toBe('ACCOUNTS')
    expect(heuristic.mapping.debit).toBe('DEBIT')
    expect(heuristic.mapping.credit).toBe('CREDIT')
    expect(heuristic.mapping.currentBalance).toBeUndefined()
    expect(heuristic.mapping.priorBalance).toBeUndefined()

    const preview = await previewTrialBalanceImport({
      rows: parsed.rows,
      columns: parsed.columns,
      grid: parsed.grid,
      headerRowIndex: parsed.headerRowIndex,
      useSmartImport: false
    })

    expect(preview.needsMapping).toBe(false)
    expect(preview.detectedMapping.debit).toBe('DEBIT')
    expect(preview.detectedMapping.credit).toBe('CREDIT')
    expect(preview.detectedMapping.priorBalance).toBeUndefined()

    const cashRow = preview.previewRows.find((row) => row.accountNumber === '1000')
    expect(cashRow?.debitAmount).toBe(18635.57)
    expect(cashRow?.creditAmount).toBe(0)
    expect(cashRow?.currentPeriodBalance).toBe(18635.57)

    const creditRow = preview.previewRows.find((row) => row.accountNumber === '1003')
    expect(creditRow?.currentPeriodBalance).toBe(-32687.55)
  })

  it('returns file preview and header row candidates for interactive correction', async () => {
    const csv = [
      'Company TB',
      'GL,Description,Amount',
      '1000,Cash,1500',
      '2000,Revenue,500'
    ].join('\n')
    const parsed = parseTrialBalanceFile({
      fileName: 'generic-tb.csv',
      base64Content: Buffer.from(csv, 'utf8').toString('base64')
    })
    const preview = await previewTrialBalanceImport({
      rows: parsed.rows,
      columns: parsed.columns,
      grid: parsed.grid,
      headerRowIndex: parsed.headerRowIndex,
      useSmartImport: false
    })
    expect(preview.filePreview?.length).toBeGreaterThan(0)
    expect(preview.headerRowCandidates?.length).toBeGreaterThan(0)
    expect(preview.mappingStatus).toBeDefined()
  })

  it('maps generic two-column account and balance exports', async () => {
    const csv = [
      'Trial Balance Export',
      'Account,Balance',
      '1000 - Cash on hand,1000',
      '2000 - Revenue,500'
    ].join('\n')
    const parsed = parseTrialBalanceFile({
      fileName: 'two-column-tb.csv',
      base64Content: Buffer.from(csv, 'utf8').toString('base64')
    })
    const preview = await previewTrialBalanceImport({
      rows: parsed.rows,
      columns: parsed.columns,
      grid: parsed.grid,
      headerRowIndex: parsed.headerRowIndex,
      useSmartImport: false
    })
    expect(preview.needsMapping).toBe(false)
    expect(preview.summary.totalRows).toBe(2)
    expect(preview.previewRows[0]?.accountNumber).toBe('1000')
  })

  it('exposes raw file rows for user review', () => {
    const grid = [
      ['Title'],
      ['Account', 'Amount'],
      ['1000', '2500']
    ]
    const preview = buildFilePreview(grid, 5)
    const candidates = buildHeaderRowCandidates(grid, 5)
    expect(preview).toHaveLength(3)
    expect(preview[1].cells).toEqual(['Account', 'Amount'])
    expect(candidates.some((candidate) => candidate.usable)).toBe(true)
  })

  it('auto-detects Wave header row without manual configuration', () => {
    const grid = [
      ['Trial Balance'],
      ['6824137 Canada Limited'],
      ['As of 2025-12-31'],
      ['Report Type: Accrual (Paid & Unpaid)'],
      [''],
      ['ACCOUNT NUMBER', 'ACCOUNTS', 'DEBIT', 'CREDIT'],
      ['1000', 'Cash on Hand', '18635.57', '0']
    ]
    const structure = detectBestGridStructure(grid)
    expect(structure.headerRowIndex).toBe(5)
    expect(structure.columns).toEqual(['ACCOUNT NUMBER', 'ACCOUNTS', 'DEBIT', 'CREDIT'])
    const heuristic = inferHeuristicMapping(structure.columns, structure.rows)
    expect(mappingIsUsable(heuristic.mapping)).toBe(true)
    expect(heuristic.mapping.debit).toBe('DEBIT')
    expect(heuristic.mapping.credit).toBe('CREDIT')
  })
})
