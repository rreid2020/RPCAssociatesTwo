/**
 * Authoritative T1 personal return package structure aligned with CRA pages:
 * - Package index: general-income-tax-benefit-package.html
 * - Other forms crosswalk: other-forms-publications.html
 */

export const T1_PACKAGE_INDEX_URL =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-years/general-income-tax-benefit-package.html'

export const T1_OTHER_FORMS_CROSSWALK_URL =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-years/general-income-tax-benefit-package/other-forms-publications.html'

export const T1_PROVINCIAL_PACKAGES = [
  { code: 'AB', name: 'Alberta', pathSegment: 'alberta', packageCode: '5009' },
  { code: 'BC', name: 'British Columbia', pathSegment: 'british-columbia', packageCode: '5001' },
  { code: 'MB', name: 'Manitoba', pathSegment: 'manitoba', packageCode: '5002' },
  { code: 'NB', name: 'New Brunswick', pathSegment: 'new-brunswick', packageCode: '5003' },
  { code: 'NL', name: 'Newfoundland and Labrador', pathSegment: 'newfoundland-labrador', packageCode: '5004' },
  { code: 'NT', name: 'Northwest Territories', pathSegment: 'northwest-territories', packageCode: '5008' },
  { code: 'NS', name: 'Nova Scotia', pathSegment: 'nova-scotia', packageCode: '5006' },
  { code: 'NU', name: 'Nunavut', pathSegment: 'nunavut', packageCode: '5014' },
  { code: 'ON', name: 'Ontario', pathSegment: 'ontario', packageCode: '5000' },
  { code: 'PE', name: 'Prince Edward Island', pathSegment: 'prince-edward-island', packageCode: '5007' },
  { code: 'QC', name: 'Quebec', pathSegment: 'quebec', packageCode: '5005' },
  { code: 'SK', name: 'Saskatchewan', pathSegment: 'saskatchewan', packageCode: '5010' },
  { code: 'YT', name: 'Yukon', pathSegment: 'yukon', packageCode: '5011' },
  { code: 'NR', name: 'Outside Canada (non-residents and deemed residents)', pathSegment: 'non-residents', packageCode: '5012' }
]

const BASE = '/en/revenue-agency/services/forms-publications/tax-packages-years/general-income-tax-benefit-package'

/**
 * CRA "other forms and publications" crosswalk — line-triggered T1 schedules/forms.
 * Guides are reference-only (not output artifacts).
 */
