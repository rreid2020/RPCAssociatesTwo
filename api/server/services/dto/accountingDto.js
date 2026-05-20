export function toWorkspaceSummaryDto (row) {
  return {
    id: row.id,
    name: row.name,
    workspace_type: row.workspace_type || 'business',
    role: row.role || null
  }
}

export function toEngagementSummaryDto (row) {
  return {
    id: row.id,
    client_id: row.client_id,
    name: row.name,
    status: row.status,
    period_end: row.period_end
  }
}

