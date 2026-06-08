import { FC, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../../components/SEO'
import ClientPortalShell from '../../../components/ClientPortalShell'
import { portalFetch } from '../../../lib/portalApi'
import { useAccountContext } from '../../../platform/account/AccountContextProvider'
import { ensureStringArray } from '../../../shared/collections/ensureStringArray'
import {
  createEvidenceLink,
  createReviewSignoff,
  createTickmark,
  fetchAiFoundations,
  fetchAuditEvents,
  fetchEngagementExecutionBundle,
  fetchEvidenceLinks,
  fetchReviewSignoffs,
  type EngagementExecutionBundle,
  fetchWorkflowQueue,
  fetchWorkingPaperTree
} from '../../../modules/working-papers/services/executionApi'
import {
  fetchAccountingClientsDomain,
  fetchEngagementDashboardDomain,
  fetchEngagementDocumentsDomain,
  fetchEngagementsDomain
} from '../../../domains/Accounting'
import { fetchTrialBalanceAccountsDomain } from '../../../domains/trial-balance'
import { fetchLeadSheetDetailDomain, fetchLeadSheetsDomain } from '../../../domains/leadsheets'
import { fetchAdjustmentsDomain } from '../../../domains/adjustments'
import { fetchReviewNotesDomain, fetchReviewTasksDomain } from '../../../domains/reviews'
import { useWorkingPapersUiStore } from '../../../modules/working-papers/state/useWorkingPapersUiStore'
import { calculateLeadSheetTotals, calculateTrialBalanceTotals } from '../../../domains/formulas'
import { downloadBase64File, exportEngagementWorkbookDomain } from '../../../domains/import-export'
import { createEngagementSnapshotDomain, fetchEngagementSnapshotsDomain } from '../../../domains/snapshots'
import { CompanyProfileTabs } from '../../../modules/accounting/layouts/CompanyProfileLayout'
import PageLoadingSkeleton from '../../../shared/loading/PageLoadingSkeleton'
import { usePermission } from '../../../platform/permissions/usePermission'

const LazyEngagementOperationsPanel = lazy(() => import('../../../modules/accounting/components/EngagementOperationsPanel'))
const LazyRolesAndPermissionsPanel = lazy(() => import('../../../modules/accounting/components/RolesAndPermissionsPanel'))
const LazyWorkingPapersWorkspacePanel = lazy(() => import('../../../modules/working-papers/components/WorkingPapersWorkspacePanel'))
const LazyTrialBalanceGridPanel = lazy(() => import('../../../modules/working-papers/components/TrialBalanceGridPanel'))
const LazyTrialBalanceImportPanel = lazy(() => import('../../../modules/working-papers/components/TrialBalanceImportPanel'))
const LazyAgGridTable = lazy(() => import('../../../modules/working-papers/components/grid/AgGridTable'))
const LazyWorkingPaperTreePanel = lazy(() => import('../../../modules/working-papers/components/WorkingPaperTreePanel'))
const LazyWorkflowQueuePanel = lazy(() => import('../../../modules/working-papers/components/WorkflowQueuePanel'))
const LazyAuditTimelinePanel = lazy(() => import('../../../modules/working-papers/components/AuditTimelinePanel'))
const LazyAdjustmentWorkspacePanel = lazy(() => import('../../../modules/working-papers/components/AdjustmentWorkspacePanel'))

const AccountingPanelFallback = () => <PageLoadingSkeleton variant="table" />
import {
  isAccountingFirmOrganization,
  resolveClientRecordLabel,
  resolveClientRecordLabelPlural,
  resolveEntityProfileSingularLabel,
  resolveEntityProfilesNavLabel
} from '../../../platform/workspace/companyProfileLabels'

type AccountingView =
  | 'landing'
  | 'companyProfile'
  | 'companyProfileEntities'
  | 'companyProfileEmployees'
  | 'companyProfileRoles'
  | 'engagementList'
  | 'workingPapersWorkspace'
  | 'newEngagement'
  | 'engagementDashboard'
  | 'trialBalance'
  | 'leadSheets'
  | 'leadSheetDetail'
  | 'documents'
  | 'review'
  | 'adjustments'
  | 'settings'
  | 'integrations'
  | 'joinWorkspaceInvite'

interface AccountingWorkspacePageProps {
  view: AccountingView
}

const titleByView: Record<AccountingView, string> = {
  landing: 'Accounting Operations',
  companyProfile: 'Business/Firm Details',
  companyProfileEntities: 'Entity Profiles',
  companyProfileEmployees: 'Invite Employees',
  companyProfileRoles: 'Roles & Permissions',
  engagementList: 'Engagements',
  workingPapersWorkspace: 'Working Papers',
  newEngagement: 'New Engagement',
  engagementDashboard: 'Engagement Dashboard',
  trialBalance: 'Trial Balance',
  leadSheets: 'Lead Sheets',
  leadSheetDetail: 'Lead Sheet Detail',
  documents: 'Supporting Documents',
  review: 'Review',
  adjustments: 'Adjustments',
  settings: 'Engagement Settings',
  integrations: 'Integrations',
  joinWorkspaceInvite: 'Join Team',
}

const descriptionByView: Record<AccountingView, string> = {
  landing: 'Manage your organization, engagements, working papers, and integrations from one place.',
  companyProfile: 'Set core business or firm information used across your organization.',
  companyProfileEntities: 'Create and maintain reporting entities or client records for engagements.',
  companyProfileEmployees: 'Invite employees and manage your organization roster before engagement assignments.',
  companyProfileRoles: 'Review built-in roles, create custom roles, and manage employee access for your organization.',
  engagementList: 'Create, update, and delete engagements with entity or client assignment and employee staffing.',
  workingPapersWorkspace: 'Select an engagement and open trial balance, lead sheets, review, adjustments, and related working paper workflows.',
  newEngagement: 'Create a new accounting engagement.',
  engagementDashboard: 'View completion status, notes, tasks, and signoff readiness.',
  trialBalance: 'Import and map trial balance data.',
  leadSheets: 'Review lead sheet sections and completion state.',
  leadSheetDetail: 'Review accounts, support, notes, and signoffs for a lead sheet.',
  documents: 'Link and manage supporting engagement documents.',
  review: 'Track and clear review notes.',
  adjustments: 'Build and reconcile journal adjustments.',
  settings: 'Configure engagement settings and assignments.',
  integrations: 'Configure accounting system integrations and connection states.',
  joinWorkspaceInvite: 'Accept a team invitation and join your organization.',
}

function formatEmployeeRoleLabel (member: { workspace_role?: string | null; role?: string | null }) {
  const role = String(member.workspace_role || member.role || '').trim().toLowerCase()
  if (role === 'owner') return 'admin'
  if (role === 'admin') return 'admin'
  return role || '—'
}

const quickLinks = [
  { to: '/portal/accounting/company-profile', label: 'Business/Firm Profile' },
  { to: '/portal/accounting/working-papers/engagements', label: 'Engagements' },
  { to: '/portal/accounting/working-papers/workspace', label: 'Working Papers' },
  { to: '/portal/accounting/working-papers/engagements/new', label: 'Create Engagement' },
  { to: '/portal/accounting/integrations', label: 'Integrations' },
]

const BUSINESS_TYPE_OPTIONS = [
  { value: 'accounting_firm', label: 'Accounting Firm' },
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'professional_corporation', label: 'Professional Corporation' },
  { value: 'llc', label: 'Limited Liability Company (LLC)' },
  { value: 'nonprofit', label: 'Nonprofit Organization' },
  { value: 'charity', label: 'Registered Charity' },
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'trust', label: 'Trust' },
  { value: 'government', label: 'Government / Public Sector' },
  { value: 'other', label: 'Other' }
]

type Client = {
  id: string
  name: string
  legal_name?: string | null
  business_number?: string | null
  fiscal_year_end_month?: number | null
  fiscal_year_end_day?: number | null
  default_currency?: string | null
}

type Engagement = {
  id: string
  client_id: string
  client_name?: string
  name: string
  engagement_type: string
  fiscal_year: number
  period_start: string
  period_end: string
  due_date?: string | null
  status: string
  source_type: string
  review_flow_status?: string | null
  next_review_flow_statuses?: string[] | null
  open_review_note_count?: number | null
  unreviewed_lead_sheet_count?: number | null
  approval_ready?: boolean | null
  blocked_by_open_notes?: boolean | null
  blocked_by_unreviewed_lead_sheets?: boolean | null
  deliverables?: string[] | null
  materiality_amount?: string | null
  assigned_preparer_id?: string | null
  assigned_reviewer_id?: string | null
  updated_at: string
}

const reviewFlowTransitions: Record<string, string[]> = {
  not_started: ['preparer_in_progress'],
  preparer_in_progress: ['reviewer_in_progress', 'review_notes_open'],
  reviewer_in_progress: ['review_notes_open', 'approved'],
  review_notes_open: ['preparer_in_progress', 'reviewer_in_progress', 'approved'],
  approved: ['review_notes_open']
}

function parseDeliverablesText (value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ).slice(0, 50)
}

function formatWorkflowLabel (value: string): string {
  return value.replace(/_/g, ' ')
}

function isAccessDeniedMessage (message: string): boolean {
  return /forbidden|403|access denied|permission denied|insufficient permissions|workspace\.[a-z_]+/i.test(message)
}

function isCompanyProfileView (view: AccountingView): boolean {
  return view === 'companyProfile'
    || view === 'companyProfileEntities'
    || view === 'companyProfileEmployees'
    || view === 'companyProfileRoles'
}

function isListCentricView (view: AccountingView): boolean {
  return view === 'engagementList' || view === 'newEngagement' || view === 'workingPapersWorkspace'
}

function isEngagementSubview (view: AccountingView): boolean {
  return view === 'engagementDashboard'
    || view === 'trialBalance'
    || view === 'leadSheets'
    || view === 'leadSheetDetail'
    || view === 'documents'
    || view === 'review'
    || view === 'adjustments'
    || view === 'settings'
}

