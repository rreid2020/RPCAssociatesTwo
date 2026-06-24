import {
  COMPLETE_FORM_WORKSHEET_DEFINITIONS,
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
  }
}

export function buildFormWorksheetLedgerEntry (formCode, role, values = {}) {
  const code = String(formCode || '').trim().toUpperCase()
  const mapping = FORM_WORKSHEET_INCOME_MAPPINGS[code]
  if (!mapping) return null

  const totals = mapping.compute(values)
  const net = Number(totals.netIncome ?? totals.totalClaim ?? totals.totalExpenses ?? 0)
  if (!Number.isFinite(net) || net === 0) return null

  const isDeduction = mapping.kind === 'deduction'
  return {
    category: mapping.category,
    description: `${code} ${mapping.description} (line ${mapping.t1LineRef})`,
    amount: Math.abs(net),
    sourceType: 'form_worksheet',
    isManual: true,
    isDeduction,
    metadata: {
      source: 'form_worksheet',
      formCode: code,
      fieldCode: mapping.netField,
      lineRef: mapping.t1LineRef,
      scheduleRef: code,
      taxpayerRole: role,
      grossIncome: totals.grossIncome,
      totalExpenses: totals.totalExpenses,
      totalClaim: totals.totalClaim
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
