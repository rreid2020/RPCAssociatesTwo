export const T2125_EXPENSE_FIELD_CODES = [
  '8521', '8523', '8690', '8710', '8760', '8810', '8811', '8860', '8871',
  '8910', '8960', '9060', '9180', '9200', '9220', '9275', '9281', '9282'
]

export const T2125_INCOME_FIELD_CODES = ['8299', '8230']

export function computeT2125Totals (values: Record<string, string | number | undefined> = {}) {
  const n = (key: string) => {
    const raw = values[key]
    const out = Number(raw || 0)
    return Number.isFinite(out) ? out : 0
  }
  const grossIncome = T2125_INCOME_FIELD_CODES.reduce((sum, code) => sum + n(code), 0)
  const totalExpenses = T2125_EXPENSE_FIELD_CODES.reduce((sum, code) => sum + n(code), 0)
  const netIncome = grossIncome - totalExpenses
  return { grossIncome, totalExpenses, netIncome }
}

export function resolveComputedFormFieldValue (
  formCode: string,
  fieldCode: string,
  values: Record<string, string | number | undefined>
): number | undefined {
  if (formCode.toUpperCase() !== 'T2125') return undefined
  const totals = computeT2125Totals(values)
  if (fieldCode === '9368') return totals.totalExpenses || undefined
  if (fieldCode === '9946') return totals.netIncome || undefined
  return undefined
}