const AccountingWorkspacePage: FC<AccountingWorkspacePageProps> = ({ view }) => {
  const { getToken } = useAuth()
  const { account, refreshAccount } = useAccountContext()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { engagementId, leadSheetId } = useParams()
  const [clients, setClients] = useState<Client[]>([])
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const listBootstrapViewRef = useRef<string | null>(null)
  const lastLoadedEngagementFiltersRef = useRef('')
  const engagementFiltersRef = useRef({
    search: '',
    statusFilter: '',
    reviewFlowStatusFilter: '',
    approvalReadyFilter: '',
    clientFilter: '',
    engagementTypeFilter: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '')
  const [reviewFlowStatusFilter, setReviewFlowStatusFilter] = useState(() => searchParams.get('reviewFlowStatus') || '')
  const [approvalReadyFilter, setApprovalReadyFilter] = useState(() => searchParams.get('approvalReady') || '')
  const [clientFilter, setClientFilter] = useState(() => searchParams.get('clientId') || '')
  const [engagementTypeFilter, setEngagementTypeFilter] = useState(() => searchParams.get('engagementType') || '')
  const [entityProfileForm, setEntityProfileForm] = useState({
    id: '',
    name: '',
    legalName: '',
    businessNumber: '',
    fiscalYearEndMonth: '',
    fiscalYearEndDay: '',
    defaultCurrency: 'CAD'
  })
  const [engagementWorkflowForm, setEngagementWorkflowForm] = useState({
    dueDate: '',
    reviewFlowStatus: 'not_started',
    deliverablesText: '',
    assignedPreparerId: '',
    assignedReviewerId: ''
  })
  const [dashboard, setDashboard] = useState<any | null>(null)
  const [leadSheets, setLeadSheets] = useState<any[]>([])
  const [leadSheetDetail, setLeadSheetDetail] = useState<any | null>(null)
  const [reviewNotes, setReviewNotes] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [adjustments, setAdjustments] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [workingPaperTree, setWorkingPaperTree] = useState<any | null>(null)
  const [workflowQueue, setWorkflowQueue] = useState<any[]>([])
  const [auditEvents, setAuditEvents] = useState<any[]>([])
  const [reviewSignoffs, setReviewSignoffs] = useState<any[]>([])
  const [evidenceLinks, setEvidenceLinks] = useState<any[]>([])
  const [aiFoundations, setAiFoundations] = useState<Record<string, unknown> | null>(null)
  const [repositoryFiles, setRepositoryFiles] = useState<any[]>([])
  const [integrationsData, setIntegrationsData] = useState<any | null>(null)
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([])
  const [organizationSnapshot, setOrganizationSnapshot] = useState<any | null>(null)
  const [workspaceProfile, setWorkspaceProfile] = useState<any | null>(null)
  const [newInviteEmail, setNewInviteEmail] = useState('')
  const [newInviteRole, setNewInviteRole] = useState('employee')
  const [companyProfileForm, setCompanyProfileForm] = useState({
    businessType: 'corporation',
    companyLegalName: '',
    companyOperatingName: '',
    taxIdentifier: '',
    websiteUrl: '',
    industry: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    provinceState: '',
    postalCode: '',
    countryCode: 'CA'
  })
  const [trialBalanceAccounts, setTrialBalanceAccounts] = useState<any[]>([])
  const [engagementSnapshots, setEngagementSnapshots] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const resetWorkingPapersSelection = useWorkingPapersUiStore((state) => state.resetSelection)

  const loadClients = useCallback(async () => {
    const { clients } = await fetchAccountingClientsDomain(getToken)
    setClients(Array.isArray(clients) ? clients : [])
  }, [getToken])

  engagementFiltersRef.current = {
    search,
    statusFilter,
    reviewFlowStatusFilter,
    approvalReadyFilter,
    clientFilter,
    engagementTypeFilter
  }

  const engagementFilterSignature = useMemo(
    () => JSON.stringify(engagementFiltersRef.current),
    [approvalReadyFilter, clientFilter, engagementTypeFilter, reviewFlowStatusFilter, search, statusFilter]
  )

  const loadEngagements = useCallback(async () => {
    const filters = engagementFiltersRef.current
    const { engagements: rows } = await fetchEngagementsDomain(getToken, {
      status: filters.statusFilter,
      reviewFlowStatus: filters.reviewFlowStatusFilter,
      approvalReady: filters.approvalReadyFilter,
      clientId: filters.clientFilter,
      engagementType: filters.engagementTypeFilter,
      search: filters.search
    })
    setEngagements(Array.isArray(rows) ? rows : [])
  }, [getToken])

  const loadEngagementDashboard = useCallback(async () => {
    if (!engagementId) return
    const data = await fetchEngagementDashboardDomain(getToken, engagementId)
    setDashboard(data)
  }, [engagementId, getToken])

  const loadTrialBalance = useCallback(async () => {
    if (!engagementId) return
    const { accounts } = await fetchTrialBalanceAccountsDomain(getToken, engagementId)
    setTrialBalanceAccounts(Array.isArray(accounts) ? accounts : [])
  }, [engagementId, getToken])

  const loadEngagementSnapshots = useCallback(async () => {
    if (!engagementId) return
    const { snapshots } = await fetchEngagementSnapshotsDomain(getToken, engagementId)
    setEngagementSnapshots(snapshots)
  }, [engagementId, getToken])

  const loadLeadSheets = useCallback(async () => {
    if (!engagementId) return
    const { leadSheets: rows } = await fetchLeadSheetsDomain(getToken, engagementId)
    setLeadSheets(Array.isArray(rows) ? rows : [])
  }, [engagementId, getToken])

  const loadLeadSheetDetail = useCallback(async () => {
    if (!engagementId || !leadSheetId) return
    const detail = await fetchLeadSheetDetailDomain(getToken, engagementId, leadSheetId)
    setLeadSheetDetail(detail)
  }, [engagementId, getToken, leadSheetId])

  const loadDocuments = useCallback(async () => {
    if (!engagementId) return
    const { documents: rows } = await fetchEngagementDocumentsDomain(getToken, engagementId, leadSheetId)
    setDocuments(rows)
  }, [engagementId, getToken, leadSheetId])

  const loadRepositoryFiles = useCallback(async () => {
    const { files } = await portalFetch<{ files: any[] }>('/v1/files', getToken)
    setRepositoryFiles(files)
  }, [getToken])

  const loadReviewNotes = useCallback(async () => {
    if (!engagementId) return
    const { notes } = await fetchReviewNotesDomain(getToken, engagementId)
    setReviewNotes(notes)
  }, [engagementId, getToken])

  const loadTasks = useCallback(async () => {
    if (!engagementId) return
    const { tasks } = await fetchReviewTasksDomain(getToken, engagementId)
    setTasks(tasks)
  }, [engagementId, getToken])

  const loadAdjustments = useCallback(async () => {
    if (!engagementId) return
    const { entries } = await fetchAdjustmentsDomain(getToken, engagementId)
    setAdjustments(entries || [])
  }, [engagementId, getToken])

  const applyEngagementExecutionBundle = useCallback((bundle: EngagementExecutionBundle) => {
    if (bundle.tree) setWorkingPaperTree(bundle.tree)
    setWorkflowQueue(Array.isArray(bundle.queue?.queue) ? bundle.queue.queue : [])
    setAdjustments(Array.isArray(bundle.adjustments?.entries) ? bundle.adjustments.entries : [])
    setAuditEvents(Array.isArray(bundle.audit?.events) ? bundle.audit.events : [])
    setReviewSignoffs(Array.isArray(bundle.signoffs?.signoffs) ? bundle.signoffs.signoffs : [])
    setAiFoundations(bundle.aiFoundations ?? null)
    if (bundle.dashboard) setDashboard(bundle.dashboard)
  }, [])

  const loadEngagementExecutionBundle = useCallback(async (options?: { includeDashboardFallback?: boolean }) => {
    if (!engagementId) return
    const bundle = await fetchEngagementExecutionBundle(engagementId, getToken)
    applyEngagementExecutionBundle(bundle)
    if (options?.includeDashboardFallback && !bundle.dashboard) {
      await loadEngagementDashboard()
    }
  }, [applyEngagementExecutionBundle, engagementId, getToken, loadEngagementDashboard])

  const loadWorkingPaperExecution = useCallback(async () => {
    if (!engagementId) return
    const [tree, queue] = await Promise.all([
      fetchWorkingPaperTree(engagementId, getToken),
      fetchWorkflowQueue(engagementId, getToken)
    ])
    setWorkingPaperTree(tree)
    setWorkflowQueue(queue.queue || [])
  }, [engagementId, getToken])

  const loadAuditEvents = useCallback(async () => {
    if (!engagementId) return
    const { events } = await fetchAuditEvents(engagementId, getToken)
    setAuditEvents(events || [])
  }, [engagementId, getToken])

  const loadReviewSignoffs = useCallback(async () => {
    if (!engagementId) return
    const { signoffs } = await fetchReviewSignoffs(engagementId, getToken)
    setReviewSignoffs(signoffs || [])
  }, [engagementId, getToken])

  const loadEvidenceLinks = useCallback(async () => {
    if (!leadSheetId) return
    const { evidence } = await fetchEvidenceLinks(leadSheetId, getToken)
    setEvidenceLinks(evidence || [])
  }, [getToken, leadSheetId])

  const loadAiFoundations = useCallback(async () => {
    if (!engagementId) return
    const response = await fetchAiFoundations(engagementId, getToken)
    setAiFoundations(response || null)
  }, [engagementId, getToken])

  const loadIntegrations = useCallback(async () => {
    const data = await portalFetch<any>('/v1/accounting/integrations', getToken)
    setIntegrationsData(data)
  }, [getToken])

  const loadWorkspaceMembers = useCallback(async () => {
    try {
      const data = await portalFetch<{ members: any[] }>('/v1/accounting/members', getToken)
      setWorkspaceMembers(Array.isArray(data.members) ? data.members : [])
    } catch {
      setWorkspaceMembers([])
    }
  }, [getToken])

  const loadOrganizationSnapshot = useCallback(async () => {
    try {
      const data = await portalFetch<any>('/v1/accounting/organization', getToken)
      setOrganizationSnapshot(data)
    } catch (e) {
      if (e instanceof Error && isAccessDeniedMessage(e.message)) {
        setOrganizationSnapshot(null)
        return
      }
      throw e
    }
  }, [getToken])

  const loadWorkspaceProfile = useCallback(async () => {
    try {
      const data = await portalFetch<any>('/v1/accounting/company-profile', getToken)
      setWorkspaceProfile(data.profile || null)
    } catch (e) {
      if (e instanceof Error && isAccessDeniedMessage(e.message)) {
        setWorkspaceProfile(null)
        return
      }
      throw e
    }
  }, [getToken])

  useEffect(() => {
    if (isListCentricView(view)) return

    let mounted = true
    const run = async () => {
      setError(null)
      setNotice(null)
      const blockWithLoadingState = !isCompanyProfileView(view)
      if (blockWithLoadingState) setLoading(true)
      try {
        if (view === 'joinWorkspaceInvite') {
          await refreshAccount()
          return
        }
        if (isCompanyProfileView(view)) {
          const profileTasks: Array<Promise<any>> = []
          if (view === 'companyProfile' || view === 'companyProfileEntities') {
            profileTasks.push(loadWorkspaceProfile())
          }
          if (view === 'companyProfileEntities') {
            profileTasks.push(loadClients())
          }
          if (profileTasks.length > 0) {
            await Promise.all(profileTasks)
          }
          return
        }

        if (view === 'engagementDashboard') {
          await Promise.all([
            loadEngagementExecutionBundle({ includeDashboardFallback: true }),
            loadWorkspaceMembers(),
            loadEngagementSnapshots()
          ])
        } else if (view === 'trialBalance') {
          await Promise.all([loadTrialBalance(), loadEngagementExecutionBundle()])
        } else if (view === 'leadSheets') {
          await loadLeadSheets()
        } else if (view === 'leadSheetDetail') {
          await Promise.all([loadLeadSheetDetail(), loadEvidenceLinks()])
        } else if (view === 'documents') {
          await Promise.all([loadDocuments(), loadRepositoryFiles()])
        } else if (view === 'review') {
          await Promise.all([
            loadReviewNotes(),
            loadWorkspaceMembers(),
            loadEngagementExecutionBundle()
          ])
        } else if (view === 'adjustments') {
          await Promise.all([
            loadEngagementExecutionBundle(),
            loadWorkspaceMembers()
          ])
        } else if (view === 'settings') {
          await loadWorkspaceMembers()
          await loadEngagementDashboard()
          await loadTasks()
        } else if (view === 'integrations') {
          await loadIntegrations()
        }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Could not load data')
      } finally {
        if (mounted && blockWithLoadingState) setLoading(false)
      }
    }
    void run()
    return () => {
      mounted = false
    }
  }, [
    loadClients,
    loadDocuments,
    loadEngagementSnapshots,
    loadAuditEvents,
    loadEngagements,
    loadIntegrations,
    loadAiFoundations,
    loadAdjustments,
    loadEvidenceLinks,
    loadLeadSheetDetail,
    loadLeadSheets,
    loadOrganizationSnapshot,
    loadRepositoryFiles,
    loadReviewNotes,
    loadReviewSignoffs,
    loadEngagementDashboard,
    loadEngagementExecutionBundle,
    loadTasks,
    loadTrialBalance,
    loadWorkingPaperExecution,
    loadWorkspaceProfile,
    loadWorkspaceMembers,
    refreshAccount,
    view
  ])

  useEffect(() => {
    if (view !== 'companyProfileEmployees') return
    const canManageAccount = account?.role === 'owner' || account?.role === 'admin'
    if (!canManageAccount) {
      setOrganizationSnapshot(null)
      return
    }
    let mounted = true
    const run = async () => {
      try {
        await loadOrganizationSnapshot()
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Could not load organization')
      }
    }
    void run()
    return () => {
      mounted = false
    }
  }, [account?.role, loadOrganizationSnapshot, view])

  useEffect(() => {
    if (!isListCentricView(view)) {
      listBootstrapViewRef.current = null
      lastLoadedEngagementFiltersRef.current = ''
      return
    }
    if (listBootstrapViewRef.current === view) return

    let mounted = true
    const run = async () => {
      setListLoading(true)
      setError(null)
      try {
        if (view === 'engagementList' || view === 'newEngagement') {
          await Promise.all([
            loadEngagements(),
            loadClients(),
            loadWorkspaceMembers()
          ])
        } else {
          await loadEngagements()
        }
        if (mounted) {
          listBootstrapViewRef.current = view
          lastLoadedEngagementFiltersRef.current = JSON.stringify(engagementFiltersRef.current)
        }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Could not load data')
      } finally {
        if (mounted) setListLoading(false)
      }
    }
    void run()
    return () => {
      mounted = false
    }
  }, [loadClients, loadEngagements, loadWorkspaceMembers, view])

  const activeWorkspace = useMemo(() => {
    if (!account) return null
    return {
      workspace_type: account.businessType,
      profile_business_type: account.profileBusinessType,
      role: account.role,
      is_personal: account.isPersonal,
      name: account.name
    }
  }, [account])
  const isFirmWorkspace = activeWorkspace?.workspace_type === 'firm'
  const profileBusinessType = companyProfileForm.businessType || workspaceProfile?.business_type || activeWorkspace?.profile_business_type || null
  const isAccountingFirm = isAccountingFirmOrganization(profileBusinessType, activeWorkspace?.workspace_type)
  const canManageWorkspaceMembers = activeWorkspace?.role === 'owner' || activeWorkspace?.role === 'admin'
  const canManageWorkspace = usePermission('workspace.manage')
  const canInviteEmployees = usePermission('workspace.invite')
  const canViewRbac = usePermission('rbac.read')
  const canAccessCompanyProfile = canManageWorkspace || canInviteEmployees || canViewRbac
  const canAccessEngagements = usePermission('engagement.read')
  const canAccessWorkingPapers = usePermission('working_papers.read')
  const canAccessIntegrations = usePermission('integrations.manage')
  const clientLabel = resolveClientRecordLabel(profileBusinessType, activeWorkspace?.workspace_type)
  const clientLabelPlural = resolveClientRecordLabelPlural(profileBusinessType, activeWorkspace?.workspace_type)
  const entityProfileLabel = resolveEntityProfileSingularLabel(profileBusinessType, activeWorkspace?.workspace_type)
  const entityProfilesNavLabel = resolveEntityProfilesNavLabel(profileBusinessType, activeWorkspace?.workspace_type)
  const pageTitle = view === 'companyProfileEntities' ? entityProfilesNavLabel : titleByView[view]
  const pageDescription = view === 'companyProfileEntities'
    ? (isAccountingFirm
      ? 'Create and maintain client records that engagements will be attached to.'
      : 'Create reporting entities (subsidiary, division, or legal entity) that engagements will be attached to.')
    : descriptionByView[view]
  const currentReviewFlowStatus = String(dashboard?.engagement?.review_flow_status || 'not_started')
  const nextReviewFlowStatuses = useMemo((): string[] => {
    const fromDashboard = ensureStringArray(dashboard?.nextReviewFlowStatuses)
    if (fromDashboard.length > 0) return fromDashboard
    return ensureStringArray(reviewFlowTransitions[currentReviewFlowStatus])
  }, [currentReviewFlowStatus, dashboard?.nextReviewFlowStatuses])
  const editableReviewFlowOptions = useMemo(
    () => Array.from(new Set([currentReviewFlowStatus, ...nextReviewFlowStatuses])),
    [currentReviewFlowStatus, nextReviewFlowStatuses]
  )
  const assignmentCandidates = useMemo(
    () => (Array.isArray(workspaceMembers) ? workspaceMembers : []).filter((member) => member.status === 'active'),
    [workspaceMembers]
  )
  const trialBalanceTotals = useMemo(
    () => (view === 'trialBalance' ? calculateTrialBalanceTotals(trialBalanceAccounts) : { currentTotal: 0, priorTotal: 0, varianceTotal: 0 }),
    [trialBalanceAccounts, view]
  )
  const leadSheetTotals = useMemo(
    () => (view === 'leadSheets' || view === 'leadSheetDetail'
      ? calculateLeadSheetTotals(leadSheets)
      : { openNotesTotal: 0, documentsTotal: 0 }),
    [leadSheets, view]
  )
  const assignmentLabelByUserId = useMemo(() => {
    const map = new Map<string, string>()
    for (const member of (Array.isArray(workspaceMembers) ? workspaceMembers : [])) {
      const key = String(member.clerk_user_id || '')
      if (!key) continue
      map.set(key, String(member.display_name || member.email || member.clerk_user_id))
    }
    return map
  }, [workspaceMembers])

  useEffect(() => {
    if (!workspaceProfile) return
    setCompanyProfileForm({
      businessType: workspaceProfile.business_type || 'corporation',
      companyLegalName: workspaceProfile.company_legal_name || '',
      companyOperatingName: workspaceProfile.company_operating_name || '',
      taxIdentifier: workspaceProfile.tax_identifier || '',
      websiteUrl: workspaceProfile.website_url || '',
      industry: workspaceProfile.industry || '',
      primaryContactName: workspaceProfile.primary_contact_name || '',
      primaryContactEmail: workspaceProfile.primary_contact_email || '',
      primaryContactPhone: workspaceProfile.primary_contact_phone || '',
      addressLine1: workspaceProfile.address_line1 || '',
      addressLine2: workspaceProfile.address_line2 || '',
      city: workspaceProfile.city || '',
      provinceState: workspaceProfile.province_state || '',
      postalCode: workspaceProfile.postal_code || '',
      countryCode: workspaceProfile.country_code || 'CA'
    })
  }, [workspaceProfile])

  useEffect(() => {
    if (view !== 'engagementList') return
    setSearch(searchParams.get('search') || '')
    setStatusFilter(searchParams.get('status') || '')
    setReviewFlowStatusFilter(searchParams.get('reviewFlowStatus') || '')
    setApprovalReadyFilter(searchParams.get('approvalReady') || '')
    setClientFilter(searchParams.get('clientId') || '')
    setEngagementTypeFilter(searchParams.get('engagementType') || '')
  }, [searchParams, view])

  useEffect(() => {
    if (view !== 'engagementList' && view !== 'newEngagement') return
    if (listBootstrapViewRef.current !== view) return
    if (engagementFilterSignature === lastLoadedEngagementFiltersRef.current) return

    let mounted = true
    const showSkeleton = engagements.length === 0
    const run = async () => {
      if (showSkeleton) setListLoading(true)
      setError(null)
      try {
        await loadEngagements()
        if (mounted) {
          lastLoadedEngagementFiltersRef.current = engagementFilterSignature
        }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Could not refresh engagements')
      } finally {
        if (mounted && showSkeleton) setListLoading(false)
      }
    }
    void run()
    return () => {
      mounted = false
    }
  }, [engagementFilterSignature, engagements.length, loadEngagements, view])

  useEffect(() => {
    const engagement = dashboard?.engagement
    if (!engagement) return
    setEngagementWorkflowForm({
      dueDate: engagement.due_date || '',
      reviewFlowStatus: engagement.review_flow_status || 'not_started',
      deliverablesText: Array.isArray(engagement.deliverables) ? engagement.deliverables.join('\n') : '',
      assignedPreparerId: engagement.assigned_preparer_id || '',
      assignedReviewerId: engagement.assigned_reviewer_id || ''
    })
  }, [dashboard])

  const refreshEngagementWorkflowViews = useCallback(async (
    options: { includeReviewNotes?: boolean; includeLeadSheetDetail?: boolean } = {}
  ) => {
    const tasks: Array<Promise<any>> = [
      loadEngagementExecutionBundle({ includeDashboardFallback: true }),
      loadEngagements(),
      loadWorkspaceMembers()
    ]
    if (options.includeReviewNotes) tasks.push(loadReviewNotes())
    if (options.includeLeadSheetDetail) tasks.push(loadLeadSheetDetail())
    await Promise.all(tasks)
  }, [
    loadEngagementExecutionBundle,
    loadEngagements,
    loadLeadSheetDetail,
    loadReviewNotes,
    loadWorkspaceMembers
  ])

  const onSelectEntityProfile = (client: Client) => {
    setEntityProfileForm({
      id: client.id,
      name: client.name || '',
      legalName: client.legal_name || '',
      businessNumber: client.business_number || '',
      fiscalYearEndMonth: client.fiscal_year_end_month != null ? String(client.fiscal_year_end_month) : '',
      fiscalYearEndDay: client.fiscal_year_end_day != null ? String(client.fiscal_year_end_day) : '',
      defaultCurrency: String(client.default_currency || 'CAD').toUpperCase()
    })
  }

  const onResetEntityProfileForm = () => {
    setEntityProfileForm({
      id: '',
      name: '',
      legalName: '',
      businessNumber: '',
      fiscalYearEndMonth: '',
      fiscalYearEndDay: '',
      defaultCurrency: 'CAD'
    })
  }

  const onSaveEntityProfile = async () => {
    const name = entityProfileForm.name.trim()
    if (!name) {
      setError(`${entityProfileLabel} name is required.`)
      return
    }
    const fiscalYearEndMonth = entityProfileForm.fiscalYearEndMonth ? Number(entityProfileForm.fiscalYearEndMonth) : null
    const fiscalYearEndDay = entityProfileForm.fiscalYearEndDay ? Number(entityProfileForm.fiscalYearEndDay) : null
    if (fiscalYearEndMonth != null && (!Number.isInteger(fiscalYearEndMonth) || fiscalYearEndMonth < 1 || fiscalYearEndMonth > 12)) {
      setError('Fiscal year end month must be between 1 and 12.')
      return
    }
    if (fiscalYearEndDay != null && (!Number.isInteger(fiscalYearEndDay) || fiscalYearEndDay < 1 || fiscalYearEndDay > 31)) {
      setError('Fiscal year end day must be between 1 and 31.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (entityProfileForm.id) {
        await portalFetch(`/v1/accounting/clients/${entityProfileForm.id}`, getToken, {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            legalName: entityProfileForm.legalName.trim() || null,
            businessNumber: entityProfileForm.businessNumber.trim() || null,
            fiscalYearEndMonth,
            fiscalYearEndDay,
            defaultCurrency: (entityProfileForm.defaultCurrency || 'CAD').trim().toUpperCase()
          })
        })
        setNotice(`${entityProfileLabel} updated.`)
      } else {
        await portalFetch('/v1/accounting/clients', getToken, {
          method: 'POST',
          body: JSON.stringify({
            name,
            legalName: entityProfileForm.legalName.trim() || null,
            businessNumber: entityProfileForm.businessNumber.trim() || null,
            fiscalYearEndMonth,
            fiscalYearEndDay,
            defaultCurrency: (entityProfileForm.defaultCurrency || 'CAD').trim().toUpperCase()
          })
        })
        setNotice(`${entityProfileLabel} created.`)
      }
      await loadClients()
      onResetEntityProfileForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : `Could not save ${entityProfileLabel.toLowerCase()}`)
    } finally {
      setSaving(false)
    }
  }

  const onUpdateEngagementWorkflow = async () => {
    if (!engagementId) {
      setError('Select an engagement before updating workflow details.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await portalFetch(`/v1/accounting/engagements/${engagementId}`, getToken, {
        method: 'PATCH',
        body: JSON.stringify({
          dueDate: engagementWorkflowForm.dueDate || null,
          reviewFlowStatus: engagementWorkflowForm.reviewFlowStatus,
          deliverables: parseDeliverablesText(engagementWorkflowForm.deliverablesText),
          assignedPreparerId: engagementWorkflowForm.assignedPreparerId || null,
          assignedReviewerId: engagementWorkflowForm.assignedReviewerId || null
        })
      })
      await refreshEngagementWorkflowViews()
      setNotice('Engagement workflow details updated')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update engagement workflow details')
    } finally {
      setSaving(false)
    }
  }

  const onAdvanceReviewFlow = async (nextStatus: string) => {
    if (!engagementId) {
      setError('Select an engagement before advancing review flow.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await portalFetch(`/v1/accounting/engagements/${engagementId}`, getToken, {
        method: 'PATCH',
        body: JSON.stringify({ reviewFlowStatus: nextStatus })
      })
      await refreshEngagementWorkflowViews()
      setNotice(`Review flow moved to ${formatWorkflowLabel(nextStatus)}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update review flow state')
    } finally {
      setSaving(false)
    }
  }

  const onGenerateLeadSheets = async () => {
    if (!engagementId) {
      setError('Select an engagement before generating lead sheets.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const result = await portalFetch<{
        leadSheets?: unknown[]
        summary?: { leadSheetCount?: number; accountCount?: number; skippedSummaryRows?: number }
      }>(`/v1/accounting/engagements/${engagementId}/lead-sheets/generate`, getToken, { method: 'POST' })
      const leadSheetCount = result.summary?.leadSheetCount ?? result.leadSheets?.length ?? 0
      const accountCount = result.summary?.accountCount ?? 0
      setNotice(
        leadSheetCount > 0
          ? `Generated ${leadSheetCount} lead sheet${leadSheetCount === 1 ? '' : 's'} from ${accountCount} account${accountCount === 1 ? '' : 's'}. Open the Lead Sheets tab to review.`
          : 'No lead sheets were generated.'
      )
      await loadLeadSheets()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate lead sheets')
    } finally {
      setSaving(false)
    }
  }

  const onCreateAdjustmentEntry = async (payload: { entryNumber: string, description: string }) => {
    if (!engagementId) {
      setError('Select an engagement before creating adjustments.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await portalFetch('/v1/accounting/adjustments', getToken, {
        method: 'POST',
        body: JSON.stringify({
          engagementId,
          entryNumber: payload.entryNumber,
          description: payload.description,
          status: 'draft',
          source: 'manual'
        })
      })
      await Promise.all([loadAdjustments(), loadAuditEvents()])
      setNotice('Adjustment entry created')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create adjustment entry')
    } finally {
      setSaving(false)
    }
  }

  const onUpsertAdjustmentLines = async (adjustmentId: string, lines: Array<{ accountName: string, debitAmount: number, creditAmount: number, memo?: string }>) => {
    setSaving(true)
    setError(null)
    try {
      await portalFetch(`/v1/accounting/adjustments/${adjustmentId}/lines`, getToken, {
        method: 'PUT',
        body: JSON.stringify({ lines })
      })
      await Promise.all([loadAdjustments(), loadAuditEvents()])
      setNotice('Adjustment lines saved')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save adjustment lines')
    } finally {
      setSaving(false)
    }
  }

  const onCaptureReviewSignoff = async (signoffType: 'preparer' | 'reviewer') => {
    if (!engagementId) return
    setSaving(true)
    setError(null)
    try {
      await createReviewSignoff(engagementId, { leadSheetId: leadSheetId || null, signoffType, signoffState: 'signed' }, getToken)
      await Promise.all([loadReviewSignoffs(), loadAuditEvents()])
      setNotice(`${signoffType === 'preparer' ? 'Preparer' : 'Reviewer'} signoff captured`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not capture signoff')
    } finally {
      setSaving(false)
    }
  }

  const onLinkEvidence = async () => {
    if (!leadSheetId) {
      setError('Open a lead sheet to link evidence.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createEvidenceLink(leadSheetId, {
        label: 'Supporting document',
        linkType: 'document',
        metadata: { source: 'manual-link' }
      }, getToken)
      await Promise.all([loadEvidenceLinks(), loadAuditEvents()])
      setNotice('Evidence link added')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add evidence link')
    } finally {
      setSaving(false)
    }
  }

  const onCreateRowTickmark = async (workingPaperRowId: string) => {
    setSaving(true)
    setError(null)
    try {
      await createTickmark(workingPaperRowId, { tickmarkCode: 'TB', label: 'Trace verified' }, getToken)
      await loadAuditEvents()
      setNotice('Tickmark added')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add tickmark')
    } finally {
      setSaving(false)
    }
  }

  const onAttachExistingDocument = async (existingDocumentId: string) => {
    if (!engagementId) {
      setError('Select an engagement before attaching supporting documents.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await portalFetch('/v1/accounting/documents/link-existing', getToken, {
        method: 'POST',
        body: JSON.stringify({
          engagementId,
          leadSheetId: leadSheetId || null,
          existingDocumentId
        })
      })
      await loadDocuments()
      setNotice('Document linked')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not attach document')
    } finally {
      setSaving(false)
    }
  }

  const onUpdateReviewNoteStatus = async (noteId: string, status: string) => {
    setSaving(true)
    setError(null)
    try {
      await portalFetch(`/v1/accounting/review-notes/${noteId}`, getToken, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      })
      await refreshEngagementWorkflowViews({ includeReviewNotes: true })
      setNotice('Review note updated')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update review note')
    } finally {
      setSaving(false)
    }
  }

  const onPreparerSignoff = async () => {
    if (!leadSheetId) {
      setError('Open a lead sheet before preparer signoff.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await portalFetch(`/v1/accounting/lead-sheets/${leadSheetId}/preparer-signoff`, getToken, { method: 'POST' })
      await refreshEngagementWorkflowViews({ includeLeadSheetDetail: true })
      setNotice('Preparer signoff completed')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign off')
    } finally {
      setSaving(false)
    }
  }

  const onReviewerSignoff = async () => {
    if (!leadSheetId) {
      setError('Open a lead sheet before reviewer signoff.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await portalFetch(`/v1/accounting/lead-sheets/${leadSheetId}/reviewer-signoff`, getToken, {
        method: 'POST',
        headers: { 'x-portal-role': 'reviewer' }
      })
      await refreshEngagementWorkflowViews({ includeLeadSheetDetail: true })
      setNotice('Reviewer signoff completed')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign off')
    } finally {
      setSaving(false)
    }
  }

  const onArchiveEngagement = async () => {
    if (!engagementId) {
      setError('Select an engagement before archiving.')
      return
    }
    if (!window.confirm('Archive this engagement? You can restore it later only through admin actions.')) return
    setSaving(true)
    setError(null)
    try {
      await portalFetch(`/v1/accounting/engagements/${engagementId}/archive`, getToken, { method: 'POST' })
      setNotice('Engagement archived')
      navigate('/portal/accounting/working-papers/engagements')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not archive engagement')
    } finally {
      setSaving(false)
    }
  }

  const onCreateWorkspaceInvite = async () => {
    if (!account) {
      setError('Account is still loading. Try again in a moment.')
      return
    }
    const inviteEmail = newInviteEmail.trim().toLowerCase()
    if (!inviteEmail) {
      setError('Employee email is required to send a Clerk invite.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const response = await portalFetch<{ invite: { reactivated?: boolean } }>(
        '/v1/accounting/organization/invites',
        getToken,
        {
          method: 'POST',
          body: JSON.stringify({
            email: inviteEmail,
            role: newInviteRole
          })
        }
      )
      setNewInviteEmail('')
      await loadOrganizationSnapshot()
      setNotice(
        response.invite?.reactivated
          ? 'Employee access was restored with the selected role.'
          : 'Organization invite sent. After acceptance, assign this employee to engagements and working papers as needed.'
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create organization invite')
    } finally {
      setSaving(false)
    }
  }

  const onSaveCompanyProfile = async () => {
    if (!account) {
      setError('Account is still loading. Try again in a moment.')
      return
    }
    if (!companyProfileForm.companyLegalName.trim()) {
      setError('Company legal name is required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await portalFetch('/v1/accounting/company-profile', getToken, {
        method: 'PUT',
        body: JSON.stringify({
          businessType: companyProfileForm.businessType,
          companyLegalName: companyProfileForm.companyLegalName.trim(),
          companyOperatingName: companyProfileForm.companyOperatingName.trim() || null,
          taxIdentifier: companyProfileForm.taxIdentifier.trim() || null,
          websiteUrl: companyProfileForm.websiteUrl.trim() || null,
          industry: companyProfileForm.industry.trim() || null,
          primaryContactName: companyProfileForm.primaryContactName.trim() || null,
          primaryContactEmail: companyProfileForm.primaryContactEmail.trim() || null,
          primaryContactPhone: companyProfileForm.primaryContactPhone.trim() || null,
          addressLine1: companyProfileForm.addressLine1.trim() || null,
          addressLine2: companyProfileForm.addressLine2.trim() || null,
          city: companyProfileForm.city.trim() || null,
          provinceState: companyProfileForm.provinceState.trim() || null,
          postalCode: companyProfileForm.postalCode.trim() || null,
          countryCode: companyProfileForm.countryCode.trim() || 'CA',
          onboardingCompleted: true
        })
      })
      await loadWorkspaceProfile()
      setNotice('Business/Firm profile saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save Business/Firm profile')
    } finally {
      setSaving(false)
    }
  }

  const onUpdateOrganizationMember = async (memberUserId: string, role: string, status: string) => {
    if (!account) return
    setSaving(true)
    setError(null)
    try {
      await portalFetch(`/v1/accounting/organization/members/${encodeURIComponent(memberUserId)}`, getToken, {
        method: 'PATCH',
        body: JSON.stringify({ role, status })
      })
      await loadOrganizationSnapshot()
      setNotice('Employee updated.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update employee')
    } finally {
      setSaving(false)
    }
  }

  const onDeleteOrganizationMember = async (memberUserId: string) => {
    if (!account) return
    if (!window.confirm('Remove this employee from the roster? This cannot be undone.')) return
    setSaving(true)
    setError(null)
    try {
      await portalFetch(`/v1/accounting/organization/members/${encodeURIComponent(memberUserId)}`, getToken, {
        method: 'DELETE'
      })
      await Promise.all([loadOrganizationSnapshot(), loadWorkspaceMembers()])
      setNotice('Employee removed.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove employee')
    } finally {
      setSaving(false)
    }
  }

  const onDeleteLeadSheet = async (id: string) => {
    if (!window.confirm('Delete this working paper (lead sheet)?')) return
    setSaving(true)
    setError(null)
    try {
      await portalFetch(`/v1/accounting/lead-sheets/${id}`, getToken, { method: 'DELETE' })
      await loadLeadSheets()
      setNotice('Working paper deleted.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete working paper')
    } finally {
      setSaving(false)
    }
  }

  const onExportEngagementWorkbook = async (targetEngagementId: string) => {
    setSaving(true)
    setError(null)
    try {
      const workbook = await exportEngagementWorkbookDomain(getToken, targetEngagementId)
      downloadBase64File(workbook)
      setNotice('Workbook export downloaded.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not export workbook')
    } finally {
      setSaving(false)
    }
  }

  const onCreateSnapshot = async () => {
    if (!engagementId) return
    setSaving(true)
    setError(null)
    try {
      await createEngagementSnapshotDomain(getToken, engagementId, {
        snapshotLabel: `Snapshot ${new Date().toLocaleString()}`,
        snapshotType: 'manual',
        sourceState: String(dashboard?.engagement?.review_flow_status || 'not_started')
      })
      await loadEngagementSnapshots()
      setNotice('Snapshot created.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create snapshot')
    } finally {
      setSaving(false)
    }
  }

  const onAcceptInviteFromUrl = useCallback(async () => {
    if (view !== 'joinWorkspaceInvite') return
    const token = new URLSearchParams(location.search).get('token') || ''
    if (!token) {
      setError('Invite token missing from URL')
      return
    }
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const accepted = await portalFetch<{ workspace: any }>(
        `/v1/accounting/invites/${encodeURIComponent(token)}/accept`,
        getToken,
        { method: 'POST' }
      )
      await refreshAccount()
      const joinedName = accepted.workspace?.name || account?.name || 'your organization'
      setNotice(`Invite accepted. You joined ${joinedName}.`)
      navigate('/portal/accounting', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not accept invite')
    } finally {
      setSaving(false)
    }
  }, [account?.name, getToken, location.search, navigate, refreshAccount, view])

  const onConnectIntegration = async (providerId: string) => {
    if (providerId !== 'quickbooks_online' && providerId !== 'google_sheets') {
      setNotice('This integration source does not require OAuth connection.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const response = await portalFetch<{ authUrl: string }>(
        `/v1/accounting/integrations/${providerId}/connect-url`,
        getToken,
        { method: 'POST' }
      )
      window.location.href = response.authUrl
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start integration connection')
      setSaving(false)
    }
  }

  useEffect(() => {
    if (view !== 'joinWorkspaceInvite') return
    void onAcceptInviteFromUrl()
  }, [onAcceptInviteFromUrl, view])

  return (
    <>
      <SEO
        title={`${pageTitle} | Client Portal`}
        description={pageDescription}
        canonical={
          view === 'landing'
            ? '/portal/accounting'
            : view === 'companyProfile'
              ? '/portal/accounting/company-profile'
              : view === 'companyProfileEntities'
                ? '/portal/accounting/company-profile/entities'
              : view === 'companyProfileEmployees'
                ? '/portal/accounting/company-profile/employees'
              : view === 'companyProfileRoles'
                ? '/portal/accounting/company-profile/roles-and-permissions'
              : view === 'joinWorkspaceInvite'
                ? '/portal/accounting/join'
              : view === 'workingPapersWorkspace'
                ? '/portal/accounting/working-papers/workspace'
            : view === 'integrations'
              ? '/portal/accounting/integrations'
              : '/portal/accounting/working-papers/engagements'
        }
      />
      <ClientPortalShell wideContent={isCompanyProfileView(view) || view === 'engagementList' || view === 'newEngagement'}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-primary-dark">{pageTitle}</h1>
            <p className="text-sm text-text-light mt-2">{pageDescription}</p>
            {isCompanyProfileView(view) && (
              <div className="mt-4">
                <CompanyProfileTabs entityTabLabel={entityProfilesNavLabel} />
              </div>
            )}
          </div>

          <>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </div>
              )}
              {notice && (
                <div className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
                  {notice}
                </div>
              )}
              <div className={isCompanyProfileView(view) ? 'space-y-4' : 'bg-white p-6 rounded-lg border border-border shadow-sm'}>
              {loading && !isListCentricView(view) ? (
                  <PageLoadingSkeleton variant={view === 'landing' ? 'cards' : 'default'} />
                ) : (
                  <div className="space-y-4">
                    {view === 'joinWorkspaceInvite' && (
                      <div className="rounded-lg border border-border p-4">
                        <h3 className="font-semibold text-primary-dark mb-2">Workspace invitation</h3>
                        <p className="text-sm text-text-light">
                          {saving
                            ? 'Accepting invitation...'
                            : 'If this invite is valid, you will be redirected to Accounting Operations.'}
                        </p>
                      </div>
                    )}
                    {view === 'landing' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {canAccessCompanyProfile && (
                          <div className="rounded-lg border border-border p-4">
                            <h3 className="font-semibold text-primary-dark mb-1">Business/Firm Profile</h3>
                            <p className="text-sm text-text-light mb-3">Manage organization details, employee access, and portal permissions.</p>
                            <Link
                              className="btn btn--primary text-sm py-2 px-4 inline-block"
                              to={canManageWorkspace
                                ? '/portal/accounting/company-profile'
                                : canInviteEmployees
                                  ? '/portal/accounting/company-profile/employees'
                                  : '/portal/accounting/company-profile/roles-and-permissions'}
                            >
                              Open Business/Firm Profile
                            </Link>
                          </div>
                        )}
                        {canAccessEngagements && (
                          <div className="rounded-lg border border-border p-4">
                            <h3 className="font-semibold text-primary-dark mb-1">Engagements</h3>
                            <p className="text-sm text-text-light mb-3">Plan and monitor client work, then assign engagement roles per engagement.</p>
                            <Link className="btn btn--primary text-sm py-2 px-4 inline-block" to="/portal/accounting/working-papers/engagements">
                              Open Engagements
                            </Link>
                          </div>
                        )}
                        {canAccessWorkingPapers && (
                          <div className="rounded-lg border border-border p-4">
                            <h3 className="font-semibold text-primary-dark mb-1">Working Papers</h3>
                            <p className="text-sm text-text-light mb-3">Engagements, trial balances, lead sheets, review notes, signoffs.</p>
                            <Link className="btn btn--primary text-sm py-2 px-4 inline-block" to="/portal/accounting/working-papers/workspace">
                              Open Working Papers
                            </Link>
                          </div>
                        )}
                        {canAccessIntegrations && (
                          <div className="rounded-lg border border-border p-4">
                            <h3 className="font-semibold text-primary-dark mb-1">Integrations</h3>
                            <p className="text-sm text-text-light mb-3">QuickBooks and Google Sheets setup readiness with feature flags.</p>
                            <Link className="btn btn--primary text-sm py-2 px-4 inline-block" to="/portal/accounting/integrations">
                              Open Integrations
                            </Link>
                          </div>
                        )}
                      </div>
                    )}

                    {view === 'companyProfile' && (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-border p-5 sm:p-6 space-y-4 bg-white">
                          <h4 className="font-semibold text-primary-dark">Business/Firm details</h4>
                          <p className="text-sm text-text-light">
                            {canManageWorkspaceMembers
                              ? 'Configure core business or firm information used across your organization.'
                              : 'View your organization business or firm profile. Contact an organization admin to request changes.'}
                          </p>
                          {!canManageWorkspaceMembers && activeWorkspace?.is_personal && (
                            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                              You are on a personal account. Your employer&apos;s business profile is managed by organization administrators.
                            </p>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <select
                              className="w-full border border-border rounded-md px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-text-light"
                              value={companyProfileForm.businessType}
                              disabled={!canManageWorkspaceMembers}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, businessType: e.target.value }))}
                            >
                              {BUSINESS_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                            <input
                              className="w-full border border-border rounded-md px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-text-light"
                              placeholder="Business/Firm legal name"
                              value={companyProfileForm.companyLegalName}
                              disabled={!canManageWorkspaceMembers}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, companyLegalName: e.target.value }))}
                            />
                            <input
                              className="w-full border border-border rounded-md px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-text-light"
                              placeholder="Operating name"
                              value={companyProfileForm.companyOperatingName}
                              disabled={!canManageWorkspaceMembers}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, companyOperatingName: e.target.value }))}
                            />
                            <input
                              className="w-full border border-border rounded-md px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-text-light"
                              placeholder="Business number"
                              value={companyProfileForm.taxIdentifier}
                              disabled={!canManageWorkspaceMembers}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, taxIdentifier: e.target.value }))}
                            />
                            <input
                              className="w-full border border-border rounded-md px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-text-light"
                              placeholder="Website URL"
                              value={companyProfileForm.websiteUrl}
                              disabled={!canManageWorkspaceMembers}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                            />
                            <input
                              className="w-full border border-border rounded-md px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-text-light"
                              placeholder="Industry"
                              value={companyProfileForm.industry}
                              disabled={!canManageWorkspaceMembers}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, industry: e.target.value }))}
                            />
                            <input
                              className="w-full border border-border rounded-md px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-text-light"
                              placeholder="Primary contact name"
                              value={companyProfileForm.primaryContactName}
                              disabled={!canManageWorkspaceMembers}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, primaryContactName: e.target.value }))}
                            />
                            <input
                              className="w-full border border-border rounded-md px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-text-light"
                              placeholder="Primary contact email"
                              value={companyProfileForm.primaryContactEmail}
                              disabled={!canManageWorkspaceMembers}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, primaryContactEmail: e.target.value }))}
                            />
                            <input
                              className="w-full border border-border rounded-md px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-text-light"
                              placeholder="Primary contact phone"
                              value={companyProfileForm.primaryContactPhone}
                              disabled={!canManageWorkspaceMembers}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, primaryContactPhone: e.target.value }))}
                            />
                            <input
                              className="w-full border border-border rounded-md px-3 py-2 text-sm sm:col-span-2 xl:col-span-2 disabled:bg-slate-50 disabled:text-text-light"
                              placeholder="Address line 1"
                              value={companyProfileForm.addressLine1}
                              disabled={!canManageWorkspaceMembers}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, addressLine1: e.target.value }))}
                            />
                            <input
                              className="w-full border border-border rounded-md px-3 py-2 text-sm sm:col-span-2 xl:col-span-2 disabled:bg-slate-50 disabled:text-text-light"
                              placeholder="Address line 2"
                              value={companyProfileForm.addressLine2}
                              disabled={!canManageWorkspaceMembers}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, addressLine2: e.target.value }))}
                            />
                            <input
                              className="w-full border border-border rounded-md px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-text-light"
                              placeholder="City"
                              value={companyProfileForm.city}
                              disabled={!canManageWorkspaceMembers}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, city: e.target.value }))}
                            />
                            <input
                              className="w-full border border-border rounded-md px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-text-light"
                              placeholder="Province/State"
                              value={companyProfileForm.provinceState}
                              disabled={!canManageWorkspaceMembers}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, provinceState: e.target.value }))}
                            />
                            <input
                              className="w-full border border-border rounded-md px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-text-light"
                              placeholder="Postal code"
                              value={companyProfileForm.postalCode}
                              disabled={!canManageWorkspaceMembers}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, postalCode: e.target.value }))}
                            />
                            <input
                              className="w-full border border-border rounded-md px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-text-light"
                              placeholder="Country code"
                              value={companyProfileForm.countryCode}
                              disabled={!canManageWorkspaceMembers}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, countryCode: e.target.value.toUpperCase() }))}
                            />
                          </div>
                          {canManageWorkspaceMembers && (
                          <button
                            type="button"
                            className="btn btn--primary text-sm py-2 px-4"
                            disabled={saving}
                            onClick={() => { void onSaveCompanyProfile() }}
                          >
                            Save Business/Firm Profile
                          </button>
                          )}
                        </div>
                      </div>
                    )}

                    {view === 'companyProfileEntities' && (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-border p-5 sm:p-6 space-y-4 bg-white">
                          <h4 className="font-semibold text-primary-dark">{entityProfilesNavLabel}</h4>
                          <p className="text-sm text-text-light">
                            {isAccountingFirm
                              ? 'Create and maintain client records that engagements will be attached to.'
                              : 'Create reporting entities (subsidiary/division/legal entity) that engagements will be attached to.'}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                            <input
                              className="w-full border border-border rounded-md px-3 py-2 text-sm xl:col-span-2"
                              placeholder={isAccountingFirm ? 'Client name' : 'Business entity name'}
                              value={entityProfileForm.name}
                              onChange={(e) => setEntityProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                            />
                            <input
                              className="w-full border border-border rounded-md px-3 py-2 text-sm xl:col-span-2"
                              placeholder="Legal name"
                              value={entityProfileForm.legalName}
                              onChange={(e) => setEntityProfileForm((prev) => ({ ...prev, legalName: e.target.value }))}
                            />
                            <input
                              className="w-full border border-border rounded-md px-3 py-2 text-sm"
                              placeholder="Business number"
                              value={entityProfileForm.businessNumber}
                              onChange={(e) => setEntityProfileForm((prev) => ({ ...prev, businessNumber: e.target.value }))}
                            />
                            <input
                              className="w-full border border-border rounded-md px-3 py-2 text-sm"
                              placeholder="Default currency (e.g., CAD)"
                              value={entityProfileForm.defaultCurrency}
                              onChange={(e) => setEntityProfileForm((prev) => ({ ...prev, defaultCurrency: e.target.value.toUpperCase() }))}
                            />
                            <input
                              className="w-full border border-border rounded-md px-3 py-2 text-sm"
                              placeholder="Fiscal year end month (1-12)"
                              value={entityProfileForm.fiscalYearEndMonth}
                              onChange={(e) => setEntityProfileForm((prev) => ({ ...prev, fiscalYearEndMonth: e.target.value }))}
                            />
                            <input
                              className="w-full border border-border rounded-md px-3 py-2 text-sm"
                              placeholder="Fiscal year end day (1-31)"
                              value={entityProfileForm.fiscalYearEndDay}
                              onChange={(e) => setEntityProfileForm((prev) => ({ ...prev, fiscalYearEndDay: e.target.value }))}
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className="btn btn--primary text-sm py-2 px-4"
                              disabled={saving}
                              onClick={() => { void onSaveEntityProfile() }}
                            >
                              {entityProfileForm.id ? `Update ${entityProfileLabel}` : `Create ${entityProfileLabel}`}
                            </button>
                            <button
                              type="button"
                              className="btn btn--secondary text-sm py-2 px-4"
                              disabled={saving}
                              onClick={onResetEntityProfileForm}
                            >
                              Clear
                            </button>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border text-left text-text-light">
                                  <th className="py-2">Name</th>
                                  <th className="py-2">Legal name</th>
                                  <th className="py-2">Business number</th>
                                  <th className="py-2">Fiscal year end</th>
                                  <th className="py-2">Currency</th>
                                  <th className="py-2">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {clients.length === 0 ? (
                                  <tr>
                                    <td className="py-3 text-text-light" colSpan={6}>
                                      No {clientLabelPlural.toLowerCase()} found in your organization.
                                    </td>
                                  </tr>
                                ) : clients.map((client) => (
                                  <tr key={client.id} className="border-b border-border/70">
                                    <td className="py-2">{client.name}</td>
                                    <td className="py-2">{client.legal_name || '—'}</td>
                                    <td className="py-2">{client.business_number || '—'}</td>
                                    <td className="py-2">
                                      {client.fiscal_year_end_month && client.fiscal_year_end_day
                                        ? `${client.fiscal_year_end_month}/${client.fiscal_year_end_day}`
                                        : '—'}
                                    </td>
                                    <td className="py-2">{client.default_currency || 'CAD'}</td>
                                    <td className="py-2">
                                      <button
                                        type="button"
                                        className="text-xs text-primary-dark underline"
                                        onClick={() => onSelectEntityProfile(client)}
                                      >
                                        Edit
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {view === 'companyProfileRoles' && (
                      <Suspense fallback={<AccountingPanelFallback />}>
                        <LazyRolesAndPermissionsPanel
                          getToken={getToken}
                          onError={setError}
                          onNotice={setNotice}
                        />
                      </Suspense>
                    )}

                    {view === 'companyProfileEmployees' && (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-border p-5 sm:p-6 space-y-4 bg-white">
                          <h4 className="font-semibold text-primary-dark">Employee invite</h4>
                          <p className="text-sm text-text-light">
                            Invite employees to your organization and manage roster status before engagement assignments.
                            Employee name and email are taken from their sign-in account after they accept the invite.
                          </p>
                          {!canManageWorkspaceMembers && (
                            <p className="text-xs text-text-light">
                              Only organization owners and admins can invite or manage employees.
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              className="border border-border rounded-md px-3 py-2 text-sm min-w-64"
                              placeholder="Employee email"
                              value={newInviteEmail}
                              onChange={(e) => setNewInviteEmail(e.target.value)}
                            />
                            <select
                              className="border border-border rounded-md px-3 py-2 text-sm"
                              value={newInviteRole}
                              onChange={(e) => setNewInviteRole(e.target.value)}
                            >
                              {['admin', 'manager', 'employee'].map((role) => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn btn--primary text-sm py-2 px-4"
                              disabled={saving || !canManageWorkspaceMembers}
                              onClick={() => { void onCreateWorkspaceInvite() }}
                            >
                              Send Invite
                            </button>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border text-left text-text-light">
                                  <th className="py-2">Employee</th>
                                  <th className="py-2">Email</th>
                                  <th className="py-2">Role</th>
                                  <th className="py-2">Status</th>
                                  <th className="py-2">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(organizationSnapshot?.employees || []).length === 0 ? (
                                  <tr>
                                    <td className="py-3 text-text-light" colSpan={5}>No organization employees yet.</td>
                                  </tr>
                                ) : (organizationSnapshot?.employees || []).map((member: any) => (
                                  <tr key={member.clerk_user_id} className="border-b border-border/70">
                                    <td className="py-2">{member.display_name || member.email || 'Employee'}</td>
                                    <td className="py-2">{member.email || '—'}</td>
                                    <td className="py-2">{formatEmployeeRoleLabel(member)}</td>
                                    <td className="py-2">{member.status}</td>
                                    <td className="py-2">
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          className="text-xs text-primary-dark underline"
                                          onClick={() => { void onUpdateOrganizationMember(member.clerk_user_id, member.role, member.status === 'active' ? 'inactive' : 'active') }}
                                        >
                                          {member.status === 'active' ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                          type="button"
                                          className="text-xs text-primary-dark underline"
                                          onClick={() => { void onDeleteOrganizationMember(member.clerk_user_id) }}
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {(view === 'engagementList' || view === 'newEngagement') && (
                      <Suspense fallback={<AccountingPanelFallback />}>
                      <LazyEngagementOperationsPanel
                        getToken={getToken}
                        accountReady={Boolean(account)}
                        clientLabel={clientLabel}
                        clientLabelPlural={clientLabelPlural}
                        clients={clients}
                        workspaceMembers={workspaceMembers}
                        engagements={engagements}
                        loading={listLoading}
                        saving={saving}
                        onReloadEngagements={async () => { await loadEngagements() }}
                        onDeleteEngagement={async (engagementId) => {
                          await portalFetch(`/v1/accounting/engagements/${engagementId}`, getToken, { method: 'DELETE' })
                          resetWorkingPapersSelection()
                        }}
                        onError={setError}
                        onNotice={setNotice}
                        onSavingChange={setSaving}
                      />
                      </Suspense>
                    )}

                    {view === 'workingPapersWorkspace' && (
                      <Suspense fallback={<AccountingPanelFallback />}>
                      <LazyWorkingPapersWorkspacePanel
                        getToken={getToken}
                        clientLabel={clientLabel}
                        engagements={engagements}
                        listLoading={listLoading}
                        onError={setError}
                        onNotice={setNotice}
                      />
                      </Suspense>
                    )}

                    {view === 'engagementDashboard' && dashboard && (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-border p-4 bg-white">
                          <p className="text-xs text-text-light">
                            Review flow: <span className="font-medium text-primary-dark">{formatWorkflowLabel(dashboard.engagement.review_flow_status || 'not_started')}</span>
                            {' '}| Due date: <span className="font-medium text-primary-dark">{dashboard.engagement.due_date ? new Date(dashboard.engagement.due_date).toLocaleDateString() : 'Not set'}</span>
                            {' '}| Deliverables: <span className="font-medium text-primary-dark">{Array.isArray(dashboard.engagement.deliverables) ? dashboard.engagement.deliverables.length : 0}</span>
                          </p>
                          <p className="text-xs text-text-light mt-1">
                            Preparer: <span className="font-medium text-primary-dark">{dashboard.engagement.assigned_preparer_id ? (assignmentLabelByUserId.get(dashboard.engagement.assigned_preparer_id) || dashboard.engagement.assigned_preparer_id) : 'Unassigned'}</span>
                            {' '}| Reviewer: <span className="font-medium text-primary-dark">{dashboard.engagement.assigned_reviewer_id ? (assignmentLabelByUserId.get(dashboard.engagement.assigned_reviewer_id) || dashboard.engagement.assigned_reviewer_id) : 'Unassigned'}</span>
                          </p>
                          <p className="text-xs text-text-light mt-1">
                            Open review notes: <span className="font-medium text-primary-dark">{Number(dashboard.workflowHealth?.openReviewNotes || 0)}</span>
                            {' '}| Unreviewed lead sheets: <span className="font-medium text-primary-dark">{Number(dashboard.workflowHealth?.unreviewedLeadSheets || 0)}</span>
                            {' '}| Approval ready: <span className="font-medium text-primary-dark">{dashboard.workflowHealth?.canApprove ? 'Yes' : 'No'}</span>
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {nextReviewFlowStatuses.map((status) => (
                              <button
                                key={status}
                                type="button"
                                className="btn btn--secondary text-sm py-2 px-3"
                                disabled={saving}
                                onClick={() => { void onAdvanceReviewFlow(status) }}
                              >
                                Move to {formatWorkflowLabel(status)}
                              </button>
                            ))}
                            <Link to={`/portal/accounting/working-papers/engagements/${engagementId}/settings`} className="text-sm text-primary-dark underline self-center">
                              Edit workflow details
                            </Link>
                            <button
                              type="button"
                              className="btn btn--secondary text-sm py-2 px-3"
                              disabled={saving}
                              onClick={() => { void onCreateSnapshot() }}
                            >
                              Create Snapshot
                            </button>
                          </div>
                          <p className="text-xs text-text-light mt-2">
                            Snapshots captured: <span className="font-medium text-primary-dark">{engagementSnapshots.length}</span>
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="rounded-lg border border-border p-4">
                            <p className="text-xs text-text-light">Status</p>
                            <p className="text-xl font-semibold text-primary-dark">{dashboard.engagement.status}</p>
                          </div>
                          <div className="rounded-lg border border-border p-4">
                            <p className="text-xs text-text-light">Open notes</p>
                            <p className="text-xl font-semibold text-primary-dark">{dashboard.noteSummary.reduce((sum: number, item: any) => sum + Number(item.c || 0), 0)}</p>
                          </div>
                          <div className="rounded-lg border border-border p-4">
                            <p className="text-xs text-text-light">Tasks</p>
                            <p className="text-xl font-semibold text-primary-dark">{dashboard.taskSummary.reduce((sum: number, item: any) => sum + Number(item.c || 0), 0)}</p>
                          </div>
                          <div className="rounded-lg border border-border p-4">
                            <p className="text-xs text-text-light">Material / unusual</p>
                            <p className="text-xl font-semibold text-primary-dark">{dashboard.materialOrUnusualCount}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/portal/accounting/working-papers/engagements/${engagementId}/execution`} className="btn btn--primary text-sm py-2 px-4">Execution</Link>
                          <Link to={`/portal/accounting/working-papers/engagements/${engagementId}/trial-balance`} className="btn btn--primary text-sm py-2 px-4">Trial Balance</Link>
                          <Link to={`/portal/accounting/working-papers/engagements/${engagementId}/lead-sheets`} className="btn btn--primary text-sm py-2 px-4">Lead Sheets</Link>
                          <Link to={`/portal/accounting/working-papers/engagements/${engagementId}/documents`} className="btn btn--primary text-sm py-2 px-4">Documents</Link>
                          <Link to={`/portal/accounting/working-papers/engagements/${engagementId}/review`} className="btn btn--primary text-sm py-2 px-4">Review</Link>
                          <Link to={`/portal/accounting/working-papers/engagements/${engagementId}/adjustments`} className="btn btn--primary text-sm py-2 px-4">Adjustments</Link>
                          <Link to={`/portal/accounting/working-papers/engagements/${engagementId}/settings`} className="btn btn--primary text-sm py-2 px-4">Settings</Link>
                          <button
                            type="button"
                            className="btn btn--secondary text-sm py-2 px-4"
                            disabled={saving}
                            onClick={() => { if (engagementId) void onExportEngagementWorkbook(engagementId) }}
                          >
                            Export workbook
                          </button>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                          <Suspense fallback={<AccountingPanelFallback />}>
                            <LazyWorkingPaperTreePanel sections={Array.isArray(workingPaperTree?.sections) ? workingPaperTree.sections : []} />
                          </Suspense>
                          <Suspense fallback={<AccountingPanelFallback />}>
                            <LazyWorkflowQueuePanel queue={workflowQueue} />
                          </Suspense>
                        </div>
                        <Suspense fallback={<AccountingPanelFallback />}>
                          <LazyAuditTimelinePanel events={auditEvents} />
                        </Suspense>
                        <div className="rounded-lg border border-border p-4">
                          <h3 className="font-semibold text-primary-dark">AI Foundations</h3>
                          <p className="text-xs text-text-light mt-1">
                            Reconciliation assistant: {String(aiFoundations?.reconciliationAssistant || 'scaffolded')} | Anomaly detection: {String(aiFoundations?.anomalyDetection || 'scaffolded')} | Notes generation: {String(aiFoundations?.notesGeneration || 'scaffolded')}
                          </p>
                        </div>
                      </div>
                    )}

                    {view === 'trialBalance' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="rounded-lg border border-border p-3">
                            <p className="text-xs text-text-light">Current total</p>
                            <p className="font-semibold text-primary-dark">{trialBalanceTotals.currentTotal.toFixed(2)}</p>
                          </div>
                          <div className="rounded-lg border border-border p-3">
                            <p className="text-xs text-text-light">Prior total</p>
                            <p className="font-semibold text-primary-dark">{trialBalanceTotals.priorTotal.toFixed(2)}</p>
                          </div>
                          <div className="rounded-lg border border-border p-3">
                            <p className="text-xs text-text-light">Variance total</p>
                            <p className="font-semibold text-primary-dark">{trialBalanceTotals.varianceTotal.toFixed(2)}</p>
                          </div>
                        </div>
                        {engagementId && (
                          <Suspense fallback={<AccountingPanelFallback />}>
                            <LazyTrialBalanceImportPanel
                              engagementId={engagementId}
                              getToken={getToken}
                              saving={saving}
                              onSavingChange={setSaving}
                              onError={setError}
                              onNotice={setNotice}
                              onImported={async () => {
                                await loadTrialBalance()
                                await loadEngagementDashboard()
                              }}
                              onGenerateLeadSheets={onGenerateLeadSheets}
                            />
                          </Suspense>
                        )}
                        {trialBalanceAccounts.length === 0 ? (
                          <p className="text-sm text-text-light">No trial balance accounts imported yet.</p>
                        ) : (
                          <Suspense fallback={<AccountingPanelFallback />}>
                          <LazyTrialBalanceGridPanel
                            getToken={getToken}
                            accounts={trialBalanceAccounts}
                            saving={saving}
                            onReload={loadTrialBalance}
                            onError={setError}
                            onNotice={setNotice}
                            onSavingChange={setSaving}
                          />
                          </Suspense>
                        )}
                      </div>
                    )}

                    {view === 'leadSheets' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="rounded-lg border border-border p-3">
                            <p className="text-xs text-text-light">Open notes total</p>
                            <p className="font-semibold text-primary-dark">{leadSheetTotals.openNotesTotal}</p>
                          </div>
                          <div className="rounded-lg border border-border p-3">
                            <p className="text-xs text-text-light">Documents total</p>
                            <p className="font-semibold text-primary-dark">{leadSheetTotals.documentsTotal}</p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button type="button" className="btn btn--primary text-sm py-2 px-4" disabled={saving} onClick={() => { void onGenerateLeadSheets() }}>
                            Generate or Refresh Lead Sheets
                          </button>
                        </div>
                        {leadSheets.length === 0 ? (
                          <p className="text-sm text-text-light">No lead sheets generated yet.</p>
                        ) : (
                          <Suspense fallback={<AccountingPanelFallback />}>
                            <LazyAgGridTable
                              rowData={leadSheets}
                              height={320}
                              columnDefs={[
                                {
                                  headerName: 'Section',
                                  minWidth: 240,
                                  valueGetter: (params) => `${params.data?.section_code || ''} - ${params.data?.section_name || ''}`
                                },
                                { field: 'status', headerName: 'Status', minWidth: 130 },
                                { field: 'risk_level', headerName: 'Risk', minWidth: 120 },
                                { field: 'open_note_count', headerName: 'Open Notes', minWidth: 120 },
                                { field: 'document_count', headerName: 'Docs', minWidth: 90 }
                              ]}
                            />
                          </Suspense>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {leadSheets.map((sheet) => (
                            <div key={`sheet-actions-${sheet.id}`} className="rounded border border-border/70 p-2 flex items-center justify-between gap-2">
                              <Link className="text-primary-dark hover:underline text-sm" to={`/portal/accounting/working-papers/engagements/${engagementId}/lead-sheets/${sheet.id}`}>
                                Open {sheet.section_code} - {sheet.section_name}
                              </Link>
                              <button
                                type="button"
                                className="text-xs text-primary-dark underline"
                                onClick={() => { void onDeleteLeadSheet(sheet.id) }}
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {view === 'leadSheetDetail' && leadSheetDetail && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="rounded-lg border border-border p-3">
                            <p className="text-xs text-text-light">Status</p>
                            <p className="font-semibold text-primary-dark">{leadSheetDetail.leadSheet.status}</p>
                          </div>
                          <div className="rounded-lg border border-border p-3">
                            <p className="text-xs text-text-light">Accounts</p>
                            <p className="font-semibold text-primary-dark">{leadSheetDetail.accounts.length}</p>
                          </div>
                          <div className="rounded-lg border border-border p-3">
                            <p className="text-xs text-text-light">Open notes</p>
                            <p className="font-semibold text-primary-dark">{leadSheetDetail.notes.filter((n: any) => n.status === 'open' || n.status === 'reopened').length}</p>
                          </div>
                        </div>
                        <div className="rounded-lg border border-border p-4">
                          <label className="block text-xs text-text-light mb-1">Conclusion</label>
                          <textarea
                            className="border border-border rounded-md px-3 py-2 text-sm w-full min-h-24"
                            defaultValue={leadSheetDetail.leadSheet.conclusion_text || ''}
                            onBlur={(e) => {
                              void portalFetch(`/v1/accounting/lead-sheets/${leadSheetId}/conclusion`, getToken, {
                                method: 'PATCH',
                                body: JSON.stringify({ conclusionText: e.target.value })
                              })
                            }}
                          />
                          <div className="flex flex-wrap gap-2 mt-3">
                            <button type="button" className="btn btn--primary text-sm py-2 px-4" disabled={saving} onClick={() => { void onPreparerSignoff() }}>
                              Preparer Signoff
                            </button>
                            <button type="button" className="btn btn--primary text-sm py-2 px-4" disabled={saving} onClick={() => { void onReviewerSignoff() }}>
                              Reviewer Signoff
                            </button>
                            <button type="button" className="btn btn--secondary text-sm py-2 px-4" disabled={saving} onClick={() => { void onCaptureReviewSignoff('reviewer') }}>
                              Capture Review Signoff Event
                            </button>
                            <button type="button" className="btn btn--secondary text-sm py-2 px-4" disabled={saving} onClick={() => { void onLinkEvidence() }}>
                              Link Evidence
                            </button>
                          </div>
                        </div>
                        <div className="rounded-lg border border-border p-4 space-y-2">
                          <h3 className="font-semibold text-primary-dark">Evidence Links</h3>
                          {evidenceLinks.length === 0 ? (
                            <p className="text-sm text-text-light">No evidence links on this lead sheet yet.</p>
                          ) : evidenceLinks.map((evidence) => (
                            <div key={evidence.id} className="text-xs text-text-light flex items-center justify-between gap-2">
                              <span>{evidence.label || evidence.link_type || 'Evidence'}</span>
                              <span>{new Date(evidence.created_at).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-lg border border-border p-4 space-y-2">
                          <h3 className="font-semibold text-primary-dark">Row Tickmarks</h3>
                          {((Array.isArray(workingPaperTree?.sections) ? workingPaperTree.sections : [])
                            .flatMap((section: any) => Array.isArray(section.rows) ? section.rows : [])
                            .filter((row: any) => String(row.lead_sheet_id) === String(leadSheetId))
                            .slice(0, 8)
                          ).map((row: any) => (
                            <div key={row.id} className="flex items-center justify-between gap-2 text-xs">
                              <span className="text-text-light">{row.row_label || row.account_name || row.id}</span>
                              <button
                                type="button"
                                className="text-xs text-primary-dark underline"
                                onClick={() => { void onCreateRowTickmark(row.id) }}
                              >
                                Add Tickmark
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {view === 'documents' && (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-border p-4">
                          <h3 className="font-semibold text-primary-dark mb-2">Link repository documents to this engagement</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {repositoryFiles.slice(0, 20).map((file) => (
                              <button
                                key={file.id}
                                type="button"
                                className="text-left rounded-md border border-border px-3 py-2 text-sm hover:bg-background"
                                onClick={() => { void onAttachExistingDocument(file.id) }}
                              >
                                {file.file_name}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border text-left text-text-light">
                                <th className="py-2">File</th>
                                <th className="py-2">Source</th>
                                <th className="py-2">Uploaded</th>
                              </tr>
                            </thead>
                            <tbody>
                              {documents.length === 0 ? (
                                <tr>
                                  <td className="py-3 text-text-light" colSpan={3}>No supporting documents linked to this engagement yet.</td>
                                </tr>
                              ) : documents.map((document) => (
                                  <tr key={document.id} className="border-b border-border/70">
                                    <td className="py-2">{document.file_name}</td>
                                    <td className="py-2">{document.source}</td>
                                    <td className="py-2">{new Date(document.uploaded_at).toLocaleString()}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {view === 'review' && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="btn btn--secondary text-sm py-2 px-4" disabled={saving} onClick={() => { void onCaptureReviewSignoff('preparer') }}>
                            Capture Preparer Signoff
                          </button>
                          <button type="button" className="btn btn--secondary text-sm py-2 px-4" disabled={saving} onClick={() => { void onCaptureReviewSignoff('reviewer') }}>
                            Capture Reviewer Signoff
                          </button>
                        </div>
                        <Suspense fallback={<AccountingPanelFallback />}>
                          <LazyWorkflowQueuePanel queue={workflowQueue} />
                        </Suspense>
                        {reviewNotes.length === 0 ? (
                          <p className="text-sm text-text-light">No review notes for this engagement.</p>
                        ) : (
                          <>
                            <Suspense fallback={<AccountingPanelFallback />}>
                              <LazyAgGridTable
                                rowData={reviewNotes}
                                height={280}
                                columnDefs={[
                                  { field: 'priority', headerName: 'Priority', minWidth: 110 },
                                  { field: 'status', headerName: 'Status', minWidth: 130 },
                                  { field: 'note_text', headerName: 'Note', minWidth: 360 }
                                ]}
                              />
                            </Suspense>
                            <div className="space-y-2">
                              {reviewNotes.map((note) => (
                                <div key={`review-actions-${note.id}`} className="rounded border border-border/70 p-2">
                                  <p className="text-xs text-text-light mb-1">{note.priority} - {note.status}</p>
                                  <p className="text-sm text-primary-dark mb-2">{note.note_text}</p>
                                  <div className="flex gap-2">
                                    <button type="button" className="text-xs text-primary-dark underline" onClick={() => { void onUpdateReviewNoteStatus(note.id, 'addressed') }}>
                                      Address
                                    </button>
                                    <button type="button" className="text-xs text-primary-dark underline" onClick={() => { void onUpdateReviewNoteStatus(note.id, 'cleared') }}>
                                      Clear
                                    </button>
                                    <button type="button" className="text-xs text-primary-dark underline" onClick={() => { void onUpdateReviewNoteStatus(note.id, 'reopened') }}>
                                      Reopen
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        <div className="rounded-lg border border-border p-4">
                          <h3 className="font-semibold text-primary-dark">Signoff Timeline</h3>
                          <div className="mt-2 space-y-1">
                            {reviewSignoffs.length === 0 ? (
                              <p className="text-sm text-text-light">No signoff events captured.</p>
                            ) : reviewSignoffs.map((signoff) => (
                              <p key={signoff.id} className="text-xs text-text-light">
                                {signoff.signoff_type} - {signoff.signoff_state} by {signoff.signed_by} on {new Date(signoff.signed_at).toLocaleString()}
                              </p>
                            ))}
                          </div>
                        </div>
                        <Suspense fallback={<AccountingPanelFallback />}>
                          <LazyAuditTimelinePanel events={auditEvents} />
                        </Suspense>
                      </div>
                    )}

                    {view === 'adjustments' && (
                      <div className="space-y-4">
                        <Suspense fallback={<AccountingPanelFallback />}>
                          <LazyAdjustmentWorkspacePanel
                            entries={adjustments}
                            saving={saving}
                            onCreateEntry={onCreateAdjustmentEntry}
                            onUpdateLines={onUpsertAdjustmentLines}
                          />
                        </Suspense>
                        <Suspense fallback={<AccountingPanelFallback />}>
                          <LazyAuditTimelinePanel events={auditEvents} />
                        </Suspense>
                      </div>
                    )}

                    {view === 'settings' && (
                      <div className="space-y-3">
                        <div className="rounded-lg border border-border p-4 space-y-3">
                          <h3 className="font-semibold text-primary-dark">
                            Team access (managed in Business/Firm Profile)
                          </h3>
                          <p className="text-xs text-text-light">
                            {isFirmWorkspace
                              ? 'Use this mode when your firm has employees serving multiple accounting clients.'
                              : 'Use this mode when one company has employees managing internal accounting work.'}
                          </p>
                          <p className="text-sm text-text-light">
                            Use <Link className="font-medium underline" to="/portal/accounting/company-profile/employees">Invite Employees</Link> for employee onboarding and member management.
                          </p>
                        </div>
                        <div className="rounded-lg border border-border p-4 space-y-3">
                          <h3 className="font-semibold text-primary-dark">Workflow details</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-text-light mb-1">Due date</label>
                              <input
                                type="date"
                                className="border border-border rounded-md px-3 py-2 text-sm w-full"
                                value={engagementWorkflowForm.dueDate}
                                onChange={(e) => setEngagementWorkflowForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-text-light mb-1">Review flow status</label>
                              <select
                                className="border border-border rounded-md px-3 py-2 text-sm w-full"
                                value={engagementWorkflowForm.reviewFlowStatus}
                                onChange={(e) => setEngagementWorkflowForm((prev) => ({ ...prev, reviewFlowStatus: e.target.value }))}
                              >
                                {editableReviewFlowOptions.map((status) => (
                                  <option key={status} value={status}>{formatWorkflowLabel(status)}</option>
                                ))}
                              </select>
                              <p className="mt-1 text-[11px] text-text-light">
                                You can keep current state or move only to valid next states.
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs text-text-light mb-1">Assigned preparer</label>
                              <select
                                className="border border-border rounded-md px-3 py-2 text-sm w-full"
                                value={engagementWorkflowForm.assignedPreparerId}
                                onChange={(e) => setEngagementWorkflowForm((prev) => ({ ...prev, assignedPreparerId: e.target.value }))}
                              >
                                <option value="">Unassigned</option>
                                {assignmentCandidates.map((member) => (
                                  <option key={member.clerk_user_id} value={member.clerk_user_id}>
                                    {member.display_name || member.email || member.clerk_user_id}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-text-light mb-1">Assigned reviewer</label>
                              <select
                                className="border border-border rounded-md px-3 py-2 text-sm w-full"
                                value={engagementWorkflowForm.assignedReviewerId}
                                onChange={(e) => setEngagementWorkflowForm((prev) => ({ ...prev, assignedReviewerId: e.target.value }))}
                              >
                                <option value="">Unassigned</option>
                                {assignmentCandidates.map((member) => (
                                  <option key={member.clerk_user_id} value={member.clerk_user_id}>
                                    {member.display_name || member.email || member.clerk_user_id}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs text-text-light mb-1">Deliverables (comma or line separated)</label>
                              <textarea
                                className="border border-border rounded-md px-3 py-2 text-sm w-full min-h-[110px]"
                                value={engagementWorkflowForm.deliverablesText}
                                onChange={(e) => setEngagementWorkflowForm((prev) => ({ ...prev, deliverablesText: e.target.value }))}
                                placeholder="Lead sheet pack, review memo, adjustment log"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn--primary text-sm py-2 px-4"
                            disabled={saving || !engagementId}
                            onClick={() => { void onUpdateEngagementWorkflow() }}
                          >
                            Save Workflow Details
                          </button>
                        </div>
                        <div className="rounded-lg border border-border p-4">
                          <h3 className="font-semibold text-primary-dark mb-2">Task summary</h3>
                          <p className="text-sm text-text-light mb-2">
                            {clientLabelPlural} in organization: {clients.length} | Tasks in engagement: {tasks.length}
                          </p>
                          <Link to={`/portal/accounting/working-papers/engagements/${engagementId}/review`} className="text-sm text-primary-dark underline">
                            Manage review notes and workflow
                          </Link>
                        </div>
                        <div className="rounded-lg border border-red-200 p-4 bg-red-50">
                          <h3 className="font-semibold text-red-700 mb-2">Danger zone</h3>
                          <p className="text-sm text-red-700 mb-3">Archive this engagement after completion.</p>
                          <button type="button" className="btn btn--primary text-sm py-2 px-4" disabled={saving} onClick={() => { void onArchiveEngagement() }}>
                            Archive Engagement
                          </button>
                        </div>
                      </div>
                    )}

                    {view === 'integrations' && integrationsData && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {(Array.isArray(integrationsData?.providers) ? integrationsData.providers : []).map((provider: any) => (
                            <div key={provider.id} className="rounded-lg border border-border p-4">
                              <h3 className="font-semibold text-primary-dark mb-1">{provider.name}</h3>
                              <p className="text-xs text-text-light mb-2">
                                {provider.configured ? 'Configured' : provider.setupMessage || 'Not configured'}
                              </p>
                              <button
                                type="button"
                                disabled={!provider.configured || !provider.enabled || saving}
                                className="btn btn--primary text-sm py-2 px-4 w-full disabled:opacity-50"
                                onClick={() => { void onConnectIntegration(provider.id) }}
                              >
                                {provider.id === 'excel_csv'
                                  ? 'Use File Import'
                                  : provider.configured && provider.enabled
                                    ? 'Connect'
                                    : 'Coming Soon'}
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-lg border border-border p-4">
                          <h3 className="font-semibold text-primary-dark mb-2">Connection records</h3>
                          {(Array.isArray(integrationsData?.connections) ? integrationsData.connections : []).length === 0 ? (
                            <p className="text-sm text-text-light">No integration connections recorded yet for your organization.</p>
                          ) : (
                            <ul className="space-y-1 text-sm text-text">
                              {(Array.isArray(integrationsData?.connections) ? integrationsData.connections : []).map((connection: any) => (
                                <li key={connection.id}>
                                  {connection.provider} - {connection.connection_status}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!isCompanyProfileView(view) && view !== 'workingPapersWorkspace' && view !== 'engagementList' && !isEngagementSubview(view) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {quickLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="bg-white rounded-lg border border-border shadow-sm px-4 py-3 text-sm font-medium text-primary-dark hover:bg-background transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
          </>
        </div>
      </ClientPortalShell>
    </>
  )
}

export default AccountingWorkspacePage
