import { portalFetch } from '../../lib/portalApi'

export type EvidenceAnnotation = {
  id: string
  evidence_link_id: string
  annotation_type: string
  content: Record<string, unknown>
  page_number: number | null
  rect: Record<string, unknown> | null
  created_by: string
  created_at: string
  updated_at: string
}

export async function fetchEvidenceAnnotationsDomain (getToken: () => Promise<string | null>, evidenceLinkId: string) {
  return portalFetch<{ annotations: EvidenceAnnotation[] }>(`/v1/accounting/evidence-links/${evidenceLinkId}/annotations`, getToken)
}

export async function createEvidenceAnnotationDomain (
  getToken: () => Promise<string | null>,
  evidenceLinkId: string,
  payload: {
    annotationType?: string
    content?: Record<string, unknown>
    pageNumber?: number | null
    rect?: Record<string, unknown> | null
  }
) {
  return portalFetch<{ annotation: EvidenceAnnotation }>(`/v1/accounting/evidence-links/${evidenceLinkId}/annotations`, getToken, {
    method: 'POST',
    body: JSON.stringify(payload || {})
  })
}

