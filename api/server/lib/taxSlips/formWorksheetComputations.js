import {
  COMPLETE_FORM_WORKSHEET_DEFINITIONS,
  computeOn479Totals,
  computeSchedule11Totals,
  computeSchedule3Totals,
  computeSchedule7Totals,
  computeSchedule9Totals,
  computeT2042Totals,
  computeT2121Totals,
  computeT2125Totals,
  computeT776Totals,
  computeT777Totals,
  computeT778Totals
} from './formWorksheetDefinitions.seed.js'

export const FORM_WORKSHEET_INCOME_MAPPINGS = {
  T2125: {
    compute: computeT2125Totals,
    netField: '9946',
    t1LineRef: '13500',
    category: 'business_income',
    description: 'net business income'
  },
  T776: {
    compute: computeT776Totals,
    netField: '9946',
    t1LineRef: '12600',
    category: 'rental_income',
    description: 'net rental income'
  },
  T777: {
    compute: computeT777Totals,
    netField: '9368',
    t1LineRef: '22900',
    category: 'employment_expenses',
    description: 'total employment expenses',
    kind: 'deduction'
  },
  T2121: {
    compute: computeT2121Totals,
    netField: '9946',
    t1LineRef: '14300',
    category: 'fishing_income',
    description: 'net fishing income'
  },
  T2042: {
    compute: computeT2042Totals,
    netField: '9946',
    t1LineRef: '14100',
    category: 'farming_income',
    description: 'net farming income'
  },
  T778: {
    compute: computeT778Totals,
    netField: 'total_claim',
    t1LineRef: '21400',
    category: 'child_care_expenses',
    description: 'child care expenses deduction',
    kind: 'deduction'
  },
  'SCHEDULE 3': {
    compute: computeSchedule3Totals,
    netField: 'taxable_capital_gains',
    t1LineRef: '12700',
    category: 'capital_gains',
    description: 'taxable capital gains'
  },
  'SCHEDULE 7': {
    compute: computeSchedule7Totals,
    netField: 'rrsp_deduction_claimed',
    t1LineRef: '20800',
    category: 'rrsp',
    description: 'RRSP deduction',
    kind: 'deduction'
  },
  'SCHEDULE 9': {
    compute: computeSchedule9Totals,
    netField: 'total_donations_claim',
    t1LineRef: '34900',
    category: 'donations',
    description: 'donations and gifts',
    kind: 'credit'
  },
  'SCHEDULE 11': {
    compute: computeSchedule11Totals,
    netField: 'tuition_amount_claimed',
    t1LineRef: '32300',
    category: 'tuition_amount',
    description: 'tuition amount',
    kind: 'credit'
  },
  ON479: {
    compute: computeOn479Totals,
    netField: 'total_ontario_credits',
    t1LineRef: '47900',
    category: 'provincial_tax_credits',
    description: 'Ontario tax credits',
    kind: 'credit'
  }
}

export function buildFormWorksheetLedgerEntry (formCode, role, values = {}) {
  const code = String(formCode || '').trim().toUpperCase()
  const mapping = FORM_WORKSHEET_INCOME_MAPPINGS[code]
  if (!mapping) return null

  const totals = mapping.compute(values)
  const net = Number(totals.netIncome ?? totals.totalClaim ?? totals.totalDeduction ?? totals.totalExpenses ?? 0)
  if (!Number.isFinite(net) || net === 0) return null

  const isDeduction = mapping.kind === 'deduction'
  const isCredit = mapping.kind === 'credit'
  return {
    category: mapping.category,
    description: `${String(formCode || '').trim()} ${mapping.description} (line ${mapping.t1LineRef})`,
    amount: Math.abs(net),
    sourceType: 'form_worksheet',
    isManual: true,
    isDeduction,
    isCredit,
    metadata: {
      source: 'form_worksheet',
      formCode: code,
      fieldCode: mapping.netField,
      lineRef: mapping.t1LineRef,
      scheduleRef: String(formCode || '').trim(),
      taxpayerRole: role,
      grossIncome: totals.grossIncome,
      totalExpenses: totals.totalExpenses,
      totalClaim: totals.totalClaim,
      totalDeduction: totals.totalDeduction
    }
  }
}

export function getFormWorksheetCoverageSummary (schemas = []) {
  const completeCodes = new Set(COMPLETE_FORM_WORKSHEET_DEFINITIONS.map((d) => String(d.code).toUpperCase()))
  const complete = schemas.filter((s) => s.schemaStatus === 'complete' || completeCodes.has(String(s.code).toUpperCase()))
  const catalogOnly = schemas.filter((s) => s.schemaStatus === 'catalog_only')
  const byArtifactKind = {}
  for (const schema of schemas) {
    const kind = schema.formFamily || schema.metadata?.artifactKind || 'other'
    byArtifactKind[kind] = (byArtifactKind[kind] || 0) + 1
  }
  return {
    totalRegistered: schemas.length,
    complete: complete.length,
    catalogOnly: catalogOnly.length,
    pendingFieldSchemas: catalogOnly.length,
    completeFormCodes: complete.map((s) => s.code).sort(),
    byArtifactKind
  }
}
