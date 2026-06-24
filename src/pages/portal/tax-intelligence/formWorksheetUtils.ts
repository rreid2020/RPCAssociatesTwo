export const T2125_EXPENSE_FIELD_CODES = [
  '8521', '8523', '8590', '8690', '8710', '8760', '8810', '8811', '8860', '8871',
  '8910', '8960', '9060', '9180', '9200', '9220', '9224', '9275', '9281', '9936', '9270'
]
export const T2125_INCOME_FIELD_CODES = ['8000', '8290', '8230', '8299']
export const T2125_PART6_FIELD_CODES = ['6A', '6B', '6C', '6D', '6E']
export const T2125_HOME_OFFICE_FIELD_CODES = ['7A', '7B', '7C', '7D', '7E', '7F', '7G']
export const T2125_CHART_A_EXPENSE_CODES = [
  'chart_a_fuel', 'chart_a_interest', 'chart_a_insurance', 'chart_a_licence',
  'chart_a_maintenance', 'chart_a_leasing', 'chart_a_electricity', 'chart_a_other'
]

function n2125 (values: Record<string, string | number | undefined>, key: string) {
  const out = Number(values[key] || 0)
  return Number.isFinite(out) ? out : 0
}

export function computeT2125Field (
  fieldCode: string,
  values: Record<string, string | number | undefined> = {}
): number | undefined {
  switch (fieldCode) {
    case '3C': return n2125(values, '3A') - n2125(values, '3B')
    case '3F': return n2125(values, '3D') - n2125(values, '3E')
    case '3G': return (computeT2125Field('3C', values) ?? 0) + (computeT2125Field('3F', values) ?? 0)
    case '3J': return n2125(values, '3H') - n2125(values, '3I')
    case '3M': return n2125(values, '3K') - n2125(values, '3L')
    case '3N': return (computeT2125Field('3J', values) ?? 0) + (computeT2125Field('3M', values) ?? 0)
    case '8299': {
      if (values['8299'] != null && values['8299'] !== '' && Number(values['8299']) !== 0) return n2125(values, '8299')
      const from8000 = n2125(values, '8000') + n2125(values, '8290') + n2125(values, '8230')
      if (from8000 !== 0) return from8000
      const from3G = computeT2125Field('3G', values) ?? 0
      if (from3G !== 0) return from3G
      return computeT2125Field('3N', values)
    }
    case '8518': {
      const subtotal = sumFieldCodes(values, ['8300', '8320', '8340', '8360', '8450'])
      return subtotal - n2125(values, '8500')
    }
    case '8519': return (computeT2125Field('8299', values) ?? 0) - (computeT2125Field('8518', values) ?? 0)
    case '4A':
      if (n2125(values, '8519')) return n2125(values, '8519')
      return computeT2125Field('8299', values)
    case '9368': return sumFieldCodes(values, T2125_EXPENSE_FIELD_CODES)
    case '9369': return (computeT2125Field('4A', values) ?? 0) - (computeT2125Field('9368', values) ?? 0)
    case '5C': return n2125(values, '5A') + n2125(values, '5B') + n2125(values, '9974')
    case '5D': {
      if (values['5D'] != null && values['5D'] !== '' && Number(values['5D']) !== 0) return n2125(values, '5D')
      const from5 = (computeT2125Field('5C', values) ?? 0) - n2125(values, '9943')
      if (from5 !== 0 || n2125(values, '5A') || n2125(values, '5B') || n2125(values, '9974')) return from5
      return computeT2125Field('9369', values)
    }
    case '6F': return sumFieldCodes(values, T2125_PART6_FIELD_CODES)
    case '7H': return sumFieldCodes(values, T2125_HOME_OFFICE_FIELD_CODES) + n2125(values, '7G')
    case '7J': return (computeT2125Field('7H', values) ?? 0) - n2125(values, '7I')
    case '7M': return (computeT2125Field('7J', values) ?? 0) + n2125(values, '7K') + n2125(values, '7L')
    case '7O': return Math.max(0, (computeT2125Field('7M', values) ?? 0) - n2125(values, '7N'))
    case '7P': {
      const m = computeT2125Field('7M', values) ?? 0
      const netAdj = Math.max(0, n2125(values, '7N') || (computeT2125Field('5D', values) ?? 0))
      return Math.min(m, netAdj)
    }
    case 'chart_a_12': return sumFieldCodes(values, T2125_CHART_A_EXPENSE_CODES)
    case 'chart_a_total': return computeT2125Field('chart_a_12', values)
    case 'chart_a_13': {
      const kmB = n2125(values, 'chart_a_km_business')
      const kmT = n2125(values, 'chart_a_km_total')
      if (!kmT) return 0
      return (kmB / kmT) * (computeT2125Field('chart_a_12', values) ?? 0)
    }
    case 'chart_a_business_part': return computeT2125Field('chart_a_13', values)
    case 'chart_a_16':
    case 'chart_a_allowable':
      return (computeT2125Field('chart_a_13', values) ?? 0) + n2125(values, 'chart_a_parking') + n2125(values, 'chart_a_supp_insurance')
    case 'chart_c_28':
      return Math.min(Math.max(0, n2125(values, 'chart_c_26')), n2125(values, 'chart_c_27'))
    case 'area_g_iii': {
      const pct = n2125(values, 'area_g_epop1_percent') / 100
      return pct > 0 ? 1_500_000 * pct : 0
    }
    case '9946':
      return (computeT2125Field('5D', values) ?? 0) - n2125(values, '9945')
    default:
      return undefined
  }
}

