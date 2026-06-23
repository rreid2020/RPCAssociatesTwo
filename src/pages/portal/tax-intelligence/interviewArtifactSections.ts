import type { InterviewTopicItem, ReturnInterviewTopicsResponse } from '../../../lib/taxIntelligenceApi'

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

export type SectionSlipEntry = {
  slipCode: string
  label: string
  description: string
}

export function sectionSlipEntries (section: InterviewArtifactSection): SectionSlipEntry[] {
  const seen = new Map<string, SectionSlipEntry>()
  const items = [...section.items].sort((a, b) => {
    const aBundle = BUNDLE_TOPIC_IDS.has(a.topicId) ? 1 : 0
    const bBundle = BUNDLE_TOPIC_IDS.has(b.topicId) ? 1 : 0
    return aBundle - bBundle
  })
  for (const item of items) {
    for (const raw of item.slipCodes) {
      const slipCode = String(raw || '').trim().toUpperCase()
      if (!slipCode || seen.has(slipCode)) continue
      seen.set(slipCode, {
        slipCode,
        label: item.label,
        description: item.description
      })
    }
  }
  return Array.from(seen.values())
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
