import type { InterviewTopicItem } from '../../../lib/taxIntelligenceApi'

export type InterviewWorkflowStep =
  | 'Identity'
  | 'Mailing'
  | 'Elections'
  | 'Spouse'
  | 'Dependents'
  | 'Interview'
  | 'Income'
  | 'Deductions'
  | 'Review'

export type InterviewTopicNavigationTarget = {
  step: InterviewWorkflowStep
  slipCode?: string
  deductionKey?: string
  focusAnchor?: string
}

const SETUP_TOPIC_STEP: Record<string, InterviewWorkflowStep> = {
  no_changes_prior_year: 'Identity',
  cra_autofill: 'Identity',
  immigrant_emigrant: 'Elections',
  bankrupt_taxpayer: 'Elections',
  deceased_taxpayer: 'Elections',
  legal_representative: 'Elections'
}

const TOPIC_DEDUCTION_KEY: Record<string, string> = {
  deduction_medical_expenses: 'medical_expenses',
  deduction_medical_bundle: 'medical_expenses',
  deduction_donations: 'donations',
  deduction_rrsp_bundle: 'rrsp',
  deduction_hbp: 'rrsp',
  deduction_llp: 'rrsp',
  deduction_fhsa: 'fhsa_deduction',
  family_childcare: 'child_care_expenses',
  other_moving: 'moving_expenses',
  student_t2202: 'tuition_amount',
  student_loans: 'tuition_amount',
  student_training_credit: 'tuition_amount',
  employment_expenses: 'union_dues'
}

const FORM_TO_DEDUCTION_KEY: Record<string, string> = {
  T778: 'child_care_expenses',
  'Schedule 7': 'rrsp',
  'Schedule 15': 'fhsa_deduction'
}

const BUNDLE_SLIP_TOPIC_IDS = new Set([
  'employment_income_bundle',
  'pension_income_bundle',
  'investment_income_bundle',
  'self_employment_bundle',
  'other_income_line_13000'
])

function normalizeSlipCode (value: string): string {
  return String(value || '').trim().toUpperCase()
}

function pickPrimaryFormCode (topic: InterviewTopicItem): string | undefined {
  const forms = (topic.formCodes || []).map(normalizeSlipCode).filter(Boolean)
  if (forms.length === 0) return undefined
  if (BUNDLE_SLIP_TOPIC_IDS.has(topic.id)) return undefined
  return forms[0]
}

function pickPrimarySlipCode (topic: InterviewTopicItem): string | undefined {
  const slips = (topic.slipCodes || []).map(normalizeSlipCode).filter(Boolean)
  if (slips.length === 0) return undefined
  if (BUNDLE_SLIP_TOPIC_IDS.has(topic.id)) return undefined
  if (slips.length === 1) return slips[0]
  const specific = slips.find((code) => !['T4A', 'T4A(P)', 'T4A(OAS)', 'T4A-RCA'].includes(code))
  return specific || slips[0]
}

export function resolveDeductionKeyForTopic (
  topicId: string,
  formCodes: string[] = []
): string | undefined {
  if (TOPIC_DEDUCTION_KEY[topicId]) return TOPIC_DEDUCTION_KEY[topicId]
  for (const formCode of formCodes) {
    const mapped = FORM_TO_DEDUCTION_KEY[formCode]
    if (mapped) return mapped
  }
  return undefined
}

function resolveDeductionKey (topic: InterviewTopicItem): string | undefined {
  return resolveDeductionKeyForTopic(topic.id, topic.formCodes || [])
}

export function resolveInterviewTopicNavigation (topic: InterviewTopicItem): InterviewTopicNavigationTarget {
  if (topic.linkedStep === 'Income') {
    return {
      step: 'Income',
      slipCode: pickPrimaryFormCode(topic) || pickPrimarySlipCode(topic),
      focusAnchor: 'rb-income-slips'
    }
  }

  if (topic.linkedStep === 'Deductions') {
    if (topic.id === 'family_support_payments' || topic.id === 'instalments_transfer') {
      return { step: 'Spouse', focusAnchor: 'rb-spouse' }
    }
    return {
      step: 'Deductions',
      deductionKey: resolveDeductionKey(topic),
      focusAnchor: 'rb-deductions'
    }
  }

  if (topic.linkedStep === 'Review') {
    return {
      step: 'Review',
      focusAnchor: topic.id.startsWith('carryforward') ? 'rb-required-forms' : 'rb-required-forms'
    }
  }

  const setupStep = SETUP_TOPIC_STEP[topic.id] || 'Elections'
  const focusAnchor = setupStep === 'Identity'
    ? 'rb-identity'
    : setupStep === 'Elections'
      ? 'rb-elections'
      : undefined

  return { step: setupStep, focusAnchor }
}

export function interviewTopicNavigationLabel (target: InterviewTopicNavigationTarget): string {
  if (target.step === 'Income' && target.slipCode) return `Open income entry for ${target.slipCode}`
  if (target.step === 'Deductions') return 'Open deductions entry'
  if (target.step === 'Review') return 'Open review and required forms'
  if (target.step === 'Elections') return 'Open CRA setup questions'
  if (target.step === 'Identity') return 'Open identification setup'
  if (target.step === 'Spouse') return 'Open spouse setup'
  return `Open ${target.step.toLowerCase()}`
}
