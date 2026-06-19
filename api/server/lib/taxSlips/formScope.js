/**
 * Return Builder scope: personal T1 income tax and benefit returns only.
 * Corporate (T2), trust returns, GST/HST business returns, and partnership
 * admin schedules are out of scope for slip entry and T1 required-forms inference.
 *
 * CRA T1 package index:
 * https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-years/general-income-tax-benefit-package.html
 */

export const RETURN_BUILDER_DOMAIN = 't1_personal'

/** Known personal information slip codes (CRA "Statement of …" slips for T1 filers). */
export const PERSONAL_INFORMATION_SLIP_CODES = new Set([
  'T4', 'T4A', 'T4E', 'T4EQ', 'T4FHSA', 'T4PS', 'T4RIF', 'T4RSP', 'T4A-RCA', 'T4A-NR',
  'T4AOAS', 'T4A(OAS)', 'T4AP', 'T4A(P)',
  'T5', 'T3', 'T5007', 'T5008', 'T5013', 'T5018', 'T2202', 'NR4', 'NR4OAS',
  'RC62', 'AGR-1', 'T1198', 'T1212', 'T737-RCA', 'RC71',
  'RL1', 'RL-1', 'RL2', 'RL-2', 'RL3', 'RL-3', 'RL5', 'RL-5', 'RL6', 'RL-6'
])

const CORPORATE_FORM_PREFIXES = [/^T2/, /^CT/, /^CO17/]
const TRUST_RETURN_TITLE_PATTERNS = [
  /trust income tax return/i,
  /return for trusts/i,
  /filing information return/i
]
const PARTNERSHIP_ADMIN_PATTERNS = [
  /^T5013FIN$/i,
  /^T5013SCH/i,
  /^T5013-1$/i,
  /^T5013SUM$/i,
  /partnership financial return/i,
  /gifi/i,
  /net income \(loss\) for income tax purposes/i
]
const CORPORATE_TITLE_PATTERNS = [
  /corporation income tax/i,
  /corporate income tax/i,
  /T2 corporation/i,
  /co-17/i
]
const GST_BUSINESS_RETURN_PATTERNS = [
  /^GST34/i,
  /^GST62/i,
  /^GST63/i,
  /^GST66/i,
  /^GST495/i
]

/** T4#### provincial credits and unrelated T4-prefixed forms — not employment slips. */
const T4_NON_SLIP_PATTERN = /^T4\d{3,}/

const PERSONAL_SLIP_TITLE_PATTERN = /^statement of /i

export function normalizeFormNumber (value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '')
}

