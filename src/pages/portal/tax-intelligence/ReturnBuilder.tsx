import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../../components/SEO'
import ClientPortalShell from '../../../components/ClientPortalShell'
import { taxFetch, type DocumentExtractResponse, type FormWorksheetSchema, type FormWorksheetSchemasResponse, type FormWorksheetValuesState, type RequiredFormsResponse, type ReturnInterviewTopicsResponse, type SlipSchema, type SlipSchemasResponse, type TaxReturnSummary } from '../../../lib/taxIntelligenceApi'
import RequiredFormsPanel from './RequiredFormsPanel'
import InterviewTopicsSetup, { type InterviewTopicsSetupHandle } from './InterviewTopicsSetup'
import {
  resolveInterviewTopicNavigation
} from './interviewTopicNavigation'
import type { InterviewTopicItem } from '../../../lib/taxIntelligenceApi'
import { IncomeSlipsSetup } from './IncomeSlipsSetup'
import { DeductionsFormsSetup } from './DeductionsFormsSetup'
import {
  SlipBoxFieldGrid,
  buildDefaultBoxes,
  createManualSlipId,
  resolveManualSlipIdFromMeta,
  slipBoxEntriesForRow,
  type SlipRow
} from './slipEntryUi'
import ReviewDiagnosticsPanel from './ReviewDiagnosticsPanel'
import { getTaxBasePath } from './path'
import { CraQuestionRow, toggleToYesNo, yesNoToToggle, YesNoToggle, type YesNo, DEFAULT_CRA_YES_NO } from './CraQuestionControls'
import ProvinceSelect from './ProvinceSelect'
import { ProvincialCraQuestionBlocks } from './ProvincialCraQuestionBlocks'
import {
  clearOrganDonorIfNotApplicable,
  clearProvincialElectionsIfNotApplicable,
  serializeOrganDonorConsent,
  serializeProvincialElections
} from './craProvinceQuestions.registry'
import DependentIdentificationForm from './DependentIdentificationForm'
import {
  createEmptyDependent,
  dependentFromLegacy,
  dependentFullName,
  dependentRequiresFullReturn,
  serializeDependent,
  type DependentRecord
} from './dependentModel'

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
      firstTimeFiler?: boolean | null
      soldPrincipalResidence?: boolean | null
      treatyExemptForeignService?: boolean | null
      indianActExemptIncome?: boolean
      foreignPropertyOver100k?: boolean | null
      organDonorConsent?: boolean | null
      provincialElectionsCanadianCitizen?: boolean | null
      provincialElectionsAuthorize?: boolean | null
      craEmailNotificationsConsent?: boolean | null
      craEmailConfirmed?: boolean | null
      craHasForeignMailingAddress?: boolean | null
      spouseSameAddress?: boolean
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
  formWorksheetValues?: FormWorksheetValuesState
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

type DependentProfile = DependentRecord

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
  maritalStatusChangedInYear: boolean
  becameResidentInYear: boolean
  ceasedResidentInYear: boolean
  filingForDeceased: boolean
  becameResidentDate: string
  ceasedResidentDate: string
  maritalStatusChangeDate: string
  deceasedDate: string
  electionsCanadianCitizen: YesNo
  electionsAuthorize: YesNo
  firstTimeFiler: YesNo
  soldPrincipalResidence: YesNo
  treatyExemptForeignService: YesNo
  indianActExemptIncome: boolean
  foreignPropertyOver100k: YesNo
  organDonorConsent: YesNo
  provincialElectionsCanadianCitizen: YesNo
  provincialElectionsAuthorize: YesNo
  craEmailNotificationsConsent: YesNo
  craEmailConfirmed: YesNo
  craHasForeignMailingAddress: YesNo
  spouseSameAddress: boolean
  maritalStatus: 'single' | 'married' | 'common_law' | 'separated' | 'divorced' | 'widowed'
  spouseReturnMode: 'summary' | 'full'
  spouseSelfEmployed: boolean
  spouseHasUccbAdjustments: boolean
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

type Step = 'Identity' | 'Mailing' | 'Elections' | 'Spouse' | 'Dependents' | 'Interview' | 'Income' | 'Deductions' | 'Review' | 'TaxReturn' | 'Netfile'
type CompletenessSeverity = 'required' | 'recommended'
type CompletenessIssue = { field: string; message: string; severity: CompletenessSeverity }

type WorkflowMenuItem = {
  id: string
  label: string
  step: Step
}

/** Linear workflow order for Back/Next navigation and sidebar sequencing. */
const WORKFLOW_PAGES: Step[] = [
  'Identity',
  'Mailing',
  'Elections',
  'Spouse',
  'Dependents',
  'Interview',
  'Income',
  'Deductions',
  'Review',
  'TaxReturn',
  'Netfile'
]

const ALL_WORKFLOW_MENU_ITEMS: WorkflowMenuItem[] = [
  { id: 'setup-identity', label: 'Identification', step: 'Identity' },
  { id: 'setup-mailing', label: 'Mailing address', step: 'Mailing' },
  { id: 'setup-cra', label: 'CRA questions', step: 'Elections' },
  { id: 'setup-spouse', label: 'Spouse setup', step: 'Spouse' },
  { id: 'setup-dependents', label: 'Dependent setup', step: 'Dependents' },
  { id: 'setup-tax-situation', label: 'Interview setup', step: 'Interview' },
  { id: 'income-slips', label: 'Income & CRA slips', step: 'Income' },
  { id: 'deductions', label: 'Deductions & credits', step: 'Deductions' },
  { id: 'review', label: 'Review & diagnostics', step: 'Review' },
  { id: 'tax-return', label: 'Tax Return', step: 'TaxReturn' },
  { id: 'netfile', label: 'NETFILE', step: 'Netfile' }
]

const HIDDEN_SIDEBAR_STEPS = new Set<Step>(['Spouse', 'Dependents', 'Netfile'])

const SIDEBAR_MENU_ITEMS: WorkflowMenuItem[] = ALL_WORKFLOW_MENU_ITEMS.filter(
  (item) => !HIDDEN_SIDEBAR_STEPS.has(item.step)
)

function workflowNeighbors (step: Step): { previous: Step | null; next: Step | null } {
  const index = WORKFLOW_PAGES.indexOf(step)
  if (index < 0) return { previous: null, next: null }
  return {
    previous: index > 0 ? WORKFLOW_PAGES[index - 1] : null,
    next: index < WORKFLOW_PAGES.length - 1 ? WORKFLOW_PAGES[index + 1] : null
  }
}

function stepLabel (step: Step): string {
  return ALL_WORKFLOW_MENU_ITEMS.find((item) => item.step === step)?.label || step
}

type WorkflowPageNavProps = {
  activeStep: Step
  onNavigate: (step: Step) => void
  onSaveBeforeNavigate?: () => Promise<boolean>
  showSaveProfile?: boolean
  onSaveProfile?: () => void
  saving?: boolean
}

