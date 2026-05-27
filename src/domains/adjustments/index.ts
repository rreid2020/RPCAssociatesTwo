import { portalFetch } from '../../lib/portalApi'

export type AdjustmentEntry = {
  id: string
  entry_number: string
  description: string
  status: string
  created_at: string
}

export async function fetchAdjustmentsDomain (getToken: () => Promise<string | null>, engagementId: string) {
  return portalFetch<{ entries: AdjustmentEntry[] }>(`/v1/accounting/engagements/${engagementId}/adjustments`, getToken)
}

