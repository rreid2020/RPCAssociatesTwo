export const INCOME_CATEGORY_TO_LINE = {
  employment_income: { lineRef: '10100', label: 'Employment income' },
  employment_commissions: { lineRef: '10120', label: 'Employment commissions' },
  pension_income: { lineRef: '11500', label: 'Other pensions and superannuation' },
  rrif_income: { lineRef: '11500', label: 'RRIF income (pension line)' },
  uccb_income: { lineRef: '11700', label: 'Universal child care benefit' },
  ei_benefits: { lineRef: '11900', label: 'Employment insurance and other benefits' },
  eligible_dividends: { lineRef: '12000', label: 'Taxable amount of eligible dividends' },
  dividend_income: { lineRef: '12010', label: 'Taxable amount of dividends other than eligible' },
  interest_income: { lineRef: '12100', label: 'Interest and other investment income' },
  rrsp_income: { lineRef: '12900', label: 'RRSP income' },
  other_income: { lineRef: '13000', label: 'Other income' },
  business_income: { lineRef: '13500', label: 'Business income (net)' },
  social_assistance: { lineRef: '14500', label: 'Social assistance payments' },
  workers_compensation: { lineRef: '14400', label: "Workers' compensation benefits" },
  capital_gains: { lineRef: '12700', label: 'Taxable capital gains' },
  cpp_benefits: { lineRef: '11400', label: 'Taxable CPP benefits' },
  oas_pension: { lineRef: '11300', label: 'Taxable OAS pension' }
}

export const DEDUCTION_CATEGORY_TO_LINE = {
  rrsp: { lineRef: '20800', label: 'RRSP deduction' },
  fhsa_deduction: { lineRef: '20805', label: 'FHSA deduction' },
  union_dues: { lineRef: '21200', label: 'Annual union/professional dues' },
  uccb_repayment: { lineRef: '21300', label: 'UCCB repayment' },
  child_care_expenses: { lineRef: '21400', label: 'Child care expenses' },
  moving_expenses: { lineRef: '21900', label: 'Moving expenses' },
  cpp2_contributions: { lineRef: '22215', label: 'CPP enhanced contributions deduction' },
  qpp2_contributions: { lineRef: '22300', label: 'QPP enhanced contributions deduction' },
  cpp_contributions: { lineRef: '22200', label: 'CPP contributions on self-employment' },
  tuition_amount: { lineRef: '32300', label: 'Tuition amount' },
  medical_expenses: { lineRef: '33099', label: 'Medical expenses' },
  donations: { lineRef: '34900', label: 'Donations and gifts' }
}

export function round2 (n) {
  return Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100
}

function getRole (metadata) {
  return String(metadata?.taxpayerRole || 'self').toLowerCase() === 'spouse' ? 'spouse' : 'self'
}

function isWithholdingEntry (row) {
  const meta = row.metadata || {}
  return Boolean(meta.asWithholding) || String(row.category || '') === 'tax_withheld'
}

export function buildIncomeLineTotals (incomeEntries = [], roleFilter = 'self') {
  const map = new Map()
  for (const row of incomeEntries) {
    const role = getRole(row.metadata)
    if (roleFilter !== 'household' && role !== roleFilter) continue
    if (isWithholdingEntry(row)) continue
    const meta = row.metadata || {}
    const lineRef = String(meta.lineRef || INCOME_CATEGORY_TO_LINE[row.category]?.lineRef || '')
    if (!lineRef) continue
    const fallbackLabel = INCOME_CATEGORY_TO_LINE[row.category]?.label || row.category
    const label = String(meta.lineLabel || fallbackLabel)
    const key = `${lineRef}:${label}`
    const prev = map.get(key)
    map.set(key, {
      lineRef,
      label,
      amount: round2((prev?.amount || 0) + Number(row.amount || 0))
    })
  }
  return Array.from(map.values()).sort((a, b) => Number(a.lineRef) - Number(b.lineRef))
}

export function buildDeductionLineTotals (deductions = [], roleFilter = 'self') {
  const map = new Map()
  for (const row of deductions) {
    if (row.is_credit) continue
    const role = getRole(row.metadata)
    if (roleFilter !== 'household' && role !== roleFilter) continue
    const meta = row.metadata || {}
    const lineRef = String(meta.lineRef || DEDUCTION_CATEGORY_TO_LINE[row.category]?.lineRef || '')
    if (!lineRef) continue
    const fallbackLabel = DEDUCTION_CATEGORY_TO_LINE[row.category]?.label || row.category
    const label = String(meta.lineLabel || fallbackLabel)
    const key = `${lineRef}:${label}`
    const prev = map.get(key)
    map.set(key, {
      lineRef,
      label,
      amount: round2((prev?.amount || 0) + Number(row.amount || 0))
    })
  }
  return Array.from(map.values()).sort((a, b) => Number(a.lineRef) - Number(b.lineRef))
}

