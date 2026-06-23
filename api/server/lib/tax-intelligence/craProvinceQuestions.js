const ORGAN_DONOR_PROVINCES = new Set(['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK'])

const PROVINCIAL_ELECTIONS_REQUIRES_CITIZEN = new Set(['AB', 'BC'])

const PROVINCIAL_ELECTIONS_PROVINCES = new Set(['AB', 'BC', 'NS', 'NL', 'PE', 'SK'])

export function normalizeProvinceCode (value) {
  return String(value || '').trim().toUpperCase().slice(0, 4)
}

export function hasOrganDonorQuestion (provinceCode) {
  return ORGAN_DONOR_PROVINCES.has(normalizeProvinceCode(provinceCode))
}

export function hasProvincialElectionsQuestions (provinceCode) {
  return PROVINCIAL_ELECTIONS_PROVINCES.has(normalizeProvinceCode(provinceCode))
}

function provincialElectionsRequiresCitizen (provinceCode) {
  return PROVINCIAL_ELECTIONS_REQUIRES_CITIZEN.has(normalizeProvinceCode(provinceCode))
}

export function normalizeOrganDonorConsent (provinceCode, value) {
  if (!hasOrganDonorQuestion(provinceCode)) return false
  if (value == null || value === '') return null
  return Boolean(value)
}

export function normalizeProvincialElections (provinceCode, citizenValue, authorizeValue) {
  if (!hasProvincialElectionsQuestions(provinceCode)) {
    return { provincialElectionsCanadianCitizen: null, provincialElectionsAuthorize: null }
  }
  if (provincialElectionsRequiresCitizen(provinceCode)) {
    const isCitizen = citizenValue == null || citizenValue === '' ? null : Boolean(citizenValue)
    return {
      provincialElectionsCanadianCitizen: isCitizen,
      provincialElectionsAuthorize: isCitizen ? (authorizeValue == null || authorizeValue === '' ? null : Boolean(authorizeValue)) : null
    }
  }
  return {
    provincialElectionsCanadianCitizen: null,
    provincialElectionsAuthorize: authorizeValue == null || authorizeValue === '' ? null : Boolean(authorizeValue)
  }
}
