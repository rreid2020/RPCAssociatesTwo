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
