import { FC, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../../components/SEO'
import ClientPortalShell from '../../../components/ClientPortalShell'
import { taxFetch, type TaxReturnSummary } from '../../../lib/taxIntelligenceApi'
import { getTaxBasePath } from './path'
import { CraQuestionRow, DEFAULT_CRA_YES_NO, toggleToYesNo, yesNoToToggle, YesNoToggle } from './CraQuestionControls'
import DependentIdentificationForm from './DependentIdentificationForm'
import {
  createEmptyDependent,
  dependentRequiresFullReturn,
  serializeDependent,
  validateDependentIdentification,
  type DependentRecord
} from './dependentModel'
import ProvinceSelect from './ProvinceSelect'
import { ProvincialCraQuestionBlocks } from './ProvincialCraQuestionBlocks'
import {
  clearOrganDonorIfNotApplicable,
  clearProvincialElectionsIfNotApplicable,
  serializeOrganDonorConsent,
  serializeProvincialElections
} from './craProvinceQuestions.registry'
import {
  buildHouseholdInterviewDraftForm,
  deserializeHouseholdInterviewDraft,
  serializeHouseholdInterviewDraft,
  type HouseholdInterviewDraftForm,
  type HouseholdInterviewDraftRecord,
  type InterviewStep,
  type MaritalStatus,
  type SpouseMode,
  type YesNo
} from './householdInterviewDraft'

type ReadinessIssueSeverity = 'required' | 'recommended'

function sanitizeSin (value: string): string {
  return String(value || '').replace(/\D/g, '').slice(0, 9)
}

function computeSetupReadiness (r: TaxReturnSummary): { required: number; recommended: number } {
  const issues: Array<{ severity: ReadinessIssueSeverity }> = []
  const profile = r.taxpayer_profile || {}
  const spouse = profile.spouse || {}
  const maritalStatus = String(profile.maritalStatus || 'single')
  const spouseMode = String(profile.spouseReturnMode || 'summary') === 'full' ? 'full' : 'summary'
  const married = maritalStatus === 'married' || maritalStatus === 'common_law'
  const missing = (value: unknown) => !String(value || '').trim()

  if (missing(r.taxpayer_first_name)) issues.push({ severity: 'required' })
  if (missing(r.taxpayer_last_name)) issues.push({ severity: 'required' })
  if (missing(r.taxpayer_date_of_birth)) issues.push({ severity: 'required' })
  if (missing(profile.mailingAddressLine1)) issues.push({ severity: 'required' })
  if (missing(profile.mailingCity)) issues.push({ severity: 'required' })
  if (missing(profile.mailingProvinceCode)) issues.push({ severity: 'required' })
  if (missing(profile.mailingPostalCode)) issues.push({ severity: 'required' })
  if (missing(profile.residenceProvinceDec31)) issues.push({ severity: 'required' })

  if (missing(profile.languageCorrespondence)) issues.push({ severity: 'required' })
  if (profile.craEmailNotificationsConsent === true && missing(profile.email)) issues.push({ severity: 'required' })

  if (married) {
    if (spouseMode === 'full') {
      if (missing(spouse.firstName)) issues.push({ severity: 'required' })
      if (missing(spouse.lastName)) issues.push({ severity: 'required' })
      if (missing(spouse.dateOfBirth)) issues.push({ severity: 'required' })
    } else if (missing(spouse.fullName)) {
      issues.push({ severity: 'required' })
    }
  }

  return {
    required: issues.filter((it) => it.severity === 'required').length,
    recommended: issues.filter((it) => it.severity === 'recommended').length
  }
}

const TaxReturns: FC = () => {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const basePath = useMemo(() => getTaxBasePath(), [])
  const [returns, setReturns] = useState<TaxReturnSummary[]>([])
  const [step, setStep] = useState<InterviewStep>(1)
  const [taxYear, setTaxYear] = useState(new Date().getFullYear())
  const [mainFirstName, setMainFirstName] = useState('')
  const [mainLastName, setMainLastName] = useState('')
  const [mainSin, setMainSin] = useState('')
  const [mainDateOfBirth, setMainDateOfBirth] = useState('')
  const [mainEmail, setMainEmail] = useState('')
  const [mailingAddressLine1, setMailingAddressLine1] = useState('')
  const [mailingCity, setMailingCity] = useState('')
  const [mailingPostalCode, setMailingPostalCode] = useState('')
  const [mainProvinceCode, setMainProvinceCode] = useState('ON')
  const [languageCorrespondence, setLanguageCorrespondence] = useState<'en' | 'fr'>('en')
  const [firstTimeFiler, setFirstTimeFiler] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [soldPrincipalResidence, setSoldPrincipalResidence] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [treatyExemptForeignService, setTreatyExemptForeignService] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [electionsCanadianCitizen, setElectionsCanadianCitizen] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [electionsAuthorize, setElectionsAuthorize] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [foreignPropertyOver100k, setForeignPropertyOver100k] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [organDonorConsent, setOrganDonorConsent] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [provincialElectionsCanadianCitizen, setProvincialElectionsCanadianCitizen] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [provincialElectionsAuthorize, setProvincialElectionsAuthorize] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [craEmailNotificationsConsent, setCraEmailNotificationsConsent] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [craEmailConfirmed, setCraEmailConfirmed] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [craHasForeignMailingAddress, setCraHasForeignMailingAddress] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [spouseApplicable, setSpouseApplicable] = useState(false)
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>('single')
  const [spouseReturnMode, setSpouseReturnMode] = useState<SpouseMode>('summary')
  const [spouseFullName, setSpouseFullName] = useState('')
  const [spouseFirstName, setSpouseFirstName] = useState('')
  const [spouseLastName, setSpouseLastName] = useState('')
  const [spouseDateOfBirth, setSpouseDateOfBirth] = useState('')
  const [spouseSin, setSpouseSin] = useState('')
  const [spouseEmail, setSpouseEmail] = useState('')
  const [spouseSameAddress, setSpouseSameAddress] = useState(true)
  const [spouseMailingAddressLine1, setSpouseMailingAddressLine1] = useState('')
  const [spouseMailingCity, setSpouseMailingCity] = useState('')
  const [spouseMailingProvinceCode, setSpouseMailingProvinceCode] = useState('ON')
  const [spouseMailingPostalCode, setSpouseMailingPostalCode] = useState('')
  const [spouseLanguageCorrespondence, setSpouseLanguageCorrespondence] = useState<'en' | 'fr'>('en')
  const [spouseCraSameAsMain, setSpouseCraSameAsMain] = useState(true)
  const [spouseFirstTimeFiler, setSpouseFirstTimeFiler] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [spouseSoldPrincipalResidence, setSpouseSoldPrincipalResidence] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [spouseTreatyExemptForeignService, setSpouseTreatyExemptForeignService] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [spouseElectionsCanadianCitizen, setSpouseElectionsCanadianCitizen] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [spouseElectionsAuthorize, setSpouseElectionsAuthorize] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [spouseForeignPropertyOver100k, setSpouseForeignPropertyOver100k] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [spouseOrganDonorConsent, setSpouseOrganDonorConsent] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [spouseProvincialElectionsCanadianCitizen, setSpouseProvincialElectionsCanadianCitizen] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [spouseProvincialElectionsAuthorize, setSpouseProvincialElectionsAuthorize] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [spouseCraEmailNotificationsConsent, setSpouseCraEmailNotificationsConsent] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [spouseCraEmailConfirmed, setSpouseCraEmailConfirmed] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [spouseCraHasForeignMailingAddress, setSpouseCraHasForeignMailingAddress] = useState<YesNo>(DEFAULT_CRA_YES_NO)
  const [dependentsApplicable, setDependentsApplicable] = useState(false)
  const [dependents, setDependents] = useState<Array<DependentRecord & { id: string }>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [createdInfo, setCreatedInfo] = useState<string | null>(null)
  const [draftResumedAt, setDraftResumedAt] = useState<string | null>(null)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [showCreateInterview, setShowCreateInterview] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const applyInterviewDraft = (form: HouseholdInterviewDraftForm) => {
    setStep(form.step)
    setTaxYear(form.taxYear)
    setMainFirstName(form.mainFirstName)
    setMainLastName(form.mainLastName)
    setMainSin(form.mainSin)
    setMainDateOfBirth(form.mainDateOfBirth)
    setMainEmail(form.mainEmail)
    setMailingAddressLine1(form.mailingAddressLine1)
    setMailingCity(form.mailingCity)
    setMailingPostalCode(form.mailingPostalCode)
    setMainProvinceCode(form.mainProvinceCode)
    setLanguageCorrespondence(form.languageCorrespondence)
    setFirstTimeFiler(form.firstTimeFiler)
    setSoldPrincipalResidence(form.soldPrincipalResidence)
    setTreatyExemptForeignService(form.treatyExemptForeignService)
    setElectionsCanadianCitizen(form.electionsCanadianCitizen)
    setElectionsAuthorize(form.electionsAuthorize)
    setForeignPropertyOver100k(form.foreignPropertyOver100k)
    setOrganDonorConsent(form.organDonorConsent)
    setProvincialElectionsCanadianCitizen(form.provincialElectionsCanadianCitizen)
    setProvincialElectionsAuthorize(form.provincialElectionsAuthorize)
    setCraEmailNotificationsConsent(form.craEmailNotificationsConsent)
    setCraEmailConfirmed(form.craEmailConfirmed)
    setCraHasForeignMailingAddress(form.craHasForeignMailingAddress)
    setSpouseApplicable(form.spouseApplicable)
    setMaritalStatus(form.maritalStatus)
    setSpouseReturnMode(form.spouseReturnMode)
    setSpouseFullName(form.spouseFullName)
    setSpouseFirstName(form.spouseFirstName)
    setSpouseLastName(form.spouseLastName)
    setSpouseDateOfBirth(form.spouseDateOfBirth)
    setSpouseSin(form.spouseSin)
    setSpouseEmail(form.spouseEmail)
    setSpouseSameAddress(form.spouseSameAddress)
    setSpouseMailingAddressLine1(form.spouseMailingAddressLine1)
    setSpouseMailingCity(form.spouseMailingCity)
    setSpouseMailingProvinceCode(form.spouseMailingProvinceCode)
    setSpouseMailingPostalCode(form.spouseMailingPostalCode)
    setSpouseLanguageCorrespondence(form.spouseLanguageCorrespondence)
    setSpouseCraSameAsMain(form.spouseCraSameAsMain)
    setSpouseFirstTimeFiler(form.spouseFirstTimeFiler)
    setSpouseSoldPrincipalResidence(form.spouseSoldPrincipalResidence)
    setSpouseTreatyExemptForeignService(form.spouseTreatyExemptForeignService)
    setSpouseElectionsCanadianCitizen(form.spouseElectionsCanadianCitizen)
    setSpouseElectionsAuthorize(form.spouseElectionsAuthorize)
    setSpouseForeignPropertyOver100k(form.spouseForeignPropertyOver100k)
    setSpouseOrganDonorConsent(form.spouseOrganDonorConsent)
    setSpouseProvincialElectionsCanadianCitizen(form.spouseProvincialElectionsCanadianCitizen)
    setSpouseProvincialElectionsAuthorize(form.spouseProvincialElectionsAuthorize)
    setSpouseCraEmailNotificationsConsent(form.spouseCraEmailNotificationsConsent)
    setSpouseCraEmailConfirmed(form.spouseCraEmailConfirmed)
    setSpouseCraHasForeignMailingAddress(form.spouseCraHasForeignMailingAddress)
    setDependentsApplicable(form.dependentsApplicable)
    setDependents(form.dependents)
  }

  const collectInterviewDraft = (targetStep: InterviewStep): HouseholdInterviewDraftForm => (
    buildHouseholdInterviewDraftForm({
      step: targetStep,
      taxYear,
      mainFirstName,
      mainLastName,
      mainSin,
      mainDateOfBirth,
      mainEmail,
      mailingAddressLine1,
      mailingCity,
      mailingPostalCode,
      mainProvinceCode,
      languageCorrespondence,
      firstTimeFiler,
      soldPrincipalResidence,
      treatyExemptForeignService,
      electionsCanadianCitizen,
      electionsAuthorize,
      foreignPropertyOver100k,
      organDonorConsent,
      provincialElectionsCanadianCitizen,
      provincialElectionsAuthorize,
      craEmailNotificationsConsent,
      craEmailConfirmed,
      craHasForeignMailingAddress,
      spouseApplicable,
      maritalStatus,
      spouseReturnMode,
      spouseFullName,
      spouseFirstName,
      spouseLastName,
      spouseDateOfBirth,
      spouseSin,
      spouseEmail,
      spouseSameAddress,
      spouseMailingAddressLine1,
      spouseMailingCity,
      spouseMailingProvinceCode,
      spouseMailingPostalCode,
      spouseLanguageCorrespondence,
      spouseCraSameAsMain,
      spouseFirstTimeFiler,
      spouseSoldPrincipalResidence,
      spouseTreatyExemptForeignService,
      spouseElectionsCanadianCitizen,
      spouseElectionsAuthorize,
      spouseForeignPropertyOver100k,
      spouseOrganDonorConsent,
      spouseProvincialElectionsCanadianCitizen,
      spouseProvincialElectionsAuthorize,
      spouseCraEmailNotificationsConsent,
      spouseCraEmailConfirmed,
      spouseCraHasForeignMailingAddress,
      dependentsApplicable,
      dependents
    })
  )

  const clearInterviewDraft = async () => {
    try {
      await taxFetch('/tax-returns/household-interview-draft', getToken, { method: 'DELETE' })
    } catch {
      // Non-blocking when clearing local interview state.
    }
    setDraftResumedAt(null)
    setDraftSavedAt(null)
  }

  const saveInterviewDraft = async (targetStep: InterviewStep): Promise<boolean> => {
    setSaving(true)
    try {
      const draftForm = collectInterviewDraft(targetStep)
      const saved = await taxFetch<{ draft: HouseholdInterviewDraftRecord }>('/tax-returns/household-interview-draft', getToken, {
        method: 'PUT',
        body: JSON.stringify({
          step: targetStep,
          draft: serializeHouseholdInterviewDraft(draftForm)
        })
      })
      const updatedAt = saved?.draft?.updatedAt
      setDraftSavedAt(updatedAt ? String(updatedAt) : new Date().toISOString())
      setDraftResumedAt(updatedAt ? String(updatedAt) : draftResumedAt)
      return true
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save interview progress')
      return false
    } finally {
      setSaving(false)
    }
  }

  const load = async () => {
    setLoading(true)
    try {
      const [returnsData, draftData] = await Promise.all([
        taxFetch<{ returns: TaxReturnSummary[] }>('/tax-returns', getToken),
        taxFetch<{ draft: HouseholdInterviewDraftRecord | null }>('/tax-returns/household-interview-draft', getToken)
          .catch(() => ({ draft: null }))
      ])
      setReturns(returnsData.returns || [])
      const primaryReturns = (returnsData.returns || []).filter((r) => !r.parent_tax_return_id)
      const restored = deserializeHouseholdInterviewDraft(draftData.draft || undefined)
      if (restored) {
        applyInterviewDraft(restored)
        setShowCreateInterview(true)
        setDraftResumedAt(draftData.draft?.updatedAt ? String(draftData.draft.updatedAt) : null)
        setDraftSavedAt(draftData.draft?.updatedAt ? String(draftData.draft.updatedAt) : null)
      } else {
        setShowCreateInterview(primaryReturns.length === 0)
        setDraftResumedAt(null)
        setDraftSavedAt(null)
      }
      setErr(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load tax returns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isMarried = spouseApplicable && (maritalStatus === 'married' || maritalStatus === 'common_law')
  const toBoolOrNull = (value: YesNo): boolean => value === 'yes'

  const resetInterview = () => {
    applyInterviewDraft(buildHouseholdInterviewDraftForm({ step: 1, taxYear: new Date().getFullYear() }))
  }

  const startInterviewOver = async () => {
    await clearInterviewDraft()
    resetInterview()
    setShowCreateInterview(true)
    setErr(null)
    setCreatedInfo(null)
    setDraftResumedAt(null)
    setDraftSavedAt(null)
  }

  const beginNewHouseholdInterview = () => {
    resetInterview()
    setShowCreateInterview(true)
    setErr(null)
    setCreatedInfo(null)
    setDraftResumedAt(null)
    setDraftSavedAt(null)
  }

  const addDependent = () => {
    setDependents((prev) => ([
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...createEmptyDependent({ residenceProvinceDec31: mainProvinceCode || 'ON' })
      }
    ]))
  }

  const updateDependent = (id: string, patch: Partial<DependentRecord>) => {
    setDependents((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }

  const removeDependent = (id: string) => {
    setDependents((prev) => prev.filter((d) => d.id !== id))
  }

  const validateCurrentStep = (): string | null => {
    if (step === 1) {
      if (!mainFirstName.trim()) return 'Main taxpayer first name is required.'
      if (!mainLastName.trim()) return 'Main taxpayer last name is required.'
      if (!taxYear || taxYear < 2000 || taxYear > 2100) return 'Tax year must be between 2000 and 2100.'
      if (!mailingAddressLine1.trim()) return 'Mailing address line 1 is required.'
      if (!mailingCity.trim()) return 'Mailing city is required.'
      if (!mainProvinceCode.trim()) return 'Province on Dec 31 is required.'
      if (!mailingPostalCode.trim()) return 'Mailing postal code is required.'
      if (craEmailNotificationsConsent === 'yes' && !mainEmail.trim()) return 'Email address is required when CRA email notifications are enabled.'
      return null
    }
    if (step === 2) {
      if (isMarried) {
        if (spouseReturnMode === 'summary' && !spouseFullName.trim()) {
          return 'Spouse full name is required for summary mode.'
        }
        if (spouseReturnMode === 'full') {
          if (!spouseFirstName.trim() || !spouseLastName.trim()) return 'Spouse first and last name are required for full return mode.'
          if (!spouseSameAddress) {
            if (!spouseMailingAddressLine1.trim()) return 'Spouse mailing address line 1 is required when spouse resides elsewhere.'
            if (!spouseMailingCity.trim()) return 'Spouse mailing city is required when spouse resides elsewhere.'
            if (!spouseMailingProvinceCode.trim()) return 'Spouse mailing province is required when spouse resides elsewhere.'
            if (!spouseMailingPostalCode.trim()) return 'Spouse mailing postal code is required when spouse resides elsewhere.'
          }
          if (!spouseCraSameAsMain) {
            if (spouseCraEmailNotificationsConsent === 'yes' && !spouseEmail.trim()) return 'Spouse email is required when spouse CRA email notifications are enabled.'
          }
        }
      }
      return null
    }
    if (step === 3) {
      if (dependentsApplicable) {
        if (dependents.length === 0) return 'Add at least one dependant or answer No.'
        for (const dependent of dependents) {
          const issue = validateDependentIdentification(dependent, taxYear)
          if (issue) return issue
        }
      }
      return null
    }
    return null
  }

  const onNext = async () => {
    const issue = validateCurrentStep()
    if (issue) {
      setErr(issue)
      return
    }
    setErr(null)
    const nextStep = Math.min(4, (step + 1) as InterviewStep) as InterviewStep
    const saved = await saveInterviewDraft(nextStep)
    if (!saved) return
    setStep(nextStep)
  }

  const onBack = async () => {
    setErr(null)
    const prevStep = Math.max(1, (step - 1) as InterviewStep) as InterviewStep
    const saved = await saveInterviewDraft(prevStep)
    if (!saved) return
    setStep(prevStep)
  }

  const onCreate = async () => {
    const issue = validateCurrentStep()
    if (issue) {
      setErr(issue)
      return
    }
    setSaving(true)
    setErr(null)
    setCreatedInfo(null)
    try {
      const payload = await taxFetch<{ taxReturn: TaxReturnSummary & { createdLinkedWorkspaces?: Array<{ id: string; role: string; taxpayerName: string }> } }>('/tax-returns', getToken, {
        method: 'POST',
        body: JSON.stringify({
          taxYear,
          taxpayerName: `${mainFirstName.trim()} ${mainLastName.trim()}`.trim(),
          firstName: mainFirstName.trim(),
          lastName: mainLastName.trim(),
          sin: sanitizeSin(mainSin),
          dateOfBirth: mainDateOfBirth || null,
          provinceCode: mainProvinceCode || 'ON',
          interview: {
            mainTaxpayer: {
              fullName: `${mainFirstName.trim()} ${mainLastName.trim()}`.trim(),
              firstName: mainFirstName.trim(),
              lastName: mainLastName.trim(),
              sin: sanitizeSin(mainSin),
              dateOfBirth: mainDateOfBirth || null,
              email: mainEmail.trim(),
              provinceCode: mainProvinceCode || 'ON',
              residenceProvinceDec31: mainProvinceCode || 'ON',
              mailingAddressLine1: mailingAddressLine1.trim(),
              mailingCity: mailingCity.trim(),
              mailingProvinceCode: mainProvinceCode || 'ON',
              mailingPostalCode: mailingPostalCode.trim(),
              languageCorrespondence
            },
            household: {
              maritalStatus,
              spouseReturnMode
            },
            spouse: isMarried
              ? {
                  fullName: spouseFullName.trim(),
                  firstName: spouseFirstName.trim(),
                  lastName: spouseLastName.trim(),
                  dateOfBirth: spouseDateOfBirth || null,
                  fullSin: sanitizeSin(spouseSin),
                  sameAddress: spouseSameAddress,
                  email: spouseEmail.trim(),
                  mailingAddressLine1: spouseMailingAddressLine1.trim(),
                  mailingCity: spouseMailingCity.trim(),
                  mailingProvinceCode: spouseMailingProvinceCode || mainProvinceCode || 'ON',
                  mailingPostalCode: spouseMailingPostalCode.trim(),
                  languageCorrespondence: spouseLanguageCorrespondence,
                  craSameAsMain: spouseCraSameAsMain,
                  cra: spouseCraSameAsMain
                    ? null
                    : {
                        electionsCanadianCitizen: toBoolOrNull(spouseElectionsCanadianCitizen),
                        electionsAuthorize: spouseElectionsCanadianCitizen === 'yes' ? toBoolOrNull(spouseElectionsAuthorize) : null,
                        firstTimeFiler: toBoolOrNull(spouseFirstTimeFiler),
                        soldPrincipalResidence: toBoolOrNull(spouseSoldPrincipalResidence),
                        treatyExemptForeignService: toBoolOrNull(spouseTreatyExemptForeignService),
                        foreignPropertyOver100k: toBoolOrNull(spouseForeignPropertyOver100k),
                        organDonorConsent: serializeOrganDonorConsent(
                          spouseSameAddress ? mainProvinceCode : spouseMailingProvinceCode,
                          spouseOrganDonorConsent
                        ),
                        ...serializeProvincialElections(
                          spouseSameAddress ? mainProvinceCode : spouseMailingProvinceCode,
                          spouseProvincialElectionsCanadianCitizen,
                          spouseProvincialElectionsAuthorize
                        ),
                        craEmailNotificationsConsent: toBoolOrNull(spouseCraEmailNotificationsConsent),
                        craEmailConfirmed: toBoolOrNull(spouseCraEmailConfirmed),
                        craHasForeignMailingAddress: toBoolOrNull(spouseCraHasForeignMailingAddress)
                      }
                }
              : {},
            dependents: dependentsApplicable ? dependents.map((d) => serializeDependent(d)) : [],
            cra: {
              becameResidentDate: null,
              ceasedResidentDate: null,
              maritalStatusChangeDate: null,
              deceasedDate: null,
              electionsCanadianCitizen: toBoolOrNull(electionsCanadianCitizen),
              electionsAuthorize: electionsCanadianCitizen === 'yes' ? toBoolOrNull(electionsAuthorize) : null,
              firstTimeFiler: toBoolOrNull(firstTimeFiler),
              soldPrincipalResidence: toBoolOrNull(soldPrincipalResidence),
              treatyExemptForeignService: toBoolOrNull(treatyExemptForeignService),
              foreignPropertyOver100k: toBoolOrNull(foreignPropertyOver100k),
              organDonorConsent: serializeOrganDonorConsent(mainProvinceCode, organDonorConsent),
              ...serializeProvincialElections(
                mainProvinceCode,
                provincialElectionsCanadianCitizen,
                provincialElectionsAuthorize
              ),
              craEmailNotificationsConsent: toBoolOrNull(craEmailNotificationsConsent),
              craEmailConfirmed: toBoolOrNull(craEmailConfirmed),
              craHasForeignMailingAddress: toBoolOrNull(craHasForeignMailingAddress)
            }
          }
        })
      })
      const linkedCount = payload.taxReturn?.createdLinkedWorkspaces?.length || 0
      const primaryReturnId = payload.taxReturn?.id
      if (linkedCount > 0) {
        setCreatedInfo(`Created primary return plus ${linkedCount} linked workspace${linkedCount > 1 ? 's' : ''}.`)
      } else {
        setCreatedInfo('Created primary return workspace.')
      }
      await clearInterviewDraft()
      resetInterview()
      setShowCreateInterview(false)
      setDraftResumedAt(null)
      setDraftSavedAt(null)
      if (primaryReturnId) {
        navigate(`${basePath}/returns/${primaryReturnId}?step=Setup&setupFocus=all`)
        return
      }
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create tax return')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (returnId: string, taxpayer: string, year: number) => {
    const confirmed = window.confirm(`Delete ${taxpayer} ${year} return?\n\nThis will permanently remove the return and all related tax data.`)
    if (!confirmed) return
    setDeletingId(returnId)
    setErr(null)
    try {
      await taxFetch(`/tax-returns/${returnId}`, getToken, { method: 'DELETE' })
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete tax return')
    } finally {
      setDeletingId(null)
    }
  }

  const workspaceRoleLabel = (r: TaxReturnSummary) => {
    const role = String(r.workspace_role || 'primary')
    if (role === 'spouse') return 'Spouse workspace'
    if (role === 'dependent') return 'Dependent workspace'
    return 'Primary workspace'
  }

  const grouped = useMemo(() => {
    const roots = returns.filter((r) => !r.parent_tax_return_id)
    const childrenByParent = new Map<string, TaxReturnSummary[]>()
    for (const item of returns) {
      if (!item.parent_tax_return_id) continue
      const current = childrenByParent.get(item.parent_tax_return_id) || []
      current.push(item)
      childrenByParent.set(item.parent_tax_return_id, current)
    }
    return { roots, childrenByParent }
  }, [returns])

  return (
    <>
      <SEO
        title="Tax Returns | Tax Intelligence | Client Portal"
        description="Manage T1 tax returns in the Tax Intelligence module."
        canonical="/app/tax-intelligence/returns"
      />
      <ClientPortalShell>
        <div className="space-y-6">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-dark">Tax Returns</h1>
              <p className="text-sm text-text-light mt-1">
                Create and manage Canadian T1 return workspaces.
              </p>
            </div>
            {!showCreateInterview && grouped.roots.length > 0 && (
              <button
                type="button"
                className="btn btn--secondary text-sm px-4 py-2 shrink-0"
                onClick={beginNewHouseholdInterview}
                disabled={saving || loading}
              >
                Create another household return
              </button>
            )}
          </header>

          {showCreateInterview && (
          <section className="bg-white p-4 rounded-lg border border-border shadow-sm">
            <h2 className="text-lg font-semibold text-primary-dark mb-1">Create return interview</h2>
            <p className="text-xs text-text-light mb-4">Step {step} of 4 — answer a few questions to build the household workspace.</p>
            {draftResumedAt && (
              <div className="mb-4 flex flex-col gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Saved progress restored from {new Date(draftResumedAt).toLocaleString()}.
                </span>
                <button
                  type="button"
                  className="text-sm font-medium text-accent hover:underline disabled:opacity-50"
                  onClick={() => { void startInterviewOver() }}
                  disabled={saving || loading}
                >
                  Start over
                </button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-primary-dark">Question 1: Who is the main taxpayer for this household return?</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="border border-border rounded-md px-3 py-2 text-sm" placeholder="Main taxpayer first name" value={mainFirstName} onChange={(e) => setMainFirstName(e.target.value)} disabled={saving} />
                  <input className="border border-border rounded-md px-3 py-2 text-sm" placeholder="Main taxpayer last name" value={mainLastName} onChange={(e) => setMainLastName(e.target.value)} disabled={saving} />
                  <input className="border border-border rounded-md px-3 py-2 text-sm" placeholder="SIN (9 digits, optional)" value={mainSin} onChange={(e) => setMainSin(e.target.value.replace(/\D/g, '').slice(0, 9))} disabled={saving} />
                  <input className="border border-border rounded-md px-3 py-2 text-sm" type="date" value={mainDateOfBirth} onChange={(e) => setMainDateOfBirth(e.target.value)} disabled={saving} />
                </div>
                <p className="text-sm font-medium text-primary-dark">Question 2: What tax year are we preparing for?</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="border border-border rounded-md px-3 py-2 text-sm" type="number" min={2000} max={2100} value={taxYear} onChange={(e) => setTaxYear(Number(e.target.value))} disabled={saving} />
                </div>
                <p className="text-sm font-medium text-primary-dark">Question 3: Contact email (optional)</p>
                <input className="border border-border rounded-md px-3 py-2 text-sm w-full" type="email" placeholder="Email (optional)" value={mainEmail} onChange={(e) => setMainEmail(e.target.value)} disabled={saving} />
                <p className="text-sm font-medium text-primary-dark">Question 4: What is the main taxpayer mailing address?</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="border border-border rounded-md px-3 py-2 text-sm md:col-span-2" placeholder="Mailing address line 1" value={mailingAddressLine1} onChange={(e) => setMailingAddressLine1(e.target.value)} disabled={saving} />
                  <input className="border border-border rounded-md px-3 py-2 text-sm" placeholder="Mailing city" value={mailingCity} onChange={(e) => setMailingCity(e.target.value)} disabled={saving} />
                  <input className="border border-border rounded-md px-3 py-2 text-sm" placeholder="Mailing postal code" value={mailingPostalCode} onChange={(e) => setMailingPostalCode(e.target.value.toUpperCase())} disabled={saving} />
                </div>
                <div className="space-y-2 border border-border rounded-md p-3 bg-background/40">
                  <h3 className="text-sm font-semibold text-primary-dark">Question 5: CRA setup questions for main taxpayer</h3>
                  <div className="divide-y divide-border/70 rounded-md border border-border">
                    <CraQuestionRow label="Province/territory of residence on Dec 31">
                      <ProvinceSelect
                        value={mainProvinceCode}
                        onChange={(code) => {
                          setMainProvinceCode(code)
                          setOrganDonorConsent(clearOrganDonorIfNotApplicable(code, organDonorConsent))
                          const cleared = clearProvincialElectionsIfNotApplicable(code, {
                            provincialElectionsCanadianCitizen,
                            provincialElectionsAuthorize
                          })
                          setProvincialElectionsCanadianCitizen(cleared.provincialElectionsCanadianCitizen)
                          setProvincialElectionsAuthorize(cleared.provincialElectionsAuthorize)
                        }}
                        disabled={saving}
                      />
                    </CraQuestionRow>
                    <CraQuestionRow label="Language of correspondence">
                      <select
                        className="border border-border rounded-md px-3 py-2 text-sm"
                        value={languageCorrespondence}
                        onChange={(e) => setLanguageCorrespondence(e.target.value === 'fr' ? 'fr' : 'en')}
                        disabled={saving}
                      >
                        <option value="en">English</option>
                        <option value="fr">French</option>
                      </select>
                    </CraQuestionRow>
                    <CraQuestionRow label="First time filing with CRA?">
                      <YesNoToggle
                        className=""
                        value={yesNoToToggle(firstTimeFiler)}
                        onChange={(value) => setFirstTimeFiler(toggleToYesNo(value))}
                        disabled={saving}
                      />
                    </CraQuestionRow>
                    <CraQuestionRow label="Sold principal residence this year?">
                      <YesNoToggle
                        className=""
                        value={yesNoToToggle(soldPrincipalResidence)}
                        onChange={(value) => setSoldPrincipalResidence(toggleToYesNo(value))}
                        disabled={saving}
                      />
                    </CraQuestionRow>
                    <CraQuestionRow label="Treaty-exempt foreign service/diplomatic status?">
                      <YesNoToggle
                        className=""
                        value={yesNoToToggle(treatyExemptForeignService)}
                        onChange={(value) => setTreatyExemptForeignService(toggleToYesNo(value))}
                        disabled={saving}
                      />
                    </CraQuestionRow>
                    <CraQuestionRow label="Elections Canada: Canadian citizen?">
                      <YesNoToggle
                        className=""
                        value={yesNoToToggle(electionsCanadianCitizen)}
                        onChange={(value) => {
                          setElectionsCanadianCitizen(toggleToYesNo(value))
                          if (value !== true) setElectionsAuthorize('no')
                        }}
                        disabled={saving}
                      />
                    </CraQuestionRow>
                    {electionsCanadianCitizen === 'yes' && (
                      <CraQuestionRow label="Elections Canada: authorize sharing?">
                        <YesNoToggle
                          className=""
                          value={yesNoToToggle(electionsAuthorize)}
                          onChange={(value) => setElectionsAuthorize(toggleToYesNo(value))}
                          disabled={saving}
                        />
                      </CraQuestionRow>
                    )}
                    <CraQuestionRow label="Foreign property over CAD 100,000?">
                      <YesNoToggle
                        className=""
                        value={yesNoToToggle(foreignPropertyOver100k)}
                        onChange={(value) => setForeignPropertyOver100k(toggleToYesNo(value))}
                        disabled={saving}
                      />
                    </CraQuestionRow>
                    <ProvincialCraQuestionBlocks
                      provinceCode={mainProvinceCode}
                      organDonorConsent={organDonorConsent}
                      onOrganDonorConsentChange={setOrganDonorConsent}
                      provincialElectionsCanadianCitizen={provincialElectionsCanadianCitizen}
                      onProvincialElectionsCanadianCitizenChange={setProvincialElectionsCanadianCitizen}
                      provincialElectionsAuthorize={provincialElectionsAuthorize}
                      onProvincialElectionsAuthorizeChange={setProvincialElectionsAuthorize}
                      disabled={saving}
                    />
                    <CraQuestionRow label="CRA email notifications consent?">
                      <YesNoToggle
                        className=""
                        value={yesNoToToggle(craEmailNotificationsConsent)}
                        onChange={(value) => setCraEmailNotificationsConsent(toggleToYesNo(value))}
                        disabled={saving}
                      />
                    </CraQuestionRow>
                    <CraQuestionRow label="CRA email address confirmed?">
                      <YesNoToggle
                        className=""
                        value={yesNoToToggle(craEmailConfirmed)}
                        onChange={(value) => setCraEmailConfirmed(toggleToYesNo(value))}
                        disabled={saving}
                      />
                    </CraQuestionRow>
                    <CraQuestionRow label="Foreign mailing address on file with CRA?">
                      <YesNoToggle
                        className=""
                        value={yesNoToToggle(craHasForeignMailingAddress)}
                        onChange={(value) => setCraHasForeignMailingAddress(toggleToYesNo(value))}
                        disabled={saving}
                      />
                    </CraQuestionRow>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-primary-dark">Question 5: Is there a spouse/common-law partner to include in household workflow?</p>
                <div className="inline-flex items-center gap-1 rounded-md border border-border bg-white p-1">
                  <button type="button" className={`px-3 py-1 text-xs rounded ${spouseApplicable ? 'bg-primary-dark text-white' : 'text-text'}`} onClick={() => { setSpouseApplicable(true); if (maritalStatus === 'single') setMaritalStatus('married') }} disabled={saving}>Yes</button>
                  <button type="button" className={`px-3 py-1 text-xs rounded ${!spouseApplicable ? 'bg-primary-dark text-white' : 'text-text'}`} onClick={() => { setSpouseApplicable(false); setMaritalStatus('single') }} disabled={saving}>No</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {isMarried && (
                    <select className="border border-border rounded-md px-3 py-2 text-sm" value={spouseReturnMode} onChange={(e) => setSpouseReturnMode(e.target.value as SpouseMode)} disabled={saving}>
                      <option value="summary">Spouse summary only</option>
                      <option value="full">Create full spouse return workspace</option>
                    </select>
                  )}
                  {isMarried && (
                    <select className="border border-border rounded-md px-3 py-2 text-sm" value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus)} disabled={saving}>
                      <option value="married">Married</option>
                      <option value="common_law">Common-law</option>
                    </select>
                  )}
                </div>

                {isMarried && spouseReturnMode === 'summary' && (
                  <>
                    <p className="text-sm font-medium text-primary-dark">Question 6: Spouse summary details</p>
                  <input className="border border-border rounded-md px-3 py-2 text-sm w-full" placeholder="Spouse full name" value={spouseFullName} onChange={(e) => setSpouseFullName(e.target.value)} disabled={saving} />
                  </>
                )}

                {isMarried && spouseReturnMode === 'full' && (
                  <>
                  <p className="text-sm font-medium text-primary-dark">Question 6: Spouse full return profile</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input className="border border-border rounded-md px-3 py-2 text-sm" placeholder="Spouse first name" value={spouseFirstName} onChange={(e) => setSpouseFirstName(e.target.value)} disabled={saving} />
                    <input className="border border-border rounded-md px-3 py-2 text-sm" placeholder="Spouse last name" value={spouseLastName} onChange={(e) => setSpouseLastName(e.target.value)} disabled={saving} />
                    <input className="border border-border rounded-md px-3 py-2 text-sm" type="date" value={spouseDateOfBirth} onChange={(e) => setSpouseDateOfBirth(e.target.value)} disabled={saving} />
                    <input className="border border-border rounded-md px-3 py-2 text-sm" placeholder="Spouse SIN (9 digits, optional)" value={spouseSin} onChange={(e) => setSpouseSin(e.target.value.replace(/\D/g, '').slice(0, 9))} disabled={saving} />
                    <input className="border border-border rounded-md px-3 py-2 text-sm md:col-span-2" type="email" placeholder="Spouse email (for CRA notifications)" value={spouseEmail} onChange={(e) => setSpouseEmail(e.target.value)} disabled={saving} />
                  </div>
                  <div className="space-y-2 border border-border rounded-md p-3 bg-background/40 mt-3">
                    <p className="text-sm font-semibold text-primary-dark">Question 7: Does spouse live at the same mailing address as main taxpayer?</p>
                    <div className="inline-flex items-center gap-1 rounded-md border border-border bg-white p-1">
                      <button type="button" className={`px-3 py-1 text-xs rounded ${spouseSameAddress ? 'bg-primary-dark text-white' : 'text-text'}`} onClick={() => setSpouseSameAddress(true)} disabled={saving}>Yes</button>
                      <button type="button" className={`px-3 py-1 text-xs rounded ${!spouseSameAddress ? 'bg-primary-dark text-white' : 'text-text'}`} onClick={() => setSpouseSameAddress(false)} disabled={saving}>No</button>
                    </div>
                    {!spouseSameAddress && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input className="border border-border rounded-md px-3 py-2 text-sm md:col-span-2" placeholder="Spouse mailing address line 1" value={spouseMailingAddressLine1} onChange={(e) => setSpouseMailingAddressLine1(e.target.value)} disabled={saving} />
                        <input className="border border-border rounded-md px-3 py-2 text-sm" placeholder="Spouse mailing city" value={spouseMailingCity} onChange={(e) => setSpouseMailingCity(e.target.value)} disabled={saving} />
                        <input className="border border-border rounded-md px-3 py-2 text-sm" placeholder="Spouse mailing postal code" value={spouseMailingPostalCode} onChange={(e) => setSpouseMailingPostalCode(e.target.value.toUpperCase())} disabled={saving} />
                        <ProvinceSelect
                          value={spouseMailingProvinceCode}
                          onChange={(code) => {
                            setSpouseMailingProvinceCode(code)
                            setSpouseOrganDonorConsent(clearOrganDonorIfNotApplicable(code, spouseOrganDonorConsent))
                            const cleared = clearProvincialElectionsIfNotApplicable(code, {
                              provincialElectionsCanadianCitizen: spouseProvincialElectionsCanadianCitizen,
                              provincialElectionsAuthorize: spouseProvincialElectionsAuthorize
                            })
                            setSpouseProvincialElectionsCanadianCitizen(cleared.provincialElectionsCanadianCitizen)
                            setSpouseProvincialElectionsAuthorize(cleared.provincialElectionsAuthorize)
                          }}
                          disabled={saving}
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 border border-border rounded-md p-3 bg-background/40 mt-3">
                    <p className="text-sm font-semibold text-primary-dark">Question 8: Spouse CRA questions</p>
                    <CraQuestionRow label="Do you want to use the same CRA answers as the main taxpayer?">
                      <YesNoToggle
                        className=""
                        value={spouseCraSameAsMain}
                        onChange={(value) => setSpouseCraSameAsMain(value !== false)}
                        disabled={saving}
                      />
                    </CraQuestionRow>
                    {!spouseCraSameAsMain && (
                      <div className="divide-y divide-border/70 rounded-md border border-border">
                        <CraQuestionRow label="Language of correspondence">
                          <select
                            className="border border-border rounded-md px-3 py-2 text-sm"
                            value={spouseLanguageCorrespondence}
                            onChange={(e) => setSpouseLanguageCorrespondence(e.target.value === 'fr' ? 'fr' : 'en')}
                            disabled={saving}
                          >
                            <option value="en">English</option>
                            <option value="fr">French</option>
                          </select>
                        </CraQuestionRow>
                        <CraQuestionRow label="First time filing with CRA?">
                          <YesNoToggle
                            className=""
                            value={yesNoToToggle(spouseFirstTimeFiler)}
                            onChange={(value) => setSpouseFirstTimeFiler(toggleToYesNo(value))}
                            disabled={saving}
                          />
                        </CraQuestionRow>
                        <CraQuestionRow label="Sold principal residence?">
                          <YesNoToggle
                            className=""
                            value={yesNoToToggle(spouseSoldPrincipalResidence)}
                            onChange={(value) => setSpouseSoldPrincipalResidence(toggleToYesNo(value))}
                            disabled={saving}
                          />
                        </CraQuestionRow>
                        <CraQuestionRow label="Treaty-exempt foreign service?">
                          <YesNoToggle
                            className=""
                            value={yesNoToToggle(spouseTreatyExemptForeignService)}
                            onChange={(value) => setSpouseTreatyExemptForeignService(toggleToYesNo(value))}
                            disabled={saving}
                          />
                        </CraQuestionRow>
                        <CraQuestionRow label="Elections Canada: Canadian citizen?">
                          <YesNoToggle
                            className=""
                            value={yesNoToToggle(spouseElectionsCanadianCitizen)}
                            onChange={(value) => {
                              setSpouseElectionsCanadianCitizen(toggleToYesNo(value))
                              if (value !== true) setSpouseElectionsAuthorize('no')
                            }}
                            disabled={saving}
                          />
                        </CraQuestionRow>
                        {spouseElectionsCanadianCitizen === 'yes' && (
                          <CraQuestionRow label="Elections Canada: authorize sharing?">
                            <YesNoToggle
                              className=""
                              value={yesNoToToggle(spouseElectionsAuthorize)}
                              onChange={(value) => setSpouseElectionsAuthorize(toggleToYesNo(value))}
                              disabled={saving}
                            />
                          </CraQuestionRow>
                        )}
                        <CraQuestionRow label="Foreign property over CAD 100,000?">
                          <YesNoToggle
                            className=""
                            value={yesNoToToggle(spouseForeignPropertyOver100k)}
                            onChange={(value) => setSpouseForeignPropertyOver100k(toggleToYesNo(value))}
                            disabled={saving}
                          />
                        </CraQuestionRow>
                        <ProvincialCraQuestionBlocks
                          provinceCode={spouseSameAddress ? mainProvinceCode : spouseMailingProvinceCode}
                          organDonorConsent={spouseOrganDonorConsent}
                          onOrganDonorConsentChange={setSpouseOrganDonorConsent}
                          provincialElectionsCanadianCitizen={spouseProvincialElectionsCanadianCitizen}
                          onProvincialElectionsCanadianCitizenChange={setSpouseProvincialElectionsCanadianCitizen}
                          provincialElectionsAuthorize={spouseProvincialElectionsAuthorize}
                          onProvincialElectionsAuthorizeChange={setSpouseProvincialElectionsAuthorize}
                          disabled={saving}
                        />
                        <CraQuestionRow label="CRA email notifications consent?">
                          <YesNoToggle
                            className=""
                            value={yesNoToToggle(spouseCraEmailNotificationsConsent)}
                            onChange={(value) => setSpouseCraEmailNotificationsConsent(toggleToYesNo(value))}
                            disabled={saving}
                          />
                        </CraQuestionRow>
                        <CraQuestionRow label="CRA email confirmed?">
                          <YesNoToggle
                            className=""
                            value={yesNoToToggle(spouseCraEmailConfirmed)}
                            onChange={(value) => setSpouseCraEmailConfirmed(toggleToYesNo(value))}
                            disabled={saving}
                          />
                        </CraQuestionRow>
                        <CraQuestionRow label="Foreign mailing address on file with CRA?">
                          <YesNoToggle
                            className=""
                            value={yesNoToToggle(spouseCraHasForeignMailingAddress)}
                            onChange={(value) => setSpouseCraHasForeignMailingAddress(toggleToYesNo(value))}
                            disabled={saving}
                          />
                        </CraQuestionRow>
                      </div>
                    )}
                  </div>
                  </>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-primary-dark">Are there dependants to include in this household return?</p>
                <div className="inline-flex items-center gap-1 rounded-md border border-border bg-white p-1">
                  <button
                    type="button"
                    className={`px-3 py-1 text-xs rounded ${dependentsApplicable ? 'bg-primary-dark text-white' : 'text-text'}`}
                    onClick={() => setDependentsApplicable(true)}
                    disabled={saving}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 text-xs rounded ${!dependentsApplicable ? 'bg-primary-dark text-white' : 'text-text'}`}
                    onClick={() => {
                      setDependentsApplicable(false)
                      setDependents([])
                    }}
                    disabled={saving}
                  >
                    No
                  </button>
                </div>
                {dependentsApplicable && (
                  <div className="space-y-3 border border-border rounded-md p-3 bg-background/40">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-primary-dark">Dependant details</p>
                        <p className="text-xs text-text-light mt-1">Full return workspaces are only required when income or filing rules apply.</p>
                      </div>
                      <button type="button" className="text-sm text-accent hover:underline shrink-0" onClick={addDependent} disabled={saving}>Add dependant</button>
                    </div>
                    {dependents.length === 0 && (
                      <p className="text-xs text-text-light">No dependants added yet.</p>
                    )}
                    {dependents.map((d) => (
                      <DependentIdentificationForm
                        key={d.id}
                        value={d}
                        taxYear={taxYear}
                        disabled={saving}
                        onChange={(patch) => updateDependent(d.id, patch)}
                        onRemove={() => removeDependent(d.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="text-sm text-text space-y-2">
                <p className="font-medium text-primary-dark">Review household workspace setup</p>
                <p><span className="font-semibold">Main taxpayer:</span> {mainFirstName.trim()} {mainLastName.trim()} · {taxYear}</p>
                <p><span className="font-semibold">Spouse workflow:</span> {isMarried ? `${maritalStatus} · ${spouseReturnMode}` : 'No spouse workspace'}</p>
                <p><span className="font-semibold">Dependents:</span> {dependentsApplicable ? `${dependents.length} total · ${dependents.filter((d) => dependentRequiresFullReturn(d)).length} full return workspace(s) required` : 'No dependants'}</p>
                <p className="text-xs text-text-light">Address and CRA setup answers are captured in this interview before workspaces are created.</p>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-2">
              <button type="button" className="text-sm text-text-light hover:text-primary-dark disabled:opacity-50" onClick={() => { void onBack() }} disabled={saving || step === 1}>Back</button>
              <div className="flex items-center gap-2">
                {draftSavedAt && (
                  <span className="text-xs text-text-light hidden sm:inline">
                    Saved {new Date(draftSavedAt).toLocaleTimeString()}
                  </span>
                )}
                {step < 4 && (
                  <button type="button" className="btn btn--primary text-sm px-4 py-2" disabled={saving} onClick={() => { void onNext() }}>
                    {saving ? 'Saving…' : 'Continue'}
                  </button>
                )}
                {step === 4 && (
                  <button type="button" className="btn btn--primary text-sm px-4 py-2" disabled={saving} onClick={() => { void onCreate() }}>
                    {saving ? 'Creating…' : 'Create household workspaces'}
                  </button>
                )}
              </div>
            </div>
            {err && (
              <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{err}</p>
            )}
            {createdInfo && (
              <p className="mt-3 text-sm text-green-800 bg-green-50 border border-green-200 rounded-md px-3 py-2">{createdInfo}</p>
            )}
          </section>
          )}

          <section className="bg-white p-4 rounded-lg border border-border shadow-sm">
            <h2 className="text-lg font-semibold text-primary-dark mb-3">Existing returns</h2>
            {loading && <p className="text-sm text-text-light">Loading…</p>}
            {!loading && returns.length === 0 && showCreateInterview && (
              <p className="text-sm text-text-light">No returns yet. Complete the household interview above to create your first return workspace.</p>
            )}
            {!loading && returns.length === 0 && !showCreateInterview && (
              <p className="text-sm text-text-light">No returns yet.</p>
            )}
            {!loading && returns.length > 0 && (
              <ul className="divide-y divide-border">
                {grouped.roots.map((r) => (
                  <li key={r.id} className="py-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-text">{r.taxpayer_name}</p>
                        <p className="text-xs text-text-light">
                          {r.tax_year} · {r.status} · {workspaceRoleLabel(r)} · updated {new Date(r.updated_at).toLocaleString()}
                        </p>
                        {String(r.workspace_role || 'primary') === 'primary' && (() => {
                          const readiness = computeSetupReadiness(r)
                          if (readiness.required === 0 && readiness.recommended === 0) {
                            return (
                              <Link
                                to={`${basePath}/returns/${r.id}?step=Setup&setupFocus=all`}
                                className="mt-1 inline-flex items-center text-[11px] text-green-800 border border-green-300 bg-green-50 rounded px-2 py-0.5 hover:bg-green-100"
                              >
                                Setup ready
                              </Link>
                            )
                          }
                          return (
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              {readiness.required > 0 && (
                                <Link
                                  to={`${basePath}/returns/${r.id}?step=Setup&setupFocus=required`}
                                  className="inline-flex items-center text-[11px] text-amber-900 border border-amber-300 bg-amber-50 rounded px-2 py-0.5 hover:bg-amber-100"
                                  title="Open builder setup and show required missing items"
                                >
                                  {readiness.required} required
                                </Link>
                              )}
                              {readiness.recommended > 0 && (
                                <Link
                                  to={`${basePath}/returns/${r.id}?step=Setup&setupFocus=all`}
                                  className="inline-flex items-center text-[11px] text-blue-900 border border-blue-300 bg-blue-50 rounded px-2 py-0.5 hover:bg-blue-100"
                                  title="Open builder setup and review all missing items"
                                >
                                  {readiness.recommended} review
                                </Link>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50"
                          disabled={deletingId === r.id}
                          onClick={() => { void onDelete(r.id, r.taxpayer_name, r.tax_year) }}
                        >
                          {deletingId === r.id ? 'Deleting…' : 'Delete'}
                        </button>
                        <Link
                          to={`${basePath}/returns/${r.id}`}
                          className="text-sm font-medium text-accent hover:underline"
                        >
                          Open builder
                        </Link>
                      </div>
                    </div>
                    {(grouped.childrenByParent.get(r.id) || []).length > 0 && (
                      <ul className="ml-4 border-l border-border pl-3 space-y-2">
                        {(grouped.childrenByParent.get(r.id) || []).map((child) => (
                          <li key={child.id} className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-text">{child.taxpayer_name}</p>
                              <p className="text-xs text-text-light">{child.tax_year} · {workspaceRoleLabel(child)}</p>
                            </div>
                            <Link
                              to={`${basePath}/returns/${child.id}`}
                              className="text-sm font-medium text-accent hover:underline"
                            >
                              Open
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
                {grouped.roots.length === 0 && returns.map((r) => (
                  <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-text">{r.taxpayer_name}</p>
                      <p className="text-xs text-text-light">
                        {r.tax_year} · {r.status} · {workspaceRoleLabel(r)} · updated {new Date(r.updated_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50"
                        disabled={deletingId === r.id}
                        onClick={() => { void onDelete(r.id, r.taxpayer_name, r.tax_year) }}
                      >
                        {deletingId === r.id ? 'Deleting…' : 'Delete'}
                      </button>
                      <Link
                        to={`${basePath}/returns/${r.id}`}
                        className="text-sm font-medium text-accent hover:underline"
                      >
                        Open builder
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </ClientPortalShell>
    </>
  )
}

export default TaxReturns
