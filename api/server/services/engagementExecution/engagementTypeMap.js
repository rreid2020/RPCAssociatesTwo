const ENGAGEMENT_TYPE_ALIASES = {
  year_end_working_papers: 'year_end_working_papers',
  review_engagement: 'review_support',
  compilation: 'compilation_support',
  tax_engagement: 'tax_support',
  audit: 'audit',
  other: 'custom',
  month_end_close: 'month_end_close',
  compilation_support: 'compilation_support',
  review_support: 'review_support',
  tax_support: 'tax_support',
  custom: 'custom'
}

export const SUPPORTED_ENGAGEMENT_TYPES = new Set(Object.values(ENGAGEMENT_TYPE_ALIASES))

export function normalizeEngagementTypeKey (value) {
  const raw = String(value || 'custom').trim().toLowerCase()
  return ENGAGEMENT_TYPE_ALIASES[raw] || raw
}

export function templateKeyForEngagementType (engagementType) {
  const normalized = normalizeEngagementTypeKey(engagementType)
  return `${normalized}-execution-v1`
}
