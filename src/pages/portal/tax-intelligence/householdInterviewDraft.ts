import { dependentFromLegacy, type DependentRecord } from './dependentModel'

export type InterviewStep = 1 | 2 | 3 | 4
export const HOUSEHOLD_INTERVIEW_DRAFT_VERSION = 2
export type MaritalStatus = 'single' | 'married' | 'common_law'
export type SpouseMode = 'summary' | 'full'
export type YesNo = '' | 'yes' | 'no'

export type HouseholdInterviewDraftForm = {
  step: InterviewStep
  taxYear: number
  mainFirstName: string
  mainLastName: string
  mainSin: string
  mainDateOfBirth: string
  mainEmail: string
  mailingAddressLine1: string
  mailingCity: string
  mailingPostalCode: string
  mainProvinceCode: string
  languageCorrespondence: 'en' | 'fr'
  firstTimeFiler: YesNo
  soldPrincipalResidence: YesNo
  treatyExemptForeignService: YesNo
  electionsCanadianCitizen: YesNo
  electionsAuthorize: YesNo
  foreignPropertyOver100k: YesNo
  organDonorConsent: YesNo
  craEmailNotificationsConsent: YesNo
  craEmailConfirmed: YesNo
  craHasForeignMailingAddress: YesNo
  spouseApplicable: boolean
  maritalStatus: MaritalStatus
  spouseReturnMode: SpouseMode
  spouseFullName: string
  spouseFirstName: string
  spouseLastName: string
  spouseDateOfBirth: string
  spouseSin: string
  spouseEmail: string
  spouseSameAddress: boolean
  spouseMailingAddressLine1: string
  spouseMailingCity: string
  spouseMailingProvinceCode: string
  spouseMailingPostalCode: string
  spouseLanguageCorrespondence: 'en' | 'fr'
  spouseCraSameAsMain: boolean
  spouseFirstTimeFiler: YesNo
  spouseSoldPrincipalResidence: YesNo
  spouseTreatyExemptForeignService: YesNo
  spouseElectionsCanadianCitizen: YesNo
  spouseElectionsAuthorize: YesNo
  spouseForeignPropertyOver100k: YesNo
  spouseOrganDonorConsent: YesNo
  spouseCraEmailNotificationsConsent: YesNo
  spouseCraEmailConfirmed: YesNo
  spouseCraHasForeignMailingAddress: YesNo
  dependents: Array<DependentRecord & { id: string }>
}

export type HouseholdInterviewDraftRecord = {
  step: InterviewStep
  draft: HouseholdInterviewDraftForm
  updatedAt?: string
}

function normalizeStep (value: unknown, draftVersion = HOUSEHOLD_INTERVIEW_DRAFT_VERSION): InterviewStep {
  const step = Number(value)
  if (step >= 4) return 4
  if (step === 3) {
    // Version 1 stored review on step 3 before dependants had a dedicated step.
    if (draftVersion < HOUSEHOLD_INTERVIEW_DRAFT_VERSION) return 4
    return 3
  }
  if (step === 2) return 2
  return 1
}

function normalizeYesNo (value: unknown): YesNo {
  if (value === true || value === 'yes') return 'yes'
  if (value === false || value === 'no') return 'no'
  return ''
}

function normalizeMaritalStatus (value: unknown): MaritalStatus {
  const status = String(value || 'single')
  if (status === 'married' || status === 'common_law') return status
  return 'single'
}

function normalizeSpouseMode (value: unknown): SpouseMode {
  return String(value || 'summary') === 'full' ? 'full' : 'summary'
}

function normalizeLanguage (value: unknown): 'en' | 'fr' {
  return String(value || 'en').toLowerCase() === 'fr' ? 'fr' : 'en'
}

function normalizeDependents (value: unknown): Array<DependentRecord & { id: string }> {
  if (!Array.isArray(value)) return []
  return value.map((item, index) => {
    const record = dependentFromLegacy(item && typeof item === 'object' ? item as Record<string, unknown> : {})
    const id = item && typeof item === 'object' && item.id
      ? String(item.id)
      : `draft-dep-${index}`
    return { ...record, id }
  })
}

export function serializeHouseholdInterviewDraft (form: HouseholdInterviewDraftForm) {
  return {
    version: HOUSEHOLD_INTERVIEW_DRAFT_VERSION,
    ...form
  }
}

