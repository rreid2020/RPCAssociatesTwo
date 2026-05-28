import { HyperFormula } from 'hyperformula'

function toNumber (value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function sumWithHyperFormula (values: number[]): number {
  if (values.length === 0) return 0
  const rows: Array<[number | string]> = values.map((value) => [value])
  rows.push([`=SUM(A1:A${values.length})`])
  const engine = HyperFormula.buildFromArray(rows, { licenseKey: 'gpl-v3' })
  const result = engine.getCellValue({ sheet: 0, row: values.length, col: 0 })
  return typeof result === 'number' && Number.isFinite(result) ? result : 0
}

export function calculateTrialBalanceTotals (accounts: Array<Record<string, unknown>>) {
  const currentValues = accounts.map((account) => toNumber(account.current_period_balance))
  const priorValues = accounts.map((account) => toNumber(account.prior_period_balance))
  const varianceValues = accounts.map((account) => toNumber(account.variance_amount))
  return {
    currentTotal: sumWithHyperFormula(currentValues),
    priorTotal: sumWithHyperFormula(priorValues),
    varianceTotal: sumWithHyperFormula(varianceValues)
  }
}

export function calculateLeadSheetTotals (leadSheets: Array<Record<string, unknown>>) {
  const noteValues = leadSheets.map((sheet) => toNumber(sheet.open_note_count))
  const documentValues = leadSheets.map((sheet) => toNumber(sheet.document_count))
  return {
    openNotesTotal: sumWithHyperFormula(noteValues),
    documentsTotal: sumWithHyperFormula(documentValues)
  }
}

