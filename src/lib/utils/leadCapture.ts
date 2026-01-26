/**
 * Utility functions for lead capture and resource access control
 */

export interface LeadData {
  firstName: string
  lastName: string
  companyName: string
  email: string
  businessPhone: string
  businessType: string
  businessOwnerStatus: string
  speakToAdvisor: boolean
  marketingConsent: boolean
  resourceName: string
  submittedAt: string
}

/**
 * Check if user has already accessed a resource
 */
export const hasAccessedResource = (resourceName: string): boolean => {
  if (typeof window === 'undefined') return false
  
  try {
    const accessedResources = JSON.parse(
      localStorage.getItem('rpc_accessed_resources') || '[]'
    )
    return accessedResources.includes(resourceName)
  } catch {
    return false
  }
}

/**
 * Mark a resource as accessed
 */
export const markResourceAsAccessed = (resourceName: string): void => {
  if (typeof window === 'undefined') return
  
  try {
    const accessedResources = JSON.parse(
      localStorage.getItem('rpc_accessed_resources') || '[]'
    )
    if (!accessedResources.includes(resourceName)) {
      accessedResources.push(resourceName)
      localStorage.setItem(
        'rpc_accessed_resources',
        JSON.stringify(accessedResources)
      )
    }
  } catch (error) {
    console.error('Error marking resource as accessed:', error)
  }
}

/**
 * Get all captured leads (for admin/debugging purposes)
 */
export const getAllLeads = (): LeadData[] => {
  if (typeof window === 'undefined') return []
  
  try {
    return JSON.parse(localStorage.getItem('rpc_leads') || '[]')
  } catch {
    return []
  }
}

/**
 * Export leads as CSV (for admin use)
 */
export const exportLeadsAsCSV = (): string => {
  const leads = getAllLeads()
  
  if (leads.length === 0) {
    return 'No leads found'
  }

  const headers = [
    'First Name',
    'Last Name',
    'Company Name',
    'Email',
    'Business Phone',
    'Business Type',
    'Business Owner Status',
    'Speak to Advisor',
    'Marketing Consent',
    'Resource Name',
    'Submitted At',
  ]

  const rows = leads.map((lead) => [
    lead.firstName,
    lead.lastName,
    lead.companyName,
    lead.email,
    lead.businessPhone,
    lead.businessType,
    lead.businessOwnerStatus,
    lead.speakToAdvisor ? 'Yes' : 'No',
    lead.marketingConsent ? 'Yes' : 'No',
    lead.resourceName,
    lead.submittedAt,
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}
