export type OrganizationType = 'business' | 'firm'

export interface OrganizationSummary {
  id: string
  name: string
  organizationType: OrganizationType
}

