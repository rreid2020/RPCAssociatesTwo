import type { InterviewTopicItem, ReturnInterviewTopicsResponse } from '../../../lib/taxIntelligenceApi'
import { canonicalSlipCode } from './slipCodeCanonical'

export const INTERVIEW_CATEGORY_ICONS: Record<string, string> = {
  specific_situations: '👥',
  other_income: '💵',
  other_t_slips: '📄',
  employment: '💼',
  pension: '🪙',
  rental: '🏠',
  investment: '📈',
  self_employment: '🧑‍💼',
  student: '🎓',
  deductions: '✂️',
  retirement_plans: '🏦',
  family: '👨‍👩‍👧',
  instalments: '🔄',
  other: '📁',
  carryforward: '↩️'
}

export type InterviewArtifactItem = {
  topicId: string
  label: string
  description: string
  slipCodes: string[]
  formCodes: string[]
  linkedStep: InterviewTopicItem['linkedStep']
}

export type InterviewArtifactSection = {
  id: string
  title: string
  summary: string
  icon: string
  items: InterviewArtifactItem[]
}

const BUNDLE_TOPIC_IDS = new Set([
  'employment_income_bundle',
  'pension_income_bundle',
  'investment_income_bundle',
  'self_employment_bundle',
  'other_income_line_13000'
])

/** Slips that may accompany a schedule topic but are not separate entry tabs when a form is selected. */
const SUPPORTING_SLIP_CODES = new Set(['T4A', 'T5018', 'AGR-1', 'RL6'])

function normalizeArtifactCode (value: string): string {
  return String(value || '').trim().toUpperCase()
}

export function shouldIncludeTopicSlipCodes (item: Pick<InterviewArtifactItem, 'topicId' | 'slipCodes' | 'formCodes'>): boolean {
  if (BUNDLE_TOPIC_IDS.has(item.topicId)) return true
  const forms = (item.formCodes || []).map(normalizeArtifactCode).filter(Boolean)
  const slips = (item.slipCodes || []).map(normalizeArtifactCode).filter(Boolean)
  if (forms.length === 0) return slips.length > 0
  if (slips.length === 0) return false
  return !slips.every((code) => SUPPORTING_SLIP_CODES.has(code))
}

export function topicArtifactDisplayCodes (
  item: Pick<InterviewArtifactItem, 'topicId' | 'slipCodes' | 'formCodes'>
): string[] {
  const forms = (item.formCodes || []).map((code) => String(code || '').trim()).filter(Boolean)
  const slips = (item.slipCodes || []).map((code) => String(code || '').trim()).filter(Boolean)
  if (BUNDLE_TOPIC_IDS.has(item.topicId)) {
    return [...slips, ...forms]
  }
  if (!shouldIncludeTopicSlipCodes(item)) {
    return forms
  }
  const formSet = new Set(forms.map(normalizeArtifactCode))
  return [
    ...slips.filter((code) => !formSet.has(normalizeArtifactCode(code))),
    ...forms
  ]
}

export function pickTopicSlipCode (item: InterviewArtifactItem): string | undefined {
  const slips = item.slipCodes.map((code) => String(code || '').trim().toUpperCase()).filter(Boolean)
  if (slips.length === 0) return undefined
  if (BUNDLE_TOPIC_IDS.has(item.topicId)) return undefined
  if (slips.length === 1) return slips[0]
  const specific = slips.find((code) => !['T4A', 'T4A(P)', 'T4A(OAS)', 'T4A-RCA'].includes(code))
  return specific || slips[0]
}

export function sectionSlipCodes (section: InterviewArtifactSection | null | undefined): Set<string> {
  const codes = new Set<string>()
  if (!section) return codes
  for (const entry of sectionSlipEntries(section)) {
    codes.add(entry.slipCode)
  }
  return codes
}

export type SectionArtifactKind = 'slip' | 'form'

export type SectionSlipEntry = {
  slipCode: string
  label: string
  description: string
  entryKind: SectionArtifactKind
}

function addSectionArtifactEntry (
  seen: Map<string, SectionSlipEntry>,
  code: string,
  item: InterviewArtifactItem,
  entryKind: SectionArtifactKind
) {
  const slipCode = canonicalSlipCode(code)
  if (!slipCode || seen.has(slipCode)) return
  seen.set(slipCode, {
    slipCode,
    label: item.label,
    description: item.description,
    entryKind
  })
}

export function sectionSlipEntries (section: InterviewArtifactSection): SectionSlipEntry[] {
  const forms = new Map<string, SectionSlipEntry>()
  const slips = new Map<string, SectionSlipEntry>()
  const items = [...section.items].sort((a, b) => {
    const aBundle = BUNDLE_TOPIC_IDS.has(a.topicId) ? 1 : 0
    const bBundle = BUNDLE_TOPIC_IDS.has(b.topicId) ? 1 : 0
    return aBundle - bBundle
  })
  for (const item of items) {
    for (const raw of item.formCodes || []) {
      const formCode = normalizeArtifactCode(raw)
      addSectionArtifactEntry(forms, formCode, item, 'form')
    }
    if (!shouldIncludeTopicSlipCodes(item)) continue
    for (const raw of item.slipCodes || []) {
      const slipCode = canonicalSlipCode(raw)
      if (forms.has(slipCode)) continue
      addSectionArtifactEntry(slips, slipCode, item, 'slip')
    }
  }
  return [...forms.values(), ...slips.values()]
}

export function buildInterviewArtifactSections (
  interview: ReturnInterviewTopicsResponse | null | undefined,
  linkedSteps: InterviewTopicItem['linkedStep'][]
): InterviewArtifactSection[] {
  if (!interview) return []
  const allowed = new Set(linkedSteps)
  const selected = new Set(interview.selectedTopicIds || [])

  return (interview.categories || [])
    .map((category) => {
      const items: InterviewArtifactItem[] = category.topics
        .filter((topic) => selected.has(topic.id) && allowed.has(topic.linkedStep))
        .map((topic) => ({
          topicId: topic.id,
          label: topic.label,
          description: topic.description,
          slipCodes: topic.slipCodes || [],
          formCodes: topic.formCodes || [],
          linkedStep: topic.linkedStep
        }))
      return {
        id: category.id,
        title: category.title,
        summary: category.summary,
        icon: INTERVIEW_CATEGORY_ICONS[category.id] || category.icon,
        items
      }
    })
    .filter((section) => section.items.length > 0)
}

export function countSectionSlipsAdded (
  section: InterviewArtifactSection,
  addedSlipCodes: Set<string>
): number {
  const sectionCodes = sectionSlipCodes(section)
  let count = 0
  for (const code of sectionCodes) {
    if (addedSlipCodes.has(code)) count += 1
  }
  return count
}
