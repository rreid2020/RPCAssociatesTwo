import type { YesNo } from './CraQuestionControls'

export type CanadianProvinceCode =
  | 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NS' | 'NT' | 'NU' | 'ON' | 'PE' | 'QC' | 'SK' | 'YT'

export type OrganDonorQuestionConfig = {
  provinceCode: CanadianProvinceCode
  label: string
  registryName: string
}

export type ProvincialElectionsConfig = {
  provinceCode: CanadianProvinceCode
  agencyName: string
  requiresCanadianCitizen: boolean
  citizenLabel: string
  authorizeLabel: string
}

/** CRA T1 provincial package organ/tissue donor consent (not offered in territories). */
const ORGAN_DONOR_BY_PROVINCE: Record<string, OrganDonorQuestionConfig> = {
  AB: {
    provinceCode: 'AB',
    registryName: 'Alberta organ and tissue donation registry',
    label: 'Authorize CRA to share your contact information with the Alberta organ and tissue donation registry'
  },
  BC: {
    provinceCode: 'BC',
    registryName: 'BC Transplant',
    label: 'Authorize CRA to share your contact information with BC Transplant for organ and tissue donor registration'
  },
  MB: {
    provinceCode: 'MB',
    registryName: 'Manitoba organ and tissue donation registry',
    label: 'Authorize CRA to share your contact information with the Manitoba organ and tissue donation registry'
  },
  NB: {
    provinceCode: 'NB',
    registryName: 'New Brunswick organ and tissue donation registry',
    label: 'Authorize CRA to share your contact information with the New Brunswick organ and tissue donation registry'
  },
  NL: {
    provinceCode: 'NL',
    registryName: 'Legacy of Life',
    label: 'Authorize CRA to share your contact information with Legacy of Life (Newfoundland and Labrador organ donation registry)'
  },
  NS: {
    provinceCode: 'NS',
    registryName: 'Nova Scotia organ and tissue donation registry',
    label: 'Authorize CRA to share your contact information with the Nova Scotia organ and tissue donation registry'
  },
  ON: {
    provinceCode: 'ON',
    registryName: 'Trillium Gift of Life Network',
    label: 'Authorize CRA to share your contact information with the Trillium Gift of Life Network (Ontario organ/tissue donor registry)'
  },
  PE: {
    provinceCode: 'PE',
    registryName: 'Prince Edward Island organ and tissue donation registry',
    label: 'Authorize CRA to share your contact information with the Prince Edward Island organ and tissue donation registry'
  },
  QC: {
    provinceCode: 'QC',
    registryName: 'Registre des consentements au don d\'organes et de tissus',
    label: 'Authorize CRA to share your contact information with the Quebec organ and tissue donation registry'
  },
  SK: {
    provinceCode: 'SK',
    registryName: 'Saskatchewan organ and tissue donation registry',
    label: 'Authorize CRA to share your contact information with the Saskatchewan organ and tissue donation registry'
  }
}

/** Provincial elections registry consents appearing on CRA T1 provincial packages. */
const PROVINCIAL_ELECTIONS_BY_PROVINCE: Record<string, ProvincialElectionsConfig> = {
  AB: {
    provinceCode: 'AB',
    agencyName: 'Elections Alberta',
    requiresCanadianCitizen: true,
    citizenLabel: 'Elections Alberta — Are you a Canadian citizen?',
    authorizeLabel: 'Elections Alberta authorization to share information with Elections Alberta'
  },
  BC: {
    provinceCode: 'BC',
    agencyName: 'Elections BC',
    requiresCanadianCitizen: true,
    citizenLabel: 'Elections BC — Are you a Canadian citizen?',
    authorizeLabel: 'Elections BC authorization to share information with Elections BC'
  },
  NS: {
    provinceCode: 'NS',
    agencyName: 'Elections Nova Scotia',
    requiresCanadianCitizen: false,
    citizenLabel: '',
    authorizeLabel: 'Authorize CRA to share your name, address, date of birth, and citizenship with Elections Nova Scotia'
  },
  NL: {
    provinceCode: 'NL',
    agencyName: 'Elections Newfoundland and Labrador',
    requiresCanadianCitizen: false,
    citizenLabel: '',
    authorizeLabel: 'Authorize CRA to share your name, address, date of birth, and citizenship with Elections Newfoundland and Labrador'
  },
  PE: {
    provinceCode: 'PE',
    agencyName: 'Elections PEI',
    requiresCanadianCitizen: false,
    citizenLabel: '',
    authorizeLabel: 'Authorize CRA to share your name, address, date of birth, and citizenship with Elections Prince Edward Island'
  },
  SK: {
    provinceCode: 'SK',
    agencyName: 'Elections Saskatchewan',
    requiresCanadianCitizen: false,
    citizenLabel: '',
    authorizeLabel: 'Authorize CRA to share your name, address, date of birth, and citizenship with Elections Saskatchewan'
  }
}

