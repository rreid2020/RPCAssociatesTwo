/**
 * JSON API for the Express `/api/portal` routes. Uses Clerk session token.
 * Dev: Vite proxies `/api/portal` to the local API. Prod: same-origin or set `VITE_API_BASE_URL`.
 */
function getApiPrefix (): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || ''
  return base ? `${base}/api/portal` : '/api/portal'
}

function parseJson<T> (r: Response): Promise<T> {
  return r.json() as Promise<T>
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
  if (!res.ok) {
    let err = res.statusText
    try {
      const j = await res.json() as { error?: string }
      if (j.error) err = j.error
    } catch { /* empty */ }
    throw new Error(err)
  }
  if (res.status === 204) {
    return undefined as T
  }
  return parseJson<T>(res)
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
