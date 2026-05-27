import { portalFetch } from '../../lib/portalApi'

export type ReviewNote = {
  id: string
  priority: string
  status: string
  note_text: string
}

export async function fetchReviewNotesDomain (getToken: () => Promise<string | null>, engagementId: string) {
  return portalFetch<{ notes: ReviewNote[] }>(`/v1/accounting/engagements/${engagementId}/review-notes`, getToken)
}

