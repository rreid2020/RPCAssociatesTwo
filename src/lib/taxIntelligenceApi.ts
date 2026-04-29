import type { useAuth } from '@clerk/clerk-react'

type GetToken = ReturnType<typeof useAuth>['getToken']

export async function taxFetch<T> (
  path: string,
  getToken: GetToken,
  init: RequestInit = {}
): Promise<T> {
  const token = await getToken()
  if (!token) throw new Error('Not signed in')
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers
    }
  })
  const text = await res.text()
  if (!res.ok) {
    try {
      const parsed = JSON.parse(text)
      throw new Error(parsed.error || res.statusText)
    } catch {
      throw new Error(res.statusText || 'Request failed')
    }
  }
  if (!text.trim()) return undefined as T
  return JSON.parse(text) as T
}

export type TaxReturnSummary = {
  id: string
  tax_year: number
  status: string
  title: string
  province_code: string
  taxpayer_name: string
  updated_at: string
}