export const T1_LINE_CROSSWALK = [
  { step: 'step2_total_income', lineRefs: ['11600'], forms: ['T1032'], guides: [] },
  { step: 'step2_total_income', lineRefs: ['12000', '12010', '12100'], forms: ['5000-D1'], schedules: [], guides: [], artifactKind: 't1_worksheet' },
  { step: 'step2_total_income', lineRefs: ['12600'], forms: ['T776'], schedules: [], guides: ['T4036'] },
  { step: 'step2_total_income', lineRefs: ['12700'], forms: [], schedules: ['Schedule 3'], guides: ['T4037'] },
  { step: 'step2_total_income', lineRefs: ['13500', '13700', '13900', '14100', '14300'], forms: ['T2125', 'T2121', 'T2042'], schedules: [], guides: ['T4002'] },
  { step: 'step3_net_income', lineRefs: ['20800'], forms: [], schedules: ['Schedule 7'], guides: ['T4040'] },
  { step: 'step3_net_income', lineRefs: ['20805'], forms: [], schedules: ['Schedule 15'], guides: [] },
  { step: 'step3_net_income', lineRefs: ['21000'], forms: ['T1032'], schedules: [], guides: [] },
  { step: 'step3_net_income', lineRefs: ['21400'], forms: ['T778'], schedules: [], guides: [] },
  { step: 'step3_net_income', lineRefs: ['21500'], forms: ['T929'], schedules: [], guides: ['RC4064', 'RC4065'] },
  { step: 'step3_net_income', lineRefs: ['21900'], forms: ['T1-M'], schedules: [], guides: [] },
  { step: 'step3_net_income', lineRefs: ['21999', '22000'], forms: ['T1158'], schedules: [], guides: [] },
  { step: 'step3_net_income', lineRefs: ['22100'], forms: ['5000-D1'], schedules: [], guides: [], artifactKind: 't1_worksheet' },
  { step: 'step3_net_income', lineRefs: ['22200'], forms: ['RC381'], schedules: ['Schedule 8'], guides: [] },
  { step: 'step3_net_income', lineRefs: ['22300'], forms: [], schedules: ['Schedule 10'], guides: [], provinces: ['QC'] },
  { step: 'step3_net_income', lineRefs: ['22400'], forms: ['T1229'], schedules: [], guides: [] },
  { step: 'step3_net_income', lineRefs: ['22900'], forms: ['T777', 'TL2', 'T2200', 'RC359'], schedules: [], guides: ['T4044'] },
  { step: 'step3_net_income', lineRefs: ['23100'], forms: ['T1223'], schedules: [], guides: [] },
  { step: 'step4_taxable_income', lineRefs: ['24900'], forms: ['T1212'], schedules: [], guides: [] },
  { step: 'step4_taxable_income', lineRefs: ['25395', '25400'], forms: ['T2048', 'T657', 'T936', 'T2017'], schedules: [], guides: ['T4037'] },
  { step: 'step4_taxable_income', lineRefs: ['25500'], forms: ['T2222'], schedules: [], guides: [] },
  { step: 'step5_part_b', lineRefs: ['30300', '30400', '30425', '30450'], forms: [], schedules: ['Schedule 5'], guides: [] },
  { step: 'step5_part_b', lineRefs: ['30800', '31000'], forms: ['RC381'], schedules: ['Schedule 8'], guides: [] },
  { step: 'step5_part_b', lineRefs: ['31210', '31215'], forms: [], schedules: ['Schedule 10'], guides: [], provinces: ['QC'] },
  { step: 'step5_part_b', lineRefs: ['31217'], forms: [], schedules: ['Schedule 13'], guides: [] },
  { step: 'step5_part_b', lineRefs: ['31285'], forms: ['5000-D1'], schedules: [], guides: [], artifactKind: 't1_worksheet' },
  { step: 'step5_part_b', lineRefs: ['31400'], forms: ['T1032'], schedules: [], guides: [] },
  { step: 'step5_part_b', lineRefs: ['31600', '31800'], forms: ['T2201'], schedules: [], guides: ['RC4064', 'RC4065'] },
  { step: 'step5_part_b', lineRefs: ['32300'], forms: [], schedules: ['Schedule 11'], guides: ['P105'] },
  { step: 'step5_part_b', lineRefs: ['32600'], forms: [], schedules: ['Schedule 2'], guides: [] },
  { step: 'step5_part_b', lineRefs: ['34900'], forms: [], schedules: ['Schedule 9'], guides: ['P113'] },
  { step: 'step5_part_b', lineRefs: ['34990'], forms: ['5000-D1'], schedules: [], guides: [], artifactKind: 't1_worksheet' },
  { step: 'step5_part_c', lineRefs: ['40424'], forms: ['T1206'], schedules: [], guides: [] },
  { step: 'step5_part_c', lineRefs: ['40427'], forms: ['T691'], schedules: [], guides: [] },
  { step: 'step5_part_c', lineRefs: ['40500'], forms: ['T2209'], schedules: [], guides: [] },
  { step: 'step5_part_c', lineRefs: ['41200'], forms: ['T2038(IND)'], schedules: [], guides: [] },
  { step: 'step5_part_c', lineRefs: ['41800'], forms: ['T1172', 'RC359'], schedules: [], guides: ['RC4092'] },
  { step: 'step6_refund_balance', lineRefs: ['42100'], forms: ['RC381'], schedules: ['Schedule 8'], guides: [] },
  { step: 'step6_refund_balance', lineRefs: ['42120'], forms: [], schedules: ['Schedule 13'], guides: [] },
  { step: 'step6_refund_balance', lineRefs: ['42800'], forms: ['428'], schedules: [], guides: [] },
  { step: 'step6_refund_balance', lineRefs: ['45300'], forms: [], schedules: ['Schedule 6'], guides: [] },
  { step: 'step6_refund_balance', lineRefs: ['45355'], forms: [], schedules: ['Schedule 12'], guides: [] },
  { step: 'step6_refund_balance', lineRefs: ['45400'], forms: ['T2038(IND)'], schedules: [], guides: [] },
  { step: 'step6_refund_balance', lineRefs: ['45700'], forms: ['GST370'], schedules: [], guides: [] },
  { step: 'step6_refund_balance', lineRefs: ['47556'], forms: ['T2043'], schedules: [], guides: [] },
  { step: 'step6_refund_balance', lineRefs: ['47900'], forms: ['479'], schedules: [], guides: [] }
]

