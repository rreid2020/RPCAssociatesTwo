/**
 * Digital Ocean Spaces Configuration
 * 
 * Base URL for files hosted on Digital Ocean Spaces.
 * If CDN is enabled, use the CDN endpoint instead of the origin endpoint.
 * 
 * Format: https://{space-name}.{region}.digitaloceanspaces.com
 * CDN Format: https://{space-name}.{region}.cdn.digitaloceanspaces.com
 */

// Base URL for Digital Ocean Spaces
// Update this if you're using CDN: replace 'digitaloceanspaces.com' with 'cdn.digitaloceanspaces.com'
export const DO_SPACES_BASE_URL = 'https://rpc-associates-space.tor1.digitaloceanspaces.com'

// Public resources path
export const DO_SPACES_PUBLIC_PATH = '/public/resources'

/**
 * Get the full URL for a file in Digital Ocean Spaces
 * @param filePath - Path relative to the space root (e.g., '/public/resources/guides/file.pdf')
 * @returns Full URL to the file
 */
export const getSpacesUrl = (filePath: string): string => {
  // Ensure filePath starts with /
  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`
  return `${DO_SPACES_BASE_URL}${normalizedPath}`
}

/**
 * Predefined file paths for commonly used resources
 */
export const SPACES_FILES = {
  cashFlowTemplate: getSpacesUrl('/public/resources/excel-templates/RPC Cash Flow Statement.xlsx'),
  icfmIcfrOrderToCash: getSpacesUrl('/public/resources/excel-templates/icfm-icfr/ICFR_P~1.XLS'),
  icfmIcfrProcureToPay: getSpacesUrl('/public/resources/excel-templates/icfm-icfr/ICFR_P~2.XLS'),
  icfmIcfrPayroll: getSpacesUrl('/public/resources/excel-templates/icfm-icfr/ICFR_P~3.XLS'),
  icfmIcfrFinancialCloseReporting: getSpacesUrl('/public/resources/excel-templates/icfm-icfr/ICFR_P~4.XLS'),
  icfmIcfrFixedAssets: getSpacesUrl('/public/resources/excel-templates/icfm-icfr/ICB1A2~1.XLS'),
  icfmIcfrTreasuryCashManagement: getSpacesUrl('/public/resources/excel-templates/icfm-icfr/ICB877~1.XLS'),
  icfmIcfrItGeneralControls: getSpacesUrl('/public/resources/excel-templates/icfm-icfr/IC9B9B~1.XLS'),
  financialRatiosGuide: getSpacesUrl('/public/resources/guides/CFI-Financial-Ratios-Definitive-Guide.pdf'),
} as const
