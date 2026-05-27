import { portalFetch } from '../../lib/portalApi'

export type WorkingPaperTreeResponse = {
  engagement: Record<string, unknown>
  sections: Array<Record<string, unknown>>
}

export async function fetchWorkingPaperTreeDomain (getToken: () => Promise<string | null>, engagementId: string) {
  return portalFetch<WorkingPaperTreeResponse>(`/v1/accounting/engagements/${engagementId}/working-paper-tree`, getToken)
}