export function deserializeHouseholdInterviewDraft (
  payload: Record<string, unknown> | null | undefined,
  fallbackStep: InterviewStep = 1
): HouseholdInterviewDraftForm | null {
  if (!payload || typeof payload !== 'object') return null
  const draft = payload.draft && typeof payload.draft === 'object'
    ? payload.draft as Record<string, unknown>
    : payload
  const draftVersion = Number(draft.version) || 1

  return {
    step: normalizeStep(payload.step ?? draft.step ?? fallbackStep, draftVersion),
    taxYear: Number(draft.taxYear) || new Date().getFullYear(),
    mainFirstName: String(draft.mainFirstName || ''),
    mainLastName: String(draft.mainLastName || ''),
    mainSin: String(draft.mainSin || '').replace(/\D/g, '').slice(0, 9),
    mainDateOfBirth: draft.mainDateOfBirth ? String(draft.mainDateOfBirth).slice(0, 10) : '',
    mainEmail: String(draft.mainEmail || ''),
    mailingAddressLine1: String(draft.mailingAddressLine1 || ''),
    mailingCity: String(draft.mailingCity || ''),
    mailingPostalCode: String(draft.mailingPostalCode || ''),
    mainProvinceCode: String(draft.mainProvinceCode || 'ON').trim().toUpperCase().slice(0, 4) || 'ON',
    languageCorrespondence: normalizeLanguage(draft.languageCorrespondence),
    firstTimeFiler: normalizeYesNo(draft.firstTimeFiler),
    soldPrincipalResidence: normalizeYesNo(draft.soldPrincipalResidence),
    treatyExemptForeignService: normalizeYesNo(draft.treatyExemptForeignService),
    electionsCanadianCitizen: normalizeYesNo(draft.electionsCanadianCitizen),
    electionsAuthorize: normalizeYesNo(draft.electionsAuthorize),
    foreignPropertyOver100k: normalizeYesNo(draft.foreignPropertyOver100k),
    organDonorConsent: normalizeYesNo(draft.organDonorConsent),
    craEmailNotificationsConsent: normalizeYesNo(draft.craEmailNotificationsConsent),
    craEmailConfirmed: normalizeYesNo(draft.craEmailConfirmed),
    craHasForeignMailingAddress: normalizeYesNo(draft.craHasForeignMailingAddress),
    spouseApplicable: Boolean(draft.spouseApplicable),
    maritalStatus: normalizeMaritalStatus(draft.maritalStatus),
    spouseReturnMode: normalizeSpouseMode(draft.spouseReturnMode),
    spouseFullName: String(draft.spouseFullName || ''),
    spouseFirstName: String(draft.spouseFirstName || ''),
    spouseLastName: String(draft.spouseLastName || ''),
    spouseDateOfBirth: draft.spouseDateOfBirth ? String(draft.spouseDateOfBirth).slice(0, 10) : '',
    spouseSin: String(draft.spouseSin || '').replace(/\D/g, '').slice(0, 9),
    spouseEmail: String(draft.spouseEmail || ''),
    spouseSameAddress: draft.spouseSameAddress == null ? true : Boolean(draft.spouseSameAddress),
    spouseMailingAddressLine1: String(draft.spouseMailingAddressLine1 || ''),
    spouseMailingCity: String(draft.spouseMailingCity || ''),
    spouseMailingProvinceCode: String(draft.spouseMailingProvinceCode || 'ON').trim().toUpperCase().slice(0, 4) || 'ON',
    spouseMailingPostalCode: String(draft.spouseMailingPostalCode || ''),
    spouseLanguageCorrespondence: normalizeLanguage(draft.spouseLanguageCorrespondence),
    spouseCraSameAsMain: draft.spouseCraSameAsMain == null ? true : Boolean(draft.spouseCraSameAsMain),
    spouseFirstTimeFiler: normalizeYesNo(draft.spouseFirstTimeFiler),
    spouseSoldPrincipalResidence: normalizeYesNo(draft.spouseSoldPrincipalResidence),
    spouseTreatyExemptForeignService: normalizeYesNo(draft.spouseTreatyExemptForeignService),
    spouseElectionsCanadianCitizen: normalizeYesNo(draft.spouseElectionsCanadianCitizen),
    spouseElectionsAuthorize: normalizeYesNo(draft.spouseElectionsAuthorize),
    spouseForeignPropertyOver100k: normalizeYesNo(draft.spouseForeignPropertyOver100k),
    spouseOrganDonorConsent: normalizeYesNo(draft.spouseOrganDonorConsent),
    spouseCraEmailNotificationsConsent: normalizeYesNo(draft.spouseCraEmailNotificationsConsent),
    spouseCraEmailConfirmed: normalizeYesNo(draft.spouseCraEmailConfirmed),
    spouseCraHasForeignMailingAddress: normalizeYesNo(draft.spouseCraHasForeignMailingAddress),
    dependents: normalizeDependents(draft.dependents)
  }
}

export function createEmptyHouseholdInterviewDraft (): HouseholdInterviewDraftForm {
  return {
    step: 1,
    taxYear: new Date().getFullYear(),
    mainFirstName: '',
    mainLastName: '',
    mainSin: '',
    mainDateOfBirth: '',
    mainEmail: '',
    mailingAddressLine1: '',
    mailingCity: '',
    mailingPostalCode: '',
    mainProvinceCode: 'ON',
    languageCorrespondence: 'en',
    firstTimeFiler: '',
    soldPrincipalResidence: '',
    treatyExemptForeignService: '',
    electionsCanadianCitizen: '',
    electionsAuthorize: '',
    foreignPropertyOver100k: '',
    organDonorConsent: '',
    craEmailNotificationsConsent: '',
    craEmailConfirmed: '',
    craHasForeignMailingAddress: '',
    spouseApplicable: false,
    maritalStatus: 'single',
    spouseReturnMode: 'summary',
    spouseFullName: '',
    spouseFirstName: '',
    spouseLastName: '',
    spouseDateOfBirth: '',
    spouseSin: '',
    spouseEmail: '',
    spouseSameAddress: true,
    spouseMailingAddressLine1: '',
    spouseMailingCity: '',
    spouseMailingProvinceCode: 'ON',
    spouseMailingPostalCode: '',
    spouseLanguageCorrespondence: 'en',
    spouseCraSameAsMain: true,
    spouseFirstTimeFiler: '',
    spouseSoldPrincipalResidence: '',
    spouseTreatyExemptForeignService: '',
    spouseElectionsCanadianCitizen: '',
    spouseElectionsAuthorize: '',
    spouseForeignPropertyOver100k: '',
    spouseOrganDonorConsent: '',
    spouseCraEmailNotificationsConsent: '',
    spouseCraEmailConfirmed: '',
    spouseCraHasForeignMailingAddress: '',
    dependents: []
  }
}

export function buildHouseholdInterviewDraftForm (input: Partial<HouseholdInterviewDraftForm> & { step: InterviewStep }): HouseholdInterviewDraftForm {
  return {
    ...createEmptyHouseholdInterviewDraft(),
    ...input,
    dependents: input.dependents || []
  }
}
