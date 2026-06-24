import { INTERVIEW_TOPIC_CATEGORIES } from './interviewTopics.registry.js'
import { T1_CORE_SCHEDULES, T1_LINE_CROSSWALK } from './t1Package.registry.js'

/** Human-readable titles for T1 Return Builder worksheet registration. */
export const T1_FORM_TITLES = {
  T2125: 'Statement of Business or Professional Activities',
  T776: 'Statement of Real Estate Rentals',
  T777: 'Statement of Employment Expenses',
  T2121: 'Statement of Fishing Activities',
  T2042: 'Statement of Farming Activities',
  T1163: 'Statement A — AgriStability and AgriInvest Programs Information',
  T1164: 'Statement B — AgriStability and AgriInvest Programs Information',
  T778: 'Child Care Expenses Deduction',
  T2201: 'Disability Tax Credit Certificate',
  T2200: 'Declaration of Conditions of Employment',
  T2209: 'Federal Foreign Tax Credits',
  T1032: 'Joint Election to Split Pension Income',
  T1135: 'Foreign Income Verification Statement',
  T1158: 'Additional Tax on RESP Accumulated Income Payments',
  T1172: 'Additional Tax on Accumulated Income Payments from RESPs',
  T1198: 'Qualifying Retroactive Lump-Sum Payment',
  T1206: 'Taxable Amount of Dividends from PUC',
  T1212: 'Superficial Losses and Other Dispositions',
  T1223: 'Clergy Residence Deduction',
  T1229: 'Exploration and Development Expenses',
  'T1-M': 'Moving Expenses Deduction',
  T2038: 'Investment Tax Credit (Individuals)',
  'T2038(IND)': 'Investment Tax Credit (Individuals)',
  T2043: 'Refund of Old Age Security',
  T2048: 'Capital Gains Deduction',
  T2222: 'Northern Residents Deductions',
  T5003: 'Tax Shelter Information and Tax Credit',
  T5013: 'Partnership Information Return (allocations)',
  T657: 'Calculation of Capital Gains Deduction',
  T691: 'Minimum Tax',
  T929: 'Disability Supports Deduction',
  T936: 'Calculation of Cumulative Net Investment Loss',
  T1013: 'Authorizing or Cancelling a Representative',
  T1248: 'Information About Your Residency Status',
  T2017: 'Summary of Reserves on Dispositions of Capital Property',
  TL2: 'Claim for Meals and Lodging Expenses',
  RC359: 'Income Tax Request for Loss Transfer',
  RC381: 'Multijurisdictional CPP Contributions',
  RC267: 'Employee Contributions to a United States Retirement Plan',
  RC268: 'Employee Contributions to a Foreign Retirement Plan',
  RC269: 'Employee Contributions to a Foreign Retirement Plan — Exempt',
  GST370: 'Employee and Partner GST/HST Rebate Application',
  '5000-D1': 'Worksheet for the Return — Federal Tax',
  'Schedule 2': 'Federal Amounts Transferred from Spouse or Common-Law Partner',
  'Schedule 3': 'Capital Gains (or Losses)',
  'Schedule 5': 'Amounts for Spouse or Common-Law Partner and Dependants',
  'Schedule 6': 'Working Income Tax Benefit',
  'Schedule 7': 'RRSP, PRPP, and SPP Unused Contributions and HBP/LLP',
  'Schedule 8': 'CPP Contributions on Self-Employment and Other Earnings',
  'Schedule 9': 'Donations and Gifts',
  'Schedule 10': 'Employment Insurance Premiums on Self-Employment (Quebec)',
  'Schedule 11': 'Tuition, Education, and Textbook Amounts',
  'Schedule 12': 'Home Accessibility Expenses',
  'Schedule 13': 'Employment Insurance Premiums on Self-Employment',
  'Schedule 14': 'Climate Action Incentive',
  'Schedule 15': 'FHSA Contributions, Transfers, and Withdrawals',
  '428': 'Provincial or Territorial Tax',
  '479': 'Provincial or Territorial Tax Credits',
  ON479: 'Ontario Tax Credits'
}

function normalizeFormCode (value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, ' ')
}

function defaultCraLandingUrl (formNumber) {
  const code = String(formNumber || '').trim()
  if (!code || /^SCHEDULE\s/i.test(code)) return null
  const slug = code.toLowerCase().replace(/\s+/g, '').replace(/[()]/g, '')
  return `https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/${slug}.html`
}

function mergeManifestEntry (existing, partial) {
  return {
    code: existing.code,
    title: partial.title || existing.title,
    artifactKind: partial.artifactKind || existing.artifactKind,
    lineRefs: Array.from(new Set([...(existing.lineRefs || []), ...(partial.lineRefs || [])])).sort(),
    t1Steps: Array.from(new Set([...(existing.t1Steps || []), ...(partial.t1Steps || [])])),
    landingUrl: partial.landingUrl || existing.landingUrl || defaultCraLandingUrl(existing.code),
    sources: Array.from(new Set([...(existing.sources || []), ...(partial.sources || [])]))
  }
}

/**
 * Authoritative manifest of CRA forms and schedules required for T1 personal return building.
 * Used to register catalog worksheet shells before line-level schemas are completed.
 */
export function buildT1ReturnFormsManifest () {
  const byCode = new Map()

  const add = (rawCode, partial = {}) => {
    const code = normalizeFormCode(rawCode)
    if (!code) return
    const existing = byCode.get(code) || {
      code,
      title: T1_FORM_TITLES[code] || T1_FORM_TITLES[code.replace(/\s+/g, '')] || code,
      artifactKind: 't1_form',
      lineRefs: [],
      t1Steps: [],
      landingUrl: defaultCraLandingUrl(code),
      sources: []
    }
    byCode.set(code, mergeManifestEntry(existing, partial))
  }

  for (const row of T1_LINE_CROSSWALK) {
    for (const form of row.forms || []) {
      const artifactKind = row.artifactKind === 't1_worksheet' || form === '5000-D1' ? 't1_worksheet' : 't1_form'
      add(form, {
        artifactKind,
        lineRefs: row.lineRefs,
        t1Steps: [row.step],
        sources: ['t1_crosswalk']
      })
    }
    for (const schedule of row.schedules || []) {
      add(schedule, {
        artifactKind: 't1_schedule',
        lineRefs: row.lineRefs,
        t1Steps: [row.step],
        sources: ['t1_crosswalk']
      })
    }
  }

  for (const schedule of T1_CORE_SCHEDULES) {
    add(schedule, { artifactKind: 't1_schedule', sources: ['t1_core'] })
  }

  for (const category of INTERVIEW_TOPIC_CATEGORIES) {
    for (const topic of category.topics) {
      for (const form of topic.formCodes || []) {
        add(form, { sources: ['interview'] })
      }
    }
  }

  return Array.from(byCode.values()).sort((a, b) => a.code.localeCompare(b.code))
}

export function getT1ReturnFormManifestEntry (formCode) {
  const code = normalizeFormCode(formCode)
  return buildT1ReturnFormsManifest().find((entry) => entry.code === code) || null
}
