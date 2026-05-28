import { portalFetch } from '../../lib/portalApi'

export type LeadSheetSummary = {
  id: string
  section_code: string
  section_name: string
  status: string
  risk_level: string
  open_note_count?: number
  document_count?: number
}

export async function fetchLeadSheetsDomain (getToken: () => Promise<string | null>, engagementId: string) {
  return portalFetch<{ leadSheets: LeadSheetSummary[] }>(`/v1/accounting/engagements/${engagementId}/lead-sheets`, getToken)
}

export async function fetchLeadSheetDetailDomain (getToken: () => Promise<string | null>, engagementId: string, leadSheetId: string) {
  return portalFetch<any>(`/v1/accounting/engagements/${engagementId}/lead-sheets/${leadSheetId}`, getToken)
}

