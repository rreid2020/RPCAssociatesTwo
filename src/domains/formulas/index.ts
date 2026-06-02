function toNumber (value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function sumValues (values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((total, value) => total + value, 0)
}

function asRecordRows (rows: unknown): Array<Record<string, unknown>> {
  return Array.isArray(rows) ? rows : []
}

export function calculateTrialBalanceTotals (accounts: unknown) {
  const rows = asRecordRows(accounts)
  const currentValues = rows.map((account) => toNumber(account.current_period_balance))
  const priorValues = rows.map((account) => toNumber(account.prior_period_balance))
  const varianceValues = rows.map((account) => toNumber(account.variance_amount))
  return {
    currentTotal: sumValues(currentValues),
    priorTotal: sumValues(priorValues),
    varianceTotal: sumValues(varianceValues)
  }
}

export function calculateLeadSheetTotals (leadSheets: unknown) {
  const rows = asRecordRows(leadSheets)
  const noteValues = rows.map((sheet) => toNumber(sheet.open_note_count))
  const documentValues = rows.map((sheet) => toNumber(sheet.document_count))
  return {
    openNotesTotal: sumValues(noteValues),
    documentsTotal: sumValues(documentValues)
  }
}