const WorkflowPageNav: FC<WorkflowPageNavProps> = ({
  activeStep,
  onNavigate,
  onSaveBeforeNavigate,
  showSaveProfile = false,
  onSaveProfile,
  saving = false
}) => {
  const { previous, next } = workflowNeighbors(activeStep)

  const navigateWithSave = async (step: Step) => {
    if (onSaveBeforeNavigate) {
      const saved = await onSaveBeforeNavigate()
      if (!saved) return
    }
    onNavigate(step)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-4 border-t border-border">
      <div>
        {previous ? (
          <button type="button" className="btn btn--secondary text-sm px-4 py-2" onClick={() => { void navigateWithSave(previous) }} disabled={saving}>
            ← Back: {stepLabel(previous)}
          </button>
        ) : (
          <span className="text-xs text-text-light">Start of workflow</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {showSaveProfile && onSaveProfile && (
          <button type="button" className="btn btn--primary text-sm px-4 py-2" onClick={onSaveProfile} disabled={saving}>
            {saving ? 'Saving…' : 'Save taxpayer profile'}
          </button>
        )}
        {next ? (
          <button type="button" className="btn btn--primary text-sm px-4 py-2" onClick={() => { void navigateWithSave(next) }} disabled={saving}>
            {saving ? 'Saving…' : `Next: ${stepLabel(next)} →`}
          </button>
        ) : (
          <span className="text-xs text-text-light">End of workflow</span>
        )}
      </div>
    </div>
  )
}

type ExtractionPreviewState = {
  extractionId: string | null
  documentId: string
  slipType: string
  confidence: number
  reviewRequired: boolean
  boxes: Record<string, number>
  ocrMethod?: string | null
  ocrWarning?: string | null
}

function slipSchemaSortRank (schema: SlipSchema): number {
  if (schema.schemaStatus === 'complete') return 0
  if (schema.schemaStatus === 'partial') return 1
  return 2
}

function compareSlipSchemas (a: SlipSchema, b: SlipSchema): number {
  const rank = slipSchemaSortRank(a) - slipSchemaSortRank(b)
  if (rank !== 0) return rank
  return a.code.localeCompare(b.code)
}

function buildSlipRowsFromReturnData (
  incomeEntries: TaxReturnPayload['incomeEntries'],
  deductions: TaxReturnPayload['deductions'],
  schemasByCode: Record<string, SlipSchema>
): SlipRow[] {
  const grouped = new Map<string, SlipRow>()

  const absorbEntry = (entry: { id: string; amount: number; metadata?: Record<string, unknown> }) => {
    const meta = (entry.metadata || {}) as Record<string, unknown>
    const slipType = String(meta.slipType || '')
    if (!slipType) return
    const manualSlipId = resolveManualSlipIdFromMeta(meta, entry.id, slipType)
    const boxCode = String(meta.boxCode || '')
    const boxValue = Number(meta.boxValue ?? entry.amount ?? 0)
    if (!grouped.has(manualSlipId)) {
      const schema = schemasByCode[slipType.toUpperCase()]
      grouped.set(manualSlipId, {
        slipCode: slipType,
        payerName: String(meta.payerName || ''),
        taxYear: Number(meta.taxYear || new Date().getFullYear()),
        taxpayerRole: String(meta.taxpayerRole || 'self') === 'spouse' ? 'spouse' : 'self',
        manualSlipId,
        boxes: buildDefaultBoxes(schema)
      })
    }
    const row = grouped.get(manualSlipId)
    if (!row || !boxCode) return
    if (Number.isFinite(boxValue) && boxValue !== 0) {
      row.boxes[boxCode] = boxValue
    }
  }

  for (const entry of incomeEntries) {
    if (entry.source_type === 'manual_slip' || entry.source_type === 'manual_t4' || String(entry.metadata?.slipType || '').length > 0) {
      absorbEntry(entry)
    }
  }
  for (const entry of deductions) {
    if (String(entry.metadata?.source || '') === 'manual_slip' || String(entry.metadata?.manualSlipId || '').length > 0) {
      absorbEntry(entry)
    }
  }

  return Array.from(grouped.values())
}

type LineMappingRow = {
  source: string
  mappedTo: string
  category: string
  amount: number
  status: 'OK' | 'REVIEW'
  reason: string
}

function reviewFieldToStep (field: string): Step {
  if (field === 'identity' || field === 'firstName' || field === 'sin') return 'Identity'
  if (field === 'mailing') return 'Mailing'
  if (field === 'elections' || field === 'firstTimeFiler' || field === 'craEmailNotificationsConsent') return 'Elections'
  if (field === 'spouse') return 'Spouse'
  if (field === 'dependents') return 'Dependents'
  if (field === 'interview') return 'Interview'
  if (field === 'income') return 'Income'
  if (field === 'deductions') return 'Deductions'
  return 'Review'
}

function stepToQueryValue (step: Step): string {
  if (step === 'TaxReturn') return 'tax-return'
  if (step === 'Netfile') return 'netfile'
  return step.toLowerCase()
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

function asYesNo (value: boolean | null | undefined): YesNo {
  if (value == null) return DEFAULT_CRA_YES_NO
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
  mailingProvinceCode: 'ON',
  mailingPostalCode: '',
  residenceProvinceDec31: 'ON',
  residenceProvinceCurrent: '',
  selfEmploymentProvinces: '',
  languageCorrespondence: 'en',
  maritalStatusChangedInYear: false,
  becameResidentInYear: false,
  ceasedResidentInYear: false,
  filingForDeceased: false,
  becameResidentDate: '',
  ceasedResidentDate: '',
  maritalStatusChangeDate: '',
  deceasedDate: '',
  electionsCanadianCitizen: DEFAULT_CRA_YES_NO,
  electionsAuthorize: DEFAULT_CRA_YES_NO,
  firstTimeFiler: DEFAULT_CRA_YES_NO,
  soldPrincipalResidence: DEFAULT_CRA_YES_NO,
  treatyExemptForeignService: DEFAULT_CRA_YES_NO,
  indianActExemptIncome: false,
  foreignPropertyOver100k: DEFAULT_CRA_YES_NO,
  organDonorConsent: DEFAULT_CRA_YES_NO,
  provincialElectionsCanadianCitizen: DEFAULT_CRA_YES_NO,
  provincialElectionsAuthorize: DEFAULT_CRA_YES_NO,
  craEmailNotificationsConsent: DEFAULT_CRA_YES_NO,
  craEmailConfirmed: DEFAULT_CRA_YES_NO,
  craHasForeignMailingAddress: DEFAULT_CRA_YES_NO,
  spouseSameAddress: true,
  maritalStatus: 'single',
  spouseReturnMode: 'summary',
  spouseSelfEmployed: false,
  spouseHasUccbAdjustments: false,
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
  const navigate = useNavigate()
  const basePath = useMemo(() => getTaxBasePath(), [])
  const [activeStep, setActiveStep] = useState<Step>('Identity')
  const [data, setData] = useState<TaxReturnPayload | null>(null)
  const [allReturns, setAllReturns] = useState<TaxReturnSummary[]>([])
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
  const [extractionPreview, setExtractionPreview] = useState<ExtractionPreviewState | null>(null)
  const [newSlipCode, setNewSlipCode] = useState('T4')
  const [slipSchemas, setSlipSchemas] = useState<SlipSchema[]>([])
  const [loadingSlipSchemas, setLoadingSlipSchemas] = useState(true)
  const [formWorksheetSchemas, setFormWorksheetSchemas] = useState<FormWorksheetSchema[]>([])
  const [loadingFormWorksheets, setLoadingFormWorksheets] = useState(true)
  const [formWorksheetValues, setFormWorksheetValues] = useState<FormWorksheetValuesState>({})
  const [slipSearch, setSlipSearch] = useState('')
  const [requiredForms, setRequiredForms] = useState<RequiredFormsResponse | null>(null)
  const [loadingRequiredForms, setLoadingRequiredForms] = useState(false)
  const [setupIssueFilter, setSetupIssueFilter] = useState<'all' | 'required'>('all')
  const [showAllSetupIssues, setShowAllSetupIssues] = useState(false)
  const [creatingDependentIdx, setCreatingDependentIdx] = useState<number | null>(null)
  const [interviewSetup, setInterviewSetup] = useState<ReturnInterviewTopicsResponse | null>(null)
  const interviewSetupRef = useRef<InterviewTopicsSetupHandle>(null)
  const pendingTopicFocusRef = useRef<{ anchor?: string; deductionKey?: string } | null>(null)

  const requestedStep = useMemo<Step | null>(() => {
    const value = new URLSearchParams(location.search).get('step')
    if (!value) return null
    const normalized = value.toLowerCase().trim()
    if (normalized === 'setup' || normalized === 'identity') return 'Identity'
    if (normalized === 'mailing') return 'Mailing'
    if (normalized === 'elections' || normalized === 'cra') return 'Elections'
    if (normalized === 'spouse') return 'Spouse'
    if (normalized === 'dependents') return 'Dependents'
    if (normalized === 'interview') return 'Interview'
    if (normalized === 'income') return 'Income'
    if (normalized === 'deductions') return 'Deductions'
    if (normalized === 'review' || normalized === 'risk') return 'Review'
    if (normalized === 'tax-return' || normalized === 'taxreturn' || normalized === 'return' || normalized === 'optimization') return 'TaxReturn'
    if (normalized === 'netfile') return 'Netfile'
    return null
  }, [location.search])

  const requestedSetupFocus = useMemo<'all' | 'required'>(() => {
    const value = new URLSearchParams(location.search).get('setupFocus')
    return String(value || '').toLowerCase() === 'required' ? 'required' : 'all'
  }, [location.search])

  const slipSchemasByCode = useMemo(
    () => Object.fromEntries(slipSchemas.map((schema) => [schema.code.toUpperCase(), schema])) as Record<string, SlipSchema>,
    [slipSchemas]
  )
  const formSchemasByCode = useMemo(
    () => Object.fromEntries(formWorksheetSchemas.map((schema) => [schema.code.toUpperCase(), schema])) as Record<string, FormWorksheetSchema>,
    [formWorksheetSchemas]
  )
  const filteredSlipSchemas = useMemo(() => {
    const query = slipSearch.trim().toLowerCase()
    const base = query
      ? slipSchemas.filter((schema) =>
        schema.code.toLowerCase().includes(query) ||
        schema.name.toLowerCase().includes(query) ||
        String(schema.catalogTitle || '').toLowerCase().includes(query)
      )
      : slipSchemas
    return [...base].sort(compareSlipSchemas)
  }, [slipSchemas, slipSearch])
  const completeSlipSchemas = useMemo(
    () => filteredSlipSchemas.filter((schema) => schema.schemaStatus === 'complete'),
    [filteredSlipSchemas]
  )
  const catalogOnlySlipSchemas = useMemo(
    () => filteredSlipSchemas.filter((schema) => schema.schemaStatus !== 'complete'),
    [filteredSlipSchemas]
  )
  const createSlipRow = (slipCode: string): SlipRow => {
    const schema = slipSchemasByCode[slipCode.toUpperCase()]
    return {
      slipCode,
      payerName: '',
      taxYear: data?.taxReturn?.tax_year || new Date().getFullYear(),
      taxpayerRole: 'self',
      manualSlipId: createManualSlipId(),
      boxes: buildDefaultBoxes(schema)
    }
  }
  const hasSpouseReturnMode =
    (taxpayerProfile.maritalStatus === 'married' || taxpayerProfile.maritalStatus === 'common_law') &&
    taxpayerProfile.spouseReturnMode === 'full'
  const householdRootId = useMemo(() => {
    const tr = data?.taxReturn as {
      id?: string
      parent_tax_return_id?: string | null
      setup_json?: Record<string, unknown>
    } | undefined
    if (!tr?.id) return ''
    const setupWorkflow = tr.setup_json && typeof tr.setup_json === 'object'
      ? (tr.setup_json.workflow as { parentTaxReturnId?: string | null } | undefined)
      : undefined
    return tr.parent_tax_return_id || setupWorkflow?.parentTaxReturnId || tr.id
  }, [data?.taxReturn])
  const workspaceTabs = useMemo(() => {
    if (!householdRootId) return []
    const direct = allReturns.filter((r) => (r.parent_tax_return_id || r.id) === householdRootId || r.id === householdRootId)
    const dedup = new Map<string, TaxReturnSummary>()
    direct.forEach((r) => dedup.set(r.id, r))
    return Array.from(dedup.values()).sort((a, b) => {
      const aPrimary = String(a.workspace_role || 'primary') === 'primary' ? 0 : 1
      const bPrimary = String(b.workspace_role || 'primary') === 'primary' ? 0 : 1
      if (aPrimary !== bPrimary) return aPrimary - bPrimary
      return String(a.taxpayer_name || '').localeCompare(String(b.taxpayer_name || ''))
    })
  }, [allReturns, householdRootId])
  const interviewMenuItems = useMemo<WorkflowMenuItem[]>(() => SIDEBAR_MENU_ITEMS, [])
  const setupCompletenessIssues = useMemo<CompletenessIssue[]>(() => {
    const issues: CompletenessIssue[] = []
    const married = taxpayerProfile.maritalStatus === 'married' || taxpayerProfile.maritalStatus === 'common_law'
    const spouseMode = married ? taxpayerProfile.spouseReturnMode : 'summary'
    const missing = (value: string) => !String(value || '').trim()

    if (missing(taxpayerProfile.firstName)) issues.push({ field: 'firstName', message: 'Taxpayer first name is missing.', severity: 'required' })
    if (missing(taxpayerProfile.lastName)) issues.push({ field: 'lastName', message: 'Taxpayer last name is missing.', severity: 'required' })
    if (missing(taxpayerProfile.dateOfBirth)) issues.push({ field: 'dateOfBirth', message: 'Taxpayer date of birth is missing.', severity: 'required' })
    if (missing(taxpayerProfile.mailingAddressLine1)) issues.push({ field: 'mailingAddressLine1', message: 'Mailing address line is missing.', severity: 'required' })
    if (missing(taxpayerProfile.mailingCity)) issues.push({ field: 'mailingCity', message: 'Mailing city is missing.', severity: 'required' })
    if (missing(taxpayerProfile.mailingProvinceCode)) issues.push({ field: 'mailingProvinceCode', message: 'Mailing province/territory is missing.', severity: 'required' })
    if (missing(taxpayerProfile.mailingPostalCode)) issues.push({ field: 'mailingPostalCode', message: 'Mailing postal code is missing.', severity: 'required' })
    if (missing(taxpayerProfile.residenceProvinceDec31)) issues.push({ field: 'residenceProvinceDec31', message: 'Province/territory of residence on Dec 31 is missing.', severity: 'required' })
    if (taxpayerProfile.maritalStatusChangedInYear && missing(taxpayerProfile.maritalStatusChangeDate)) {
      issues.push({ field: 'maritalStatusChangeDate', message: 'Marital status changed is marked Yes, but change date is missing.', severity: 'required' })
    }
    if (taxpayerProfile.becameResidentInYear && missing(taxpayerProfile.becameResidentDate)) {
      issues.push({ field: 'becameResidentDate', message: 'Became-resident question is marked Yes, but date of entry is missing.', severity: 'required' })
    }
    if (taxpayerProfile.ceasedResidentInYear && missing(taxpayerProfile.ceasedResidentDate)) {
      issues.push({ field: 'ceasedResidentDate', message: 'Ceased-residency question is marked Yes, but date of departure is missing.', severity: 'required' })
    }
    if (taxpayerProfile.filingForDeceased && missing(taxpayerProfile.deceasedDate)) {
      issues.push({ field: 'deceasedDate', message: 'Deceased filing is marked Yes, but date of death is missing.', severity: 'required' })
    }
    if (missing(taxpayerProfile.languageCorrespondence)) issues.push({ field: 'languageCorrespondence', message: 'Language of correspondence is required.', severity: 'required' })
    if (taxpayerProfile.craEmailNotificationsConsent === 'yes' && missing(taxpayerProfile.email)) {
      issues.push({ field: 'email', message: 'CRA email notifications are enabled, but email address is missing.', severity: 'required' })
    }

    if (married) {
      if (spouseMode === 'full') {
        if (missing(taxpayerProfile.spouse.firstName)) issues.push({ field: 'spouse.firstName', message: 'Spouse first name is missing for full spouse return mode.', severity: 'required' })
        if (missing(taxpayerProfile.spouse.lastName)) issues.push({ field: 'spouse.lastName', message: 'Spouse last name is missing for full spouse return mode.', severity: 'required' })
        if (missing(taxpayerProfile.spouse.dateOfBirth)) issues.push({ field: 'spouse.dateOfBirth', message: 'Spouse date of birth is missing for full spouse return mode.', severity: 'required' })
      } else if (missing(taxpayerProfile.spouse.fullName)) {
        issues.push({ field: 'spouse.fullName', message: 'Spouse full name is missing for summary spouse mode.', severity: 'required' })
      }
      if (taxpayerProfile.spouseNetIncome23600 < 0) {
        issues.push({ field: 'spouseNetIncome23600', message: 'Spouse net income (line 23600) cannot be negative.', severity: 'recommended' })
      }
      if (taxpayerProfile.spouseHasUccbAdjustments && Number(taxpayerProfile.spouseUccb11700 || 0) === 0 && Number(taxpayerProfile.spouseUccbRepayment21300 || 0) === 0) {
        issues.push({ field: 'spouseUccb', message: 'UCCB adjustments is marked Yes, but line 11700 and 21300 amounts are both zero.', severity: 'required' })
      }
    }
    if ((interviewSetup?.selectedTopicIds?.length || 0) === 0) {
      issues.push({ field: 'taxSituation', message: 'Tax situation setup has no topics selected for this taxpayer.', severity: 'recommended' })
    }
    return issues
  }, [taxpayerProfile, interviewSetup])
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
  const displayedSetupIssues = useMemo(
    () => (showAllSetupIssues ? visibleSetupCompletenessIssues : visibleSetupCompletenessIssues.slice(0, 8)),
    [showAllSetupIssues, visibleSetupCompletenessIssues]
  )

  const hiddenSetupIssueCount = Math.max(0, visibleSetupCompletenessIssues.length - displayedSetupIssues.length)

  useEffect(() => {
    if (requestedStep) setActiveStep(requestedStep)
  }, [requestedStep])

  useEffect(() => {
    setSetupIssueFilter(requestedSetupFocus)
  }, [requestedSetupFocus])

  useEffect(() => {
    setShowAllSetupIssues(false)
  }, [setupIssueFilter, visibleSetupCompletenessIssues.length])

  const navigateWorkflowStep = (step: Step) => {
    setActiveStep(step)
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 20)
  }

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [returnData, docs, listData, interviewTopicsData] = await Promise.all([
        taxFetch<TaxReturnPayload>(`/tax-returns/${id}`, getToken),
        taxFetch<{ documents: Array<{ id: string; file_name: string }> }>('/documents/for-tax', getToken),
        taxFetch<{ returns: TaxReturnSummary[] }>('/tax-returns', getToken),
        taxFetch<ReturnInterviewTopicsResponse>(`/tax-returns/${id}/interview-topics`, getToken).catch(() => null)
      ])
      setData(returnData)
      setAllReturns(listData.returns || [])
      setInterviewSetup(interviewTopicsData)
      const setupJson = (returnData.taxReturn.setup_json || {}) as Record<string, unknown>
      const setupTaxpayerProfile = (setupJson.taxpayerProfile && typeof setupJson.taxpayerProfile === 'object'
        ? setupJson.taxpayerProfile
        : {}) as Record<string, unknown>
      const interview = (setupJson.interview && typeof setupJson.interview === 'object'
        ? setupJson.interview
        : {}) as Record<string, unknown>
      const interviewMain = (interview.mainTaxpayer && typeof interview.mainTaxpayer === 'object'
        ? interview.mainTaxpayer
        : {}) as Record<string, unknown>
      const interviewHousehold = (interview.household && typeof interview.household === 'object'
        ? interview.household
        : {}) as Record<string, unknown>
      const interviewSpouse = (interview.spouse && typeof interview.spouse === 'object'
        ? interview.spouse
        : {}) as Record<string, unknown>
      const interviewCra = (interview.cra && typeof interview.cra === 'object'
        ? interview.cra
        : {}) as Record<string, unknown>
      const setupProfile: Record<string, unknown> = {
        ...setupTaxpayerProfile,
        email: setupTaxpayerProfile.email ?? interviewMain.email,
        mailingAddressLine1: setupTaxpayerProfile.mailingAddressLine1 ?? interviewMain.mailingAddressLine1,
        mailingCity: setupTaxpayerProfile.mailingCity ?? interviewMain.mailingCity,
        mailingProvinceCode: setupTaxpayerProfile.mailingProvinceCode ?? interviewMain.mailingProvinceCode ?? interviewMain.provinceCode,
        mailingPostalCode: setupTaxpayerProfile.mailingPostalCode ?? interviewMain.mailingPostalCode,
        residenceProvinceDec31: setupTaxpayerProfile.residenceProvinceDec31 ?? interviewMain.residenceProvinceDec31 ?? interviewMain.provinceCode,
        languageCorrespondence: setupTaxpayerProfile.languageCorrespondence ?? interviewMain.languageCorrespondence,
        maritalStatus: setupTaxpayerProfile.maritalStatus ?? interviewHousehold.maritalStatus,
        spouseReturnMode: setupTaxpayerProfile.spouseReturnMode ?? interviewHousehold.spouseReturnMode,
        spouseSameAddress: setupTaxpayerProfile.spouseSameAddress ?? interviewSpouse.sameAddress,
        electionsCanadianCitizen: setupTaxpayerProfile.electionsCanadianCitizen ?? interviewCra.electionsCanadianCitizen,
        electionsAuthorize: setupTaxpayerProfile.electionsAuthorize ?? interviewCra.electionsAuthorize,
        firstTimeFiler: setupTaxpayerProfile.firstTimeFiler ?? interviewCra.firstTimeFiler,
        soldPrincipalResidence: setupTaxpayerProfile.soldPrincipalResidence ?? interviewCra.soldPrincipalResidence,
        treatyExemptForeignService: setupTaxpayerProfile.treatyExemptForeignService ?? interviewCra.treatyExemptForeignService,
        foreignPropertyOver100k: setupTaxpayerProfile.foreignPropertyOver100k ?? interviewCra.foreignPropertyOver100k,
        organDonorConsent: setupTaxpayerProfile.organDonorConsent ?? interviewCra.organDonorConsent,
        provincialElectionsCanadianCitizen: setupTaxpayerProfile.provincialElectionsCanadianCitizen ?? interviewCra.provincialElectionsCanadianCitizen,
        provincialElectionsAuthorize: setupTaxpayerProfile.provincialElectionsAuthorize ?? interviewCra.provincialElectionsAuthorize,
        craEmailNotificationsConsent: setupTaxpayerProfile.craEmailNotificationsConsent ?? interviewCra.craEmailNotificationsConsent,
        craEmailConfirmed: setupTaxpayerProfile.craEmailConfirmed ?? interviewCra.craEmailConfirmed,
        craHasForeignMailingAddress: setupTaxpayerProfile.craHasForeignMailingAddress ?? interviewCra.craHasForeignMailingAddress,
        spouse: (setupTaxpayerProfile.spouse && typeof setupTaxpayerProfile.spouse === 'object')
          ? setupTaxpayerProfile.spouse
          : {
              fullName: interviewSpouse.fullName,
              firstName: interviewSpouse.firstName,
              lastName: interviewSpouse.lastName,
              dateOfBirth: interviewSpouse.dateOfBirth,
              fullSin: interviewSpouse.fullSin
            }
      }
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
        mailingProvinceCode: String(dbProfile.mailingProvinceCode || setupProfile.mailingProvinceCode || 'ON').trim().toUpperCase().slice(0, 4) || 'ON',
        mailingPostalCode: String(dbProfile.mailingPostalCode || setupProfile.mailingPostalCode || ''),
        residenceProvinceDec31: String(dbProfile.residenceProvinceDec31 || setupProfile.residenceProvinceDec31 || 'ON').trim().toUpperCase().slice(0, 4) || 'ON',
        residenceProvinceCurrent: String(dbProfile.residenceProvinceCurrent || setupProfile.residenceProvinceCurrent || ''),
        selfEmploymentProvinces: String(dbProfile.selfEmploymentProvinces || setupProfile.selfEmploymentProvinces || ''),
        languageCorrespondence: String(dbProfile.languageCorrespondence || setupProfile.languageCorrespondence || 'en') === 'fr' ? 'fr' : 'en',
        maritalStatusChangedInYear: Boolean(coerceNullableBoolean(dbProfile.maritalStatusChangedInYear ?? setupProfile.maritalStatusChangedInYear)) || String(dbProfile.maritalStatusChangeDate || setupProfile.maritalStatusChangeDate || '').length > 0,
        becameResidentInYear: Boolean(coerceNullableBoolean(dbProfile.becameResidentInYear ?? setupProfile.becameResidentInYear)) || String(dbProfile.becameResidentDate || setupProfile.becameResidentDate || '').length > 0,
        ceasedResidentInYear: Boolean(coerceNullableBoolean(dbProfile.ceasedResidentInYear ?? setupProfile.ceasedResidentInYear)) || String(dbProfile.ceasedResidentDate || setupProfile.ceasedResidentDate || '').length > 0,
        filingForDeceased: Boolean(coerceNullableBoolean(dbProfile.filingForDeceased ?? setupProfile.filingForDeceased)) || String(dbProfile.deceasedDate || setupProfile.deceasedDate || '').length > 0,
        becameResidentDate: String(dbProfile.becameResidentDate || setupProfile.becameResidentDate || ''),
        ceasedResidentDate: String(dbProfile.ceasedResidentDate || setupProfile.ceasedResidentDate || ''),
        maritalStatusChangeDate: String(dbProfile.maritalStatusChangeDate || setupProfile.maritalStatusChangeDate || ''),
        deceasedDate: String(dbProfile.deceasedDate || setupProfile.deceasedDate || ''),
        electionsCanadianCitizen: asYesNo(coerceNullableBoolean(dbProfile.electionsCanadianCitizen ?? setupProfile.electionsCanadianCitizen)),
        electionsAuthorize: asYesNo(coerceNullableBoolean(dbProfile.electionsAuthorize ?? setupProfile.electionsAuthorize)),
        firstTimeFiler: asYesNo(coerceNullableBoolean(dbProfile.firstTimeFiler ?? setupProfile.firstTimeFiler)),
        soldPrincipalResidence: asYesNo(coerceNullableBoolean(dbProfile.soldPrincipalResidence ?? setupProfile.soldPrincipalResidence)),
        treatyExemptForeignService: asYesNo(coerceNullableBoolean(dbProfile.treatyExemptForeignService ?? setupProfile.treatyExemptForeignService)),
        indianActExemptIncome: Boolean(coerceNullableBoolean(dbProfile.indianActExemptIncome ?? setupProfile.indianActExemptIncome)),
        foreignPropertyOver100k: asYesNo(coerceNullableBoolean(dbProfile.foreignPropertyOver100k ?? setupProfile.foreignPropertyOver100k)),
        organDonorConsent: asYesNo(coerceNullableBoolean(dbProfile.organDonorConsent ?? setupProfile.organDonorConsent)),
        provincialElectionsCanadianCitizen: asYesNo(coerceNullableBoolean(dbProfile.provincialElectionsCanadianCitizen ?? setupProfile.provincialElectionsCanadianCitizen)),
        provincialElectionsAuthorize: asYesNo(coerceNullableBoolean(dbProfile.provincialElectionsAuthorize ?? setupProfile.provincialElectionsAuthorize)),
        craEmailNotificationsConsent: asYesNo(coerceNullableBoolean(dbProfile.craEmailNotificationsConsent ?? setupProfile.craEmailNotificationsConsent)),
        craEmailConfirmed: asYesNo(coerceNullableBoolean(dbProfile.craEmailConfirmed ?? setupProfile.craEmailConfirmed)),
        craHasForeignMailingAddress: asYesNo(coerceNullableBoolean(dbProfile.craHasForeignMailingAddress ?? setupProfile.craHasForeignMailingAddress)),
        spouseSameAddress: (dbProfile.spouseSameAddress ?? setupProfile.spouseSameAddress) == null
          ? true
          : Boolean(coerceNullableBoolean(dbProfile.spouseSameAddress ?? setupProfile.spouseSameAddress)),
        maritalStatus: (['single', 'married', 'common_law', 'separated', 'divorced', 'widowed'].includes(String(dbProfile.maritalStatus || setupProfile.maritalStatus))
          ? String(dbProfile.maritalStatus || setupProfile.maritalStatus)
          : 'single') as TaxpayerProfileState['maritalStatus'],
        spouseReturnMode: String(dbProfile.spouseReturnMode || setupProfile.spouseReturnMode || 'summary') === 'full' ? 'full' : 'summary',
        spouseSelfEmployed: Boolean(coerceNullableBoolean(dbProfile.spouseSelfEmployed ?? setupProfile.spouseSelfEmployed)),
        spouseHasUccbAdjustments: Boolean(coerceNullableBoolean((dbProfile as Record<string, unknown>).spouseHasUccbAdjustments ?? setupProfile.spouseHasUccbAdjustments)) ||
          Number(dbProfile.spouseUccb11700 ?? setupProfile.spouseUccb11700 ?? 0) !== 0 ||
          Number(dbProfile.spouseUccbRepayment21300 ?? setupProfile.spouseUccbRepayment21300 ?? 0) !== 0,
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
        dependents: dependentsRaw.map((d) => dependentFromLegacy(d as Record<string, unknown>))
      })
      const nonSlipEntries = (returnData.incomeEntries || []).filter(
        (r) => !(
          r.source_type === 'manual_slip' ||
          r.source_type === 'manual_t4' ||
          r.source_type === 'form_worksheet' ||
          String(r?.metadata?.slipType || '').length > 0
        )
      )
      setIncomeRows(nonSlipEntries.map((r) => ({
        category: r.category,
        description: r.description || '',
        amount: Number(r.amount || 0),
        taxpayerRole: String((r.metadata || {}).taxpayerRole || 'self') === 'spouse' ? 'spouse' : 'self'
      })))
      setFormWorksheetValues(returnData.formWorksheetValues || {})
      setManualSlipRows(buildSlipRowsFromReturnData(
        returnData.incomeEntries || [],
        returnData.deductions || [],
        slipSchemasByCode
      ))
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
    const loadSlipSchemas = async () => {
      setLoadingSlipSchemas(true)
      try {
        const response = await taxFetch<SlipSchemasResponse>('/slip-schemas', getToken)
        const schemas = response.schemas || []
        setSlipSchemas(schemas)
        const sorted = [...schemas].sort(compareSlipSchemas)
        const preferred = sorted.find((schema) => schema.schemaStatus === 'complete') || sorted[0]
        if (preferred && !schemas.some((schema) => schema.code === newSlipCode && schema.schemaStatus === 'complete')) {
          setNewSlipCode(preferred.code)
        }
      } catch (e) {
        setErr((prev) => prev || (e instanceof Error ? e.message : 'Could not load slip schemas'))
      } finally {
        setLoadingSlipSchemas(false)
      }
    }
    void loadSlipSchemas()
    const loadFormWorksheets = async () => {
      setLoadingFormWorksheets(true)
      try {
        const response = await taxFetch<FormWorksheetSchemasResponse>('/form-worksheets', getToken)
        setFormWorksheetSchemas(response.schemas || [])
      } catch (e) {
        setErr((prev) => prev || (e instanceof Error ? e.message : 'Could not load form worksheets'))
      } finally {
        setLoadingFormWorksheets(false)
      }
    }
    void loadFormWorksheets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!data || slipSchemas.length === 0) return
    setManualSlipRows(buildSlipRowsFromReturnData(
      data.incomeEntries || [],
      data.deductions || [],
      slipSchemasByCode
    ))
  }, [data, slipSchemas, slipSchemasByCode])

  const loadRequiredForms = async () => {
    if (!id) {
      setRequiredForms(null)
      return
    }
    setLoadingRequiredForms(true)
    try {
      const response = await taxFetch<RequiredFormsResponse>(`/tax-returns/${id}/required-forms`, getToken)
      setRequiredForms(response)
    } catch {
      setRequiredForms(null)
    } finally {
      setLoadingRequiredForms(false)
    }
  }

  useEffect(() => {
    if (activeStep === 'Review' && id) {
      void loadRequiredForms()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, id])

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
  const addSlipRow = (slipCode?: string) => {
    const code = slipCode || newSlipCode
    if (slipCode) setNewSlipCode(slipCode)
    setManualSlipRows((prev) => [...prev, { ...createSlipRow(code), taxpayerRole: returnRole }])
  }
  const addSuggestedSlipRow = (slipCode: string) => {
    setNewSlipCode(slipCode)
    setManualSlipRows((prev) => {
      const exists = prev.some((row) =>
        row.taxpayerRole === returnRole && row.slipCode.toUpperCase() === slipCode.toUpperCase()
      )
      if (exists) return prev
      return [...prev, { ...createSlipRow(slipCode), taxpayerRole: returnRole }]
    })
  }
  const ensureSectionSlipRow = useCallback((slipCode: string) => {
    setManualSlipRows((prev) => {
      const exists = prev.some((row) =>
        row.taxpayerRole === returnRole && row.slipCode.toUpperCase() === slipCode.toUpperCase()
      )
      if (exists) return prev
      return [...prev, { ...createSlipRow(slipCode), taxpayerRole: returnRole }]
    })
  }, [returnRole, slipSchemasByCode, data?.taxReturn?.tax_year])

  const focusInterviewTopicTarget = (anchor?: string, deductionKey?: string) => {
    window.setTimeout(() => {
      if (anchor) {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      if (deductionKey) {
        const target = document.querySelector(`[data-deduction-key="${deductionKey}"]`)
        const input = (target instanceof HTMLInputElement
          ? target
          : target?.querySelector('input')) as HTMLInputElement | null
        input?.focus()
        input?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 80)
  }

  const handleInterviewTopicNavigate = async (topic: InterviewTopicItem, selectedTopicIds: string[]) => {
    const saved = await (interviewSetupRef.current?.saveSelection(selectedTopicIds) ?? Promise.resolve(true))
    if (!saved) return

    const target = resolveInterviewTopicNavigation(topic)
    if (target.slipCode && slipSchemasByCode[target.slipCode.toUpperCase()]) {
      addSuggestedSlipRow(target.slipCode)
    }
    pendingTopicFocusRef.current = {
      anchor: target.focusAnchor,
      deductionKey: target.deductionKey
    }
    navigateWorkflowStep(target.step as Step)
  }

  useEffect(() => {
    const pending = pendingTopicFocusRef.current
    if (!pending) return
    pendingTopicFocusRef.current = null
    focusInterviewTopicTarget(pending.anchor, pending.deductionKey)
  }, [activeStep])
  const removeSlipRow = async (target: { idx: number; manualSlipId?: string }) => {
    const row = manualSlipRows[target.idx]
    if (!row) return
    const label = slipSchemasByCode[row.slipCode.toUpperCase()]?.name || row.slipCode
    if (!window.confirm(`Remove ${row.slipCode} — ${label}?`)) return
    const slipKey = row.manualSlipId || target.manualSlipId
    const previousSlips = manualSlipRows
    const nextSlips = manualSlipRows.filter((candidate, i) => {
      if (slipKey) return candidate.manualSlipId !== slipKey
      return i !== target.idx
    })
    setManualSlipRows(nextSlips)
    const saved = await saveIncome({ slips: nextSlips, reload: false })
    if (!saved) setManualSlipRows(previousSlips)
  }
  const updateSlipRowCode = (idx: number, slipCode: string) => {
    const schema = slipSchemasByCode[slipCode.toUpperCase()]
    setManualSlipRows((prev) => {
      const next = [...prev]
      const row = next[idx]
      if (!row) return prev
      next[idx] = {
        ...row,
        slipCode,
        manualSlipId: row.manualSlipId || createManualSlipId(),
        boxes: { ...buildDefaultBoxes(schema), ...row.boxes }
      }
      return next
    })
  }
  const addCustomBoxToSlip = (idx: number) => {
    const nextCode = window.prompt('Enter CRA box code (for example 14 or 16A)')
    if (!nextCode?.trim()) return
    setManualSlipRows((prev) => {
      const next = [...prev]
      const row = next[idx]
      if (!row) return prev
      next[idx] = {
        ...row,
        boxes: { ...row.boxes, [nextCode.trim().toUpperCase()]: row.boxes[nextCode.trim().toUpperCase()] ?? 0 }
      }
      return next
    })
  }
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
      const def = slipSchemasByCode[slipType.toUpperCase()]
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
  }, [data?.incomeEntries, slipSchemasByCode])

  const handleFormWorksheetChange = useCallback((formCode: string, fieldCode: string, value: string | number | undefined) => {
    const code = formCode.toUpperCase()
    setFormWorksheetValues((prev) => {
      const current = prev[code] || { self: {}, spouse: {} }
      const roleBucket = { ...current[returnRole] }
      if (value == null || value === '') delete roleBucket[fieldCode]
      else roleBucket[fieldCode] = value
      return {
        ...prev,
        [code]: {
          ...current,
          [returnRole]: roleBucket
        }
      }
    })
  }, [returnRole])

  const saveIncome = async (overrides?: { slips?: SlipRow[]; reload?: boolean }): Promise<boolean> => {
    setSaving(true)
    try {
      const slips = (overrides?.slips ?? manualSlipRows).map((row) => ({
        ...row,
        manualSlipId: row.manualSlipId || createManualSlipId(),
        taxpayerRole: row.taxpayerRole || 'self'
      }))
      const formResult = await taxFetch<{
        formWorksheetValues: FormWorksheetValuesState
        incomeEntries: TaxReturnPayload['incomeEntries']
      }>(`/tax-returns/${id}/form-worksheets`, getToken, {
        method: 'PUT',
        body: JSON.stringify({ formWorksheetValues })
      })
      const result = await taxFetch<{ incomeEntries: TaxReturnPayload['incomeEntries']; deductions: TaxReturnPayload['deductions'] }>(`/tax-returns/${id}/slips`, getToken, {
        method: 'POST',
        body: JSON.stringify({
          manualIncomeRows: incomeRows,
          slips
        })
      })
      const mergedIncomeEntries = result.incomeEntries || []
      setFormWorksheetValues(formResult.formWorksheetValues || formWorksheetValues)
      if (overrides?.reload === false) {
        setManualSlipRows(buildSlipRowsFromReturnData(
          mergedIncomeEntries,
          result.deductions || [],
          slipSchemasByCode
        ))
        setData((prev) => prev ? {
          ...prev,
          incomeEntries: mergedIncomeEntries,
          deductions: result.deductions || [],
          formWorksheetValues: formResult.formWorksheetValues || formWorksheetValues
        } : prev)
      } else {
        await load()
      }
      if (activeStep === 'Review') void loadRequiredForms()
      return true
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save income')
      return false
    } finally {
      setSaving(false)
    }
  }

  const saveDeductions = async (): Promise<boolean> => {
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

      const slipDeductionEntries = (data?.deductions || [])
        .filter((d) => String((d.metadata || {}).source || '') === 'manual_slip')
        .map((d) => ({
          category: d.category,
          description: d.description || '',
          amount: Number(d.amount || 0),
          isCredit: Boolean(d.is_credit),
          metadata: d.metadata || {}
        }))

      await taxFetch(`/tax-returns/${id}/deductions`, getToken, {
        method: 'PUT',
        body: JSON.stringify({
          entries: [
            ...structuredEntries,
            ...slipDeductionEntries,
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
      if (activeStep === 'Review') void loadRequiredForms()
      return true
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save deductions')
      return false
    } finally {
      setSaving(false)
    }
  }

  const importFromDocument = async () => {
    if (!selectedDocumentId) return
    setSaving(true)
    setErr(null)
    try {
      const response = await taxFetch<DocumentExtractResponse>('/documents/extract', getToken, {
        method: 'POST',
        body: JSON.stringify({
          documentId: selectedDocumentId,
          taxReturnId: id,
          previewOnly: true,
          taxYear: data?.taxReturn?.tax_year,
          taxpayerName: data?.taxReturn?.taxpayer_name
        })
      })
      setExtractionPreview({
        extractionId: response.extraction?.id || null,
        documentId: selectedDocumentId,
        slipType: response.slipType || 'UNKNOWN',
        confidence: response.confidence || 0,
        reviewRequired: response.reviewRequired,
        boxes: { ...(response.boxes || {}) },
        ocrMethod: response.ocrMethod,
        ocrWarning: response.ocrWarning
      })
      if (response.slipType && response.slipType !== 'UNKNOWN') {
        setNewSlipCode(response.slipType)
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not extract from document')
    } finally {
      setSaving(false)
    }
  }

  const applyExtractionPreview = async () => {
    if (!extractionPreview) return
    const slipCode = extractionPreview.slipType
    if (!slipCode || slipCode === 'UNKNOWN') {
      setErr('Select a slip type before applying the extraction.')
      return
    }
    const schema = slipSchemasByCode[slipCode.toUpperCase()]
    const mergedBoxes = { ...buildDefaultBoxes(schema), ...extractionPreview.boxes }
    const newRow: SlipRow = {
      slipCode,
      payerName: '',
      taxYear: data?.taxReturn?.tax_year || new Date().getFullYear(),
      taxpayerRole: 'self',
      manualSlipId: `extract-${extractionPreview.extractionId || Date.now()}`,
      boxes: mergedBoxes
    }
    setManualSlipRows((prev) => [...prev, newRow])
    if (extractionPreview.extractionId) {
      try {
        await taxFetch(`/documents/extractions/${extractionPreview.extractionId}/review`, getToken, { method: 'POST' })
      } catch {
        // Non-blocking: slip row is applied locally even if review flag fails.
      }
    }
    setExtractionPreview(null)
    setSelectedDocumentId('')
    setErr(null)
  }

  const addDependent = () => {
    setTaxpayerProfile((prev) => ({
      ...prev,
      dependents: [...prev.dependents, createEmptyDependent({ residenceProvinceDec31: prev.residenceProvinceDec31 || 'ON' })]
    }))
  }

  const removeDependent = (idx: number) => {
    setTaxpayerProfile((prev) => ({
      ...prev,
      dependents: prev.dependents.filter((_, i) => i !== idx)
    }))
  }

  const stepForIssueField = (field: string): Step => {
    if (field === 'taxSituation') return 'Interview'
    if (field.startsWith('spouse') || field === 'spouseUccb') return 'Spouse'
    if (field.startsWith('dependents')) return 'Dependents'
    if ([
      'firstTimeFiler',
      'soldPrincipalResidence',
      'treatyExemptForeignService',
      'electionsCanadianCitizen',
      'electionsAuthorize',
      'foreignPropertyOver100k',
      'organDonorConsent',
      'provincialElectionsCanadianCitizen',
      'provincialElectionsAuthorize',
      'craEmailNotificationsConsent',
      'craEmailConfirmed',
      'craHasForeignMailingAddress',
      'residenceProvinceDec31',
      'languageCorrespondence',
      'maritalStatusChangeDate',
      'becameResidentDate',
      'ceasedResidentDate',
      'deceasedDate'
    ].includes(field)) return 'Elections'
    if (
      field.startsWith('mailing') ||
      field.startsWith('residence') ||
      field === 'email'
    ) return 'Mailing'
    return 'Identity'
  }

  const openSetupIssueField = (field: string) => {
    navigateWorkflowStep(stepForIssueField(field))
  }

  const createDependentReturn = async (dep: DependentProfile, idx: number) => {
    if (!dependentRequiresFullReturn(dep)) {
      setErr('This dependant does not require a full tax return workspace based on income and filing obligation answers.')
      return
    }
    const dependentName = dependentFullName(dep)
    if (!dependentName) {
      setErr('Enter the dependant first and last name before creating a return workspace.')
      return
    }
    setErr(null)
    setCreatingDependentIdx(idx)
    try {
      const created = await taxFetch<{ taxReturn: { id: string } }>('/tax-returns', getToken, {
        method: 'POST',
        body: JSON.stringify({
          taxpayerName: dependentName,
          firstName: dep.firstName.trim(),
          lastName: dep.lastName.trim(),
          sin: dep.sin.replace(/\D/g, '').slice(0, 9) || null,
          dateOfBirth: dep.dateOfBirth || null,
          provinceCode: dep.residenceProvinceDec31 || 'ON',
          taxYear: data?.taxReturn?.tax_year || new Date().getFullYear(),
          setup: {
            sourceReturnId: data?.taxReturn?.id || null,
            sourceRole: 'dependent',
            relationship: dep.relationship || null,
            workflow: {
              source: 'return-builder',
              linkedPrimaryReturnId: data?.taxReturn?.id || null,
              relationship: dep.relationship || null
            }
          },
          taxpayerProfile: {
            maritalStatus: dep.maritalStatus,
            residenceProvinceDec31: dep.residenceProvinceDec31 || 'ON',
            spouseReturnMode: 'summary',
            dependents: []
          }
        })
      })
      const createdId = created?.taxReturn?.id
      if (!createdId) throw new Error('Dependent return was created but no return id was received.')
      navigate(`${basePath}/returns/${createdId}?step=identity&setupFocus=all`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create dependant return workspace')
    } finally {
      setCreatingDependentIdx(null)
    }
  }

  const saveTaxpayerProfile = async (): Promise<boolean> => {
    if (!data?.taxReturn?.id) return true
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
        maritalStatusChangedInYear: Boolean(taxpayerProfile.maritalStatusChangedInYear),
        becameResidentInYear: Boolean(taxpayerProfile.becameResidentInYear),
        ceasedResidentInYear: Boolean(taxpayerProfile.ceasedResidentInYear),
        filingForDeceased: Boolean(taxpayerProfile.filingForDeceased),
        becameResidentDate: taxpayerProfile.becameResidentInYear ? (taxpayerProfile.becameResidentDate || null) : null,
        ceasedResidentDate: taxpayerProfile.ceasedResidentInYear ? (taxpayerProfile.ceasedResidentDate || null) : null,
        maritalStatusChangeDate: taxpayerProfile.maritalStatusChangedInYear ? (taxpayerProfile.maritalStatusChangeDate || null) : null,
        deceasedDate: taxpayerProfile.filingForDeceased ? (taxpayerProfile.deceasedDate || null) : null,
        electionsCanadianCitizen: taxpayerProfile.electionsCanadianCitizen === 'yes',
        electionsAuthorize: taxpayerProfile.electionsAuthorize === 'yes',
        firstTimeFiler: taxpayerProfile.firstTimeFiler === 'yes',
        soldPrincipalResidence: taxpayerProfile.soldPrincipalResidence === 'yes',
        treatyExemptForeignService: taxpayerProfile.treatyExemptForeignService === 'yes',
        indianActExemptIncome: Boolean(taxpayerProfile.indianActExemptIncome),
        foreignPropertyOver100k: taxpayerProfile.foreignPropertyOver100k === 'yes',
        organDonorConsent: serializeOrganDonorConsent(
          taxpayerProfile.residenceProvinceDec31,
          taxpayerProfile.organDonorConsent
        ),
        ...serializeProvincialElections(
          taxpayerProfile.residenceProvinceDec31,
          taxpayerProfile.provincialElectionsCanadianCitizen,
          taxpayerProfile.provincialElectionsAuthorize
        ),
        craEmailNotificationsConsent: taxpayerProfile.craEmailNotificationsConsent === 'yes',
        craEmailConfirmed: taxpayerProfile.craEmailConfirmed === 'yes',
        craHasForeignMailingAddress: taxpayerProfile.craHasForeignMailingAddress === 'yes',
        spouseSameAddress: Boolean(taxpayerProfile.spouseSameAddress),
        spouseSelfEmployed: Boolean(taxpayerProfile.spouseSelfEmployed),
        spouseHasUccbAdjustments: Boolean(taxpayerProfile.spouseHasUccbAdjustments),
        spouseNetIncome23600: Number(taxpayerProfile.spouseNetIncome23600 || taxpayerProfile.spouse.netIncome || 0),
        spouseUccb11700: taxpayerProfile.spouseHasUccbAdjustments ? Number(taxpayerProfile.spouseUccb11700 || 0) : 0,
        spouseUccbRepayment21300: taxpayerProfile.spouseHasUccbAdjustments ? Number(taxpayerProfile.spouseUccbRepayment21300 || 0) : 0,
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
          .filter((d) => dependentFullName(d).length > 0)
          .map((d) => serializeDependent(d))
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
      // Keep the just-entered setup values in the UI after save. This avoids
      // a disruptive full reload from temporarily incomplete backend snapshots.
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          taxReturn: {
            ...prev.taxReturn,
            taxpayer_name: fullName,
            taxpayer_first_name: taxpayerProfile.firstName.trim() || null,
            taxpayer_last_name: taxpayerProfile.lastName.trim() || null,
            taxpayer_sin: sanitizeSin(taxpayerProfile.sin) || null,
            taxpayer_date_of_birth: taxpayerProfile.dateOfBirth || null,
            taxpayer_profile: normalizedProfile
          }
        }
      })
      if (setupCompletenessIssues.length > 0) {
        setProfileSavedMsg(`Taxpayer profile saved with ${setupCompletenessIssues.length} non-blocking completeness warning(s).`)
      } else {
        setProfileSavedMsg('Taxpayer profile saved.')
      }
      return true
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save taxpayer profile')
      return false
    } finally {
      setSaving(false)
    }
  }

  const saveActiveStepData = async (): Promise<boolean> => {
    switch (activeStep) {
      case 'Identity':
      case 'Mailing':
      case 'Elections':
      case 'Spouse':
      case 'Dependents':
        return saveTaxpayerProfile()
      case 'Interview': {
        setSaving(true)
        try {
          return await (interviewSetupRef.current?.save() ?? true)
        } finally {
          setSaving(false)
        }
      }
      case 'Income':
        return saveIncome()
      case 'Deductions':
        return saveDeductions()
      default:
        return true
    }
  }

  const jumpToMenuItem = async (item: WorkflowMenuItem) => {
    if (item.step === activeStep) return
    const saved = await saveActiveStepData()
    if (!saved) return
    navigateWorkflowStep(item.step)
  }

  const navigateFromReviewField = (reviewField: string, targetReturnId?: string) => {
    const step = reviewFieldToStep(reviewField)
    if (targetReturnId && targetReturnId !== id) {
      navigate(`${basePath}/returns/${targetReturnId}?step=${stepToQueryValue(step)}`)
      return
    }
    navigateWorkflowStep(step)
  }

  return (
    <>
      <SEO
        title="Return Builder | Tax Intelligence | Client Portal"
        description="Build and review T1 return data."
        canonical="/app/tax-intelligence/returns"
      />
      <ClientPortalShell wideContent>
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

          <div className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-2">
            <p className="text-xs text-text-light">Household workspaces</p>
            <div className="rounded-md border border-border bg-background/40 p-2">
              <div role="tablist" aria-label="Household workspaces" className="flex flex-wrap items-end gap-2 border-b border-border px-1">
              {workspaceTabs.map((w) => {
                const current = w.id === id
                const label = String(w.workspace_role || 'primary') === 'primary'
                  ? `${w.taxpayer_name}`
                  : `${w.taxpayer_name} (${String(w.workspace_role || '').toLowerCase()})`
                return (
                  <button
                    key={w.id}
                    type="button"
                    role="tab"
                    aria-selected={current}
                    onClick={() => navigate(`${basePath}/returns/${w.id}`)}
                    className={`px-3 py-1.5 text-xs rounded-t-md border border-b-0 ${current ? 'bg-white text-primary-dark border-primary-dark font-semibold' : 'bg-background text-text border-border hover:bg-white'}`}
                  >
                    {label}
                  </button>
                )
              })}
              </div>
              {workspaceTabs.length === 0 && (
                <span className="text-xs text-text-light block px-1">This return has no linked household workspaces yet.</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
            <aside className="bg-white p-3 rounded-lg border border-border shadow-sm h-fit lg:sticky lg:top-20">
              <p className="text-xs font-semibold text-primary-dark mb-2">Interview and forms</p>
              <div className="space-y-1">
                {interviewMenuItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { void jumpToMenuItem(item) }}
                    className={`w-full text-left px-2 py-1.5 text-xs rounded-md border ${
                      activeStep === item.step ? 'bg-primary-dark text-white border-primary-dark' : 'bg-white text-text border-border hover:bg-background'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-text-light mt-3">
                Move through setup, slips, deductions, review, tax return, and NETFILE.
              </p>
            </aside>

            <div className="space-y-4">
              {err && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{err}</p>}
              {loading && <p className="text-sm text-text-light">Loading return data…</p>}

          {!loading && activeStep === 'Interview' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm">
              {id ? (
                <InterviewTopicsSetup
                  ref={interviewSetupRef}
                  taxReturnId={id}
                  taxpayerName={data?.taxReturn?.taxpayer_name || 'this taxpayer'}
                  getToken={getToken}
                  onSaved={(response) => setInterviewSetup(response)}
                  onNavigateTopic={handleInterviewTopicNavigate}
                />
              ) : (
                <p className="text-sm text-text-light">Select a household workspace tab to begin interview setup.</p>
              )}
              <WorkflowPageNav activeStep={activeStep} onNavigate={navigateWorkflowStep} onSaveBeforeNavigate={saveActiveStepData} saving={saving} />
            </section>
          )}

          {!loading && activeStep === 'Identity' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-3">
              <h2 className="text-lg font-semibold text-primary-dark">Identification</h2>
              <p className="text-sm text-text-light">
                Return status: <strong className="text-text">{data?.taxReturn.status}</strong>. Enter taxpayer identity for T1 Step 1.
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
                    {displayedSetupIssues.map((item, idx) => (
                      <li key={`${item.field}-${idx}`}>
                        <button
                          type="button"
                          className="text-left hover:underline"
                          onClick={() => openSetupIssueField(item.field)}
                          title="Open the setup section for this issue"
                        >
                          [{item.severity === 'required' ? 'REQUIRED' : 'RECOMMENDED'}] {item.message}
                        </button>
                      </li>
                    ))}
                    {displayedSetupIssues.length === 0 && (
                      <li>[REQUIRED] No required warnings at the moment.</li>
                    )}
                  </ul>
                  {hiddenSetupIssueCount > 0 && (
                    <button
                      type="button"
                      className="mt-2 text-xs text-amber-900 underline"
                      onClick={() => setShowAllSetupIssues(true)}
                    >
                      Show {hiddenSetupIssueCount} more warning(s)
                    </button>
                  )}
                  {showAllSetupIssues && visibleSetupCompletenessIssues.length > 8 && (
                    <button
                      type="button"
                      className="mt-2 ml-3 text-xs text-amber-900 underline"
                      onClick={() => setShowAllSetupIssues(false)}
                    >
                      Show fewer
                    </button>
                  )}
                </div>
              )}
              <div id="rb-identity" className="space-y-2">
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
                  SIN (9 digits, optional)
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
              </div>
              <WorkflowPageNav
                activeStep={activeStep}
                onNavigate={navigateWorkflowStep}
                showSaveProfile
                onSaveProfile={() => { void saveTaxpayerProfile() }}
                onSaveBeforeNavigate={saveActiveStepData}
                saving={saving}
              />
            </section>
          )}

          {!loading && activeStep === 'Mailing' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-3">
              <h2 className="text-lg font-semibold text-primary-dark">Mailing address (T1 Step 1)</h2>
              <p className="text-sm text-text-light">Mailing address and related location details.</p>
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
                  <ul className="mt-2 space-y-1 text-xs text-amber-900">
                    {displayedSetupIssues.map((item, idx) => (
                      <li key={`${item.field}-${idx}`}>
                        <button type="button" className="text-left hover:underline" onClick={() => openSetupIssueField(item.field)}>
                          [{item.severity === 'required' ? 'REQUIRED' : 'RECOMMENDED'}] {item.message}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div id="rb-mailing" className="space-y-2">
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
                    <ProvinceSelect
                      className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                      value={taxpayerProfile.mailingProvinceCode || 'ON'}
                      onChange={(code) => setTaxpayerProfile((prev) => ({ ...prev, mailingProvinceCode: code }))}
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
                  <label className="text-xs text-text-light md:col-span-2">
                    Current residence province/territory if different from mailing address
                    <ProvinceSelect
                      className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                      value={taxpayerProfile.residenceProvinceCurrent}
                      onChange={(code) => setTaxpayerProfile((prev) => ({ ...prev, residenceProvinceCurrent: code }))}
                      allowEmpty
                      emptyLabel="Same as mailing address"
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
                </div>
              </div>
              <WorkflowPageNav
                activeStep={activeStep}
                onNavigate={navigateWorkflowStep}
                showSaveProfile
                onSaveProfile={() => { void saveTaxpayerProfile() }}
                onSaveBeforeNavigate={saveActiveStepData}
                saving={saving}
              />
            </section>
          )}

          {!loading && activeStep === 'Elections' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-3">
              <h2 className="text-lg font-semibold text-primary-dark">CRA questions</h2>
              <p className="text-sm text-text-light">Province of residence, residency questions, and T1 page 2 elections.</p>
              <div id="rb-elections" className="divide-y divide-border/70 rounded-md border border-border">
                <CraQuestionRow label="Province/territory of residence on Dec 31">
                  <ProvinceSelect
                    value={taxpayerProfile.residenceProvinceDec31 || 'ON'}
                    onChange={(code) => setTaxpayerProfile((prev) => {
                      const clearedElections = clearProvincialElectionsIfNotApplicable(code, {
                        provincialElectionsCanadianCitizen: prev.provincialElectionsCanadianCitizen,
                        provincialElectionsAuthorize: prev.provincialElectionsAuthorize
                      })
                      return {
                        ...prev,
                        residenceProvinceDec31: code,
                        organDonorConsent: clearOrganDonorIfNotApplicable(code, prev.organDonorConsent),
                        ...clearedElections
                      }
                    })}
                  />
                </CraQuestionRow>
                <CraQuestionRow label="Language of correspondence">
                  <select
                    className="border border-border rounded-md px-3 py-2 text-sm"
                    value={taxpayerProfile.languageCorrespondence}
                    onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, languageCorrespondence: e.target.value === 'fr' ? 'fr' : 'en' }))}
                  >
                    <option value="en">English</option>
                    <option value="fr">French</option>
                  </select>
                </CraQuestionRow>
                <CraQuestionRow label="Did marital status change during the year?">
                  <YesNoToggle
                    className=""
                    value={taxpayerProfile.maritalStatusChangedInYear}
                    onChange={(value) => setTaxpayerProfile((prev) => ({
                      ...prev,
                      maritalStatusChangedInYear: Boolean(value),
                      maritalStatusChangeDate: value ? prev.maritalStatusChangeDate : ''
                    }))}
                  />
                </CraQuestionRow>
                {taxpayerProfile.maritalStatusChangedInYear && (
                  <CraQuestionRow label="Date marital status changed">
                    <input
                      type="date"
                      className="border border-border rounded-md px-3 py-2 text-sm"
                      value={taxpayerProfile.maritalStatusChangeDate ? taxpayerProfile.maritalStatusChangeDate.slice(0, 10) : ''}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, maritalStatusChangeDate: e.target.value }))}
                    />
                  </CraQuestionRow>
                )}
                <CraQuestionRow label="Became a resident of Canada this year?">
                  <YesNoToggle
                    className=""
                    value={taxpayerProfile.becameResidentInYear}
                    onChange={(value) => setTaxpayerProfile((prev) => ({
                      ...prev,
                      becameResidentInYear: Boolean(value),
                      becameResidentDate: value ? prev.becameResidentDate : ''
                    }))}
                  />
                </CraQuestionRow>
                {taxpayerProfile.becameResidentInYear && (
                  <CraQuestionRow label="Date of entry to Canada">
                    <input
                      type="date"
                      className="border border-border rounded-md px-3 py-2 text-sm"
                      value={taxpayerProfile.becameResidentDate ? taxpayerProfile.becameResidentDate.slice(0, 10) : ''}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, becameResidentDate: e.target.value }))}
                    />
                  </CraQuestionRow>
                )}
                <CraQuestionRow label="Ceased residency in Canada this year?">
                  <YesNoToggle
                    className=""
                    value={taxpayerProfile.ceasedResidentInYear}
                    onChange={(value) => setTaxpayerProfile((prev) => ({
                      ...prev,
                      ceasedResidentInYear: Boolean(value),
                      ceasedResidentDate: value ? prev.ceasedResidentDate : ''
                    }))}
                  />
                </CraQuestionRow>
                {taxpayerProfile.ceasedResidentInYear && (
                  <CraQuestionRow label="Date of departure from Canada">
                    <input
                      type="date"
                      className="border border-border rounded-md px-3 py-2 text-sm"
                      value={taxpayerProfile.ceasedResidentDate ? taxpayerProfile.ceasedResidentDate.slice(0, 10) : ''}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, ceasedResidentDate: e.target.value }))}
                    />
                  </CraQuestionRow>
                )}
                <CraQuestionRow label="Filing for a deceased person?">
                  <YesNoToggle
                    className=""
                    value={taxpayerProfile.filingForDeceased}
                    onChange={(value) => setTaxpayerProfile((prev) => ({
                      ...prev,
                      filingForDeceased: Boolean(value),
                      deceasedDate: value ? prev.deceasedDate : ''
                    }))}
                  />
                </CraQuestionRow>
                {taxpayerProfile.filingForDeceased && (
                  <CraQuestionRow label="Date of death">
                    <input
                      type="date"
                      className="border border-border rounded-md px-3 py-2 text-sm"
                      value={taxpayerProfile.deceasedDate ? taxpayerProfile.deceasedDate.slice(0, 10) : ''}
                      onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, deceasedDate: e.target.value }))}
                    />
                  </CraQuestionRow>
                )}
                <CraQuestionRow label="Are you filing a CRA income tax return for the first time?">
                  <YesNoToggle
                    className=""
                    value={yesNoToToggle(taxpayerProfile.firstTimeFiler)}
                    onChange={(value) => setTaxpayerProfile((prev) => ({ ...prev, firstTimeFiler: toggleToYesNo(value) }))}
                  />
                </CraQuestionRow>
                <CraQuestionRow label="Did you sell a principal residence in the tax year?">
                  <YesNoToggle
                    className=""
                    value={yesNoToToggle(taxpayerProfile.soldPrincipalResidence)}
                    onChange={(value) => setTaxpayerProfile((prev) => ({ ...prev, soldPrincipalResidence: toggleToYesNo(value) }))}
                  />
                </CraQuestionRow>
                <CraQuestionRow label="Are you (or eligible household member) exempt from tax under a treaty because of foreign service/diplomatic status?">
                  <YesNoToggle
                    className=""
                    value={yesNoToToggle(taxpayerProfile.treatyExemptForeignService)}
                    onChange={(value) => setTaxpayerProfile((prev) => ({ ...prev, treatyExemptForeignService: toggleToYesNo(value) }))}
                  />
                </CraQuestionRow>
                <CraQuestionRow label="Elections Canada - Are you a Canadian citizen?">
                  <YesNoToggle
                    className=""
                    value={yesNoToToggle(taxpayerProfile.electionsCanadianCitizen)}
                    onChange={(value) => setTaxpayerProfile((prev) => ({
                      ...prev,
                      electionsCanadianCitizen: toggleToYesNo(value),
                      electionsAuthorize: value ? prev.electionsAuthorize : 'no'
                    }))}
                  />
                </CraQuestionRow>
                {taxpayerProfile.electionsCanadianCitizen === 'yes' && (
                  <CraQuestionRow label="Elections Canada authorization to share information with Elections Canada">
                    <YesNoToggle
                      className=""
                      value={yesNoToToggle(taxpayerProfile.electionsAuthorize)}
                      onChange={(value) => setTaxpayerProfile((prev) => ({ ...prev, electionsAuthorize: toggleToYesNo(value) }))}
                    />
                  </CraQuestionRow>
                )}
                <CraQuestionRow label="Tick if you had income exempt under the Indian Act">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={taxpayerProfile.indianActExemptIncome}
                    onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, indianActExemptIncome: e.target.checked }))}
                  />
                </CraQuestionRow>
                <CraQuestionRow label="Did you own/hold specified foreign property above CAD 100,000 at any point in the year?">
                  <YesNoToggle
                    className=""
                    value={yesNoToToggle(taxpayerProfile.foreignPropertyOver100k)}
                    onChange={(value) => setTaxpayerProfile((prev) => ({ ...prev, foreignPropertyOver100k: toggleToYesNo(value) }))}
                  />
                </CraQuestionRow>
                <ProvincialCraQuestionBlocks
                  provinceCode={taxpayerProfile.residenceProvinceDec31}
                  organDonorConsent={taxpayerProfile.organDonorConsent}
                  onOrganDonorConsentChange={(value) => setTaxpayerProfile((prev) => ({ ...prev, organDonorConsent: value }))}
                  provincialElectionsCanadianCitizen={taxpayerProfile.provincialElectionsCanadianCitizen}
                  onProvincialElectionsCanadianCitizenChange={(value) => setTaxpayerProfile((prev) => ({ ...prev, provincialElectionsCanadianCitizen: value }))}
                  provincialElectionsAuthorize={taxpayerProfile.provincialElectionsAuthorize}
                  onProvincialElectionsAuthorizeChange={(value) => setTaxpayerProfile((prev) => ({ ...prev, provincialElectionsAuthorize: value }))}
                />
                <CraQuestionRow label="I accept CRA terms and choose to receive email notifications.">
                  <YesNoToggle
                    className=""
                    value={yesNoToToggle(taxpayerProfile.craEmailNotificationsConsent)}
                    onChange={(value) => setTaxpayerProfile((prev) => ({ ...prev, craEmailNotificationsConsent: toggleToYesNo(value) }))}
                  />
                </CraQuestionRow>
                <CraQuestionRow label="I confirm the CRA email address is correct.">
                  <YesNoToggle
                    className=""
                    value={yesNoToToggle(taxpayerProfile.craEmailConfirmed)}
                    onChange={(value) => setTaxpayerProfile((prev) => ({ ...prev, craEmailConfirmed: toggleToYesNo(value) }))}
                  />
                </CraQuestionRow>
                <CraQuestionRow label="Do you have a foreign mailing address on file with CRA?">
                  <YesNoToggle
                    className=""
                    value={yesNoToToggle(taxpayerProfile.craHasForeignMailingAddress)}
                    onChange={(value) => setTaxpayerProfile((prev) => ({ ...prev, craHasForeignMailingAddress: toggleToYesNo(value) }))}
                  />
                </CraQuestionRow>
              </div>
              <WorkflowPageNav
                activeStep={activeStep}
                onNavigate={navigateWorkflowStep}
                showSaveProfile
                onSaveProfile={() => { void saveTaxpayerProfile() }}
                onSaveBeforeNavigate={saveActiveStepData}
                saving={saving}
              />
            </section>
          )}

          {!loading && activeStep === 'Spouse' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-3">
              <h2 className="text-lg font-semibold text-primary-dark">Spouse setup</h2>
              <p className="text-sm text-text-light">Spouse or common-law partner details for summary or full spouse return mode.</p>
              {!(taxpayerProfile.maritalStatus === 'married' || taxpayerProfile.maritalStatus === 'common_law') ? (
                <p className="text-sm text-text-light border border-border rounded-md p-3 bg-background/50">
                  Spouse setup applies when marital status is Married or Common-law. Update marital status on the Identification page.
                </p>
              ) : (
                <div id="rb-spouse" className="space-y-2">
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
                        <input className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full" value={taxpayerProfile.spouse.fullName} onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, spouse: { ...prev.spouse, fullName: e.target.value } }))} />
                      </label>
                      <label className="text-xs text-text-light">
                        SIN (9 digits, optional)
                        <input className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full" value={taxpayerProfile.spouse.fullSin} onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, spouse: { ...prev.spouse, fullSin: sanitizeSin(e.target.value) } }))} />
                      </label>
                      <label className="text-xs text-text-light">
                        Net income (line 23600)
                        <input type="number" className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full" value={Number(taxpayerProfile.spouseNetIncome23600 || 0)} onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, spouseNetIncome23600: Number(e.target.value || 0), spouse: { ...prev.spouse, netIncome: Number(e.target.value || 0) } }))} />
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs text-text-light">
                        Does spouse reside at the same address as the main taxpayer?
                        <YesNoToggle value={taxpayerProfile.spouseSameAddress} onChange={(value) => setTaxpayerProfile((prev) => ({ ...prev, spouseSameAddress: value !== false }))} />
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <label className="text-xs text-text-light">
                          First name (required)
                          <input className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full" value={taxpayerProfile.spouse.firstName} onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, spouse: { ...prev.spouse, firstName: e.target.value } }))} />
                        </label>
                        <label className="text-xs text-text-light">
                          Last name (required)
                          <input className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full" value={taxpayerProfile.spouse.lastName} onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, spouse: { ...prev.spouse, lastName: e.target.value } }))} />
                        </label>
                        <label className="text-xs text-text-light">
                          Date of birth (required)
                          <input type="date" className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full" value={taxpayerProfile.spouse.dateOfBirth ? taxpayerProfile.spouse.dateOfBirth.slice(0, 10) : ''} onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, spouse: { ...prev.spouse, dateOfBirth: e.target.value } }))} />
                        </label>
                        <label className="text-xs text-text-light">
                          Net income (line 23600)
                          <input type="number" className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full" value={Number(taxpayerProfile.spouseNetIncome23600 || 0)} onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, spouseNetIncome23600: Number(e.target.value || 0), spouse: { ...prev.spouse, netIncome: Number(e.target.value || 0) } }))} />
                        </label>
                        <label className="text-xs text-text-light">
                          SIN (9 digits, optional)
                          <input className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full" value={taxpayerProfile.spouse.fullSin} onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, spouse: { ...prev.spouse, fullSin: sanitizeSin(e.target.value) } }))} />
                        </label>
                      </div>
                      <button type="button" className="btn btn--secondary text-xs px-2 py-1" onClick={() => { setReturnRole('spouse'); navigateWorkflowStep('Income') }}>
                        Build spouse return now
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <label className="text-xs text-text-light inline-flex items-center gap-2">
                      <input type="checkbox" checked={taxpayerProfile.spouseSelfEmployed} onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, spouseSelfEmployed: e.target.checked }))} />
                      Spouse was self-employed in the tax year
                    </label>
                    <label className="text-xs text-text-light md:col-span-2">
                      Does spouse have UCCB adjustments (line 11700 or 21300)?
                      <YesNoToggle value={taxpayerProfile.spouseHasUccbAdjustments} onChange={(value) => setTaxpayerProfile((prev) => ({ ...prev, spouseHasUccbAdjustments: Boolean(value), spouseUccb11700: value ? prev.spouseUccb11700 : 0, spouseUccbRepayment21300: value ? prev.spouseUccbRepayment21300 : 0 }))} />
                    </label>
                    {taxpayerProfile.spouseHasUccbAdjustments && (
                      <>
                        <label className="text-xs text-text-light">
                          UCCB amount from spouse line 11700
                          <input type="number" className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full" value={Number(taxpayerProfile.spouseUccb11700 || 0)} onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, spouseUccb11700: Number(e.target.value || 0) }))} />
                        </label>
                        <label className="text-xs text-text-light">
                          UCCB repayment from spouse line 21300
                          <input type="number" className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full" value={Number(taxpayerProfile.spouseUccbRepayment21300 || 0)} onChange={(e) => setTaxpayerProfile((prev) => ({ ...prev, spouseUccbRepayment21300: Number(e.target.value || 0) }))} />
                        </label>
                      </>
                    )}
                  </div>
                </div>
              )}
              <WorkflowPageNav activeStep={activeStep} onNavigate={navigateWorkflowStep} showSaveProfile onSaveProfile={() => { void saveTaxpayerProfile() }} onSaveBeforeNavigate={saveActiveStepData} saving={saving} />
            </section>
          )}

          {!loading && activeStep === 'Dependents' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-3">
              <h2 className="text-lg font-semibold text-primary-dark">Dependant identification</h2>
              <p className="text-sm text-text-light">
                Record household dependants here. Only dependants with income or a required filing obligation need a linked full return workspace.
              </p>
              <div id="rb-dependents" className="space-y-3">
                <div className="flex items-center justify-end">
                  <button type="button" className="btn btn--secondary text-xs px-2 py-1" onClick={addDependent}>Add dependant</button>
                </div>
                {taxpayerProfile.dependents.length === 0 && (
                  <p className="text-xs text-text-light">No dependants added.</p>
                )}
                {taxpayerProfile.dependents.map((dep, idx) => (
                  <DependentIdentificationForm
                    key={`dep-${idx}`}
                    value={dep}
                    taxYear={data?.taxReturn?.tax_year || new Date().getFullYear()}
                    onChange={(patch) => setTaxpayerProfile((prev) => {
                      const next = [...prev.dependents]
                      next[idx] = { ...next[idx], ...patch }
                      return { ...prev, dependents: next }
                    })}
                    onRemove={() => removeDependent(idx)}
                    showWorkspaceActions
                    creatingWorkspace={creatingDependentIdx === idx}
                    onCreateWorkspace={() => { void createDependentReturn(dep, idx) }}
                  />
                ))}
              </div>
              <WorkflowPageNav activeStep={activeStep} onNavigate={navigateWorkflowStep} showSaveProfile onSaveProfile={() => { void saveTaxpayerProfile() }} onSaveBeforeNavigate={saveActiveStepData} saving={saving} />
            </section>
          )}

          {!loading && activeStep === 'Income' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-3">
              <IncomeSlipsSetup
                taxpayerName={data?.taxReturn?.taxpayer_name || 'this workspace'}
                returnRole={returnRole}
                interviewSetup={interviewSetup}
                manualSlipRows={manualSlipRows}
                setManualSlipRows={setManualSlipRows}
                slipSchemas={slipSchemas}
                slipSchemasByCode={slipSchemasByCode}
                formSchemasByCode={formSchemasByCode}
                loadingFormWorksheets={loadingFormWorksheets}
                formWorksheetValues={formWorksheetValues}
                onFormWorksheetChange={handleFormWorksheetChange}
                filteredSlipSchemas={filteredSlipSchemas}
                completeSlipSchemas={completeSlipSchemas}
                catalogOnlySlipSchemas={catalogOnlySlipSchemas}
                loadingSlipSchemas={loadingSlipSchemas}
                slipSearch={slipSearch}
                setSlipSearch={setSlipSearch}
                newSlipCode={newSlipCode}
                setNewSlipCode={setNewSlipCode}
                saving={saving}
                onAddSlip={addSlipRow}
                onEnsureSlipRow={ensureSectionSlipRow}
                onRemoveSlip={removeSlipRow}
                onUpdateSlipRowCode={updateSlipRowCode}
                onAddCustomBox={addCustomBoxToSlip}
                documents={documents}
                selectedDocumentId={selectedDocumentId}
                setSelectedDocumentId={setSelectedDocumentId}
                onImportFromDocument={() => { void importFromDocument() }}
                extractionPreview={extractionPreview && (() => {
                  const previewSchema = slipSchemasByCode[extractionPreview.slipType.toUpperCase()]
                  const previewRow: SlipRow = {
                    slipCode: extractionPreview.slipType,
                    payerName: '',
                    taxYear: data?.taxReturn?.tax_year || new Date().getFullYear(),
                    taxpayerRole: returnRole,
                    boxes: extractionPreview.boxes
                  }
                  const previewBoxFields = slipBoxEntriesForRow(previewRow, previewSchema)
                  const selectedDoc = documents.find((d) => d.id === extractionPreview.documentId)
                  return (
                    <div className="border border-primary-dark/30 rounded-md p-3 bg-primary-dark/5 space-y-3">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-primary-dark">Extraction preview</h3>
                          <p className="text-xs text-text-light mt-1">
                            {selectedDoc?.file_name || 'Selected document'} · confidence {(extractionPreview.confidence * 100).toFixed(0)}%
                            {extractionPreview.ocrMethod ? ` · ${extractionPreview.ocrMethod}` : ''}
                          </p>
                          {extractionPreview.ocrWarning && (
                            <p className="text-xs text-amber-700 mt-1">{extractionPreview.ocrWarning}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button type="button" className="btn btn--secondary text-sm px-3 py-2" onClick={() => setExtractionPreview(null)}>
                            Dismiss
                          </button>
                          <button type="button" className="btn btn--primary text-sm px-3 py-2" onClick={() => { void applyExtractionPreview() }}>
                            Apply to slip rows
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <label className="text-xs text-text-light">
                          Detected slip type
                          <select
                            className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                            value={extractionPreview.slipType}
                            onChange={(e) => setExtractionPreview((prev) => prev ? { ...prev, slipType: e.target.value } : prev)}
                          >
                            <option value="UNKNOWN">Unknown — select slip type</option>
                            {slipSchemas.map((schema) => (
                              <option key={schema.code} value={schema.code}>
                                {schema.code} - {schema.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <p className="text-xs text-text-light self-end pb-2">
                          Review box values below, then apply to add a slip row. Save income when finished.
                        </p>
                      </div>
                      {previewBoxFields.length === 0 ? (
                        <p className="text-xs text-amber-700">No box values were detected. Choose a slip type and enter values manually after applying, or dismiss and add a slip manually.</p>
                      ) : (
                        <SlipBoxFieldGrid
                          keyPrefix="preview"
                          boxes={extractionPreview.boxes}
                          boxFields={previewBoxFields}
                          onBoxChange={(boxCode, nextValue) => {
                            setExtractionPreview((prev) => {
                              if (!prev) return prev
                              const boxes = { ...prev.boxes }
                              if (nextValue == null) delete boxes[boxCode]
                              else boxes[boxCode] = nextValue
                              return { ...prev, boxes }
                            })
                          }}
                        />
                      )}
                    </div>
                  )
                })()}
              />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-primary-dark">Other income (line 13000)</h3>
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
              <WorkflowPageNav activeStep={activeStep} onNavigate={navigateWorkflowStep} onSaveBeforeNavigate={saveActiveStepData} saving={saving} />
            </section>
          )}

          {!loading && activeStep === 'Deductions' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-3">
              <h2 className="text-lg font-semibold text-primary-dark">Deductions &amp; credits</h2>
              <div className="text-xs text-text-light">
                Editing deductions for: <span className="font-semibold text-text">{returnRole === 'self' ? 'Taxpayer' : 'Spouse'}</span>
              </div>
              <DeductionsFormsSetup
                returnRole={returnRole}
                interviewSetup={interviewSetup}
                deductionFields={T1_DEDUCTION_FIELDS}
                deductionFormValues={deductionFormValues}
                setDeductionFormValues={setDeductionFormValues}
              />
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
              <WorkflowPageNav activeStep={activeStep} onNavigate={navigateWorkflowStep} onSaveBeforeNavigate={saveActiveStepData} saving={saving} />
            </section>
          )}

          {!loading && activeStep === 'Review' && (
            <section className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-border shadow-sm">
                <h2 className="text-lg font-semibold text-primary-dark">Review &amp; diagnostics</h2>
                <p className="text-sm text-text-light mt-1">
                  Balance overview, messages, federal summary, and tax-saving ideas are calculated automatically when you open this step.
                </p>
              </div>
              {id ? (
                <ReviewDiagnosticsPanel
                  taxReturnId={id}
                  taxYear={data?.taxReturn?.tax_year || new Date().getFullYear()}
                  getToken={getToken}
                  onNavigateToField={navigateFromReviewField}
                  onReviewComplete={() => { void load(); void loadRequiredForms() }}
                />
              ) : (
                <p className="text-sm text-text-light">Select a household workspace to run review.</p>
              )}
              <details className="bg-white p-4 rounded-lg border border-border shadow-sm">
                <summary className="text-sm font-semibold text-primary-dark cursor-pointer">Technical diagnostics</summary>
                <div className="mt-4 space-y-4">
                  <div id="rb-required-forms" className="border border-border rounded-md p-3 bg-background/50">
                    <h3 className="text-sm font-semibold text-primary-dark">Required CRA forms &amp; schedules</h3>
                    <RequiredFormsPanel requiredForms={requiredForms} loading={loadingRequiredForms} compact />
                  </div>
                  <div id="rb-review">
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
                  </div>
                </div>
              </details>
              <div className="bg-white p-4 rounded-lg border border-border shadow-sm">
                <WorkflowPageNav activeStep={activeStep} onNavigate={navigateWorkflowStep} onSaveBeforeNavigate={saveActiveStepData} saving={saving} />
              </div>
            </section>
          )}

          {!loading && activeStep === 'TaxReturn' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-3">
              <h2 className="text-lg font-semibold text-primary-dark">Tax Return</h2>
              <p className="text-sm text-text-light">
                Review completed T1 forms, schedules, and line summaries for {data?.taxReturn?.taxpayer_name || 'this taxpayer'} before filing.
              </p>
              <Link className="text-sm text-accent font-medium hover:underline block" to={`${basePath}/forms-schedules`}>
                Open Forms &amp; Schedules workspace
              </Link>
              <WorkflowPageNav activeStep={activeStep} onNavigate={navigateWorkflowStep} onSaveBeforeNavigate={saveActiveStepData} saving={saving} />
            </section>
          )}

          {!loading && activeStep === 'Netfile' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-3">
              <h2 className="text-lg font-semibold text-primary-dark">NETFILE</h2>
              <p className="text-sm text-text-light">
                Prepare to electronically file this return with the CRA after review and diagnostics are complete.
              </p>
              <p className="text-xs text-text-light border border-border rounded-md p-3 bg-background/50">
                NETFILE submission will be available here once return validation and certification checks pass.
              </p>
              <WorkflowPageNav activeStep={activeStep} onNavigate={navigateWorkflowStep} onSaveBeforeNavigate={saveActiveStepData} saving={saving} />
            </section>
          )}

            </div>
          </div>
        </div>
      </ClientPortalShell>
    </>
  )
}

export default ReturnBuilder
