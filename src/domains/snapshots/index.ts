import { portalFetch } from '../../lib/portalApi'

export type EngagementSnapshot = {
  id: string
  snapshot_label: string
  snapshot_type: string
  source_state: string | null
  created_by: string
  created_at: string
}

export async function fetchEngagementSnapshotsDomain (getToken: () => Promise<string | null>, engagementId: string) {
  return portalFetch<{ snapshots: EngagementSnapshot[] }>(`/v1/accounting/engagements/${engagementId}/snapshots`, getToken)
}

export async function createEngagementSnapshotDomain (
  getToken: () => Promise<string | null>,
  engagementId: string,
  payload: { snapshotLabel?: string, snapshotType?: string, sourceState?: string } = {}
) {
  return portalFetch<{ snapshot: EngagementSnapshot }>(`/v1/accounting/engagements/${engagementId}/snapshots`, getToken, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

