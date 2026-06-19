import { getTaxReturnById } from './taxReturn.service.js'
import { listDeductions, listIncomeEntries } from './income.service.js'
import { INTERVIEW_TOPIC_CATEGORIES, normalizeInterviewTopicIds } from '../../lib/taxSlips/interviewTopics.registry.js'
import {
  getProvincialPackage,
  getT1PackageCatalog,
  resolveFormsForLineRefs,
  collectTriggeredLineRefs
} from '../../lib/taxSlips/t1Package.registry.js'
import { classifyReturnBuilderArtifact, isOutOfScopeForm } from '../../lib/taxSlips/formScope.js'

function normalizeFormCode (value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '')
}

function buildLookupVariants (rawCode) {
  const normalized = normalizeFormCode(rawCode)
  const variants = new Set([normalized])
  const scheduleMatch = normalized.match(/^SCHEDULE(\d+)$/)
  if (scheduleMatch) {
    variants.add(`SCHEDULE ${scheduleMatch[1]}`)
    variants.add(`Schedule ${scheduleMatch[1]}`)
  }
  if (/^SCHEDULE\s*\d+$/i.test(String(rawCode || ''))) {
    const digits = String(rawCode).replace(/\D/g, '')
    if (digits) variants.add(`SCHEDULE${digits}`)
  }
  return Array.from(variants)
}

const CATEGORY_FORM_RULES = {
  capital_gains: { formCode: 'Schedule 3', reason: 'Capital gains income reported on the return' },
  capital_disposition_proceeds: { formCode: 'Schedule 3', reason: 'Capital disposition proceeds reported' },
  partnership_capital_gains: { formCode: 'Schedule 3', reason: 'Partnership capital gains reported' },
  non_resident_self_employment: { formCode: 'T2125', reason: 'Non-resident self-employment income reported' },
  self_employed_commissions: { formCode: 'T2125', reason: 'Self-employment commission income reported' },
  professional_fees: { formCode: 'T2125', reason: 'Professional or business fees reported' },
  partnership_business_income: { formCode: 'T2125', reason: 'Partnership business income reported' },
  contract_payments: { formCode: 'T2125', reason: 'Contractor/subcontractor payments reported' },
  rental_income: { formCode: 'T776', reason: 'Rental income reported on the return' },
  retroactive_lump_sum: { formCode: 'T1198', reason: 'Retroactive lump-sum payment reported on slip' },
  security_option_benefits: { formCode: 'T1212', reason: 'Deferred security option benefits reported' },
  child_care_expenses: { formCode: 'T778', reason: 'Child care expenses reported' },
  moving_expenses: { formCode: 'T1-M', reason: 'Moving expenses reported' },
  donations: { formCode: 'Schedule 9', reason: 'Donations and gifts reported' },
  medical_expenses: { formCode: 'Schedule 9', reason: 'Medical expenses may affect donation limit calculations' },
  fhsa_deduction: { formCode: 'Schedule 15', reason: 'FHSA deduction reported' },
  employment_expenses: { formCode: 'T777', reason: 'Employment expenses reported' },
  student_loan_interest: { formCode: 'Schedule 9', reason: 'Student loan interest reported' }
}

const SETUP_FLAG_RULES = [
  { field: 'soldPrincipalResidence', formCode: 'Schedule 3', reason: 'Principal residence sale indicated in T1 setup' },
  { field: 'foreignPropertyOver100k', formCode: 'T1135', reason: 'Foreign property over $100,000 indicated in T1 setup' },
  { field: 'spouseSelfEmployed', formCode: 'T2125', reason: 'Spouse self-employment indicated in T1 setup' }
]

async function lookupFormInRegistry (pool, rawCode) {
  const variants = buildLookupVariants(rawCode)
  try {
    for (const variant of variants) {
      const normalized = normalizeFormCode(variant)
      const { rows } = await pool.query(
        `
          SELECT
            form_number AS "formNumber",
            title,
            landing_url AS "landingUrl",
            status,
            form_family AS "formFamily",
            last_update AS "lastUpdate"
          FROM taxgpt.form_registry
          WHERE form_number = $1
             OR LOWER(title) LIKE '%' || LOWER($2) || '%'
          ORDER BY
            CASE WHEN form_number = $1 THEN 0 ELSE 1 END,
            updated_at DESC
          LIMIT 1
        `,
        [normalized, variant]
      )
      if (rows[0]) {
        return {
          formNumber: rows[0].formNumber,
          title: rows[0].title,
          landingUrl: rows[0].landingUrl,
          status: rows[0].status,
          formFamily: rows[0].formFamily,
          lastUpdate: rows[0].lastUpdate,
          registryStatus: rows[0].status === 'archived' ? 'archived' : 'active'
        }
      }
    }
    return {
      formNumber: normalizeFormCode(rawCode),
      title: null,
      landingUrl: null,
      status: null,
      formFamily: null,
      lastUpdate: null,
      registryStatus: 'not_indexed'
    }
  } catch (error) {
    if (error?.code === '42P01') {
      return {
        formNumber: normalizeFormCode(rawCode),
        title: null,
        landingUrl: null,
        status: null,
        formFamily: null,
        lastUpdate: null,
        registryStatus: 'registry_unavailable'
      }
    }
    throw error
  }
}

function pushSignal (map, signal) {
  const key = normalizeFormCode(signal.formCode)
  if (!key) return
  const existing = map.get(key)
  if (!existing) {
    map.set(key, signal)
    return
  }
  const sources = new Set([...(existing.sources || []), ...(signal.sources || [])])
  const reasons = new Set([...(existing.reasons || []), ...(signal.reasons || [])])
  map.set(key, {
    ...existing,
    sources: Array.from(sources),
    reasons: Array.from(reasons)
  })
}