function buildCreditLineTotals (deductions = [], roleFilter = 'self') {
  const map = new Map()
  for (const row of deductions) {
    if (!row.is_credit) continue
    const role = getRole(row.metadata)
    if (roleFilter !== 'household' && role !== roleFilter) continue
    const meta = row.metadata || {}
    const lineRef = String(meta.lineRef || DEDUCTION_CATEGORY_TO_LINE[row.category]?.lineRef || '')
    if (!lineRef) continue
    const fallbackLabel = DEDUCTION_CATEGORY_TO_LINE[row.category]?.label || row.category
    const label = String(meta.lineLabel || fallbackLabel)
    const key = `${lineRef}:${label}`
    const prev = map.get(key)
    map.set(key, {
      lineRef,
      label,
      amount: round2((prev?.amount || 0) + Number(row.amount || 0))
    })
  }
  return Array.from(map.values()).sort((a, b) => Number(a.lineRef) - Number(b.lineRef))
}

function readCalculationField (calculation, snakeKey, camelKey, fallback = 0) {
  if (!calculation) return fallback
  const direct = calculation[snakeKey] ?? calculation[camelKey]
  return Number(direct ?? fallback)
}

export function buildFederalSummaryForReturn ({ incomeEntries = [], deductions = [], calculation = null }) {
  const comparative = calculation?.assumptions?.comparative
  const totalIncome = round2(incomeEntries.reduce((sum, row) => {
    if (isWithholdingEntry(row)) return sum
    return sum + Number(row.amount || 0)
  }, 0))
  const totalDeductions = round2(deductions
    .filter((d) => !d.is_credit)
    .reduce((sum, d) => sum + Number(d.amount || 0), 0))
  const totalCreditsClaimed = round2(deductions
    .filter((d) => d.is_credit)
    .reduce((sum, d) => sum + Number(d.amount || 0), 0))
  const line23600 = Number(comparative?.self?.netIncome ?? readCalculationField(calculation, 'net_income', 'netIncome', totalIncome - totalDeductions))
  const line26000 = Number(comparative?.self?.taxableIncome ?? readCalculationField(calculation, 'taxable_income', 'taxableIncome', line23600))
  const federalTax = readCalculationField(calculation, 'federal_tax', 'federalTax', 0)
  const provincialTax = readCalculationField(calculation, 'provincial_tax', 'provincialTax', 0)
  const totalCreditsApplied = readCalculationField(calculation, 'total_credits', 'totalCredits', Math.min(federalTax + provincialTax, totalCreditsClaimed))
  const line43500 = readCalculationField(calculation, 'total_payable', 'totalPayable', Math.max(0, federalTax + provincialTax - totalCreditsApplied))
  const line43700 = Number(comparative?.self?.taxesWithheld ?? readCalculationField(calculation, 'taxes_withheld', 'taxesWithheld', 0))
  const refundOrBalance = round2(readCalculationField(calculation, 'refund_or_balance', 'refundOrBalance', line43700 - line43500))
  const creditLines = buildCreditLineTotals(deductions, 'self')

  return {
    incomeLines: buildIncomeLineTotals(incomeEntries, 'self'),
    deductionLines: buildDeductionLineTotals(deductions, 'self'),
    creditLines,
    totals: {
      line15000: totalIncome,
      line23600: round2(line23600),
      line26000: round2(line26000),
      line35000: round2(federalTax),
      line42800: round2(provincialTax),
      line43500: round2(line43500),
      line43700: round2(line43700),
      line484Or485: round2(Math.abs(refundOrBalance)),
      isRefund: refundOrBalance >= 0
    },
    sections: [
      {
        id: 'total_income',
        title: 'Total income',
        lines: buildIncomeLineTotals(incomeEntries, 'self'),
        subtotal: { lineRef: '15000', label: 'Total income', amount: totalIncome }
      },
      {
        id: 'net_income',
        title: 'Net income',
        lines: buildDeductionLineTotals(deductions, 'self'),
        subtotal: { lineRef: '23600', label: 'Net income', amount: round2(line23600) }
      },
      {
        id: 'taxable_income',
        title: 'Taxable income',
        lines: [],
        subtotal: { lineRef: '26000', label: 'Taxable income', amount: round2(line26000) }
      },
      {
        id: 'federal_tax',
        title: 'Tax on taxable income',
        lines: [
          { lineRef: '35000', label: 'Federal tax on taxable income', amount: round2(federalTax) },
          { lineRef: '42800', label: 'Provincial or territorial tax', amount: round2(provincialTax) }
        ],
        subtotal: { lineRef: '42000', label: 'Net tax before credits', amount: round2(federalTax + provincialTax) }
      },
      {
        id: 'credits',
        title: 'Non-refundable tax credits',
        lines: creditLines,
        subtotal: { lineRef: '38200', label: 'Total non-refundable credits claimed', amount: round2(totalCreditsClaimed) }
      },
      {
        id: 'tax_and_balance',
        title: 'Refund or balance owing',
        lines: [
          { lineRef: '43500', label: 'Total payable', amount: round2(line43500) },
          { lineRef: '43700', label: 'Total income tax deducted', amount: round2(line43700) }
        ],
        subtotal: {
          lineRef: refundOrBalance >= 0 ? '48400' : '48500',
          label: refundOrBalance >= 0 ? 'Refund' : 'Balance owing',
          amount: round2(Math.abs(refundOrBalance))
        }
      }
    ]
  }
}
