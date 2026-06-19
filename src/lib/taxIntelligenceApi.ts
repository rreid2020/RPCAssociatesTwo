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
      const raw = text.trim()
      if (raw) {
        const compact = raw.replace(/\s+/g, ' ').slice(0, 220)
        throw new Error(compact)
      }
      throw new Error(`${res.status} ${res.statusText}`.trim() || 'Request failed')
    }
  }
  if (!text.trim()) return undefined as T
  return JSON.parse(text) as T
}

export type RequiredFormRegistryInfo = {
  formNumber: string
  title: string | null
  landingUrl: string | null
  status: string | null
  formFamily: string | null
  lastUpdate: string | null
  registryStatus: 'active' | 'archived' | 'not_indexed' | 'registry_unavailable'
}

export type RequiredFormItem = {
  formCode: string
  normalizedFormCode: string
  sources: string[]
  reasons: string[]
  requirementStatus: 'required'
  registry: RequiredFormRegistryInfo
}

export type RequiredFormsResponse = {
  taxReturnId: string
  taxYear: number
  taxpayerName: string
  generatedAt: string
  forms: RequiredFormItem[]
}

export type SlipSchemaTarget = {
  kind: 'income' | 'deduction'
  category: string
  description: string
  lineRef?: string
  scheduleRef?: string
  asWithholding?: boolean
}

export type SlipBoxSchema = {
  code: string
  label: string
  type: 'currency' | 'number'
  targets: SlipSchemaTarget[]
}

export type SlipSchema = {
  code: string
  name: string
  payerLabel: string
  slipKind: string
  schemaStatus: 'complete' | 'catalog_only' | 'partial'
  catalogTitle?: string
  taxYearsSupported?: number[]
  boxes: SlipBoxSchema[]
}

export type SlipSchemasResponse = {
  schemas: SlipSchema[]
}

export type DocumentExtractionRecord = {
  id: string
  document_id: string
  tax_return_id?: string | null
  extraction_status?: string
  confidence_score?: number
  review_required?: boolean
}

export type DocumentExtractResponse = {
  extraction: DocumentExtractionRecord | null
  previewOnly: boolean
  appliedToReturn: boolean
  reviewRequired: boolean
  confidence: number
  slipType: string
  boxes: Record<string, number>
  mappedEntries?: Array<{
    category: string
    description?: string | null
    amount: number
    metadata?: Record<string, unknown>
  }>
  ocrMethod?: string | null
  ocrWarning?: string | null
}

export type InterviewTopicItem = {
  id: string
  categoryId: string
  label: string
  description: string
  slipCodes: string[]
  formCodes: string[]
  linkedStep: 'Income' | 'Deductions' | 'Setup' | 'Review'
}

export type InterviewTopicCategory = {
  id: string
  title: string
  summary: string
  icon: string
  topics: InterviewTopicItem[]
}

export type InterviewTopicsResponse = {
  version: number
  categories: InterviewTopicCategory[]
}

export type ReturnInterviewTopicsResponse = InterviewTopicsResponse & {
  taxReturnId: string
  taxpayerName: string
  workspaceRole?: string
  selectedTopicIds: string[]
  resolvedSlipCodes: string[]
  resolvedFormCodes: string[]
  resolvedTopics: Array<{
    id: string
    label: string
    categoryId: string
    categoryTitle: string
  }>
  updatedAt: string | null
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
    email?: string
    mailingAddressLine1?: string
    mailingCity?: string
    mailingProvinceCode?: string
    mailingPostalCode?: string
    residenceProvinceDec31?: string
    languageCorrespondence?: 'en' | 'fr' | string
    electionsCanadianCitizen?: boolean | null
    electionsAuthorize?: boolean | null
    firstTimeFiler?: boolean | null
    soldPrincipalResidence?: boolean | null
    treatyExemptForeignService?: boolean | null
    foreignPropertyOver100k?: boolean | null
    organDonorConsent?: boolean | null
    craEmailNotificationsConsent?: boolean | null
    craEmailConfirmed?: boolean | null
    craHasForeignMailingAddress?: boolean | null
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
