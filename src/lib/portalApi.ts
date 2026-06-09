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

const inflightGetRequests = new Map<string, Promise<unknown>>()
const stableGetCache = new Map<string, { at: number; data: unknown }>()
const failedGetCache = new Map<string, number>()
const FAILED_GET_COOLDOWN_MS = 20_000

function getStableCacheTtlMs (path: string): number | null {
  if (path === '/v1/accounting/members' || path === '/v1/accounting/clients') return 60_000
  if (path.startsWith('/v1/accounting/engagements/') && path.endsWith('/review-notes')) return 30_000
  return null
}

function shouldBypassPortalCache (init: RequestInit): boolean {
  const headers = init.headers
  if (!headers) return false
  if (headers instanceof Headers) {
    return headers.get('X-Portal-Cache-Bypass') === '1'
  }
  const record = headers as Record<string, string>
  return record['X-Portal-Cache-Bypass'] === '1'
}

function isTransientGatewayMessage (message: string): boolean {
  const lower = String(message || '').toLowerCase()
  return lower.includes('took too long to respond') || lower.includes('temporarily unavailable')
}

export function invalidatePortalFetchCache (prefix = ''): void {
  if (!prefix) {
    stableGetCache.clear()
    failedGetCache.clear()
    return
  }
  for (const key of stableGetCache.keys()) {
    if (key.startsWith(prefix)) stableGetCache.delete(key)
  }
  for (const key of failedGetCache.keys()) {
    if (key.includes(prefix)) failedGetCache.delete(key)
  }
}

function isDeadlockMessage (errorMessage: string): boolean {
  return String(errorMessage || '').toLowerCase().includes('deadlock detected')
}

export function isPortalRequestAborted (error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return error.name === 'AbortError' || error.message === 'The user aborted a request.'
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
  if (typeof getToken !== 'function') {
    throw new Error('Authentication is not ready. Refresh the page and sign in again.')
  }
  const token = await getToken()
  if (!token) {
    throw new Error('Not signed in')
  }

  const method = String(init.method || 'GET').toUpperCase()
  const dedupeKey = method === 'GET' && !init.body ? `${method}:${path}` : null
  const cacheTtlMs = dedupeKey && !shouldBypassPortalCache(init) ? getStableCacheTtlMs(path) : null

  if (dedupeKey && !shouldBypassPortalCache(init)) {
    const failedAt = failedGetCache.get(dedupeKey)
    if (failedAt && Date.now() - failedAt < FAILED_GET_COOLDOWN_MS) {
      throw new Error('The server took too long to respond. Please retry in a moment.')
    }
  }

  if (cacheTtlMs && dedupeKey) {
    const cached = stableGetCache.get(dedupeKey)
    if (cached && Date.now() - cached.at < cacheTtlMs) {
      return cached.data as T
    }
  }

  const request = async (): Promise<T> => {
    const res = await fetch(`${getApiPrefix()}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...init.headers
      }
    })
    const text = await res.text()
    if (!res.ok) {
      let err = res.statusText
      if (res.status === 504) {
        err = 'The server took too long to respond. Please retry in a moment.'
      } else if (res.status === 503) {
        err = 'The server is temporarily unavailable. Please retry in a moment.'
      }
      try {
        const j = parseJsonBody<{ error?: string }>(text, false)
        if (j.error) err = j.error
      } catch (e) {
        if (e instanceof Error && e.message === htmlInsteadOfJsonHint) {
          err = res.status === 504 || res.status === 503
            ? err
            : e.message
        }
      }
      throw new Error(err)
    }
    if (res.status === 204) {
      return undefined as T
    }
    return parseJsonBody<T>(text, false)
  }

  const execute = async (): Promise<T> => {
    try {
      const data = await request()
      if (cacheTtlMs && dedupeKey) {
        stableGetCache.set(dedupeKey, { at: Date.now(), data })
      }
      return data
    } catch (error) {
      if (isPortalRequestAborted(error)) {
        throw error
      }
      const message = error instanceof Error ? error.message : String(error)
      if (dedupeKey && isTransientGatewayMessage(message)) {
        failedGetCache.set(dedupeKey, Date.now())
      }
      const shouldRetryTransient = isDeadlockMessage(message) ||
        message.toLowerCase().includes('temporary database conflict')
      if (shouldRetryTransient) {
        await new Promise((resolve) => setTimeout(resolve, 120))
        return await request()
      }
      throw error
    }
  }

  if (!dedupeKey) {
    return await execute()
  }

  const existing = inflightGetRequests.get(dedupeKey)
  if (existing) {
    return await existing as Promise<T>
  }

  const pending = execute().finally(() => {
    if (inflightGetRequests.get(dedupeKey) === pending) {
      inflightGetRequests.delete(dedupeKey)
    }
  })
  inflightGetRequests.set(dedupeKey, pending)
  return await pending
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

export function getTaxgptWebUrl (): string {
  return (import.meta.env.VITE_TAXGPT_WEB_URL as string) || ''
}
