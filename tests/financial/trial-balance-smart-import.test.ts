import { describe, expect, it } from 'vitest'
import {
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
})