export async function inferRequiredFormsForReturn (pool, clerkUserId, taxReturnId) {
  const taxReturn = await getTaxReturnById(pool, clerkUserId, taxReturnId)
  if (!taxReturn) return null

  const [incomeEntries, deductions] = await Promise.all([
    listIncomeEntries(pool, clerkUserId, taxReturnId),
    listDeductions(pool, clerkUserId, taxReturnId)
  ])

  const signals = new Map()
  const profile = taxReturn.taxpayer_profile && typeof taxReturn.taxpayer_profile === 'object'
    ? taxReturn.taxpayer_profile
    : {}
  const setupJson = taxReturn.setup_json && typeof taxReturn.setup_json === 'object'
    ? taxReturn.setup_json
    : {}
  const interviewTopics = setupJson.interviewTopics && typeof setupJson.interviewTopics === 'object'
    ? setupJson.interviewTopics
    : {}
  const selectedInterviewTopicIds = normalizeInterviewTopicIds(interviewTopics.selectedTopicIds)

  for (const category of INTERVIEW_TOPIC_CATEGORIES) {
    for (const topic of category.topics) {
      if (!selectedInterviewTopicIds.includes(topic.id)) continue
      for (const formCode of topic.formCodes || []) {
        pushSignal(signals, {
          formCode,
          sources: ['interview_topic'],
          reasons: [`Tax situation setup: ${topic.label}`]
        })
      }
    }
  }

  for (const rule of SETUP_FLAG_RULES) {
    if (profile[rule.field] === true) {
      pushSignal(signals, {
        formCode: rule.formCode,
        sources: ['setup_flag'],
        reasons: [rule.reason]
      })
    }
  }

  for (const entry of incomeEntries || []) {
    const amount = Number(entry.amount || 0)
    if (amount <= 0) continue
    const categoryRule = CATEGORY_FORM_RULES[entry.category]
    if (categoryRule) {
      pushSignal(signals, {
        formCode: categoryRule.formCode,
        sources: ['income_category'],
        reasons: [categoryRule.reason]
      })
    }
    const meta = entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {}
    const scheduleRef = String(meta.scheduleRef || '').trim()
    if (scheduleRef) {
      pushSignal(signals, {
        formCode: scheduleRef,
        sources: ['slip_mapping'],
        reasons: [`Mapped from ${String(meta.slipType || entry.source_type || 'income')} box ${String(meta.boxCode || '')}`.trim()]
      })
    }
  }

  for (const row of deductions || []) {
    const amount = Number(row.amount || 0)
    if (amount <= 0) continue
    const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {}
    const scheduleRef = String(meta.scheduleRef || '').trim()
    if (scheduleRef) {
      pushSignal(signals, {
        formCode: scheduleRef,
        sources: ['deduction_mapping'],
        reasons: [`Deduction mapped to ${String(meta.lineRef || row.category || 'line')}`]
      })
    }
  }

  const provinceCode = String(taxReturn.province_code || profile.residenceProvinceDec31 || 'ON').toUpperCase()
  const triggeredLineRefs = collectTriggeredLineRefs(incomeEntries, deductions)
  const crosswalk = resolveFormsForLineRefs(triggeredLineRefs, { provinceCode })

  for (const artifact of [...crosswalk.forms, ...crosswalk.schedules, ...crosswalk.worksheets]) {
    pushSignal(signals, {
      formCode: artifact.formCode,
      sources: ['t1_line_crosswalk'],
      reasons: [`CRA T1 package crosswalk for line(s) ${artifact.lineRefs.join(', ')}`]
    })
  }

  const forms = []
  for (const signal of signals.values()) {
    if (isOutOfScopeForm(signal.formCode)) continue
    const registry = await lookupFormInRegistry(pool, signal.formCode)
    if (isOutOfScopeForm(registry.formNumber || signal.formCode, registry.title || '')) continue
    const classification = classifyReturnBuilderArtifact(
      registry.formNumber || signal.formCode,
      registry.title || '',
      registry.landingUrl || ''
    )
    if (!classification.returnBuilderEligible && classification.artifactKind !== 't1_guide') continue
    forms.push({
      formCode: signal.formCode,
      normalizedFormCode: normalizeFormCode(signal.formCode),
      sources: signal.sources || [],
      reasons: signal.reasons || [],
      requirementStatus: 'required',
      artifactKind: classification.artifactKind,
      registry
    })
  }

  forms.sort((a, b) => a.normalizedFormCode.localeCompare(b.normalizedFormCode))

  const grouped = {
    schedules: forms.filter((f) => f.artifactKind === 't1_schedule'),
    forms: forms.filter((f) => f.artifactKind === 't1_form'),
    worksheets: forms.filter((f) => f.artifactKind === 't1_worksheet'),
    other: forms.filter((f) => !['t1_schedule', 't1_form', 't1_worksheet'].includes(f.artifactKind))
  }

  const provincialPackage = getProvincialPackage(provinceCode)
  const catalog = getT1PackageCatalog()

  return {
    domain: 't1_personal',
    taxReturnId,
    taxYear: taxReturn.tax_year,
    taxpayerName: taxReturn.taxpayer_name,
    provinceCode,
    provincialPackage,
    packageIndexUrl: catalog.indexUrl,
    crosswalkUrl: catalog.crosswalkUrl,
    triggeredLineRefs,
    referenceGuides: crosswalk.guides,
    generatedAt: new Date().toISOString(),
    forms,
    grouped
  }
}
