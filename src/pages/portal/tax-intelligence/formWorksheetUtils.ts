export const T2125_EXPENSE_FIELD_CODES = [
  '8521', '8523', '8690', '8710', '8760', '8810', '8811', '8860', '8871',
  '8910', '8960', '9060', '9180', '9200', '9220', '9275', '9281', '9282'
]
export const T2125_INCOME_FIELD_CODES = ['8299', '8230']

export const T776_EXPENSE_FIELD_CODES = [
  '8521', '8690', '8710', '8760', '8810', '8860', '8871', '8960', '9180', '9220', '9275', '9281', '9282'
]
export const T776_INCOME_FIELD_CODES = ['8141', '8230']

export const T777_EXPENSE_FIELD_CODES = [
  '9281', '9282', '9283', '9284', '9285', '9286', '9287', '9288', '9289', '9290'
]

export const T2121_EXPENSE_FIELD_CODES = [
  '8521', '8690', '8710', '8760', '8810', '8860', '8910', '8960', '9060', '9180', '9200', '9220', '9275', '9281', '9282'
]
export const T2121_INCOME_FIELD_CODES = ['8299', '8230']

export const T2042_EXPENSE_FIELD_CODES = T2121_EXPENSE_FIELD_CODES
export const T2042_INCOME_FIELD_CODES = ['8299', '8230']

export const T778_CLAIM_FIELD_CODES = ['total_eligible', 'total_disabled', 'total_overnight']

type Totals = {
  grossIncome?: number
  totalExpenses?: number
  netIncome?: number
  totalClaim?: number
}

function sumFieldCodes (values: Record<string, string | number | undefined>, codes: string[]) {
  return codes.reduce((sum, code) => {
    const out = Number(values[code] || 0)
    return sum + (Number.isFinite(out) ? out : 0)
  }, 0)
}

function incomeExpenseTotals (
  values: Record<string, string | number | undefined>,
  incomeCodes: string[],
  expenseCodes: string[]
): Totals {
  const grossIncome = sumFieldCodes(values, incomeCodes)
  const totalExpenses = sumFieldCodes(values, expenseCodes)
  return { grossIncome, totalExpenses, netIncome: grossIncome - totalExpenses }
}

export function computeT2125Totals (values: Record<string, string | number | undefined> = {}) {
  return incomeExpenseTotals(values, T2125_INCOME_FIELD_CODES, T2125_EXPENSE_FIELD_CODES)
}

export function computeT776Totals (values: Record<string, string | number | undefined> = {}) {
  return incomeExpenseTotals(values, T776_INCOME_FIELD_CODES, T776_EXPENSE_FIELD_CODES)
}

export function computeT777Totals (values: Record<string, string | number | undefined> = {}) {
  const totalExpenses = sumFieldCodes(values, T777_EXPENSE_FIELD_CODES)
  return { grossIncome: 0, totalExpenses, netIncome: totalExpenses }
}

export function computeT2121Totals (values: Record<string, string | number | undefined> = {}) {
  return incomeExpenseTotals(values, T2121_INCOME_FIELD_CODES, T2121_EXPENSE_FIELD_CODES)
}

export function computeT2042Totals (values: Record<string, string | number | undefined> = {}) {
  return incomeExpenseTotals(values, T2042_INCOME_FIELD_CODES, T2042_EXPENSE_FIELD_CODES)
}

export function computeT778Totals (values: Record<string, string | number | undefined> = {}) {
  const totalClaim = sumFieldCodes(values, T778_CLAIM_FIELD_CODES)
  return { totalClaim, netIncome: totalClaim, grossIncome: 0, totalExpenses: totalClaim }
}

const FORM_COMPUTE: Record<string, (values: Record<string, string | number | undefined>) => Totals> = {
  T2125: computeT2125Totals,
  T776: computeT776Totals,
  T777: computeT777Totals,
  T2121: computeT2121Totals,
  T2042: computeT2042Totals,
  T778: computeT778Totals
}

export function computeFormWorksheetTotals (
  formCode: string,
  values: Record<string, string | number | undefined> = {}
): Totals | null {
  const fn = FORM_COMPUTE[formCode.toUpperCase()]
  return fn ? fn(values) : null
}

export function resolveComputedFormFieldValue (
  formCode: string,
  fieldCode: string,
  values: Record<string, string | number | undefined>
): number | undefined {
  const code = formCode.toUpperCase()
  const totals = computeFormWorksheetTotals(code, values)
  if (!totals) return undefined

  if (fieldCode === '9368') {
    return totals.totalExpenses || totals.totalClaim || undefined
  }
  if (fieldCode === '9946') {
    return totals.netIncome ?? undefined
  }
  if (fieldCode === 'total_claim') {
    return totals.totalClaim ?? totals.netIncome ?? undefined
  }

  return undefined
}

export const COMPLETE_FORM_WORKSHEET_CODES = Object.keys(FORM_COMPUTE)
