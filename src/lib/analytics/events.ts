export interface AnalyticsEvent {
  name: string
  domain: 'marketing' | 'portal' | 'accounting' | 'tax' | 'integrations'
  workspaceId?: string
  engagementId?: string
  metadata?: Record<string, unknown>
}

export function trackAnalyticsEvent (event: AnalyticsEvent): void {
  // Vendor-neutral analytics hook for future provider adapters.
  console.log({
    type: 'analytics_event',
    timestamp: new Date().toISOString(),
    ...event
  })
}