export function isPersonalInformationSlip (formNumber, title = '') {
  const code = normalizeFormNumber(formNumber)
  const normalizedTitle = String(title || '').trim()
  if (!code) return false
  if (PERSONAL_INFORMATION_SLIP_CODES.has(code)) return true
  if (/\(slip\)/i.test(normalizedTitle)) return true
  if (PERSONAL_SLIP_TITLE_PATTERN.test(normalizedTitle) && !/summary/i.test(normalizedTitle)) {
    if (isOutOfScopeForm(code, normalizedTitle)) return false
    return true
  }
  if (code === 'T4' || code === 'T4A' || code === 'T4E') return true
  if (/^T4[A-Z(\-]/.test(code) && !T4_NON_SLIP_PATTERN.test(code) && !/-SUM$/.test(code) && !/SUM$/.test(code)) {
    return true
  }
  if (/^T5/.test(code) && !/-SUM$/.test(code) && !/SUM$/.test(code)) return true
  if (code === 'T3' && /statement of trust income/i.test(normalizedTitle)) return true
  if (code === 'T3' && !TRUST_RETURN_TITLE_PATTERNS.some((p) => p.test(normalizedTitle))) return true
  if (/^RL\d$/.test(code) || /^RL-\d$/.test(code)) return true
  return false
}

export function isOutOfScopeForm (formNumber, title = '') {
  const code = normalizeFormNumber(formNumber)
  const normalizedTitle = String(title || '').trim()
  if (!code) return true

  if (CORPORATE_FORM_PREFIXES.some((p) => p.test(code))) return true
  if (CORPORATE_TITLE_PATTERNS.some((p) => p.test(normalizedTitle))) return true
  if (TRUST_RETURN_TITLE_PATTERNS.some((p) => p.test(normalizedTitle))) return true
  if (PARTNERSHIP_ADMIN_PATTERNS.some((p) => p.test(code) || p.test(normalizedTitle))) return true
  if (GST_BUSINESS_RETURN_PATTERNS.some((p) => p.test(code))) return true
  if (T4_NON_SLIP_PATTERN.test(code)) return true
  if (/^T5013FIN$/i.test(code)) return true
  if (/^T5013SCH/i.test(code)) return true

  return false
}

export function classifyReturnBuilderArtifact (formNumber, title = '', landingUrl = '') {
  const code = normalizeFormNumber(formNumber)
  const normalizedTitle = String(title || '').trim()
  const url = String(landingUrl || '').toLowerCase()

  if (isOutOfScopeForm(code, normalizedTitle)) {
    if (CORPORATE_FORM_PREFIXES.some((p) => p.test(code)) || CORPORATE_TITLE_PATTERNS.some((p) => p.test(normalizedTitle))) {
      return { domain: 'corporate', artifactKind: 'out_of_scope', returnBuilderEligible: false }
    }
    if (TRUST_RETURN_TITLE_PATTERNS.some((p) => p.test(normalizedTitle))) {
      return { domain: 'trust_return', artifactKind: 'out_of_scope', returnBuilderEligible: false }
    }
    if (PARTNERSHIP_ADMIN_PATTERNS.some((p) => p.test(code) || p.test(normalizedTitle))) {
      return { domain: 'partnership_admin', artifactKind: 'out_of_scope', returnBuilderEligible: false }
    }
    return { domain: 'other', artifactKind: 'out_of_scope', returnBuilderEligible: false }
  }

  if (isPersonalInformationSlip(code, normalizedTitle)) {
    return { domain: RETURN_BUILDER_DOMAIN, artifactKind: 'information_slip', returnBuilderEligible: true }
  }

  if (/tax-packages-years/i.test(url) && /5000-s\d|5005-s\d|5009-s\d|5014-s\d/i.test(url)) {
    return { domain: RETURN_BUILDER_DOMAIN, artifactKind: 't1_schedule', returnBuilderEligible: true }
  }
  if (/^SCHEDULE\s*\d/i.test(code) || /^SCHEDULE\d+$/i.test(code) || /^5000-S/i.test(code) || /^5005-S/i.test(code)) {
    return { domain: RETURN_BUILDER_DOMAIN, artifactKind: 't1_schedule', returnBuilderEligible: true }
  }

  if (/5000-d1|federal worksheet/i.test(url) || /federal worksheet/i.test(normalizedTitle)) {
    return { domain: RETURN_BUILDER_DOMAIN, artifactKind: 't1_worksheet', returnBuilderEligible: true }
  }

  if (/^T\d/i.test(code) || /^RC\d/i.test(code) || /^NR\d/i.test(code)) {
    return { domain: RETURN_BUILDER_DOMAIN, artifactKind: 't1_form', returnBuilderEligible: true }
  }

  if (/publications\//i.test(url) && /guide/i.test(normalizedTitle)) {
    return { domain: RETURN_BUILDER_DOMAIN, artifactKind: 't1_guide', returnBuilderEligible: false }
  }

  return { domain: 'other', artifactKind: 'other', returnBuilderEligible: false }
}

/** Maps Return Builder classification to taxgpt.form_registry form_family values. */
export function classifyFormRegistryFamily (formNumber, title = '') {
  const code = normalizeFormNumber(formNumber)
  const normalizedTitle = String(title || '').trim()
  if (/^T1/.test(code) || /^SCH\d/.test(code) || /^5000-/.test(code) || /^5005-/.test(code)) return 't1'
  if (/^T2/.test(code)) return 'corporate'
  if (/^T3/.test(code)) {
    if (/statement of trust income/i.test(normalizedTitle) || /\(slip\)/i.test(normalizedTitle)) return 't1'
    if (TRUST_RETURN_TITLE_PATTERNS.some((p) => p.test(normalizedTitle))) return 'trust'
    return 't1'
  }
  if (/^RL\d$/.test(code)) return 't1'
  if (/^RC/.test(code)) return 'rc'
  if (/^GST/.test(code) || /^B\d/.test(code)) return 'gst'
  if (/^NR/.test(code)) return 'non_resident'
  if (/^UHT/.test(code)) return 'uht'
  if (isOutOfScopeForm(code, normalizedTitle)) {
    if (CORPORATE_FORM_PREFIXES.some((p) => p.test(code)) || CORPORATE_TITLE_PATTERNS.some((p) => p.test(normalizedTitle))) return 'corporate'
    if (TRUST_RETURN_TITLE_PATTERNS.some((p) => p.test(normalizedTitle))) return 'trust'
  }
  if (isPersonalInformationSlip(code, normalizedTitle)) return 't1'
  if (/^T\d/i.test(code) || /^SCHEDULE/i.test(code)) return 't1'
  return 'other'
}
