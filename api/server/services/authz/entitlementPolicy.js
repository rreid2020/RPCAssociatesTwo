import { getWorkspaceEntitlements } from '../orchestrators/billingOrchestrator.js'

export async function assertWorkspaceEntitlement ({ pool, workspaceId, entitlementKey }) {
  const entitlements = await getWorkspaceEntitlements(pool, workspaceId)
  const checks = {
    workingPapers: Boolean(entitlements.can_access_working_papers),
    integrations: Boolean(entitlements.can_use_qbo_integration || entitlements.can_use_google_sheets_integration),
    taxgpt: Boolean(entitlements.can_access_taxgpt)
  }
  if (!checks[entitlementKey]) {
    throw new Error(`Entitlement denied: ${entitlementKey}`)
  }
  return entitlements
}
