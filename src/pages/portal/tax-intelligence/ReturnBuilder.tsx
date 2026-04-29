import { FC, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../../components/SEO'
import ClientPortalShell from '../../../components/ClientPortalShell'
import { taxFetch } from '../../../lib/taxIntelligenceApi'
import { getTaxBasePath } from './path'
import { SLIP_DEFINITIONS, SLIP_DEFINITIONS_BY_CODE } from '../../../lib/taxSlips/definitions'

type TaxReturnPayload = {
  taxReturn: {
    id: string
    tax_year: number
    taxpayer_name: string
    taxpayer_first_name?: string | null
    taxpayer_last_name?: string | null
    taxpayer_sin?: string | null
    taxpayer_sin_last4?: string | null
    taxpayer_date_of_birth?: string | null
    status: string
    province_code?: string
    setup_json?: Record<string, unknown>
    taxpayer_profile?: {
      maritalStatus?: string
      spouseReturnMode?: string
      email?: string
      mailingAddressLine1?: string
      mailingPoBox?: string
      mailingRR?: string
      mailingCity?: string
      mailingProvinceCode?: string
      mailingPostalCode?: string
      residenceProvinceDec31?: string
      residenceProvinceCurrent?: string
      selfEmploymentProvinces?: string
      languageCorrespondence?: 'en' | 'fr'
      becameResidentDate?: string | null
      ceasedResidentDate?: string | null
      maritalStatusChangeDate?: string | null
      deceasedDate?: string | null
      electionsCanadianCitizen?: boolean | null
      electionsAuthorize?: boolean | null
      indianActExemptIncome?: boolean
      foreignPropertyOver100k?: boolean | null
      organDonorConsent?: boolean | null
      spouseSelfEmployed?: boolean
      spouseNetIncome23600?: number
      spouseUccb11700?: number
      spouseUccbRepayment21300?: number
      spouse?: {
        fullName?: string
        firstName?: string
        lastName?: string
        dateOfBirth?: string | null
        fullSin?: string
        sinLast4?: string
        netIncome?: number
      }
      dependents?: Array<{
        fullName?: string
        relationship?: string
        dateOfBirth?: string | null
        disability?: boolean
      }>
    }
  }
  incomeEntries: Array<{
    id: string
    category: string
    description: string | null
    amount: number
    source_type?: string
    metadata?: Record<string, unknown>
  }>
  deductions: Array<{
    id: string
    category: string
    description: string | null
    amount: number
    is_credit: boolean
    metadata?: Record<string, unknown>
  }>
  calculation?: {
    taxable_income: number
    total_payable: number
    refund_or_balance: number
    assumptions?: {
      comparative?: {
        self?: {
          netIncome?: number
          taxableIncome?: number
          estimatedTaxBeforeCredits?: number
          taxesWithheld?: number
        }
        spouse?: {
          netIncome?: number
          taxableIncome?: number
          estimatedTaxBeforeCredits?: number
          taxesWithheld?: number
        }
      }
      optimization?: {
        pensionSplit?: {
          splitSourceRole?: string
          recommendedSplit?: number
          estimatedTaxSavingsBeforeCredits?: number
        } | null
      }
    }
  }
}

type DependentProfile = {
  fullName: string
  relationship: string
  dateOfBirth: string
  disability: boolean
}

type TaxpayerProfileState = {
  firstName: string
  lastName: string
  dateOfBirth: string
  sin: string
  email: string
  mailingAddressLine1: string
  mailingPoBox: string
  mailingRR: string
  mailingCity: string
  mailingProvinceCode: string
  mailingPostalCode: string
  residenceProvinceDec31: string
  residenceProvinceCurrent: string
  selfEmploymentProvinces: string
  languageCorrespondence: 'en' | 'fr'
  becameResidentDate: string
  ceasedResidentDate: string
  maritalStatusChangeDate: string
  deceasedDate: string
  electionsCanadianCitizen: '' | 'yes' | 'no'
  electionsAuthorize: '' | 'yes' | 'no'
  indianActExemptIncome: boolean
  foreignPropertyOver100k: '' | 'yes' | 'no'
  organDonorConsent: '' | 'yes' | 'no'
  maritalStatus: 'single' | 'married' | 'common_law' | 'separated' | 'divorced' | 'widowed'
  spouseReturnMode: 'summary' | 'full'
  spouseSelfEmployed: boolean
  spouseNetIncome23600: number
  spouseUccb11700: number
  spouseUccbRepayment21300: number
  spouse: {
    fullName: string
    firstName: string
    lastName: string
    dateOfBirth: string
    fullSin: string
    netIncome: number
  }
  dependents: DependentProfile[]
}

const steps = ['Setup', 'Income', 'Deductions', 'Review', 'Optimization', 'Risk'] as const
type Step = typeof steps[number]
type CompletenessSeverity = 'required' | 'recommended'
type CompletenessIssue = { field: string; message: string; severity: CompletenessSeverity }

type SlipRow = {
  slipCode: string
  payerName: string
  taxYear: number
  taxpayerRole: 'self' | 'spouse'
  boxes: Record<string, number>
}

type LineMappingRow = {
  source: string
  mappedTo: string
  category: string
  amount: number
  status: 'OK' | 'REVIEW'
  reason: string
}

function sanitizeSin (value: string): string {
  return String(value || '').replace(/\D/g, '').slice(0, 9)
}

function coerceNullableBoolean (value: unknown): boolean | null {
  if (value == null || value === '') return null
  if (typeof value === 'boolean') return value
  const normalized = String(value).toLowerCase().trim()
  if (normalized === 'yes' || normalized === 'true' || normalized === '1') return true
  if (normalized === 'no' || normalized === 'false' || normalized === '0') return false
  return null
}

function asYesNo (value: boolean | null): '' | 'yes' | 'no' {
  if (value == null) return ''
  return value ? 'yes' : 'no'
}

const T1_DEDUCTION_FIELDS = [
  { key: 'rrsp', label: 'RRSP deduction', lineRef: '20800', category: 'rrsp', isCredit: false },
  { key: 'fhsa_deduction', label: 'FHSA deduction', lineRef: '20805', category: 'fhsa_deduction', isCredit: false },
  { key: 'union_dues', label: 'Annual union/professional dues', lineRef: '21200', category: 'union_dues', isCredit: false },
  { key: 'child_care_expenses', label: 'Child care expenses', lineRef: '21400', category: 'child_care_expenses', isCredit: false },
  { key: 'moving_expenses', label: 'Moving expenses', lineRef: '21900', category: 'moving_expenses', isCredit: false },
  { key: 'cpp2_contributions', label: 'CPP enhanced contributions deduction', lineRef: '22215', category: 'cpp2_contributions', isCredit: false },
  { key: 'tuition_amount', label: 'Tuition amount', lineRef: '32300', category: 'tuition_amount', isCredit: true },
  { key: 'medical_expenses', label: 'Medical expenses (self/family)', lineRef: '33099', category: 'medical_expenses', isCredit: true },
  { key: 'donations', label: 'Donations and gifts', lineRef: '34900', category: 'donations', isCredit: true }
] as const

const DEFAULT_TAXPAYER_PROFILE: TaxpayerProfileState = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  sin: '',
  email: '',
  mailingAddressLine1: '',
  mailingPoBox: '',
  mailingRR: '',
  mailingCity: '',
  mailingProvinceCode: '',
  mailingPostalCode: '',
  residenceProvinceDec31: '',
  residenceProvinceCurrent: '',
  selfEmploymentProvinces: '',
  languageCorrespondence: 'en',
  becameResidentDate: '',
  ceasedResidentDate: '',
  maritalStatusChangeDate: '',
  deceasedDate: '',
  electionsCanadianCitizen: '',
  electionsAuthorize: '',
  indianActExemptIncome: false,
  foreignPropertyOver100k: '',
  organDonorConsent: '',
  maritalStatus: 'single',
  spouseReturnMode: 'summary',
  spouseSelfEmployed: false,
  spouseNetIncome23600: 0,
  spouseUccb11700: 0,
  spouseUccbRepayment21300: 0,
  spouse: {
    fullName: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    fullSin: '',
    netIncome: 0
  },
  dependents: []
}