export function normalizeProvinceCode (value: string): string {
  return String(value || '').trim().toUpperCase().slice(0, 4)
}

export function getOrganDonorQuestion (provinceCode: string): OrganDonorQuestionConfig | null {
  return ORGAN_DONOR_BY_PROVINCE[normalizeProvinceCode(provinceCode)] || null
}

export function hasOrganDonorQuestion (provinceCode: string): boolean {
  return getOrganDonorQuestion(provinceCode) != null
}

export function getProvincialElectionsConfig (provinceCode: string): ProvincialElectionsConfig | null {
  return PROVINCIAL_ELECTIONS_BY_PROVINCE[normalizeProvinceCode(provinceCode)] || null
}

export function hasProvincialElectionsQuestions (provinceCode: string): boolean {
  return getProvincialElectionsConfig(provinceCode) != null
}

export function clearOrganDonorIfNotApplicable (provinceCode: string, current: YesNo): YesNo {
  return hasOrganDonorQuestion(provinceCode) ? current : 'no'
}

export function clearProvincialElectionsIfNotApplicable (
  provinceCode: string,
  current: { provincialElectionsCanadianCitizen: YesNo; provincialElectionsAuthorize: YesNo }
): { provincialElectionsCanadianCitizen: YesNo; provincialElectionsAuthorize: YesNo } {
  const config = getProvincialElectionsConfig(provinceCode)
  if (!config) {
    return { provincialElectionsCanadianCitizen: 'no', provincialElectionsAuthorize: 'no' }
  }
  if (config.requiresCanadianCitizen) {
    return {
      provincialElectionsCanadianCitizen: current.provincialElectionsCanadianCitizen,
      provincialElectionsAuthorize: current.provincialElectionsCanadianCitizen === 'yes'
        ? current.provincialElectionsAuthorize
        : 'no'
    }
  }
  return {
    provincialElectionsCanadianCitizen: 'no',
    provincialElectionsAuthorize: current.provincialElectionsAuthorize
  }
}

export function serializeOrganDonorConsent (provinceCode: string, consent: YesNo): boolean | null {
  if (!hasOrganDonorQuestion(provinceCode)) return false
  return consent === 'yes'
}

export function serializeProvincialElections (
  provinceCode: string,
  citizen: YesNo,
  authorize: YesNo
): { provincialElectionsCanadianCitizen: boolean | null; provincialElectionsAuthorize: boolean | null } {
  const config = getProvincialElectionsConfig(provinceCode)
  if (!config) {
    return { provincialElectionsCanadianCitizen: null, provincialElectionsAuthorize: null }
  }
  if (config.requiresCanadianCitizen) {
    const isCitizen = citizen === 'yes'
    return {
      provincialElectionsCanadianCitizen: isCitizen,
      provincialElectionsAuthorize: isCitizen ? authorize === 'yes' : null
    }
  }
  return {
    provincialElectionsCanadianCitizen: null,
    provincialElectionsAuthorize: authorize === 'yes'
  }
}