/** Federal schedules in the standard T1 package (output-only in Return Builder). */
export const T1_CORE_SCHEDULES = [
  'Schedule 2', 'Schedule 3', 'Schedule 5', 'Schedule 6', 'Schedule 7', 'Schedule 8',
  'Schedule 9', 'Schedule 10', 'Schedule 11', 'Schedule 12', 'Schedule 13', 'Schedule 15'
]

const SCHEDULE_SUFFIX_BY_NAME = {
  'Schedule 2': 's2',
  'Schedule 3': 's3',
  'Schedule 5': 's5',
  'Schedule 6': 's6',
  'Schedule 7': 's7',
  'Schedule 8': 's8',
  'Schedule 9': 's9',
  'Schedule 10': 's10',
  'Schedule 11': 's11',
  'Schedule 12': 's12',
  'Schedule 13': 's13',
  'Schedule 15': 's15'
}

export function resolveSchedulePackageUrl (scheduleName, provinceCode = 'ON') {
  const pkg = getProvincialPackage(provinceCode)
  const suffix = SCHEDULE_SUFFIX_BY_NAME[scheduleName]
  if (!pkg || !suffix) return null
  const pathSegment = provinceCode === 'QC' ? 'quebec' : pkg.pathSegment
  return `https://www.canada.ca${BASE}/${pathSegment}/${pkg.packageCode}-${suffix}.html`
}

export function enrichCrosswalkArtifacts (crosswalk, provinceCode = 'ON') {
  const enrich = (items = []) => items.map((item) => {
    if (item.artifactKind !== 't1_schedule') return item
    return {
      ...item,
      packageUrl: resolveSchedulePackageUrl(item.formCode, provinceCode)
    }
  })
  return {
    forms: enrich(crosswalk.forms),
    schedules: enrich(crosswalk.schedules),
    worksheets: crosswalk.worksheets.map((item) => ({
      ...item,
      packageUrl: item.formCode === '5000-D1'
        ? `https://www.canada.ca${BASE}/${provinceCode === 'QC' ? 'quebec' : getProvincialPackage(provinceCode).pathSegment}/${getProvincialPackage(provinceCode).packageCode}-d1.html`
        : null
    })),
    guides: crosswalk.guides
  }
}

export function getProvincialPackage (provinceCode) {
  const code = String(provinceCode || 'ON').trim().toUpperCase()
  return T1_PROVINCIAL_PACKAGES.find((p) => p.code === code) || T1_PROVINCIAL_PACKAGES.find((p) => p.code === 'ON')
}

export function resolveFormsForLineRefs (lineRefs = [], { provinceCode = 'ON' } = {}) {
  const normalized = new Set(lineRefs.map((l) => String(l).replace(/\D/g, '')))
  const forms = new Map()
  const schedules = new Map()
  const worksheets = new Map()
  const guides = new Map()

  for (const row of T1_LINE_CROSSWALK) {
    const hit = row.lineRefs.some((ref) => normalized.has(String(ref).replace(/\D/g, '')))
    if (!hit) continue
    if (row.provinces?.length && !row.provinces.includes(provinceCode)) continue

    for (const form of row.forms || []) {
      const kind = row.artifactKind === 't1_worksheet' || form === '5000-D1' ? 't1_worksheet' : 't1_form'
      const key = form
      if (!forms.has(key) && kind !== 't1_worksheet') {
        forms.set(key, { formCode: form, artifactKind: kind, lineRefs: row.lineRefs, step: row.step })
      } else if (kind === 't1_worksheet') {
        worksheets.set(key, { formCode: form, artifactKind: 't1_worksheet', lineRefs: row.lineRefs, step: row.step })
      }
    }
    for (const schedule of row.schedules || []) {
      schedules.set(schedule, {
        formCode: schedule,
        artifactKind: 't1_schedule',
        lineRefs: row.lineRefs,
        step: row.step,
        packageUrl: resolveSchedulePackageUrl(schedule, provinceCode)
      })
    }
    for (const guide of row.guides || []) {
      guides.set(guide, { formCode: guide, artifactKind: 't1_guide', lineRefs: row.lineRefs, step: row.step })
    }
  }

  return {
    forms: Array.from(forms.values()),
    schedules: Array.from(schedules.values()),
    worksheets: Array.from(worksheets.values()),
    guides: Array.from(guides.values())
  }
}

