import { describe, expect, it } from 'vitest'
import {
  inferLeadSheetSectionFromAccount,
  isSummaryTrialBalanceRow,
  normalizeLeadSheetSectionCode,
  resolveLeadSheetSectionForAccount
} from '../../api/server/services/workingPapersService.js'

describe('lead sheet generation helpers', () => {
  it('skips total and subtotal rows', () => {
    expect(isSummaryTrialBalanceRow({ account_name: 'Total Assets' })).toBe(true)
    expect(isSummaryTrialBalanceRow({ account_name: 'Accounts Receivable' })).toBe(false)
  })

  it('normalizes invalid section codes to Other', () => {
    expect(normalizeLeadSheetSectionCode('accounts_receivable')).toBe('Z')
    expect(normalizeLeadSheetSectionCode('b')).toBe('B')
  })

  it('infers sections from account names', () => {
    expect(inferLeadSheetSectionFromAccount({ account_name: 'Accounts Receivable' })).toBe('B')
    expect(inferLeadSheetSectionFromAccount({ account_name: 'Office Rent Expense' })).toBe('L')
  })

  it('prefers explicit lead sheet section mapping', () => {
    const section = resolveLeadSheetSectionForAccount(
      { account_name: 'Miscellaneous', lead_sheet_section: 'F' },
      new Map()
    )
    expect(section).toBe('F')
  })
})