const ReturnBuilder: FC = () => {
  const { id = '' } = useParams()
  const { getToken } = useAuth()
  const location = useLocation()
  const basePath = useMemo(() => getTaxBasePath(location.pathname), [location.pathname])
  const [activeStep, setActiveStep] = useState<Step>('Setup')
  const [data, setData] = useState<TaxReturnPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null)
  const [taxpayerProfile, setTaxpayerProfile] = useState<TaxpayerProfileState>(DEFAULT_TAXPAYER_PROFILE)
  const [incomeRows, setIncomeRows] = useState<Array<{ category: string; description: string; amount: number; taxpayerRole: 'self' | 'spouse' }>>([])
  const [manualSlipRows, setManualSlipRows] = useState<SlipRow[]>([])
  const [deductionRows, setDeductionRows] = useState<Array<{ category: string; description: string; amount: number; isCredit: boolean; taxpayerRole: 'self' | 'spouse' }>>([])
  const [deductionFormValues, setDeductionFormValues] = useState<Record<string, { self: number; spouse: number }>>({})
  const [returnRole, setReturnRole] = useState<'self' | 'spouse'>('self')
  const [documents, setDocuments] = useState<Array<{ id: string; file_name: string }>>([])
  const [selectedDocumentId, setSelectedDocumentId] = useState('')
  const [newSlipCode, setNewSlipCode] = useState('T4')
  const [setupIssueFilter, setSetupIssueFilter] = useState<'all' | 'required'>('all')

  const requestedStep = useMemo<Step | null>(() => {
    const value = new URLSearchParams(location.search).get('step')
    if (!value) return null
    const normalized = value.toLowerCase().trim()
    if (normalized === 'setup') return 'Setup'
    if (normalized === 'income') return 'Income'
    if (normalized === 'deductions') return 'Deductions'
    if (normalized === 'review') return 'Review'
    if (normalized === 'optimization') return 'Optimization'
    if (normalized === 'risk') return 'Risk'
    return null
  }, [location.search])

  const requestedSetupFocus = useMemo<'all' | 'required'>(() => {
    const value = new URLSearchParams(location.search).get('setupFocus')
    return String(value || '').toLowerCase() === 'required' ? 'required' : 'all'
  }, [location.search])

  const createSlipRow = (slipCode: string): SlipRow => ({
    slipCode,
    payerName: '',
    taxYear: data?.taxReturn?.tax_year || new Date().getFullYear(),
    taxpayerRole: 'self',
    boxes: Object.fromEntries((SLIP_DEFINITIONS_BY_CODE[slipCode]?.boxes || []).map((b) => [b.code, 0]))
  })
  const hasSpouseReturnMode =
    (taxpayerProfile.maritalStatus === 'married' || taxpayerProfile.maritalStatus === 'common_law') &&
    taxpayerProfile.spouseReturnMode === 'full'
  const setupCompletenessIssues = useMemo<CompletenessIssue[]>(() => {
    const issues: CompletenessIssue[] = []
    const married = taxpayerProfile.maritalStatus === 'married' || taxpayerProfile.maritalStatus === 'common_law'
    const spouseMode = married ? taxpayerProfile.spouseReturnMode : 'summary'
    const missing = (value: string) => !String(value || '').trim()

    if (missing(taxpayerProfile.firstName)) issues.push({ field: 'firstName', message: 'Taxpayer first name is missing.', severity: 'required' })
    if (missing(taxpayerProfile.lastName)) issues.push({ field: 'lastName', message: 'Taxpayer last name is missing.', severity: 'required' })
    if (!sanitizeSin(taxpayerProfile.sin)) issues.push({ field: 'sin', message: 'Taxpayer SIN is missing or incomplete.', severity: 'required' })
    if (missing(taxpayerProfile.dateOfBirth)) issues.push({ field: 'dateOfBirth', message: 'Taxpayer date of birth is missing.', severity: 'required' })
    if (missing(taxpayerProfile.mailingAddressLine1)) issues.push({ field: 'mailingAddressLine1', message: 'Mailing address line is missing.', severity: 'required' })
    if (missing(taxpayerProfile.mailingCity)) issues.push({ field: 'mailingCity', message: 'Mailing city is missing.', severity: 'required' })
    if (missing(taxpayerProfile.mailingProvinceCode)) issues.push({ field: 'mailingProvinceCode', message: 'Mailing province/territory is missing.', severity: 'required' })
    if (missing(taxpayerProfile.mailingPostalCode)) issues.push({ field: 'mailingPostalCode', message: 'Mailing postal code is missing.', severity: 'required' })
    if (missing(taxpayerProfile.residenceProvinceDec31)) issues.push({ field: 'residenceProvinceDec31', message: 'Province/territory of residence on Dec 31 is missing.', severity: 'required' })
    if (taxpayerProfile.electionsCanadianCitizen === '') issues.push({ field: 'electionsCanadianCitizen', message: 'Elections Canada citizenship question is unanswered.', severity: 'recommended' })
    if (taxpayerProfile.electionsCanadianCitizen === 'yes' && taxpayerProfile.electionsAuthorize === '') {
      issues.push({ field: 'electionsAuthorize', message: 'Elections Canada authorization question is unanswered.', severity: 'recommended' })
    }
    if (taxpayerProfile.foreignPropertyOver100k === '') issues.push({ field: 'foreignPropertyOver100k', message: 'Foreign property question is unanswered.', severity: 'recommended' })

    if (married) {
      if (spouseMode === 'full') {
        if (missing(taxpayerProfile.spouse.firstName)) issues.push({ field: 'spouse.firstName', message: 'Spouse first name is missing for full spouse return mode.', severity: 'required' })
        if (missing(taxpayerProfile.spouse.lastName)) issues.push({ field: 'spouse.lastName', message: 'Spouse last name is missing for full spouse return mode.', severity: 'required' })
        if (missing(taxpayerProfile.spouse.dateOfBirth)) issues.push({ field: 'spouse.dateOfBirth', message: 'Spouse date of birth is missing for full spouse return mode.', severity: 'required' })
        if (!sanitizeSin(taxpayerProfile.spouse.fullSin)) issues.push({ field: 'spouse.fullSin', message: 'Spouse SIN is missing or incomplete for full spouse return mode.', severity: 'required' })
      } else if (missing(taxpayerProfile.spouse.fullName)) {
        issues.push({ field: 'spouse.fullName', message: 'Spouse full name is missing for summary spouse mode.', severity: 'required' })
      }
      if (taxpayerProfile.spouseNetIncome23600 < 0) {
        issues.push({ field: 'spouseNetIncome23600', message: 'Spouse net income (line 23600) cannot be negative.', severity: 'recommended' })
      }
    }
    return issues
  }, [taxpayerProfile])
  const requiredSetupIssueCount = useMemo(
    () => setupCompletenessIssues.filter((item) => item.severity === 'required').length,
    [setupCompletenessIssues]
  )
  const recommendedSetupIssueCount = useMemo(
    () => setupCompletenessIssues.filter((item) => item.severity === 'recommended').length,
    [setupCompletenessIssues]
  )
  const visibleSetupCompletenessIssues = useMemo(
    () => (setupIssueFilter === 'required'
      ? setupCompletenessIssues.filter((item) => item.severity === 'required')
      : setupCompletenessIssues),
    [setupCompletenessIssues, setupIssueFilter]
  )

  useEffect(() => {
    if (requestedStep) setActiveStep(requestedStep)
  }, [requestedStep])

  useEffect(() => {
    setSetupIssueFilter(requestedSetupFocus)
  }, [requestedSetupFocus])

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [returnData, docs] = await Promise.all([
        taxFetch<TaxReturnPayload>(`/tax-returns/${id}`, getToken),
        taxFetch<{ documents: Array<{ id: string; file_name: string }> }>('/documents/for-tax', getToken)
      ])
      setData(returnData)
      const setupJson = (returnData.taxReturn.setup_json || {}) as Record<string, unknown>
      const setupProfile = (setupJson.taxpayerProfile || {}) as Record<string, unknown>
      const dbProfile = (returnData.taxReturn.taxpayer_profile || {}) as Record<string, unknown>
      const spouseObj = (dbProfile.spouse as Record<string, unknown> | undefined) || (setupProfile.spouse as Record<string, unknown> | undefined) || {}
      const dependentsRaw = Array.isArray(dbProfile.dependents)
        ? dbProfile.dependents
        : (Array.isArray(setupProfile.dependents) ? setupProfile.dependents : [])
      setTaxpayerProfile({
        firstName: String(returnData.taxReturn.taxpayer_first_name || ''),
        lastName: String(returnData.taxReturn.taxpayer_last_name || ''),
        dateOfBirth: String(returnData.taxReturn.taxpayer_date_of_birth || ''),
        sin: String(returnData.taxReturn.taxpayer_sin || ''),
        email: String(dbProfile.email || setupProfile.email || ''),
        mailingAddressLine1: String(dbProfile.mailingAddressLine1 || setupProfile.mailingAddressLine1 || ''),
        mailingPoBox: String(dbProfile.mailingPoBox || setupProfile.mailingPoBox || ''),
        mailingRR: String(dbProfile.mailingRR || setupProfile.mailingRR || ''),
        mailingCity: String(dbProfile.mailingCity || setupProfile.mailingCity || ''),
        mailingProvinceCode: String(dbProfile.mailingProvinceCode || setupProfile.mailingProvinceCode || ''),
        mailingPostalCode: String(dbProfile.mailingPostalCode || setupProfile.mailingPostalCode || ''),
        residenceProvinceDec31: String(dbProfile.residenceProvinceDec31 || setupProfile.residenceProvinceDec31 || ''),
        residenceProvinceCurrent: String(dbProfile.residenceProvinceCurrent || setupProfile.residenceProvinceCurrent || ''),
        selfEmploymentProvinces: String(dbProfile.selfEmploymentProvinces || setupProfile.selfEmploymentProvinces || ''),
        languageCorrespondence: String(dbProfile.languageCorrespondence || setupProfile.languageCorrespondence || 'en') === 'fr' ? 'fr' : 'en',
        becameResidentDate: String(dbProfile.becameResidentDate || setupProfile.becameResidentDate || ''),
        ceasedResidentDate: String(dbProfile.ceasedResidentDate || setupProfile.ceasedResidentDate || ''),
        maritalStatusChangeDate: String(dbProfile.maritalStatusChangeDate || setupProfile.maritalStatusChangeDate || ''),
        deceasedDate: String(dbProfile.deceasedDate || setupProfile.deceasedDate || ''),
        electionsCanadianCitizen: asYesNo(coerceNullableBoolean(dbProfile.electionsCanadianCitizen ?? setupProfile.electionsCanadianCitizen)),
        electionsAuthorize: asYesNo(coerceNullableBoolean(dbProfile.electionsAuthorize ?? setupProfile.electionsAuthorize)),
        indianActExemptIncome: Boolean(coerceNullableBoolean(dbProfile.indianActExemptIncome ?? setupProfile.indianActExemptIncome)),
        foreignPropertyOver100k: asYesNo(coerceNullableBoolean(dbProfile.foreignPropertyOver100k ?? setupProfile.foreignPropertyOver100k)),
        organDonorConsent: asYesNo(coerceNullableBoolean(dbProfile.organDonorConsent ?? setupProfile.organDonorConsent)),
        maritalStatus: (['single', 'married', 'common_law', 'separated', 'divorced', 'widowed'].includes(String(dbProfile.maritalStatus || setupProfile.maritalStatus))
          ? String(dbProfile.maritalStatus || setupProfile.maritalStatus)
          : 'single') as TaxpayerProfileState['maritalStatus'],
        spouseReturnMode: String(dbProfile.spouseReturnMode || setupProfile.spouseReturnMode || 'summary') === 'full' ? 'full' : 'summary',
        spouseSelfEmployed: Boolean(coerceNullableBoolean(dbProfile.spouseSelfEmployed ?? setupProfile.spouseSelfEmployed)),
        spouseNetIncome23600: Number(dbProfile.spouseNetIncome23600 ?? setupProfile.spouseNetIncome23600 ?? spouseObj.netIncome ?? 0),
        spouseUccb11700: Number(dbProfile.spouseUccb11700 ?? setupProfile.spouseUccb11700 ?? 0),
        spouseUccbRepayment21300: Number(dbProfile.spouseUccbRepayment21300 ?? setupProfile.spouseUccbRepayment21300 ?? 0),
        spouse: {
          fullName: String(spouseObj.fullName || ''),
          firstName: String(spouseObj.firstName || ''),
          lastName: String(spouseObj.lastName || ''),
          dateOfBirth: String(spouseObj.dateOfBirth || ''),
          fullSin: String(spouseObj.fullSin || ''),
          netIncome: Number(spouseObj.netIncome || 0)
        },
        dependents: dependentsRaw.map((d) => {
          const dep = d as Record<string, unknown>
          return {
            fullName: String(dep.fullName || ''),
            relationship: String(dep.relationship || ''),
            dateOfBirth: String(dep.dateOfBirth || ''),
            disability: Boolean(dep.disability)
          }
        })
      })
      const manualSlipEntries = (returnData.incomeEntries || []).filter(
        (r) => r.source_type === 'manual_slip' || r.source_type === 'manual_t4' || String(r?.metadata?.slipType || '').length > 0
      )
      const nonSlipEntries = (returnData.incomeEntries || []).filter(
        (r) => !(r.source_type === 'manual_slip' || r.source_type === 'manual_t4' || String(r?.metadata?.slipType || '').length > 0)
      )
      setIncomeRows(nonSlipEntries.map((r) => ({
        category: r.category,
        description: r.description || '',
        amount: Number(r.amount || 0),
        taxpayerRole: String((r.metadata || {}).taxpayerRole || 'self') === 'spouse' ? 'spouse' : 'self'
      })))
      const grouped = new Map<string, SlipRow>()
      for (const entry of manualSlipEntries) {
        const meta = (entry.metadata || {}) as Record<string, unknown>
        const slipType = String(meta.slipType || 'T4')
        const manualSlipId = String(meta.manualSlipId || `${slipType}-${entry.id}`)
        const boxCode = String(meta.boxCode || '')
        const boxValue = Number(meta.boxValue || 0)
        if (!grouped.has(manualSlipId)) {
          grouped.set(manualSlipId, {
            slipCode: slipType,
            payerName: String(meta.payerName || ''),
            taxYear: Number(meta.taxYear || returnData.taxReturn.tax_year || new Date().getFullYear()),
            taxpayerRole: String(meta.taxpayerRole || 'self') === 'spouse' ? 'spouse' : 'self',
            boxes: Object.fromEntries((SLIP_DEFINITIONS_BY_CODE[slipType]?.boxes || []).map((b) => [b.code, 0]))
          })
        }
        const row = grouped.get(manualSlipId)
        if (!row) continue
        if (boxCode) row.boxes[boxCode] = Number.isFinite(boxValue) ? boxValue : 0
      }
      setManualSlipRows(Array.from(grouped.values()))
      const structuredCategories: Set<string> = new Set(T1_DEDUCTION_FIELDS.map((f) => f.category))
      setDeductionRows(
        (returnData.deductions || [])
          .filter((r) => !structuredCategories.has(r.category))
          .map((r) => ({
            category: r.category,
            description: r.description || '',
            amount: Number(r.amount || 0),
            isCredit: Boolean(r.is_credit),
            taxpayerRole: String((r.metadata || {}).taxpayerRole || 'self') === 'spouse' ? 'spouse' : 'self'
          }))
      )
      const nextFormValues: Record<string, { self: number; spouse: number }> = {}
      for (const field of T1_DEDUCTION_FIELDS) {
        const matching = (returnData.deductions || []).filter((d) => d.category === field.category)
        nextFormValues[field.key] = {
          self: matching
            .filter((d) => String((d.metadata || {}).taxpayerRole || 'self') !== 'spouse')
            .reduce((sum, d) => sum + Number(d.amount || 0), 0),
          spouse: matching
            .filter((d) => String((d.metadata || {}).taxpayerRole || 'self') === 'spouse')
            .reduce((sum, d) => sum + Number(d.amount || 0), 0)
        }
      }
      setDeductionFormValues(nextFormValues)
      setDocuments(docs.documents || [])
      setProfileSavedMsg(null)
      setErr(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load return builder')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!hasSpouseReturnMode && returnRole === 'spouse') setReturnRole('self')
  }, [hasSpouseReturnMode, returnRole])

  useEffect(() => {
    const married = taxpayerProfile.maritalStatus === 'married' || taxpayerProfile.maritalStatus === 'common_law'
    if (!married && taxpayerProfile.spouseReturnMode !== 'summary') {
      setTaxpayerProfile((prev) => ({ ...prev, spouseReturnMode: 'summary' }))
    }
  }, [taxpayerProfile.maritalStatus, taxpayerProfile.spouseReturnMode])

  const addIncomeRow = (role: 'self' | 'spouse') => setIncomeRows((prev) => [...prev, { category: 'employment_income', description: '', amount: 0, taxpayerRole: role }])
  const addSlipRow = (role: 'self' | 'spouse') => setManualSlipRows((prev) => [...prev, { ...createSlipRow(newSlipCode), taxpayerRole: role }])
  const addDeductionRow = (role: 'self' | 'spouse') => setDeductionRows((prev) => [...prev, { category: 'rrsp', description: '', amount: 0, isCredit: false, taxpayerRole: role }])
  const lineMappingRows = useMemo<LineMappingRow[]>(() => {
    const rows: LineMappingRow[] = []
    for (const entry of data?.incomeEntries || []) {
      const meta = (entry.metadata || {}) as Record<string, unknown>
      const slipType = String(meta.slipType || '')
      const boxCode = String(meta.boxCode || '')
      const lineRef = String(meta.lineRef || '')
      const scheduleRef = String(meta.scheduleRef || '')
      if (!slipType || !lineRef) continue
      const def = SLIP_DEFINITIONS_BY_CODE[slipType]
      const boxDef = def?.boxes.find((b) => b.code === boxCode)
      const expectedCategories = (boxDef?.targets || []).map((t) => t.category)
      const expectedLineRefs = (boxDef?.targets || []).map((t) => String(t.lineRef || '')).filter(Boolean)
      const expectedScheduleRefs = (boxDef?.targets || []).map((t) => String(t.scheduleRef || ''))

      let status: 'OK' | 'REVIEW' = 'OK'
      let reason = 'Mapping matches configured CRA slip box target.'
      if (!def) {
        status = 'REVIEW'
        reason = 'Unknown slip type. Confirm mapping manually.'
      } else if (!boxDef) {
        status = 'REVIEW'
        reason = 'Box is not registered for this slip type.'
      } else if (expectedCategories.length > 0 && !expectedCategories.includes(entry.category)) {
        status = 'REVIEW'
        reason = `Category mismatch. Expected one of: ${expectedCategories.join(', ')}.`
      } else if (expectedLineRefs.length > 0 && !expectedLineRefs.includes(lineRef)) {
        status = 'REVIEW'
        reason = `Line mismatch. Expected one of: ${expectedLineRefs.map((x) => `Line ${x}`).join(', ')}.`
      } else if (scheduleRef && expectedScheduleRefs.length > 0 && !expectedScheduleRefs.includes(scheduleRef)) {
        status = 'REVIEW'
        reason = `Schedule mismatch. Expected one of: ${expectedScheduleRefs.filter(Boolean).join(', ')}.`
      } else if (Number(entry.amount || 0) <= 0) {
        status = 'REVIEW'
        reason = 'Amount should be greater than zero.'
      }

      rows.push({
        source: boxCode ? `${slipType} box ${boxCode}` : slipType,
        mappedTo: scheduleRef ? `Line ${lineRef} (${scheduleRef})` : `Line ${lineRef}`,
        category: entry.category,
        amount: Number(entry.amount || 0),
        status,
        reason
      })
    }
    return rows
  }, [data?.incomeEntries])

  const saveIncome = async () => {
    setSaving(true)
    try {
      const manualEntries = incomeRows.map((r) => ({
        category: r.category,
        description: r.description,
        amount: Number(r.amount || 0),
        sourceType: 'manual',
        isManual: true,
        metadata: {
          taxpayerRole: r.taxpayerRole || 'self'
        }
      }))
      const slipEntries = manualSlipRows.flatMap((slip) => {
        const def = SLIP_DEFINITIONS_BY_CODE[slip.slipCode]
        if (!def) return []
        const manualSlipId = crypto.randomUUID()
        const entries: Array<Record<string, unknown>> = []
        for (const boxDef of def.boxes) {
          const boxValue = Number(slip.boxes[boxDef.code] || 0)
          if (!Number.isFinite(boxValue) || boxValue === 0) continue
          for (const target of boxDef.targets) {
            entries.push({
              category: target.category,
              description: `${def.code} box ${boxDef.code}: ${target.description}`,
              amount: boxValue,
              sourceType: 'manual_slip',
              isManual: true,
              metadata: {
                slipType: def.code,
                payerName: slip.payerName || null,
                taxYear: Number(slip.taxYear || (data?.taxReturn?.tax_year || new Date().getFullYear())),
                taxpayerRole: slip.taxpayerRole || 'self',
                boxCode: boxDef.code,
                boxValue,
                lineRef: target.lineRef || null,
                scheduleRef: target.scheduleRef || null,
                asWithholding: Boolean(target.asWithholding),
                incomeTaxDeducted: target.asWithholding ? boxValue : 0,
                manualSlipId
              }
            })
          }
        }
        return entries
      })
      await taxFetch(`/tax-returns/${id}/income`, getToken, {
        method: 'PUT',
        body: JSON.stringify({
          entries: [...manualEntries, ...slipEntries]
        })
      })
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save income')
    } finally {
      setSaving(false)
    }
  }

  const saveDeductions = async () => {
    setSaving(true)
    try {
      const structuredEntries = T1_DEDUCTION_FIELDS
        .flatMap((field) => (['self', 'spouse'] as const).map((role) => ({
          category: field.category,
          description: `Line ${field.lineRef}: ${field.label} (${role === 'self' ? 'Taxpayer' : 'Spouse'})`,
          amount: Number(deductionFormValues[field.key]?.[role] || 0),
          isCredit: field.isCredit,
          metadata: { lineRef: field.lineRef, source: 't1_deduction_form', taxpayerRole: role }
        })))
        .filter((row) => Number.isFinite(row.amount) && row.amount > 0)

      await taxFetch(`/tax-returns/${id}/deductions`, getToken, {
        method: 'PUT',
        body: JSON.stringify({
          entries: [
            ...structuredEntries,
            ...deductionRows
              .map((r) => ({
                category: r.category,
                description: r.description,
                amount: Number(r.amount || 0),
                isCredit: r.isCredit,
                metadata: {
                  taxpayerRole: r.taxpayerRole || 'self'
                }
              }))
              .filter((r) => Number.isFinite(r.amount) && r.amount > 0)
          ]
        })
      })
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save deductions')
    } finally {
      setSaving(false)
    }
  }

  const importFromDocument = async () => {
    if (!selectedDocumentId) return
    setSaving(true)
    try {
      await taxFetch('/documents/extract', getToken, {
        method: 'POST',
        body: JSON.stringify({
          documentId: selectedDocumentId,
          taxReturnId: id
        })
      })
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not import from document')
    } finally {
      setSaving(false)
    }
  }

  const runCalculation = async () => {
    setSaving(true)
    try {
      await taxFetch(`/tax-returns/${id}/calculate`, getToken, { method: 'POST' })
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not calculate return')
    } finally {
      setSaving(false)
    }
  }

  const runAudit = async () => {
    setSaving(true)
    try {
      await taxFetch('/audit/run', getToken, {
        method: 'POST',
        body: JSON.stringify({ taxReturnId: id })
      })
      await load()
      setActiveStep('Risk')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not run audit')
    } finally {
      setSaving(false)
    }
  }

  const addDependent = () => {
    setTaxpayerProfile((prev) => ({
      ...prev,
      dependents: [...prev.dependents, { fullName: '', relationship: '', dateOfBirth: '', disability: false }]
    }))
  }

  const removeDependent = (idx: number) => {
    setTaxpayerProfile((prev) => ({
      ...prev,
      dependents: prev.dependents.filter((_, i) => i !== idx)
    }))
  }

  const saveTaxpayerProfile = async () => {
    if (!data?.taxReturn?.id) return
    setSaving(true)
    setProfileSavedMsg(null)
    setErr(null)
    try {
      const married = taxpayerProfile.maritalStatus === 'married' || taxpayerProfile.maritalStatus === 'common_law'
      const spouseMode = married ? taxpayerProfile.spouseReturnMode : 'summary'

      const fullName = `${taxpayerProfile.firstName} ${taxpayerProfile.lastName}`.trim() || data.taxReturn.taxpayer_name
      const normalizedProfile = {
        maritalStatus: taxpayerProfile.maritalStatus,
        spouseReturnMode: spouseMode,
        email: taxpayerProfile.email.trim(),
        mailingAddressLine1: taxpayerProfile.mailingAddressLine1.trim(),
        mailingPoBox: taxpayerProfile.mailingPoBox.trim(),
        mailingRR: taxpayerProfile.mailingRR.trim(),
        mailingCity: taxpayerProfile.mailingCity.trim(),
        mailingProvinceCode: taxpayerProfile.mailingProvinceCode.trim(),
        mailingPostalCode: taxpayerProfile.mailingPostalCode.trim(),
        residenceProvinceDec31: taxpayerProfile.residenceProvinceDec31.trim(),
        residenceProvinceCurrent: taxpayerProfile.residenceProvinceCurrent.trim(),
        selfEmploymentProvinces: taxpayerProfile.selfEmploymentProvinces.trim(),
        languageCorrespondence: taxpayerProfile.languageCorrespondence,
        becameResidentDate: taxpayerProfile.becameResidentDate || null,
        ceasedResidentDate: taxpayerProfile.ceasedResidentDate || null,
        maritalStatusChangeDate: taxpayerProfile.maritalStatusChangeDate || null,
        deceasedDate: taxpayerProfile.deceasedDate || null,
        electionsCanadianCitizen: taxpayerProfile.electionsCanadianCitizen === ''
          ? null
          : taxpayerProfile.electionsCanadianCitizen === 'yes',
        electionsAuthorize: taxpayerProfile.electionsAuthorize === ''
          ? null
          : taxpayerProfile.electionsAuthorize === 'yes',
        indianActExemptIncome: Boolean(taxpayerProfile.indianActExemptIncome),
        foreignPropertyOver100k: taxpayerProfile.foreignPropertyOver100k === ''
          ? null
          : taxpayerProfile.foreignPropertyOver100k === 'yes',
        organDonorConsent: taxpayerProfile.organDonorConsent === ''
          ? null
          : taxpayerProfile.organDonorConsent === 'yes',
        spouseSelfEmployed: Boolean(taxpayerProfile.spouseSelfEmployed),
        spouseNetIncome23600: Number(taxpayerProfile.spouseNetIncome23600 || taxpayerProfile.spouse.netIncome || 0),
        spouseUccb11700: Number(taxpayerProfile.spouseUccb11700 || 0),
        spouseUccbRepayment21300: Number(taxpayerProfile.spouseUccbRepayment21300 || 0),
        spouse: {
          ...taxpayerProfile.spouse,
          fullName: spouseMode === 'full'
            ? `${taxpayerProfile.spouse.firstName} ${taxpayerProfile.spouse.lastName}`.trim()
            : taxpayerProfile.spouse.fullName.trim(),
          firstName: taxpayerProfile.spouse.firstName.trim(),
          lastName: taxpayerProfile.spouse.lastName.trim(),
          dateOfBirth: taxpayerProfile.spouse.dateOfBirth || null,
          fullSin: sanitizeSin(taxpayerProfile.spouse.fullSin),
          netIncome: Number(taxpayerProfile.spouseNetIncome23600 || taxpayerProfile.spouse.netIncome || 0)
        },
        dependents: taxpayerProfile.dependents
          .filter((d) => d.fullName.trim().length > 0)
          .map((d) => ({
            fullName: d.fullName.trim(),
            relationship: d.relationship.trim(),
            dateOfBirth: d.dateOfBirth || null,
            disability: Boolean(d.disability)
          }))
      }
      await taxFetch(`/tax-returns/${id}`, getToken, {
        method: 'PATCH',
        body: JSON.stringify({
          taxpayerName: fullName,
          firstName: taxpayerProfile.firstName.trim() || null,
          lastName: taxpayerProfile.lastName.trim() || null,
          sin: sanitizeSin(taxpayerProfile.sin) || null,
          dateOfBirth: taxpayerProfile.dateOfBirth || null,
          taxpayerProfile: normalizedProfile
        })
      })
      await load()
      if (setupCompletenessIssues.length > 0) {
        setProfileSavedMsg(`Taxpayer profile saved with ${setupCompletenessIssues.length} non-blocking completeness warning(s).`)
      } else {
        setProfileSavedMsg('Taxpayer profile saved.')
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save taxpayer profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <SEO
        title="Return Builder | Tax Intelligence | Client Portal"
        description="Build and review T1 return data."
        canonical="/app/tax-intelligence/returns"
      />
      <ClientPortalShell>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-primary-dark">Return Builder</h1>
              <p className="text-sm text-text-light">
                {data?.taxReturn?.taxpayer_name || 'Loading taxpayer'} · {data?.taxReturn?.tax_year || ''}
              </p>
            </div>
            <Link to={`${basePath}/returns`} className="text-sm text-accent font-medium hover:underline">Back to returns</Link>
          </div>

          <div className="bg-white p-3 rounded-lg border border-border shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {steps.map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setActiveStep(step)}
                  className={`px-2 py-2 text-xs rounded-md border ${
                    activeStep === step ? 'bg-primary-dark text-white border-primary-dark' : 'bg-background text-text border-border'
                  }`}
                >
                  {step}
                  {step === 'Setup' && requiredSetupIssueCount > 0 ? ` (${requiredSetupIssueCount} required)` : ''}
                  {step === 'Setup' && requiredSetupIssueCount === 0 && recommendedSetupIssueCount > 0 ? ` (${recommendedSetupIssueCount} review)` : ''}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <span className="text-xs text-text-light">Return workspace:</span>
              <button
                type="button"
                className={`px-2 py-1 text-xs rounded border ${returnRole === 'self' ? 'bg-primary-dark text-white border-primary-dark' : 'bg-white text-text border-border'}`}
                onClick={() => setReturnRole('self')}
              >
                Taxpayer full return
              </button>
              <button
                type="button"
                className={`px-2 py-1 text-xs rounded border ${returnRole === 'spouse' ? 'bg-primary-dark text-white border-primary-dark' : 'bg-white text-text border-border'} ${!hasSpouseReturnMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => hasSpouseReturnMode && setReturnRole('spouse')}
                disabled={!hasSpouseReturnMode}
                title={!hasSpouseReturnMode ? 'Set marital status to Married/Common-law and save profile to enable spouse full return mode.' : undefined}
              >
                Spouse full return
              </button>
            </div>
          </div>

          {err && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{err}</p>}
          {loading && <p className="text-sm text-text-light">Loading return data…</p>}

          {!loading && activeStep === 'Setup' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-3">
              <h2 className="text-lg font-semibold text-primary-dark">Setup</h2>
              <p className="text-sm text-text-light">
                Return status: <strong className="text-text">{data?.taxReturn.status}</strong>. Complete taxpayer profile details for T1 Step 1 and family-related claims.
              </p>
              <p className="text-xs text-text-light">
                If married/common-law, choose spouse mode below: Summary only or Complete full spouse return.
              </p>
              {profileSavedMsg && (
                <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md px-3 py-2">{profileSavedMsg}</p>
              )}
              {setupCompletenessIssues.length > 0 && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-amber-900">T1 Setup completeness checker</p>
                    <span className="text-[11px] text-amber-900 border border-amber-300 bg-amber-100 rounded px-2 py-0.5">
                      {requiredSetupIssueCount} required
                    </span>
                    <span className="text-[11px] text-amber-900 border border-amber-300 bg-amber-100 rounded px-2 py-0.5">
                      {recommendedSetupIssueCount} recommended
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className={`px-2 py-1 text-[11px] rounded border ${setupIssueFilter === 'all' ? 'bg-amber-700 text-white border-amber-700' : 'bg-white text-amber-900 border-amber-300'}`}
                      onClick={() => setSetupIssueFilter('all')}
                    >
                      Show all warnings
                    </button>
                    <button
                      type="button"
                      className={`px-2 py-1 text-[11px] rounded border ${setupIssueFilter === 'required' ? 'bg-amber-700 text-white border-amber-700' : 'bg-white text-amber-900 border-amber-300'}`}
                      onClick={() => setSetupIssueFilter('required')}
                    >
                      Show required only
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-amber-800">
                    These items are non-blocking. You can continue to Income, Deductions, and Review without clearing them.
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-amber-900">
                    {visibleSetupCompletenessIssues.map((item, idx) => (
                      <li key={`${item.field}-${idx}`}>
                        [{item.severity === 'required' ? 'REQUIRED' : 'RECOMMENDED'}] {item.message}
                      </li>
                    ))}
                    {visibleSetupCompletenessIssues.length === 0 && (
                      <li>[REQUIRED] No required warnings at the moment.</li>
                    )}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label className="text-xs text-text-light">
                  First name
                  <input
                    className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                    value={taxpayerProfile.firstName}
                    onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, firstName: e.target.value }))}
                  />
                </label>
                <label className="text-xs text-text-light">
                  Last name
                  <input
                    className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                    value={taxpayerProfile.lastName}
                    onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, lastName: e.target.value }))}
                  />
                </label>
                <label className="text-xs text-text-light">
                  Date of birth
                  <input
                    type="date"
                    className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                    value={taxpayerProfile.dateOfBirth ? taxpayerProfile.dateOfBirth.slice(0, 10) : ''}
                    onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </label>
                <label className="text-xs text-text-light">
                  SIN (9 digits)
                  <input
                    className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                    value={taxpayerProfile.sin}
                    onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, sin: sanitizeSin(e.target.value) }))}
                  />
                </label>
                <label className="text-xs text-text-light md:col-span-2">
                  Email address
                  <input
                    className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                    value={taxpayerProfile.email}
                    onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </label>
                <label className="text-xs text-text-light md:col-span-2">
                  Marital status
                  <select
                    className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                    value={taxpayerProfile.maritalStatus}
                    onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, maritalStatus: e.target.value as TaxpayerProfileState['maritalStatus'] }))}
                  >
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="common_law">Common-law</option>
                    <option value="separated">Separated</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </label>
              </div>

              <div className="border border-border rounded-md p-3 bg-background/50 space-y-2">
                <h3 className="text-sm font-semibold text-primary-dark">Mailing and residence information (T1 Step 1)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <label className="text-xs text-text-light md:col-span-2">
                    Mailing address (apartment, number, street)
                    <input
                      className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                      value={taxpayerProfile.mailingAddressLine1}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, mailingAddressLine1: e.target.value }))}
                    />
                  </label>
                  <label className="text-xs text-text-light">
                    PO Box
                    <input
                      className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                      value={taxpayerProfile.mailingPoBox}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, mailingPoBox: e.target.value }))}
                    />
                  </label>
                  <label className="text-xs text-text-light">
                    RR
                    <input
                      className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                      value={taxpayerProfile.mailingRR}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, mailingRR: e.target.value }))}
                    />
                  </label>
                  <label className="text-xs text-text-light">
                    City
                    <input
                      className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                      value={taxpayerProfile.mailingCity}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, mailingCity: e.target.value }))}
                    />
                  </label>
                  <label className="text-xs text-text-light">
                    Province/Territory
                    <input
                      className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                      value={taxpayerProfile.mailingProvinceCode}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, mailingProvinceCode: e.target.value.toUpperCase().slice(0, 8) }))}
                    />
                  </label>
                  <label className="text-xs text-text-light">
                    Postal code
                    <input
                      className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                      value={taxpayerProfile.mailingPostalCode}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, mailingPostalCode: e.target.value.toUpperCase() }))}
                    />
                  </label>
                  <label className="text-xs text-text-light">
                    Province/territory of residence on Dec 31
                    <input
                      className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                      value={taxpayerProfile.residenceProvinceDec31}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, residenceProvinceDec31: e.target.value.toUpperCase().slice(0, 8) }))}
                    />
                  </label>
                  <label className="text-xs text-text-light md:col-span-2">
                    Current residence province/territory if different from mailing address
                    <input
                      className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                      value={taxpayerProfile.residenceProvinceCurrent}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, residenceProvinceCurrent: e.target.value.toUpperCase().slice(0, 8) }))}
                    />
                  </label>
                  <label className="text-xs text-text-light md:col-span-2">
                    Provinces/territories where you had business permanent establishments (if self-employed)
                    <input
                      className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                      value={taxpayerProfile.selfEmploymentProvinces}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, selfEmploymentProvinces: e.target.value }))}
                    />
                  </label>
                  <label className="text-xs text-text-light">
                    Language of correspondence
                    <select
                      className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                      value={taxpayerProfile.languageCorrespondence}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, languageCorrespondence: e.target.value === 'fr' ? 'fr' : 'en' }))}
                    >
                      <option value="en">English</option>
                      <option value="fr">French</option>
                    </select>
                  </label>
                  <label className="text-xs text-text-light">
                    Date marital status changed (if changed this year)
                    <input
                      type="date"
                      className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                      value={taxpayerProfile.maritalStatusChangeDate ? taxpayerProfile.maritalStatusChangeDate.slice(0, 10) : ''}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, maritalStatusChangeDate: e.target.value }))}
                    />
                  </label>
                  <label className="text-xs text-text-light">
                    Date of entry to Canada (if became resident this year)
                    <input
                      type="date"
                      className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                      value={taxpayerProfile.becameResidentDate ? taxpayerProfile.becameResidentDate.slice(0, 10) : ''}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, becameResidentDate: e.target.value }))}
                    />
                  </label>
                  <label className="text-xs text-text-light">
                    Date of departure from Canada (if ceased residency this year)
                    <input
                      type="date"
                      className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                      value={taxpayerProfile.ceasedResidentDate ? taxpayerProfile.ceasedResidentDate.slice(0, 10) : ''}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, ceasedResidentDate: e.target.value }))}
                    />
                  </label>
                  <label className="text-xs text-text-light md:col-span-2">
                    Date of death (if filing for a deceased person)
                    <input
                      type="date"
                      className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                      value={taxpayerProfile.deceasedDate ? taxpayerProfile.deceasedDate.slice(0, 10) : ''}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, deceasedDate: e.target.value }))}
                    />
                  </label>
                </div>
              </div>

              {(taxpayerProfile.maritalStatus === 'married' || taxpayerProfile.maritalStatus === 'common_law') && (
                <div className="border border-border rounded-md p-3 bg-background/50 space-y-2">
                  <h3 className="text-sm font-semibold text-primary-dark">Spouse or common-law partner</h3>
                  <div className="text-xs text-text-light border border-border rounded-md p-2 bg-white">
                    Choose spouse return mode:
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        className={`px-2 py-1 text-xs rounded border ${taxpayerProfile.spouseReturnMode === 'summary' ? 'bg-primary-dark text-white border-primary-dark' : 'bg-white text-text border-border'}`}
                        onClick={() => setTaxpayerProfile((prev) => ({ ...prev, spouseReturnMode: 'summary' }))}
                      >
                        Summary only
                      </button>
                      <button
                        type="button"
                        className={`px-2 py-1 text-xs rounded border ${taxpayerProfile.spouseReturnMode === 'full' ? 'bg-primary-dark text-white border-primary-dark' : 'bg-white text-text border-border'}`}
                        onClick={() => setTaxpayerProfile((prev) => ({ ...prev, spouseReturnMode: 'full' }))}
                      >
                        Complete full spouse return
                      </button>
                    </div>
                  </div>

                  {taxpayerProfile.spouseReturnMode === 'summary' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <label className="text-xs text-text-light">
                        Full name (required)
                        <input
                          className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                          value={taxpayerProfile.spouse.fullName}
                          onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, spouse: { ...prev.spouse, fullName: e.target.value } }))}
                        />
                      </label>
                      <label className="text-xs text-text-light">
                        SIN (9 digits)
                        <input
                          className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                          value={taxpayerProfile.spouse.fullSin}
                          onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, spouse: { ...prev.spouse, fullSin: sanitizeSin(e.target.value) } }))}
                        />
                      </label>
                      <label className="text-xs text-text-light">
                        Net income (line 23600)
                        <input
                          type="number"
                          className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                          value={Number(taxpayerProfile.spouseNetIncome23600 || 0)}
                          onChange={(e) => setTaxpayerProfile((prev) => ({
                            ...prev,
                            spouseNetIncome23600: Number(e.target.value || 0),
                            spouse: { ...prev.spouse, netIncome: Number(e.target.value || 0) }
                          }))}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <label className="text-xs text-text-light">
                          First name (required)
                          <input
                            className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                            value={taxpayerProfile.spouse.firstName}
                            onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, spouse: { ...prev.spouse, firstName: e.target.value } }))}
                          />
                        </label>
                        <label className="text-xs text-text-light">
                          Last name (required)
                          <input
                            className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                            value={taxpayerProfile.spouse.lastName}
                            onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, spouse: { ...prev.spouse, lastName: e.target.value } }))}
                          />
                        </label>
                        <label className="text-xs text-text-light">
                          Date of birth (required)
                          <input
                            type="date"
                            className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                            value={taxpayerProfile.spouse.dateOfBirth ? taxpayerProfile.spouse.dateOfBirth.slice(0, 10) : ''}
                            onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, spouse: { ...prev.spouse, dateOfBirth: e.target.value } }))}
                          />
                        </label>
                        <label className="text-xs text-text-light">
                          Net income (line 23600)
                          <input
                            type="number"
                            className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                            value={Number(taxpayerProfile.spouseNetIncome23600 || 0)}
                            onChange={(e) => setTaxpayerProfile((prev) => ({
                              ...prev,
                              spouseNetIncome23600: Number(e.target.value || 0),
                              spouse: { ...prev.spouse, netIncome: Number(e.target.value || 0) }
                            }))}
                          />
                        </label>
                        <label className="text-xs text-text-light">
                          SIN (9 digits) (required)
                          <input
                            className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                            value={taxpayerProfile.spouse.fullSin}
                            onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, spouse: { ...prev.spouse, fullSin: sanitizeSin(e.target.value) } }))}
                          />
                        </label>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          className="btn btn--secondary text-xs px-2 py-1"
                          onClick={() => {
                            setReturnRole('spouse')
                            setActiveStep('Income')
                          }}
                        >
                          Build spouse return now
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <label className="text-xs text-text-light inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={taxpayerProfile.spouseSelfEmployed}
                        onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, spouseSelfEmployed: e.target.checked }))}
                      />
                      Spouse was self-employed in the tax year
                    </label>
                    <label className="text-xs text-text-light">
                      UCCB amount from spouse line 11700
                      <input
                        type="number"
                        className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                        value={Number(taxpayerProfile.spouseUccb11700 || 0)}
                        onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, spouseUccb11700: Number(e.target.value || 0) }))}
                      />
                    </label>
                    <label className="text-xs text-text-light">
                      UCCB repayment from spouse line 21300
                      <input
                        type="number"
                        className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                        value={Number(taxpayerProfile.spouseUccbRepayment21300 || 0)}
                        onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, spouseUccbRepayment21300: Number(e.target.value || 0) }))}
                      />
                    </label>
                  </div>
                  <div className="text-[11px] text-text-light">
                    {taxpayerProfile.spouseReturnMode === 'summary'
                      ? 'Summary mode stores spouse profile basics only.'
                      : 'Full mode requires complete spouse profile and enables full spouse return entry in Income and Deductions.'}
                  </div>
                </div>
              )}

              <div className="border border-border rounded-md p-3 bg-background/50 space-y-3">
                <h3 className="text-sm font-semibold text-primary-dark">T1 page 2 questions and elections</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <label className="text-xs text-text-light">
                    Elections Canada - Are you a Canadian citizen?
                    <select
                      className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                      value={taxpayerProfile.electionsCanadianCitizen}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, electionsCanadianCitizen: e.target.value as TaxpayerProfileState['electionsCanadianCitizen'] }))}
                    >
                      <option value="">Select...</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                  <label className="text-xs text-text-light">
                    Elections Canada authorization to share information with Elections Canada
                    <select
                      className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                      value={taxpayerProfile.electionsAuthorize}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, electionsAuthorize: e.target.value as TaxpayerProfileState['electionsAuthorize'] }))}
                    >
                      <option value="">Select...</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                  <label className="text-xs text-text-light inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={taxpayerProfile.indianActExemptIncome}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, indianActExemptIncome: e.target.checked }))}
                    />
                    Tick if you had income exempt under the Indian Act
                  </label>
                  <label className="text-xs text-text-light">
                    Did you own/hold specified foreign property above CAD 100,000 at any point in the year?
                    <select
                      className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                      value={taxpayerProfile.foreignPropertyOver100k}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, foreignPropertyOver100k: e.target.value as TaxpayerProfileState['foreignPropertyOver100k'] }))}
                    >
                      <option value="">Select...</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                  <label className="text-xs text-text-light md:col-span-2">
                    Ontario organ/tissue donor contact sharing consent
                    <select
                      className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                      value={taxpayerProfile.organDonorConsent}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, organDonorConsent: e.target.value as TaxpayerProfileState['organDonorConsent'] }))}
                    >
                      <option value="">Select...</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="border border-border rounded-md p-3 bg-background/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-primary-dark">Dependants</h3>
                  <button type="button" className="btn btn--secondary text-xs px-2 py-1" onClick={addDependent}>Add dependant</button>
                </div>
                {taxpayerProfile.dependents.length === 0 && (
                  <p className="text-xs text-text-light">No dependants added.</p>
                )}
                {taxpayerProfile.dependents.map((dep, idx) => (
                  <div key={`dep-${idx}`} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end border border-border rounded-md p-2 bg-white">
                    <label className="text-xs text-text-light">
                      Full name
                      <input
                        className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                        value={dep.fullName}
                        onChange={(e) => setTaxpayerProfile((prev) => {
                          const next = [...prev.dependents]
                          next[idx] = { ...next[idx], fullName: e.target.value }
                          return { ...prev, dependents: next }
                        })}
                      />
                    </label>
                    <label className="text-xs text-text-light">
                      Relationship
                      <input
                        className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                        value={dep.relationship}
                        onChange={(e) => setTaxpayerProfile((prev) => {
                          const next = [...prev.dependents]
                          next[idx] = { ...next[idx], relationship: e.target.value }
                          return { ...prev, dependents: next }
                        })}
                      />
                    </label>
                    <label className="text-xs text-text-light">
                      Date of birth
                      <input
                        type="date"
                        className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                        value={dep.dateOfBirth ? dep.dateOfBirth.slice(0, 10) : ''}
                        onChange={(e) => setTaxpayerProfile((prev) => {
                          const next = [...prev.dependents]
                          next[idx] = { ...next[idx], dateOfBirth: e.target.value }
                          return { ...prev, dependents: next }
                        })}
                      />
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-text-light inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={dep.disability}
                          onChange={(e) => setTaxpayerProfile((prev) => {
                            const next = [...prev.dependents]
                            next[idx] = { ...next[idx], disability: e.target.checked }
                            return { ...prev, dependents: next }
                          })}
                        />
                        Disability
                      </label>
                      <button type="button" className="text-xs text-red-700 hover:underline" onClick={() => removeDependent(idx)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button type="button" className="btn btn--primary text-sm px-3 py-2" onClick={() => { void saveTaxpayerProfile() }} disabled={saving}>
                  Save taxpayer profile
                </button>
              </div>
            </section>
          )}

          {!loading && activeStep === 'Income' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-3">
              <h2 className="text-lg font-semibold text-primary-dark">Income</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-light">Building return for:</span>
                <button
                  type="button"
                  className={`px-2 py-1 text-xs rounded border ${returnRole === 'self' ? 'bg-primary-dark text-white border-primary-dark' : 'bg-white text-text border-border'}`}
                  onClick={() => setReturnRole('self')}
                >
                  Taxpayer
                </button>
                <button
                  type="button"
                  className={`px-2 py-1 text-xs rounded border ${returnRole === 'spouse' ? 'bg-primary-dark text-white border-primary-dark' : 'bg-white text-text border-border'} ${!hasSpouseReturnMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => hasSpouseReturnMode && setReturnRole('spouse')}
                  disabled={!hasSpouseReturnMode}
                >
                  Spouse
                </button>
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <select
                  className="border border-border rounded-md px-3 py-2 text-sm flex-1"
                  value={selectedDocumentId}
                  onChange={(e) => setSelectedDocumentId(e.target.value)}
                >
                  <option value="">Import from Documents…</option>
                  {documents.map((d) => <option key={d.id} value={d.id}>{d.file_name}</option>)}
                </select>
                <button type="button" className="btn btn--secondary text-sm px-3 py-2" onClick={() => { void importFromDocument() }} disabled={saving || !selectedDocumentId}>
                  Import selected document
                </button>
              </div>
              <div className="border border-border rounded-md p-3 bg-background/50 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-primary-dark">Manual CRA slip entry (box format)</h3>
                  <p className="text-xs text-text-light mt-1">
                    Select a slip type, then enter box values exactly as shown on the CRA slip.
                  </p>
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                  <select
                    className="border border-border rounded-md px-3 py-2 text-sm flex-1"
                    value={newSlipCode}
                    onChange={(e) => setNewSlipCode(e.target.value)}
                  >
                    {SLIP_DEFINITIONS.map((def) => (
                      <option key={def.code} value={def.code}>{def.code} - {def.name}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn--secondary text-sm px-3 py-2" onClick={() => addSlipRow(returnRole)}>
                    Add slip
                  </button>
                </div>
                {manualSlipRows.map((row, idx) => {
                  if (row.taxpayerRole !== returnRole) return null
                  const def = SLIP_DEFINITIONS_BY_CODE[row.slipCode]
                  if (!def) return null
                  return (
                  <div key={`t4-${idx}`} className="border border-border rounded-md p-3 bg-white space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        className="border border-border rounded-md px-3 py-2 text-sm"
                        placeholder={def.payerLabel}
                        value={row.payerName}
                        onChange={(e) => {
                          const next = [...manualSlipRows]
                          next[idx].payerName = e.target.value
                          setManualSlipRows(next)
                        }}
                      />
                      <input
                        type="number"
                        className="border border-border rounded-md px-3 py-2 text-sm"
                        placeholder="Tax year"
                        value={row.taxYear}
                        onChange={(e) => {
                          const next = [...manualSlipRows]
                          next[idx].taxYear = Number(e.target.value)
                          setManualSlipRows(next)
                        }}
                      />
                      <select
                        className="border border-border rounded-md px-3 py-2 text-sm"
                        value={row.taxpayerRole}
                        onChange={(e) => {
                          const next = [...manualSlipRows]
                          next[idx].taxpayerRole = e.target.value === 'spouse' ? 'spouse' : 'self'
                          setManualSlipRows(next)
                        }}
                      >
                        <option value="self">Taxpayer</option>
                        <option value="spouse">Spouse</option>
                      </select>
                    </div>
                    <p className="text-xs text-text-light font-medium">{def.code} - {def.name}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {def.boxes.map((box) => (
                        <label key={`${row.slipCode}-${idx}-${box.code}`} className="text-xs text-text-light">
                          Box {box.code} {box.label}
                          <input
                            type="number"
                            className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                            value={Number(row.boxes[box.code] || 0)}
                            onChange={(e) => {
                              const next = [...manualSlipRows]
                              next[idx].boxes = { ...next[idx].boxes, [box.code]: Number(e.target.value) }
                              setManualSlipRows(next)
                            }}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                  )
                })}
              </div>
              <div className="space-y-2">
                {incomeRows.map((row, idx) => (
                  row.taxpayerRole !== returnRole ? null : (
                  <div key={`income-${idx}`} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input className="border border-border rounded-md px-3 py-2 text-sm" value={row.category} onChange={(e) => {
                      const next = [...incomeRows]; next[idx].category = e.target.value; setIncomeRows(next)
                    }} />
                    <input className="border border-border rounded-md px-3 py-2 text-sm" value={row.description} onChange={(e) => {
                      const next = [...incomeRows]; next[idx].description = e.target.value; setIncomeRows(next)
                    }} />
                    <input type="number" className="border border-border rounded-md px-3 py-2 text-sm" value={row.amount} onChange={(e) => {
                      const next = [...incomeRows]; next[idx].amount = Number(e.target.value); setIncomeRows(next)
                    }} />
                    <select className="border border-border rounded-md px-3 py-2 text-sm" value={row.taxpayerRole} onChange={(e) => {
                      const next = [...incomeRows]; next[idx].taxpayerRole = e.target.value === 'spouse' ? 'spouse' : 'self'; setIncomeRows(next)
                    }}>
                      <option value="self">Taxpayer</option>
                      <option value="spouse">Spouse</option>
                    </select>
                  </div>
                  )
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn--secondary text-sm px-3 py-2" onClick={() => addIncomeRow(returnRole)}>
                  Add {returnRole === 'self' ? 'taxpayer' : 'spouse'} row
                </button>
                <button type="button" className="btn btn--primary text-sm px-3 py-2" onClick={() => { void saveIncome() }} disabled={saving}>Save income</button>
              </div>
            </section>
          )}

          {!loading && activeStep === 'Deductions' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-3">
              <h2 className="text-lg font-semibold text-primary-dark">Deductions</h2>
              <div className="text-xs text-text-light">
                Editing deductions for: <span className="font-semibold text-text">{returnRole === 'self' ? 'Taxpayer' : 'Spouse'}</span>
              </div>
              <div className="border border-border rounded-md p-3 bg-background/50 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-primary-dark">T1 deduction and credit inputs</h3>
                  <p className="text-xs text-text-light mt-1">Enter common deduction/credit lines from T1 General Step 3 and Step 5.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {T1_DEDUCTION_FIELDS.map((field) => (
                    <label key={field.key} className="text-xs text-text-light border border-border rounded-md p-2 bg-white">
                      <span className="font-medium text-text block">Line {field.lineRef} - {field.label}</span>
                      <span className="block text-[11px] mt-0.5">{field.isCredit ? 'Non-refundable credit input' : 'Net income deduction input'}</span>
                      <input
                        type="number"
                        className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                        value={Number(deductionFormValues[field.key]?.[returnRole] || 0)}
                        onChange={(e) => {
                          const n = Number(e.target.value)
                          setDeductionFormValues((prev) => ({
                            ...prev,
                            [field.key]: {
                              self: Number(prev[field.key]?.self || 0),
                              spouse: Number(prev[field.key]?.spouse || 0),
                              [returnRole]: Number.isFinite(n) ? n : 0
                            }
                          }))
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
              <h3 className="text-sm font-semibold text-primary-dark">Additional custom deductions/credits</h3>
              <div className="space-y-2">
                {deductionRows.map((row, idx) => (
                  row.taxpayerRole !== returnRole ? null : (
                  <div key={`deduction-${idx}`} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input className="border border-border rounded-md px-3 py-2 text-sm" value={row.category} onChange={(e) => {
                      const next = [...deductionRows]; next[idx].category = e.target.value; setDeductionRows(next)
                    }} />
                    <input className="border border-border rounded-md px-3 py-2 text-sm" value={row.description} onChange={(e) => {
                      const next = [...deductionRows]; next[idx].description = e.target.value; setDeductionRows(next)
                    }} />
                    <input type="number" className="border border-border rounded-md px-3 py-2 text-sm" value={row.amount} onChange={(e) => {
                      const next = [...deductionRows]; next[idx].amount = Number(e.target.value); setDeductionRows(next)
                    }} />
                    <label className="text-sm text-text-light inline-flex items-center gap-2 px-2">
                      <input type="checkbox" checked={row.isCredit} onChange={(e) => {
                        const next = [...deductionRows]; next[idx].isCredit = e.target.checked; setDeductionRows(next)
                      }} />
                      Credit
                    </label>
                  </div>
                  )
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn--secondary text-sm px-3 py-2" onClick={() => addDeductionRow(returnRole)}>
                  Add {returnRole === 'self' ? 'taxpayer' : 'spouse'} row
                </button>
                <button type="button" className="btn btn--primary text-sm px-3 py-2" onClick={() => { void saveDeductions() }} disabled={saving}>Save deductions</button>
              </div>
            </section>
          )}

          {!loading && activeStep === 'Review' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm">
              <h2 className="text-lg font-semibold text-primary-dark mb-2">Review</h2>
              <button type="button" className="btn btn--primary text-sm px-3 py-2" onClick={() => { void runCalculation() }} disabled={saving}>
                Run deterministic calculation
              </button>
              {data?.calculation?.assumptions?.comparative && (
                <div className="mt-3 border border-border rounded-md p-3 bg-background/50">
                  <h3 className="text-sm font-semibold text-primary-dark mb-2">
                    {returnRole === 'self' ? 'Taxpayer' : 'Spouse'} T1 summary (estimated)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                    <div className="border border-border rounded-md p-2 bg-white">
                      <p className="text-text-light">Line 23600 Net income</p>
                      <p className="font-semibold text-text">
                        ${Number((returnRole === 'self'
                          ? data.calculation.assumptions.comparative.self?.netIncome
                          : data.calculation.assumptions.comparative.spouse?.netIncome) || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="border border-border rounded-md p-2 bg-white">
                      <p className="text-text-light">Line 26000 Taxable income</p>
                      <p className="font-semibold text-text">
                        ${Number((returnRole === 'self'
                          ? data.calculation.assumptions.comparative.self?.taxableIncome
                          : data.calculation.assumptions.comparative.spouse?.taxableIncome) || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="border border-border rounded-md p-2 bg-white">
                      <p className="text-text-light">Line 43500 Tax (before credits)</p>
                      <p className="font-semibold text-text">
                        ${Number((returnRole === 'self'
                          ? data.calculation.assumptions.comparative.self?.estimatedTaxBeforeCredits
                          : data.calculation.assumptions.comparative.spouse?.estimatedTaxBeforeCredits) || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="border border-border rounded-md p-2 bg-white">
                      <p className="text-text-light">Line 43700 Tax deducted</p>
                      <p className="font-semibold text-text">
                        ${Number((returnRole === 'self'
                          ? data.calculation.assumptions.comparative.self?.taxesWithheld
                          : data.calculation.assumptions.comparative.spouse?.taxesWithheld) || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-primary-dark">Slip line mapping trace</h3>
                <p className="text-xs text-text-light mt-1">Shows how slip boxes are mapped into T1 lines/schedules.</p>
                {lineMappingRows.length === 0 ? (
                  <p className="text-xs text-text-light mt-2">No slip mappings available yet. Add manual slips or import extracted slips.</p>
                ) : (
                  <div className="overflow-x-auto mt-2 border border-border rounded-md">
                    <table className="min-w-full text-xs">
                      <thead className="bg-background/70">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold text-primary-dark">Source</th>
                          <th className="text-left px-3 py-2 font-semibold text-primary-dark">Mapped To</th>
                          <th className="text-left px-3 py-2 font-semibold text-primary-dark">Category</th>
                          <th className="text-left px-3 py-2 font-semibold text-primary-dark">Validation</th>
                          <th className="text-right px-3 py-2 font-semibold text-primary-dark">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineMappingRows.map((row, idx) => (
                          <tr key={`${row.source}-${row.mappedTo}-${idx}`} className="border-t border-border">
                            <td className="px-3 py-2 text-text">{row.source}</td>
                            <td className="px-3 py-2 text-text">{row.mappedTo}</td>
                            <td className="px-3 py-2 text-text">{row.category}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                  row.status === 'OK'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                                title={row.reason}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right text-text">${row.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {lineMappingRows.some((r) => r.status === 'REVIEW') && (
                  <p className="text-xs text-amber-700 mt-2">
                    One or more mappings need review. Hover over the `REVIEW` badge to see the reason.
                  </p>
                )}
              </div>
              {data?.calculation && (
                <div className="mt-3 text-sm text-text space-y-1">
                  <p>Taxable income: ${Number(data.calculation.taxable_income || 0).toFixed(2)}</p>
                  <p>Total payable: ${Number(data.calculation.total_payable || 0).toFixed(2)}</p>
                  <p>Refund / balance: ${Number(data.calculation.refund_or_balance || 0).toFixed(2)}</p>
                </div>
              )}
              {data?.calculation?.assumptions?.comparative && (
                <div className="mt-4 border border-border rounded-md p-3 bg-background/50">
                  <h3 className="text-sm font-semibold text-primary-dark mb-2">Taxpayer vs spouse comparative</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-text">
                    <div className="border border-border rounded-md p-2 bg-white">
                      <p className="font-semibold">Taxpayer</p>
                      <p>Net income: ${Number(data.calculation.assumptions.comparative.self?.netIncome || 0).toFixed(2)}</p>
                      <p>Taxable income: ${Number(data.calculation.assumptions.comparative.self?.taxableIncome || 0).toFixed(2)}</p>
                      <p>Est. tax (before credits): ${Number(data.calculation.assumptions.comparative.self?.estimatedTaxBeforeCredits || 0).toFixed(2)}</p>
                    </div>
                    <div className="border border-border rounded-md p-2 bg-white">
                      <p className="font-semibold">Spouse</p>
                      <p>Net income: ${Number(data.calculation.assumptions.comparative.spouse?.netIncome || 0).toFixed(2)}</p>
                      <p>Taxable income: ${Number(data.calculation.assumptions.comparative.spouse?.taxableIncome || 0).toFixed(2)}</p>
                      <p>Est. tax (before credits): ${Number(data.calculation.assumptions.comparative.spouse?.estimatedTaxBeforeCredits || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
              {data?.calculation?.assumptions?.optimization?.pensionSplit && (
                <div className="mt-3 border border-border rounded-md p-3 bg-background/50 text-xs text-text">
                  <h3 className="text-sm font-semibold text-primary-dark mb-1">Optimization: pension splitting</h3>
                  <p>
                    Recommended split from {String(data.calculation.assumptions.optimization.pensionSplit.splitSourceRole || 'taxpayer')}:
                    {' '}${Number(data.calculation.assumptions.optimization.pensionSplit.recommendedSplit || 0).toFixed(2)}
                  </p>
                  <p>
                    Estimated tax savings (before credits): ${Number(data.calculation.assumptions.optimization.pensionSplit.estimatedTaxSavingsBeforeCredits || 0).toFixed(2)}
                  </p>
                </div>
              )}
            </section>
          )}

          {!loading && activeStep === 'Optimization' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-2">
              <h2 className="text-lg font-semibold text-primary-dark">Optimization</h2>
              <p className="text-sm text-text-light">Create scenarios in the dedicated Scenarios page.</p>
              <Link className="text-sm text-accent font-medium hover:underline" to={`${basePath}/scenarios`}>Open scenarios</Link>
            </section>
          )}

          {!loading && activeStep === 'Risk' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-2">
              <h2 className="text-lg font-semibold text-primary-dark">Risk</h2>
              <button type="button" className="btn btn--secondary text-sm px-3 py-2" onClick={() => { void runAudit() }} disabled={saving}>
                Run audit risk checks
              </button>
              <Link className="text-sm text-accent font-medium hover:underline block" to={`${basePath}/risk`}>Open Audit & Risk panel</Link>
            </section>
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default ReturnBuilder