export function collectTriggeredLineRefs (incomeEntries = [], deductions = []) {
  const lineRefs = new Set()
  for (const entry of [...incomeEntries, ...deductions]) {
    const meta = entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {}
    const lineRef = String(meta.lineRef || '').replace(/\D/g, '')
    if (lineRef) lineRefs.add(lineRef)
    const amount = Number(entry.amount || 0)
    if (amount <= 0) continue
    const category = String(entry.category || '')
    if (category === 'employment_income') lineRefs.add('10100')
    if (category === 'pension_income' || category === 'rrif_income' || category === 'cpp_benefits' || category === 'oas_pension') lineRefs.add('11500')
    if (category === 'cpp_retirement_benefit' || category === 'cpp_survivor_benefit' || category === 'cpp_disability_benefit') lineRefs.add('11400')
    if (category === 'eligible_dividends' || category === 'taxable_eligible_dividends') lineRefs.add('12000')
    if (category === 'other_dividends' || category === 'taxable_other_dividends' || category === 'dividend_income') lineRefs.add('12010')
    if (category === 'interest_income') lineRefs.add('12100')
    if (category === 'rental_income') lineRefs.add('12600')
    if (category === 'capital_gains' || category === 'capital_disposition_proceeds' || category === 'capital_gains_dividends') lineRefs.add('12700')
    if (category === 'rrsp_income') lineRefs.add('12900')
    if (category === 'social_assistance') lineRefs.add('14500')
    if (category === 'workers_compensation') lineRefs.add('14400')
    if (category === 'self_employed_commissions' || category === 'professional_fees' || category === 'partnership_business_income') {
      lineRefs.add('13500')
    }
    if (category === 'tuition_amount') lineRefs.add('32300')
    if (category === 'rrsp_contributions' || category === 'rrsp') lineRefs.add('20800')
    if (category === 'fhsa_deduction') lineRefs.add('20805')
    if (category === 'union_dues') lineRefs.add('21200')
    if (category === 'child_care_expenses') lineRefs.add('21400')
    if (category === 'moving_expenses') lineRefs.add('21900')
    if (category === 'cpp_contributions' || category === 'qpp_contributions') lineRefs.add('30800')
    if (category === 'qpip_premiums') lineRefs.add('22300')
    if (category === 'ei_premiums') lineRefs.add('31200')
    if (category === 'medical_expenses') lineRefs.add('33099')
    if (category === 'donations') lineRefs.add('34900')
    if (category === 'disability_supports' || category === 'disability_amount') lineRefs.add('21500')
    if (category === 'employment_expenses') lineRefs.add('22900')
    if (category === 'student_loan_interest') lineRefs.add('31900')
    if (category === 'retiring_allowance' || category === 'death_benefits') lineRefs.add('13000')
  }
  return Array.from(lineRefs)
}

export function getT1PackageCatalog () {
  return {
    domain: 't1_personal',
    taxYear: 2025,
    indexUrl: T1_PACKAGE_INDEX_URL,
    crosswalkUrl: T1_OTHER_FORMS_CROSSWALK_URL,
    provincialPackages: T1_PROVINCIAL_PACKAGES.map((p) => ({
      ...p,
      packageUrl: `${BASE}/${p.pathSegment}/${p.packageCode}-g.html`
    })),
    coreSchedules: T1_CORE_SCHEDULES,
    lineCrosswalk: T1_LINE_CROSSWALK
  }
}
