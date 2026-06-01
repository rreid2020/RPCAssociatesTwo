import { syncOrganizationEmployeeFromClerkEvent } from './accountingWorkspaceService.js'

export async function syncClerkMembershipEvent (pool, payload = {}, options = {}) {
  return syncOrganizationEmployeeFromClerkEvent(pool, payload, options)
}