export function computeT2125Totals (values: Record<string, string | number | undefined> = {}) {
  const grossIncome = computeT2125Field('8299', values) ?? 0
  const totalExpenses = computeT2125Field('9368', values) ?? 0
  const netBeforeAdj = computeT2125Field('9369', values) ?? 0
  const netIncome = computeT2125Field('9946', values) ?? netBeforeAdj
  return { grossIncome, totalExpenses, netIncome }
}

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

export const SCHEDULE_3_GAIN_FIELD_CODES = [
  'gain_loss_1', 'gain_loss_2', 'gain_loss_3', 'capital_gains_dividends', 'other_capital_gains'
]
export const SCHEDULE_3_LOSS_FIELD_CODES = ['allowable_capital_loss', 'prior_year_losses_applied']

export const SCHEDULE_7_CONTRIBUTION_FIELD_CODES = [
  'rrsp_contributions_current_year', 'rrsp_contributions_first_60_days', 'rrsp_spousal_contributions'
]

export const SCHEDULE_9_DONATION_FIELD_CODES = ['donations_cash', 'donations_kind', 'donations_carryforward']

export const SCHEDULE_11_TUITION_FIELD_CODES = ['tuition_eligible', 'tuition_received_transfer']

export const ON479_CREDIT_FIELD_CODES = [
  'line_61010', 'line_61070', 'line_61500', 'line_63100', 'line_63640', 'line_63800'
]

type Totals = {
  grossIncome?: number
  totalExpenses?: number
  netIncome?: number
  totalClaim?: number
  totalDeduction?: number
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

export function computeSchedule3Totals (values: Record<string, string | number | undefined> = {}) {
  const totalGains = sumFieldCodes(values, SCHEDULE_3_GAIN_FIELD_CODES)
  const totalLosses = sumFieldCodes(values, SCHEDULE_3_LOSS_FIELD_CODES)
  const netIncome = totalGains - totalLosses
  return { grossIncome: totalGains, totalExpenses: totalLosses, netIncome: Math.max(0, netIncome) }
}

export function computeSchedule7Totals (values: Record<string, string | number | undefined> = {}) {
  const totalDeduction = Number(values.rrsp_deduction_claimed || 0) || sumFieldCodes(values, SCHEDULE_7_CONTRIBUTION_FIELD_CODES)
  return { totalDeduction, netIncome: totalDeduction, grossIncome: 0, totalExpenses: totalDeduction }
}

export function computeSchedule9Totals (values: Record<string, string | number | undefined> = {}) {
  const totalClaim = sumFieldCodes(values, SCHEDULE_9_DONATION_FIELD_CODES)
  return { totalClaim, netIncome: totalClaim, grossIncome: 0, totalExpenses: totalClaim }
}

export function computeSchedule11Totals (values: Record<string, string | number | undefined> = {}) {
  const eligible = sumFieldCodes(values, SCHEDULE_11_TUITION_FIELD_CODES)
  const transferredOut = Number(values.tuition_transferred_out || 0)
  const totalClaim = Math.max(0, eligible - transferredOut)
  return { totalClaim, netIncome: totalClaim, grossIncome: 0, totalExpenses: totalClaim }
}

export function computeOn479Totals (values: Record<string, string | number | undefined> = {}) {
  const totalClaim = sumFieldCodes(values, ON479_CREDIT_FIELD_CODES)
  return { totalClaim, netIncome: totalClaim, grossIncome: 0, totalExpenses: totalClaim }
}

const FORM_COMPUTE: Record<string, (values: Record<string, string | number | undefined>) => Totals> = {
  T2125: computeT2125Totals,
  T776: computeT776Totals,
  T777: computeT777Totals,
  T2121: computeT2121Totals,
  T2042: computeT2042Totals,
  T778: computeT778Totals,
  'SCHEDULE 3': computeSchedule3Totals,
  'SCHEDULE 7': computeSchedule7Totals,
  'SCHEDULE 9': computeSchedule9Totals,
  'SCHEDULE 11': computeSchedule11Totals,
  ON479: computeOn479Totals
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
  if (code === 'T2125') {
    const t2125 = computeT2125Field(fieldCode, values)
    if (t2125 != null) return t2125
  }

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
  if (fieldCode === 'taxable_capital_gains') {
    return totals.netIncome ?? undefined
  }
  if (fieldCode === 'total_donations_claim' || fieldCode === 'total_ontario_credits' || fieldCode === 'tuition_amount_claimed') {
    return totals.totalClaim ?? totals.netIncome ?? undefined
  }

  return undefined
}

export const COMPLETE_FORM_WORKSHEET_CODES = Object.keys(FORM_COMPUTE)
