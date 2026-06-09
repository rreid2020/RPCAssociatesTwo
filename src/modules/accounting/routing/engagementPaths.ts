const ENGAGEMENT_ROUTE_SEGMENT = '/portal/accounting/working-papers/engagements/'

export const RESERVED_ENGAGEMENT_PATH_SEGMENTS = new Set([
  'new',
  'execution',
  'trial-balance',
  'datasets',
  'lead-sheets',
  'documents',
  'review',
  'adjustments',
  'settings'
])

export function parseEngagementIdFromPathname (pathname: string): string | null {
  const markerIndex = pathname.indexOf(ENGAGEMENT_ROUTE_SEGMENT)
  if (markerIndex < 0) return null
  const remainder = pathname.slice(markerIndex + ENGAGEMENT_ROUTE_SEGMENT.length)
  const segment = remainder.split('/').filter(Boolean)[0] || ''
  if (!segment || RESERVED_ENGAGEMENT_PATH_SEGMENTS.has(segment)) return null
  return decodeURIComponent(segment)
}

export function buildEngagementBasePath (engagementId: string): string {
  return `${ENGAGEMENT_ROUTE_SEGMENT}${encodeURIComponent(engagementId)}`
}

export function buildEngagementSubPath (engagementId: string, segment: string): string {
  const normalizedSegment = String(segment || '').replace(/^\//, '')
  return `${buildEngagementBasePath(engagementId)}/${normalizedSegment}`
}
