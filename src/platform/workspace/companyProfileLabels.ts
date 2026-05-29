export function isAccountingFirmOrganization (
  businessType?: string | null,
  workspaceType?: string | null
): boolean {
  const normalizedBusinessType = String(businessType || '').trim().toLowerCase()
  if (normalizedBusinessType === 'accounting_firm') return true
  return String(workspaceType || '').trim().toLowerCase() === 'firm'
}

export function resolveEntityProfilesNavLabel (
  businessType?: string | null,
  workspaceType?: string | null
): string {
  return isAccountingFirmOrganization(businessType, workspaceType) ? 'Clients' : 'Corporate Entity Profiles'
}

export function resolveEntityProfileSingularLabel (
  businessType?: string | null,
  workspaceType?: string | null
): string {
  return isAccountingFirmOrganization(businessType, workspaceType) ? 'Client profile' : 'Corporate business entity profile'
}

export function resolveClientRecordLabel (
  businessType?: string | null,
  workspaceType?: string | null
): string {
  return isAccountingFirmOrganization(businessType, workspaceType) ? 'Accounting client' : 'Business entity'
}

export function resolveClientRecordLabelPlural (
  businessType?: string | null,
  workspaceType?: string | null
): string {
  return isAccountingFirmOrganization(businessType, workspaceType) ? 'Accounting clients' : 'Business entities'
}
