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
  workspace_role?: 'primary' | 'spouse' | 'dependent' | string
  parent_tax_return_id?: string | null
  related_person_name?: string | null
  interview_stage?: string | null
  title: string
  province_code: string
  taxpayer_name: string
  taxpayer_first_name?: string | null
  taxpayer_last_name?: string | null
  taxpayer_sin?: string | null
  taxpayer_date_of_birth?: string | null
  taxpayer_profile?: {
    maritalStatus?: string
    spouseReturnMode?: string
    mailingAddressLine1?: string
    mailingCity?: string
    mailingProvinceCode?: string
    mailingPostalCode?: string
    residenceProvinceDec31?: string
    electionsCanadianCitizen?: boolean | null
    electionsAuthorize?: boolean | null
    foreignPropertyOver100k?: boolean | null
    spouse?: {
      fullName?: string
      firstName?: string
      lastName?: string
      dateOfBirth?: string | null
      fullSin?: string
    }
  }
  updated_at: string
}
