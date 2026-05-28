import { trackAnalyticsEvent } from './analytics/events'

/**
 * JSON API for the Express `/api/portal` routes. Uses Clerk session token.
 *
 * Local dev: run the API (e.g. `npm start` in api/server) so Vite can proxy `/api` to port 3000.
 * Production: the browser must call an origin that actually serves `/api/portal` (e.g. App Platform
 * with an `/api` service), OR set VITE_API_BASE_URL to the full API site origin (no path), e.g.
 * `https://your-api.ondigitalocean.app`, and allow that CORS origin on the API.
 */
function getApiPrefix (): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || ''
  return base ? `${base}/api/portal` : '/api/portal'
}

const htmlInsteadOfJsonHint =
  'The app received a web page instead of API data. The portal API must be reachable at /api (same host) or set VITE_API_BASE_URL to your API origin at build time, with CORS enabled on the API.'

export const ACCOUNTING_WORKSPACE_STORAGE_KEY = 'accounting:selectedWorkspaceId'

function getSelectedAccountingWorkspaceId (): string | null {
  if (typeof window === 'undefined') return null
  const id = window.localStorage.getItem(ACCOUNTING_WORKSPACE_STORAGE_KEY)
  return id && id.trim() ? id.trim() : null
}

function clearSelectedAccountingWorkspaceId () {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(ACCOUNTING_WORKSPACE_STORAGE_KEY)
}

function emitWorkspaceRecoveryTelemetry (reason: string, workspaceId: string | null) {
  trackAnalyticsEvent({
    name: 'workspace_context_recovered',
    domain: 'portal',
    workspaceId: workspaceId || undefined,
    metadata: { reason }
  })
}

function shouldRetryWithoutWorkspaceHeader (errorMessage: string): boolean {
  const message = String(errorMessage || '').toLowerCase()
  return message.includes('workspace access denied') || message.includes('workspace not found') || message === 'forbidden'
}

function parseJsonBody<T> (text: string, allowEmpty: boolean): T {
  const t = text.trim()
  if (!t) {
    if (allowEmpty) return undefined as T
    throw new Error('Empty response from server.')
  }
  if (t.startsWith('<!') || t.toLowerCase().includes('<html')) {
    throw new Error(htmlInsteadOfJsonHint)
  }
  try {
    return JSON.parse(t) as T
  } catch {
    throw new Error('Server response was not valid JSON. Confirm the portal API is deployed and the request URL is correct.')
  }
}

export async function portalFetch<T> (
  path: string,
  getToken: () => Promise<string | null>,
  init: RequestInit = {}
): Promise<T> {
  const token = await getToken()
  if (!token) {
    throw new Error('Not signed in')
  }
  const run = async (workspaceId: string | null): Promise<T> => {
    const res = await fetch(`${getApiPrefix()}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(workspaceId ? { 'x-accounting-workspace-id': workspaceId } : {}),
        ...init.headers
      }
    })
    const text = await res.text()
    if (!res.ok) {
      let err = res.statusText
      try {
        const j = parseJsonBody<{ error?: string }>(text, false)
        if (j.error) err = j.error
      } catch (e) {
        if (e instanceof Error && e.message === htmlInsteadOfJsonHint) err = e.message
      }
      throw new Error(err)
    }
    if (res.status === 204) {
      return undefined as T
    }
    return parseJsonBody<T>(text, false)
  }

  const selectedWorkspaceId = getSelectedAccountingWorkspaceId()
  try {
    return await run(selectedWorkspaceId)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (selectedWorkspaceId && shouldRetryWithoutWorkspaceHeader(message)) {
      emitWorkspaceRecoveryTelemetry(message, selectedWorkspaceId)
      clearSelectedAccountingWorkspaceId()
      return await run(null)
    }
    throw error
  }
}

export type PortalDashboard = {
  counts: { openItems: number; upcomingDeadlines: number; activeProjects: number }
  openItems: Array<{
    id: string
    title: string
    description: string | null
    status: string
    due_at: string | null
    updated_at: string
  }>
  deadlines: Array<{ id: string; title: string; due_at: string; category: string | null }>
  recentActivity: Array<{ id: string; kind: string; title: string; body: string | null; created_at: string }>
}

