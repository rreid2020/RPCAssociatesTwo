import { describe, expect, it } from 'vitest'
import { inferColumnSchema, parseDatasetFile, previewDatasetImport } from '../../api/server/services/datasetImportService.js'
import { mergeLeftJoinRows } from '../../api/server/services/datasetViewService.js'
import { mapRowToSchema } from '../../api/server/services/spreadsheetImportService.js'

describe('engagement dataset import', () => {
  it('infers column schema from arbitrary spreadsheet columns', () => {
    const columns = ['Vendor', 'Invoice', 'Amount']
    const rows = [
      { Vendor: 'Acme', Invoice: 'INV-1', Amount: '1500' },
      { Vendor: 'Beta', Invoice: 'INV-2', Amount: '2200' }
    ]
    const schema = inferColumnSchema(columns, rows)
    expect(schema).toHaveLength(3)
    expect(schema.find((col) => col.sourceColumn === 'Amount')?.dataType).toBe('currency')
  })

  it('previews custom schedule import without trial balance fields', () => {
    const csv = [
      'AR Aging Report',
      'Customer,Invoice,Balance',
      'Acme Corp,INV-100,1500.00',
      'Beta LLC,INV-200,800.00'
    ].join('\n')
    const parsed = parseDatasetFile({
      fileName: 'ar-aging.csv',
      base64Content: Buffer.from(csv, 'utf8').toString('base64')
    })
    const preview = previewDatasetImport({
      rows: parsed.rows,
      columns: parsed.columns,
      grid: parsed.grid,
      headerRowIndex: parsed.headerRowIndex
    })
    expect(preview.needsMapping).toBe(false)
    expect(preview.columnSchema.length).toBeGreaterThan(0)
    expect(preview.previewRows[0]?.rowData).toBeDefined()
  })

  it('maps row values using custom column schema', () => {
    const schema = [
      { key: 'customer', label: 'Customer', dataType: 'text', sourceColumn: 'Customer' },
      { key: 'balance', label: 'Balance', dataType: 'currency', sourceColumn: 'Balance' }
    ]
    const mapped = mapRowToSchema({ Customer: 'Acme', Balance: '1,500.00' }, schema)
    expect(mapped.customer).toBe('Acme')
    expect(mapped.balance).toBe(1500)
  })

  it('left-joins foreign dataset rows by key', () => {
    const localRows = [
      { source_row_number: 2, row_data: { account: '1000', balance: 1500 } },
      { source_row_number: 3, row_data: { account: '2000', balance: 800 } }
    ]
    const foreignRows = [
      { source_row_number: 2, row_data: { acct_no: '1000', name: 'Cash' } }
    ]
    const joined = mergeLeftJoinRows(localRows, foreignRows, {
      localColumn: 'account',
      foreignColumn: 'acct_no'
    })
    expect(joined).toHaveLength(2)
    expect(joined[0].row_data.join_name).toBe('Cash')
    expect(joined[1].row_data.join_name).toBeUndefined()
  })
})
