import { FC, FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../../components/SEO'
import ClientPortalShell from '../../../components/ClientPortalShell'
import { portalFetch } from '../../../lib/portalApi'
import { useWorkspaceState } from '../../../platform/workspace/useWorkspaceState'

type AccountingView =
  | 'landing'
  | 'workspaceAdmin'
  | 'companyProfile'
  | 'workingPapersDashboard'
  | 'engagementList'
  | 'newEngagement'
  | 'engagementDashboard'
  | 'trialBalance'
  | 'leadSheets'
  | 'leadSheetDetail'
  | 'documents'
  | 'review'
  | 'settings'
  | 'integrations'
  | 'joinWorkspaceInvite'

interface AccountingWorkspacePageProps {
  view: AccountingView
}

const titleByView: Record<AccountingView, string> = {
  landing: 'Accounting Operations',
  workspaceAdmin: 'Workspace Administration',
  companyProfile: 'Business/Firm Profile Setup',
  workingPapersDashboard: 'Working Papers',
  engagementList: 'Engagements',
  newEngagement: 'New Engagement',
  engagementDashboard: 'Engagement Dashboard',
  trialBalance: 'Trial Balance',
  leadSheets: 'Lead Sheets',
  leadSheetDetail: 'Lead Sheet Detail',
  documents: 'Supporting Documents',
  review: 'Review',
  settings: 'Engagement Settings',
  integrations: 'Integrations',
  joinWorkspaceInvite: 'Join Workspace',
}

const descriptionByView: Record<AccountingView, string> = {
  landing: 'Manage workspace administration, engagements, working papers, and integrations from one place.',
  workspaceAdmin: 'Configure organization workspaces, employee onboarding, and role assignments.',
  companyProfile: 'Set business/firm profile details, invite employees, and confirm roster before assignments.',
  workingPapersDashboard: 'Track engagement progress, review items, and trial balance readiness.',
  engagementList: 'Search and manage accounting engagements.',
  newEngagement: 'Create a new accounting engagement.',
  engagementDashboard: 'View completion status, notes, tasks, and signoff readiness.',
  trialBalance: 'Import and map trial balance data.',
  leadSheets: 'Review lead sheet sections and completion state.',
  leadSheetDetail: 'Review accounts, support, notes, and signoffs for a lead sheet.',
  documents: 'Link and manage supporting engagement documents.',
  review: 'Track and clear review notes.',
  settings: 'Configure engagement settings and assignments.',
  integrations: 'Configure accounting system integrations and connection states.',
  joinWorkspaceInvite: 'Accept a workspace invitation and join your team workspace.',
}

const quickLinks = [
  { to: '/portal/accounting/company-profile', label: 'Business/Firm Profile' },
  { to: '/portal/accounting/workspaces', label: 'Workspace Admin' },
  { to: '/portal/accounting/working-papers/engagements', label: 'Engagements' },
  { to: '/portal/accounting/working-papers', label: 'Working Papers' },
  { to: '/portal/accounting/working-papers/engagements/new', label: 'Create Engagement' },
  { to: '/portal/accounting/integrations', label: 'Integrations' },
]

const workspaceAdminQuickLinks = [
  { to: '/portal/accounting/company-profile', label: 'Business/Firm Profile' },
  { to: '/portal/accounting/workspaces', label: 'Workspace Admin' }
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

const engagementTypeOptions = [
  'month_end_close',
  'year_end_working_papers',
  'compilation_support',
  'review_support',
  'tax_support',
  'custom'
]

const sourceTypeOptions = ['qbo', 'excel', 'csv', 'google_sheets', 'manual']
const statusOptions = ['draft', 'active', 'in_review', 'completed', 'archived']
const reviewFlowStatusOptions = [
  'not_started',
  'preparer_in_progress',
  'reviewer_in_progress',
  'review_notes_open',
  'approved'
]
const reviewFlowTransitions: Record<string, string[]> = {
  not_started: ['preparer_in_progress'],
  preparer_in_progress: ['reviewer_in_progress', 'review_notes_open'],
  reviewer_in_progress: ['review_notes_open', 'approved'],
  review_notes_open: ['preparer_in_progress', 'reviewer_in_progress', 'approved'],
  approved: ['review_notes_open']
}

type TrialBalancePreview = {
  columns: string[]
  detectedMapping: Record<string, string>
  previewRows: Array<{
    sourceRowNumber: number
    accountNumber: string | null
    accountName: string
    accountType: string
    currentPeriodBalance: number
    priorPeriodBalance: number | null
    varianceAmount: number
    variancePercent: number | null
    varianceLabel: string | null
    isMaterial: boolean
    isUnusual: boolean
  }>
  summary: { totalRows: number; previewRows: number; warningCount: number }
  warnings: Array<{ type: string; message: string }>
}

function fileToBase64 (file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const [, base64 = ''] = result.split(',')
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
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

const AccountingWorkspacePage: FC<AccountingWorkspacePageProps> = ({ view }) => {
  const { getToken } = useAuth()
  const { workspaceId, setWorkspaceId } = useWorkspaceState()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { engagementId, leadSheetId } = useParams()
  const [clients, setClients] = useState<Client[]>([])
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [statusSummary, setStatusSummary] = useState<Array<{ status: string; c: number }>>([])
  const [workflowSummary, setWorkflowSummary] = useState<{
    total_engagements: number
    approval_ready_count: number
    approval_blocked_count: number
    open_review_notes: number
    unreviewed_lead_sheets: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '')
  const [reviewFlowStatusFilter, setReviewFlowStatusFilter] = useState(() => searchParams.get('reviewFlowStatus') || '')
  const [approvalReadyFilter, setApprovalReadyFilter] = useState(() => searchParams.get('approvalReady') || '')
  const [clientFilter, setClientFilter] = useState(() => searchParams.get('clientId') || '')
  const [engagementTypeFilter, setEngagementTypeFilter] = useState(() => searchParams.get('engagementType') || '')
  const [newClientName, setNewClientName] = useState('')
  const [newEngagement, setNewEngagement] = useState({
    clientId: '',
    name: '',
    engagementType: 'year_end_working_papers',
    fiscalYear: new Date().getFullYear(),
    periodStart: `${new Date().getFullYear()}-01-01`,
    periodEnd: `${new Date().getFullYear()}-12-31`,
    dueDate: '',
    sourceType: 'csv',
    reviewFlowStatus: 'not_started',
    deliverablesText: '',
    assignedPreparerId: '',
    assignedReviewerId: ''
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
  const [documents, setDocuments] = useState<any[]>([])
  const [repositoryFiles, setRepositoryFiles] = useState<any[]>([])
  const [integrationsData, setIntegrationsData] = useState<any | null>(null)
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([])
  const [workspaceInvites, setWorkspaceInvites] = useState<any[]>([])
  const [organizationSnapshot, setOrganizationSnapshot] = useState<any | null>(null)
  const [workspaceProfile, setWorkspaceProfile] = useState<any | null>(null)
  const selectedWorkspaceId = workspaceId || ''
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [newWorkspaceType, setNewWorkspaceType] = useState<'business' | 'firm'>('business')
  const [editWorkspaceName, setEditWorkspaceName] = useState('')
  const [editWorkspaceType, setEditWorkspaceType] = useState<'business' | 'firm'>('business')
  const [showWorkspaceTools, setShowWorkspaceTools] = useState(false)
  const [assignmentUserId, setAssignmentUserId] = useState('')
  const [assignmentWorkspaceRole, setAssignmentWorkspaceRole] = useState('member')
  const [assignmentEngagementId, setAssignmentEngagementId] = useState('')
  const [assignmentLeadSheetId, setAssignmentLeadSheetId] = useState('')
  const [newInviteEmail, setNewInviteEmail] = useState('')
  const [newInviteRole, setNewInviteRole] = useState('preparer')
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
  const [trialBalancePreview, setTrialBalancePreview] = useState<TrialBalancePreview | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [transitioningEngagementId, setTransitioningEngagementId] = useState<string | null>(null)
  const [importPayload, setImportPayload] = useState<{ fileName: string; base64Content: string } | null>(null)

  const loadClients = useCallback(async () => {
    const { clients: rows } = await portalFetch<{ clients: Client[] }>('/v1/accounting/clients', getToken)
    setClients(rows)
  }, [getToken])

  const loadEngagements = useCallback(async () => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (reviewFlowStatusFilter) params.set('reviewFlowStatus', reviewFlowStatusFilter)
    if (approvalReadyFilter) params.set('approvalReady', approvalReadyFilter)
    if (clientFilter) params.set('clientId', clientFilter)
    if (engagementTypeFilter) params.set('engagementType', engagementTypeFilter)
    if (search.trim()) params.set('search', search.trim())
    const url = `/v1/accounting/engagements${params.toString() ? `?${params.toString()}` : ''}`
    const { engagements: rows } = await portalFetch<{ engagements: Engagement[] }>(url, getToken)
    setEngagements(rows)
  }, [approvalReadyFilter, clientFilter, engagementTypeFilter, getToken, reviewFlowStatusFilter, search, statusFilter])

  const loadStatusSummary = useCallback(async () => {
    const { summary } = await portalFetch<{ summary: Array<{ status: string; c: number }> }>('/v1/accounting/engagements/status-summary', getToken)
    setStatusSummary(summary)
  }, [getToken])

  const loadWorkflowSummary = useCallback(async () => {
    const { summary } = await portalFetch<{
      summary: {
        total_engagements: number
        approval_ready_count: number
        approval_blocked_count: number
        open_review_notes: number
        unreviewed_lead_sheets: number
      }
    }>('/v1/accounting/engagements/workflow-summary', getToken)
    setWorkflowSummary(summary)
  }, [getToken])

  const loadEngagementDashboard = useCallback(async () => {
    if (!engagementId) return
    const data = await portalFetch<any>(`/v1/accounting/engagements/${engagementId}/dashboard`, getToken)
    setDashboard(data)
  }, [engagementId, getToken])

  const loadTrialBalance = useCallback(async () => {
    if (!engagementId) return
    const { accounts } = await portalFetch<{ accounts: any[] }>(
      `/v1/accounting/engagements/${engagementId}/trial-balance/accounts`,
      getToken
    )
    setTrialBalanceAccounts(accounts)
  }, [engagementId, getToken])

  const loadLeadSheets = useCallback(async () => {
    if (!engagementId) return
    const { leadSheets: rows } = await portalFetch<{ leadSheets: any[] }>(
      `/v1/accounting/engagements/${engagementId}/lead-sheets`,
      getToken
    )
    setLeadSheets(rows)
  }, [engagementId, getToken])

  const loadLeadSheetDetail = useCallback(async () => {
    if (!engagementId || !leadSheetId) return
    const detail = await portalFetch<any>(
      `/v1/accounting/engagements/${engagementId}/lead-sheets/${leadSheetId}`,
      getToken
    )
    setLeadSheetDetail(detail)
  }, [engagementId, getToken, leadSheetId])

  const loadDocuments = useCallback(async () => {
    if (!engagementId) return
    const { documents: rows } = await portalFetch<{ documents: any[] }>(
      `/v1/accounting/engagements/${engagementId}/documents${leadSheetId ? `?leadSheetId=${leadSheetId}` : ''}`,
      getToken
    )
    setDocuments(rows)
  }, [engagementId, getToken, leadSheetId])

  const loadRepositoryFiles = useCallback(async () => {
    const { files } = await portalFetch<{ files: any[] }>('/v1/files', getToken)
    setRepositoryFiles(files)
  }, [getToken])

  const loadReviewNotes = useCallback(async () => {
    if (!engagementId) return
    const { notes } = await portalFetch<{ notes: any[] }>(`/v1/accounting/engagements/${engagementId}/review-notes`, getToken)
    setReviewNotes(notes)
  }, [engagementId, getToken])

  const loadTasks = useCallback(async () => {
    if (!engagementId) return
    const { tasks } = await portalFetch<{ tasks: any[] }>(`/v1/accounting/engagements/${engagementId}/tasks`, getToken)
    setTasks(tasks)
  }, [engagementId, getToken])

  const loadIntegrations = useCallback(async () => {
    const data = await portalFetch<any>('/v1/accounting/integrations', getToken)
    setIntegrationsData(data)
  }, [getToken])

  const loadWorkspaces = useCallback(async () => {
    const { workspaces: rows } = await portalFetch<{ workspaces: any[] }>('/v1/accounting/workspaces', getToken)
    setWorkspaces(rows)
    if (selectedWorkspaceId && rows.some((workspace) => workspace.id === selectedWorkspaceId)) return
    setWorkspaceId(rows[0]?.id || null)
  }, [getToken, selectedWorkspaceId, setWorkspaceId])

  const loadWorkspaceMembers = useCallback(async () => {
    if (!selectedWorkspaceId) return
    const data = await portalFetch<{ members: any[] }>(`/v1/accounting/workspaces/${selectedWorkspaceId}/members`, getToken)
    setWorkspaceMembers(data.members || [])
  }, [getToken, selectedWorkspaceId])

  const loadWorkspaceInvites = useCallback(async () => {
    if (!selectedWorkspaceId) return
    const data = await portalFetch<{ invites: any[] }>(`/v1/accounting/workspaces/${selectedWorkspaceId}/invites`, getToken)
    setWorkspaceInvites(data.invites || [])
  }, [getToken, selectedWorkspaceId])

  const loadOrganizationSnapshot = useCallback(async () => {
    if (!selectedWorkspaceId) return
    const data = await portalFetch<any>(`/v1/accounting/workspaces/${selectedWorkspaceId}/organization`, getToken)
    setOrganizationSnapshot(data)
  }, [getToken, selectedWorkspaceId])

  const loadWorkspaceProfile = useCallback(async () => {
    if (!selectedWorkspaceId) return
    const data = await portalFetch<any>(`/v1/accounting/workspaces/${selectedWorkspaceId}/profile`, getToken)
    setWorkspaceProfile(data.profile || null)
  }, [getToken, selectedWorkspaceId])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setError(null)
      setNotice(null)
      const blockWithLoadingState = view !== 'companyProfile'
      if (blockWithLoadingState) setLoading(true)
      try {
        if (view === 'joinWorkspaceInvite') {
          await loadWorkspaces()
          return
        }
        if (view === 'companyProfile') {
          // Keep Business/Firm Profile interactive and avoid blocking paint;
          // refresh workspace list in background and load selected scope only.
          void loadWorkspaces()
          if (selectedWorkspaceId) {
            await Promise.all([
              loadWorkspaceProfile(),
              loadOrganizationSnapshot()
            ])
          }
          return
        }
        // Always refresh workspace selection first so downstream API calls
        // use a valid workspace header (avoids stale workspaceId lockout).
        await loadWorkspaces()
        if (view === 'workspaceAdmin') {
          return
        }
        await loadClients()
        if (['workingPapersDashboard', 'engagementList', 'newEngagement', 'landing'].includes(view)) {
          await Promise.all([loadEngagements(), loadStatusSummary(), loadWorkflowSummary()])
        }
        if (view === 'engagementDashboard') {
          await Promise.all([loadEngagementDashboard(), loadWorkspaceMembers()])
        }
        if (view === 'trialBalance') await loadTrialBalance()
        if (view === 'leadSheets') await loadLeadSheets()
        if (view === 'leadSheetDetail') await loadLeadSheetDetail()
        if (view === 'documents') {
          await loadDocuments()
          await loadRepositoryFiles()
        }
        if (view === 'review') {
          await Promise.all([loadReviewNotes(), loadWorkspaceMembers()])
        }
        if (view === 'settings') await Promise.all([loadTasks(), loadWorkspaceMembers(), loadEngagementDashboard()])
        if (view === 'integrations') await loadIntegrations()
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
    loadEngagementDashboard,
    loadEngagements,
    loadIntegrations,
    loadLeadSheetDetail,
    loadLeadSheets,
    loadOrganizationSnapshot,
    loadRepositoryFiles,
    loadReviewNotes,
    loadStatusSummary,
    loadWorkflowSummary,
    loadTasks,
    loadTrialBalance,
    loadWorkspaceProfile,
    loadWorkspaceInvites,
    loadWorkspaceMembers,
    loadWorkspaces,
    selectedWorkspaceId,
    view
  ])

  const activeEngagements = useMemo(() => engagements.filter((e) => e.status !== 'archived'), [engagements])
  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) || null,
    [workspaces, selectedWorkspaceId]
  )
  const isFirmWorkspace = activeWorkspace?.workspace_type === 'firm'
  const canManageWorkspaceMembers = activeWorkspace?.role === 'owner' || activeWorkspace?.role === 'admin'
  const clientLabel = isFirmWorkspace ? 'Accounting client' : 'Business entity'
  const clientLabelPlural = isFirmWorkspace ? 'Accounting clients' : 'Business entities'
  const currentReviewFlowStatus = String(dashboard?.engagement?.review_flow_status || 'not_started')
  const nextReviewFlowStatuses: string[] = Array.isArray(dashboard?.nextReviewFlowStatuses)
    ? dashboard.nextReviewFlowStatuses
    : (reviewFlowTransitions[currentReviewFlowStatus] || [])
  const editableReviewFlowOptions = useMemo(
    () => Array.from(new Set([currentReviewFlowStatus, ...nextReviewFlowStatuses])),
    [currentReviewFlowStatus, nextReviewFlowStatuses]
  )
  const assignmentCandidates = useMemo(
    () => workspaceMembers.filter((member) => member.status === 'active'),
    [workspaceMembers]
  )
  const assignmentLabelByUserId = useMemo(() => {
    const map = new Map<string, string>()
    for (const member of workspaceMembers) {
      const key = String(member.clerk_user_id || '')
      if (!key) continue
      map.set(key, String(member.display_name || member.email || member.clerk_user_id))
    }
    return map
  }, [workspaceMembers])

  useEffect(() => {
    if (!activeWorkspace) return
    setEditWorkspaceName(String(activeWorkspace.name || ''))
    setEditWorkspaceType((activeWorkspace.workspace_type === 'firm' ? 'firm' : 'business'))
  }, [activeWorkspace])

  useEffect(() => {
    if (!showWorkspaceTools || !selectedWorkspaceId) return
    void loadWorkspaceMembers()
    void loadWorkspaceInvites()
    void loadOrganizationSnapshot()
  }, [loadOrganizationSnapshot, loadWorkspaceInvites, loadWorkspaceMembers, selectedWorkspaceId, showWorkspaceTools])

  useEffect(() => {
    if (view !== 'companyProfile' || !selectedWorkspaceId) return
    void loadWorkspaceProfile()
    void loadOrganizationSnapshot()
  }, [loadOrganizationSnapshot, loadWorkspaceProfile, selectedWorkspaceId, view])

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
    void Promise.all([loadEngagements(), loadStatusSummary(), loadWorkflowSummary()])
  }, [loadEngagements, loadStatusSummary, loadWorkflowSummary, searchParams, view])

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
      loadEngagementDashboard(),
      loadEngagements(),
      loadStatusSummary(),
      loadWorkflowSummary(),
      loadWorkspaceMembers()
    ]
    if (options.includeReviewNotes) tasks.push(loadReviewNotes())
    if (options.includeLeadSheetDetail) tasks.push(loadLeadSheetDetail())
    await Promise.all(tasks)
  }, [
    loadEngagementDashboard,
    loadEngagements,
    loadLeadSheetDetail,
    loadReviewNotes,
    loadStatusSummary,
    loadWorkflowSummary,
    loadWorkspaceMembers
  ])

  const onCreateClient = async () => {
    const name = newClientName.trim()
    if (!name) {
      setError(`${clientLabel} name is required.`)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await portalFetch('/v1/accounting/clients', getToken, {
        method: 'POST',
        body: JSON.stringify({ name })
      })
      setNewClientName('')
      await loadClients()
      setNotice('Client created')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create client')
    } finally {
      setSaving(false)
    }
  }

  const onApplyEngagementFilters = () => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    if (statusFilter) params.set('status', statusFilter)
    if (reviewFlowStatusFilter) params.set('reviewFlowStatus', reviewFlowStatusFilter)
    if (approvalReadyFilter) params.set('approvalReady', approvalReadyFilter)
    if (clientFilter) params.set('clientId', clientFilter)
    if (engagementTypeFilter) params.set('engagementType', engagementTypeFilter)
    setSearchParams(params, { replace: true })
    void loadEngagements()
  }

  const onSetEngagementFilterPreset = (preset: 'all' | 'queue' | 'ready') => {
    const params = new URLSearchParams()
    if (preset === 'queue') {
      params.set('approvalReady', 'false')
      setApprovalReadyFilter('false')
    } else if (preset === 'ready') {
      params.set('approvalReady', 'true')
      setApprovalReadyFilter('true')
    } else {
      setApprovalReadyFilter('')
    }
    setSearch('')
    setStatusFilter('')
    setReviewFlowStatusFilter('')
    setClientFilter('')
    setEngagementTypeFilter('')
    setSearchParams(params, { replace: true })
    void Promise.all([loadEngagements(), loadStatusSummary(), loadWorkflowSummary()])
  }

  const onClearEngagementFilters = () => {
    setSearch('')
    setStatusFilter('')
    setReviewFlowStatusFilter('')
    setApprovalReadyFilter('')
    setClientFilter('')
    setEngagementTypeFilter('')
    setSearchParams(new URLSearchParams(), { replace: true })
    void Promise.all([loadEngagements(), loadStatusSummary(), loadWorkflowSummary()])
  }

  const onCreateEngagement = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { engagement } = await portalFetch<{ engagement: Engagement }>('/v1/accounting/engagements', getToken, {
        method: 'POST',
        body: JSON.stringify({
          ...newEngagement,
          dueDate: newEngagement.dueDate || null,
          deliverables: parseDeliverablesText(newEngagement.deliverablesText),
          status: 'draft'
        })
      })
      setNotice('Engagement created')
      navigate(`/portal/accounting/working-papers/engagements/${engagement.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create engagement')
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

  const onAdvanceReviewFlowForEngagement = async (targetEngagementId: string, nextStatus: string) => {
    if (transitioningEngagementId === targetEngagementId) return
    const previousEngagements = engagements
    setTransitioningEngagementId(targetEngagementId)
    setError(null)
    setEngagements((rows) => rows.map((engagement) => (
      engagement.id === targetEngagementId
        ? {
            ...engagement,
            review_flow_status: nextStatus,
            next_review_flow_statuses: reviewFlowTransitions[nextStatus] || []
          }
        : engagement
    )))
    try {
      await portalFetch(`/v1/accounting/engagements/${targetEngagementId}`, getToken, {
        method: 'PATCH',
        body: JSON.stringify({ reviewFlowStatus: nextStatus })
      })
      if (view === 'engagementList' || view === 'workingPapersDashboard' || view === 'landing') {
        await Promise.all([loadEngagements(), loadStatusSummary(), loadWorkflowSummary()])
      } else {
        await refreshEngagementWorkflowViews({
          includeReviewNotes: view === 'review',
          includeLeadSheetDetail: view === 'leadSheetDetail'
        })
      }
      setNotice(`Engagement moved to ${formatWorkflowLabel(nextStatus)}`)
    } catch (e) {
      setEngagements(previousEngagements)
      setError(e instanceof Error ? e.message : 'Could not update engagement workflow')
    } finally {
      setTransitioningEngagementId(null)
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
      await portalFetch(`/v1/accounting/engagements/${engagementId}/lead-sheets/generate`, getToken, { method: 'POST' })
      setNotice('Lead sheets generated')
      await loadLeadSheets()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate lead sheets')
    } finally {
      setSaving(false)
    }
  }

  const onPreviewImport = async () => {
    if (!engagementId) {
      setError('Select an engagement before previewing trial balance import.')
      return
    }
    if (!importFile) {
      setError('Choose a file first to preview trial balance import.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const base64Content = await fileToBase64(importFile)
      setImportPayload({ fileName: importFile.name, base64Content })
      const preview = await portalFetch<TrialBalancePreview>(
        `/v1/accounting/engagements/${engagementId}/trial-balance/preview`,
        getToken,
        {
          method: 'POST',
          body: JSON.stringify({
            fileName: importFile.name,
            base64Content
          })
        }
      )
      setTrialBalancePreview(preview)
      setNotice('Preview generated. Review warnings before import.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not preview import')
    } finally {
      setSaving(false)
    }
  }

  const onImportTrialBalance = async () => {
    if (!engagementId) {
      setError('Select an engagement before importing trial balance.')
      return
    }
    if (!importPayload) {
      setError('Generate an import preview first, then import the trial balance.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await portalFetch(`/v1/accounting/engagements/${engagementId}/trial-balance/import`, getToken, {
        method: 'POST',
        body: JSON.stringify({
          fileName: importPayload.fileName,
          base64Content: importPayload.base64Content
        })
      })
      setNotice('Trial balance imported')
      setTrialBalancePreview(null)
      setImportPayload(null)
      setImportFile(null)
      await loadTrialBalance()
      await loadEngagementDashboard()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not import trial balance')
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

  const onCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      setError('Workspace name is required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await portalFetch('/v1/accounting/workspaces', getToken, {
        method: 'POST',
        body: JSON.stringify({ name: newWorkspaceName.trim(), workspaceType: newWorkspaceType })
      })
      setNewWorkspaceName('')
      setNewWorkspaceType('business')
      await loadWorkspaces()
      setNotice('Workspace created')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create workspace')
    } finally {
      setSaving(false)
    }
  }

  const onUpdateWorkspace = async () => {
    if (!selectedWorkspaceId) {
      setError('Select a workspace before editing.')
      return
    }
    if (!editWorkspaceName.trim()) {
      setError('Workspace name is required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await portalFetch(`/v1/accounting/workspaces/${selectedWorkspaceId}`, getToken, {
        method: 'PATCH',
        body: JSON.stringify({ name: editWorkspaceName.trim(), workspaceType: editWorkspaceType })
      })
      await Promise.all([loadWorkspaces(), loadOrganizationSnapshot()])
      setNotice('Workspace updated.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update workspace')
    } finally {
      setSaving(false)
    }
  }

  const onDeleteWorkspace = async () => {
    if (!selectedWorkspaceId) {
      setError('Select a workspace before deleting.')
      return
    }
    if (!window.confirm('Delete this workspace and all related records? This cannot be undone.')) return
    setSaving(true)
    setError(null)
    try {
      await portalFetch(`/v1/accounting/workspaces/${selectedWorkspaceId}`, getToken, { method: 'DELETE' })
      setWorkspaceId(null)
      await loadWorkspaces()
      await loadOrganizationSnapshot()
      setNotice('Workspace deleted.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete workspace')
    } finally {
      setSaving(false)
    }
  }

  const onAssignWorkspaceEmployee = async () => {
    if (!selectedWorkspaceId) {
      setError('Select a workspace before assigning an employee.')
      return
    }
    if (!assignmentUserId.trim()) {
      setError('Employee Clerk user ID is required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await portalFetch(
        `/v1/accounting/workspaces/${selectedWorkspaceId}/assignments/workspace`,
        getToken,
        {
          method: 'PUT',
          body: JSON.stringify({
            clerkUserId: assignmentUserId.trim(),
            assignmentRole: assignmentWorkspaceRole
          })
        }
      )
      await Promise.all([loadWorkspaceMembers(), loadOrganizationSnapshot()])
      setNotice('Workspace assignment saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update workspace assignment')
    } finally {
      setSaving(false)
    }
  }

  const onAssignEngagementEmployee = async () => {
    if (!assignmentEngagementId.trim() || !assignmentUserId.trim()) {
      setError('Both engagement ID and Clerk user ID are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await portalFetch(
        `/v1/accounting/engagements/${assignmentEngagementId.trim()}/assignments`,
        getToken,
        {
          method: 'PUT',
          body: JSON.stringify({
            workspaceId: selectedWorkspaceId,
            clerkUserId: assignmentUserId.trim()
          })
        }
      )
      await loadOrganizationSnapshot()
      setNotice('Engagement assignment saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update engagement assignment')
    } finally {
      setSaving(false)
    }
  }

  const onAssignWorkingPaperEmployee = async () => {
    if (!assignmentLeadSheetId.trim() || !assignmentUserId.trim()) {
      setError('Both working paper (lead sheet) ID and Clerk user ID are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await portalFetch(
        `/v1/accounting/lead-sheets/${assignmentLeadSheetId.trim()}/assignments`,
        getToken,
        {
          method: 'PUT',
          body: JSON.stringify({
            workspaceId: selectedWorkspaceId,
            clerkUserId: assignmentUserId.trim()
          })
        }
      )
      await loadOrganizationSnapshot()
      setNotice('Working paper assignment saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update working paper assignment')
    } finally {
      setSaving(false)
    }
  }

  const onCreateWorkspaceInvite = async () => {
    if (!selectedWorkspaceId) {
      setError('Select a workspace before sending an invite.')
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
      await portalFetch<{ invite: any }>(
        `/v1/accounting/workspaces/${selectedWorkspaceId}/organization/invites`,
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
      setNotice('Organization invite sent. After invite acceptance/confirmation, assign this employee to workspaces, engagements, and working papers.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create organization invite')
    } finally {
      setSaving(false)
    }
  }

  const onSaveCompanyProfile = async () => {
    if (!selectedWorkspaceId) {
      setError('Select a workspace before saving Business/Firm profile.')
      return
    }
    if (!companyProfileForm.companyLegalName.trim()) {
      setError('Company legal name is required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await portalFetch(`/v1/accounting/workspaces/${selectedWorkspaceId}/profile`, getToken, {
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
    if (!selectedWorkspaceId) return
    setSaving(true)
    setError(null)
    try {
      await portalFetch(`/v1/accounting/workspaces/${selectedWorkspaceId}/organization/members/${encodeURIComponent(memberUserId)}`, getToken, {
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
    if (!selectedWorkspaceId) return
    if (!window.confirm('Remove this employee from organization assignments?')) return
    setSaving(true)
    setError(null)
    try {
      await portalFetch(`/v1/accounting/workspaces/${selectedWorkspaceId}/organization/members/${encodeURIComponent(memberUserId)}`, getToken, {
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

  const onDeleteEngagement = async (id: string) => {
    if (!window.confirm('Delete this engagement and all related working papers?')) return
    setSaving(true)
    setError(null)
    try {
      await portalFetch(`/v1/accounting/engagements/${id}`, getToken, { method: 'DELETE' })
      await Promise.all([loadEngagements(), loadStatusSummary()])
      setNotice('Engagement deleted.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete engagement')
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
      setWorkspaceId(accepted.workspace.id)
      setNotice(`Invite accepted. You joined ${accepted.workspace.name}.`)
      navigate('/portal/accounting', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not accept invite')
    } finally {
      setSaving(false)
    }
  }, [getToken, location.search, navigate, setWorkspaceId, view])

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
        title={`${titleByView[view]} | Client Portal`}
        description={descriptionByView[view]}
        canonical={
          view === 'landing'
            ? '/portal/accounting'
            : view === 'workspaceAdmin'
              ? '/portal/accounting/workspaces'
              : view === 'companyProfile'
                ? '/portal/accounting/company-profile'
              : view === 'joinWorkspaceInvite'
                ? '/portal/accounting/join'
            : view === 'integrations'
              ? '/portal/accounting/integrations'
              : '/portal/accounting/working-papers'
        }
      />
      <ClientPortalShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-primary-dark">{titleByView[view]}</h1>
            <p className="text-sm text-text-light mt-2">{descriptionByView[view]}</p>
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
              {workspaces.length > 0 && (view === 'landing' || view === 'workspaceAdmin') && (
                <div className="bg-white p-4 rounded-lg border border-border shadow-sm">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="text-xs text-text-light">Active workspace</label>
                      <select
                        className="border border-border rounded-md px-3 py-2 text-sm min-w-64"
                        value={selectedWorkspaceId}
                        onChange={(e) => setWorkspaceId(e.target.value || null)}
                      >
                        {workspaces.map((workspace) => (
                          <option key={workspace.id} value={workspace.id}>
                            {workspace.name} ({workspace.workspace_type || 'business'} / {workspace.role})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn--primary text-sm py-2 px-3"
                        onClick={() => setShowWorkspaceTools((prev) => !prev)}
                      >
                        {showWorkspaceTools ? 'Hide Workspace Admin Tools' : 'Open Workspace Admin Tools'}
                      </button>
                      <span className="text-xs text-text-light">
                        {isFirmWorkspace
                          ? 'Firm workspace: manage many accounting clients and engagements in one place.'
                          : 'Business workspace: manage accounting work for one company with your internal team.'}
                      </span>
                    </div>
                    {showWorkspaceTools && (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="rounded-lg border border-border p-3 space-y-3">
                          <h4 className="text-sm font-semibold text-primary-dark">Create Workspace</h4>
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              className="border border-border rounded-md px-3 py-2 text-sm min-w-64"
                              placeholder="New workspace name"
                              value={newWorkspaceName}
                              onChange={(e) => setNewWorkspaceName(e.target.value)}
                            />
                            <select
                              className="border border-border rounded-md px-3 py-2 text-sm"
                              value={newWorkspaceType}
                              onChange={(e) => setNewWorkspaceType((e.target.value as 'business' | 'firm'))}
                            >
                              <option value="business">Business workspace</option>
                              <option value="firm">Firm workspace</option>
                            </select>
                            <button
                              type="button"
                              className="btn btn--primary text-sm py-2 px-4"
                              disabled={saving}
                              onClick={() => { void onCreateWorkspace() }}
                            >
                              Create Workspace
                            </button>
                          </div>
                          <div className="rounded-md border border-border p-2 space-y-2">
                            <p className="text-xs text-text-light">Edit or delete selected workspace</p>
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                className="border border-border rounded-md px-3 py-2 text-sm min-w-64"
                                placeholder="Workspace name"
                                value={editWorkspaceName}
                                onChange={(e) => setEditWorkspaceName(e.target.value)}
                              />
                              <select
                                className="border border-border rounded-md px-3 py-2 text-sm"
                                value={editWorkspaceType}
                                onChange={(e) => setEditWorkspaceType((e.target.value as 'business' | 'firm'))}
                              >
                                <option value="business">Business workspace</option>
                                <option value="firm">Firm workspace</option>
                              </select>
                              <button
                                type="button"
                                className="btn btn--secondary text-sm py-2 px-4"
                                disabled={saving || !canManageWorkspaceMembers}
                                onClick={() => { void onUpdateWorkspace() }}
                              >
                                Save Workspace
                              </button>
                              <button
                                type="button"
                                className="btn btn--secondary text-sm py-2 px-4"
                                disabled={saving || !canManageWorkspaceMembers}
                                onClick={() => { void onDeleteWorkspace() }}
                              >
                                Delete Workspace
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-lg border border-border p-3 space-y-3">
                          <h4 className="text-sm font-semibold text-primary-dark">Employee assignments</h4>
                          <ol className="text-xs text-text-light space-y-1 list-decimal pl-4">
                            <li>Invite employees from Business/Firm Profile.</li>
                            <li>Wait for invite acceptance/confirmation.</li>
                            <li>Assign confirmed employees to workspace, engagements, and working papers.</li>
                          </ol>
                          {!canManageWorkspaceMembers && (
                            <p className="text-xs text-text-light">
                              Only workspace owners/admins can add employees.
                            </p>
                          )}
                          <div className="max-h-40 overflow-auto rounded-md border border-border">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border text-left text-text-light">
                                  <th className="py-2 px-2">User</th>
                                  <th className="py-2 px-2">Role</th>
                                  <th className="py-2 px-2">Status</th>
                                  <th className="py-2 px-2">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {workspaceMembers.length === 0 ? (
                                  <tr>
                                    <td className="py-2 px-2 text-text-light" colSpan={4}>No team members in this workspace yet.</td>
                                  </tr>
                                ) : workspaceMembers.map((member) => (
                                  <tr key={member.clerk_user_id} className="border-b border-border/70">
                                    <td className="py-2 px-2 font-mono">{member.clerk_user_id}</td>
                                    <td className="py-2 px-2">{member.role}</td>
                                    <td className="py-2 px-2">{member.status}</td>
                                    <td className="py-2 px-2">
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          className="text-xs text-primary-dark underline"
                                          disabled={saving || !canManageWorkspaceMembers}
                                          onClick={() => { void onUpdateOrganizationMember(member.clerk_user_id, member.role, member.status === 'active' ? 'inactive' : 'active') }}
                                        >
                                          {member.status === 'active' ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                          type="button"
                                          className="text-xs text-primary-dark underline"
                                          disabled={saving || !canManageWorkspaceMembers}
                                          onClick={() => { void onDeleteOrganizationMember(member.clerk_user_id) }}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="rounded-md border border-border p-3 space-y-3">
                            <h4 className="text-sm font-semibold text-primary-dark">Explicit assignment controls</h4>
                            <p className="text-xs text-text-light">
                              Assign employees at workspace, engagement, and working-paper (lead sheet) levels.
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                className="border border-border rounded-md px-3 py-2 text-sm min-w-64"
                                placeholder="Employee Clerk User ID (user_...)"
                                value={assignmentUserId}
                                onChange={(e) => setAssignmentUserId(e.target.value)}
                              />
                              <select
                                className="border border-border rounded-md px-3 py-2 text-sm"
                                value={assignmentWorkspaceRole}
                                onChange={(e) => setAssignmentWorkspaceRole(e.target.value)}
                              >
                                <option value="member">member</option>
                                <option value="admin">admin</option>
                              </select>
                              <button
                                type="button"
                                className="btn btn--primary text-sm py-2 px-4"
                                disabled={saving || !canManageWorkspaceMembers}
                                onClick={() => { void onAssignWorkspaceEmployee() }}
                              >
                                Assign Workspace
                              </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                className="border border-border rounded-md px-3 py-2 text-sm min-w-64"
                                placeholder="Engagement ID"
                                value={assignmentEngagementId}
                                onChange={(e) => setAssignmentEngagementId(e.target.value)}
                              />
                              <button
                                type="button"
                                className="btn btn--secondary text-sm py-2 px-4"
                                disabled={saving || !canManageWorkspaceMembers}
                                onClick={() => { void onAssignEngagementEmployee() }}
                              >
                                Assign Engagement
                              </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                className="border border-border rounded-md px-3 py-2 text-sm min-w-64"
                                placeholder="Working Paper Lead Sheet ID"
                                value={assignmentLeadSheetId}
                                onChange={(e) => setAssignmentLeadSheetId(e.target.value)}
                              />
                              <button
                                type="button"
                                className="btn btn--secondary text-sm py-2 px-4"
                                disabled={saving || !canManageWorkspaceMembers}
                                onClick={() => { void onAssignWorkingPaperEmployee() }}
                              >
                                Assign Working Paper
                              </button>
                            </div>
                            {organizationSnapshot && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-text-light">
                                <p>Workspace assignments: {organizationSnapshot.workspaceCounts?.reduce((sum: number, row: any) => sum + Number(row.c || 0), 0) || 0}</p>
                                <p>Engagement assignments: {organizationSnapshot.engagementCounts?.reduce((sum: number, row: any) => sum + Number(row.c || 0), 0) || 0}</p>
                                <p>Working paper assignments: {organizationSnapshot.paperCounts?.reduce((sum: number, row: any) => sum + Number(row.c || 0), 0) || 0}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
              {loading ? (
                  <p className="text-sm text-text-light">Loading&hellip;</p>
                ) : (
                  <div className="space-y-4">
                    {view === 'joinWorkspaceInvite' && (
                      <div className="rounded-lg border border-border p-4">
                        <h3 className="font-semibold text-primary-dark mb-2">Workspace invitation</h3>
                        <p className="text-sm text-text-light">
                          {saving
                            ? 'Accepting invitation...'
                            : 'If this invite is valid, you will be redirected to Workspace Admin.'}
                        </p>
                      </div>
                    )}
                    {view === 'landing' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-lg border border-border p-4">
                          <h3 className="font-semibold text-primary-dark mb-1">Business/Firm Profile</h3>
                          <p className="text-sm text-text-light mb-3">Set up company details and invite employees before assignment workflows.</p>
                          <Link className="btn btn--primary text-sm py-2 px-4 inline-block" to="/portal/accounting/company-profile">
                            Open Business/Firm Profile
                          </Link>
                        </div>
                        <div className="rounded-lg border border-border p-4">
                          <h3 className="font-semibold text-primary-dark mb-1">Workspace Admin</h3>
                          <p className="text-sm text-text-light mb-3">Set workspace type, onboard employees, and manage access roles.</p>
                          <Link className="btn btn--primary text-sm py-2 px-4 inline-block" to="/portal/accounting/workspaces">
                            Open Workspace Admin
                          </Link>
                        </div>
                        <div className="rounded-lg border border-border p-4">
                          <h3 className="font-semibold text-primary-dark mb-1">Engagements</h3>
                          <p className="text-sm text-text-light mb-3">Plan and monitor client work before opening detailed working papers.</p>
                          <Link className="btn btn--primary text-sm py-2 px-4 inline-block" to="/portal/accounting/working-papers/engagements">
                            Open Engagements
                          </Link>
                        </div>
                        <div className="rounded-lg border border-border p-4">
                          <h3 className="font-semibold text-primary-dark mb-1">Working Papers</h3>
                          <p className="text-sm text-text-light mb-3">Engagements, trial balances, lead sheets, review notes, signoffs.</p>
                          <Link className="btn btn--primary text-sm py-2 px-4 inline-block" to="/portal/accounting/working-papers">
                            Open Working Papers
                          </Link>
                        </div>
                        <div className="rounded-lg border border-border p-4">
                          <h3 className="font-semibold text-primary-dark mb-1">Integrations</h3>
                          <p className="text-sm text-text-light mb-3">QuickBooks and Google Sheets setup readiness with feature flags.</p>
                          <Link className="btn btn--primary text-sm py-2 px-4 inline-block" to="/portal/accounting/integrations">
                            Open Integrations
                          </Link>
                        </div>
                      </div>
                    )}

                    {view === 'workspaceAdmin' && (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-border p-4">
                          <h3 className="font-semibold text-primary-dark mb-2">Hierarchy</h3>
                          <p className="text-sm text-text-light">
                            Organization (business or firm) → workspace(s) → employee assignments and role access.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="rounded-lg border border-border p-4">
                            <p className="text-xs text-text-light">Workspaces</p>
                            <p className="text-2xl font-bold text-primary-dark">{workspaces.length}</p>
                          </div>
                          <div className="rounded-lg border border-border p-4">
                            <p className="text-xs text-text-light">Members in active workspace</p>
                            <p className="text-2xl font-bold text-primary-dark">{workspaceMembers.length}</p>
                          </div>
                          <div className="rounded-lg border border-border p-4">
                            <p className="text-xs text-text-light">Invites in active workspace</p>
                            <p className="text-2xl font-bold text-primary-dark">{workspaceInvites.length}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {view === 'companyProfile' && (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-border p-4">
                          <h3 className="font-semibold text-primary-dark mb-2">Business/Firm profile</h3>
                          <p className="text-sm text-text-light">
                            Configure core business/firm information, then invite employees before assignment to workspace/engagement/working paper scopes.
                          </p>
                        </div>
                        <div className="rounded-lg border border-border p-4 space-y-3">
                          <h4 className="font-semibold text-primary-dark">Business/Firm details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <select
                              className="border border-border rounded-md px-3 py-2 text-sm"
                              value={companyProfileForm.businessType}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, businessType: e.target.value }))}
                            >
                              {BUSINESS_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                            <input
                              className="border border-border rounded-md px-3 py-2 text-sm"
                              placeholder="Business/Firm legal name"
                              value={companyProfileForm.companyLegalName}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, companyLegalName: e.target.value }))}
                            />
                            <input
                              className="border border-border rounded-md px-3 py-2 text-sm"
                              placeholder="Operating name"
                              value={companyProfileForm.companyOperatingName}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, companyOperatingName: e.target.value }))}
                            />
                            <input
                              className="border border-border rounded-md px-3 py-2 text-sm"
                              placeholder="Business number"
                              value={companyProfileForm.taxIdentifier}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, taxIdentifier: e.target.value }))}
                            />
                            <input
                              className="border border-border rounded-md px-3 py-2 text-sm"
                              placeholder="Website URL"
                              value={companyProfileForm.websiteUrl}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                            />
                            <input
                              className="border border-border rounded-md px-3 py-2 text-sm"
                              placeholder="Industry"
                              value={companyProfileForm.industry}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, industry: e.target.value }))}
                            />
                            <input
                              className="border border-border rounded-md px-3 py-2 text-sm"
                              placeholder="Primary contact name"
                              value={companyProfileForm.primaryContactName}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, primaryContactName: e.target.value }))}
                            />
                            <input
                              className="border border-border rounded-md px-3 py-2 text-sm"
                              placeholder="Primary contact email"
                              value={companyProfileForm.primaryContactEmail}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, primaryContactEmail: e.target.value }))}
                            />
                            <input
                              className="border border-border rounded-md px-3 py-2 text-sm"
                              placeholder="Primary contact phone"
                              value={companyProfileForm.primaryContactPhone}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, primaryContactPhone: e.target.value }))}
                            />
                            <input
                              className="border border-border rounded-md px-3 py-2 text-sm md:col-span-2"
                              placeholder="Address line 1"
                              value={companyProfileForm.addressLine1}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, addressLine1: e.target.value }))}
                            />
                            <input
                              className="border border-border rounded-md px-3 py-2 text-sm md:col-span-2"
                              placeholder="Address line 2"
                              value={companyProfileForm.addressLine2}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, addressLine2: e.target.value }))}
                            />
                            <input
                              className="border border-border rounded-md px-3 py-2 text-sm"
                              placeholder="City"
                              value={companyProfileForm.city}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, city: e.target.value }))}
                            />
                            <input
                              className="border border-border rounded-md px-3 py-2 text-sm"
                              placeholder="Province/State"
                              value={companyProfileForm.provinceState}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, provinceState: e.target.value }))}
                            />
                            <input
                              className="border border-border rounded-md px-3 py-2 text-sm"
                              placeholder="Postal code"
                              value={companyProfileForm.postalCode}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, postalCode: e.target.value }))}
                            />
                            <input
                              className="border border-border rounded-md px-3 py-2 text-sm"
                              placeholder="Country code"
                              value={companyProfileForm.countryCode}
                              onChange={(e) => setCompanyProfileForm((prev) => ({ ...prev, countryCode: e.target.value.toUpperCase() }))}
                            />
                          </div>
                          <button
                            type="button"
                            className="btn btn--primary text-sm py-2 px-4"
                            disabled={saving}
                            onClick={() => { void onSaveCompanyProfile() }}
                          >
                            Save Business/Firm Profile
                          </button>
                        </div>
                        <div className="rounded-lg border border-border p-4 space-y-3">
                          <h4 className="font-semibold text-primary-dark">Employee invite</h4>
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
                              {['admin', 'manager', 'reviewer', 'preparer', 'read_only', 'client'].map((role) => (
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
                                    <td className="py-2">{member.role}</td>
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
                                          Delete
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

                    {view === 'workingPapersDashboard' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="rounded-lg border border-border p-4">
                            <p className="text-xs text-text-light">Active engagements</p>
                            <p className="text-2xl font-bold text-primary-dark">{activeEngagements.length}</p>
                          </div>
                          <div className="rounded-lg border border-border p-4">
                            <p className="text-xs text-text-light">Recent engagements</p>
                            <p className="text-2xl font-bold text-primary-dark">{engagements.slice(0, 5).length}</p>
                          </div>
                          <div className="rounded-lg border border-border p-4">
                            <p className="text-xs text-text-light">Status categories</p>
                            <p className="text-2xl font-bold text-primary-dark">{statusSummary.length}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link to="/portal/accounting/working-papers/engagements/new" className="btn btn--primary text-sm py-2 px-4">Create Engagement</Link>
                          <Link to="/portal/accounting/working-papers/engagements" className="btn btn--primary text-sm py-2 px-4">Open Engagements</Link>
                        </div>
                      </div>
                    )}

                    {view === 'engagementList' && (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <div className="rounded-lg border border-border px-3 py-2 text-xs text-text-light">
                            Total: <span className="font-medium text-primary-dark">{Number(workflowSummary?.total_engagements || 0)}</span>
                          </div>
                          <div className="rounded-lg border border-border px-3 py-2 text-xs text-text-light">
                            Ready: <span className="font-medium text-primary-dark">{Number(workflowSummary?.approval_ready_count || 0)}</span>
                          </div>
                          <div className="rounded-lg border border-border px-3 py-2 text-xs text-text-light">
                            Blocked: <span className="font-medium text-primary-dark">{Number(workflowSummary?.approval_blocked_count || 0)}</span>
                          </div>
                          <div className="rounded-lg border border-border px-3 py-2 text-xs text-text-light">
                            Open notes: <span className="font-medium text-primary-dark">{Number(workflowSummary?.open_review_notes || 0)}</span>
                          </div>
                          <div className="rounded-lg border border-border px-3 py-2 text-xs text-text-light">
                            Unreviewed sheets: <span className="font-medium text-primary-dark">{Number(workflowSummary?.unreviewed_lead_sheets || 0)}</span>
                          </div>
                          <button type="button" className="btn btn--secondary text-xs py-1.5 px-3" onClick={() => onSetEngagementFilterPreset('all')}>
                            All
                          </button>
                          <button type="button" className="btn btn--secondary text-xs py-1.5 px-3" onClick={() => onSetEngagementFilterPreset('queue')}>
                            Queue
                          </button>
                          <button type="button" className="btn btn--secondary text-xs py-1.5 px-3" onClick={() => onSetEngagementFilterPreset('ready')}>
                            Ready
                          </button>
                          <input
                            className="border border-border rounded-md px-3 py-2 text-sm"
                            placeholder={`Search engagement or ${clientLabel.toLowerCase()}`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                          <select className="border border-border rounded-md px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">All statuses</option>
                            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                          <select className="border border-border rounded-md px-3 py-2 text-sm" value={reviewFlowStatusFilter} onChange={(e) => setReviewFlowStatusFilter(e.target.value)}>
                            <option value="">All review-flow states</option>
                            {reviewFlowStatusOptions.map((status) => (
                              <option key={status} value={status}>{formatWorkflowLabel(status)}</option>
                            ))}
                          </select>
                          <select className="border border-border rounded-md px-3 py-2 text-sm" value={approvalReadyFilter} onChange={(e) => setApprovalReadyFilter(e.target.value)}>
                            <option value="">All approval states</option>
                            <option value="true">Approval ready</option>
                            <option value="false">Approval blocked</option>
                          </select>
                          <select className="border border-border rounded-md px-3 py-2 text-sm" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
                            <option value="">{`All ${clientLabelPlural.toLowerCase()}`}</option>
                            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                          </select>
                          <select className="border border-border rounded-md px-3 py-2 text-sm" value={engagementTypeFilter} onChange={(e) => setEngagementTypeFilter(e.target.value)}>
                            <option value="">All types</option>
                            {engagementTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                          </select>
                          <button type="button" className="btn btn--primary text-sm py-2 px-4" onClick={onApplyEngagementFilters}>
                            Apply Filters
                          </button>
                          <button type="button" className="btn btn--secondary text-sm py-2 px-4" onClick={onClearEngagementFilters}>
                            Clear Filters
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border text-left text-text-light">
                                <th className="py-2">Engagement</th>
                                <th className="py-2">{clientLabel}</th>
                                <th className="py-2">Type</th>
                                <th className="py-2">Status</th>
                                <th className="py-2">Review Flow</th>
                                <th className="py-2">Workflow Blockers</th>
                                <th className="py-2">Period End</th>
                                <th className="py-2">Due Date</th>
                                <th className="py-2">Deliverables</th>
                                <th className="py-2">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {engagements.length === 0 ? (
                                <tr>
                                  <td className="py-3 text-text-light" colSpan={10}>No engagements match the current filters.</td>
                                </tr>
                              ) : engagements.map((engagement) => (
                                  <tr key={engagement.id} className="border-b border-border/70">
                                    <td className="py-2">
                                      <Link className="text-primary-dark hover:underline" to={`/portal/accounting/working-papers/engagements/${engagement.id}`}>
                                        {engagement.name}
                                      </Link>
                                    </td>
                                    <td className="py-2">{engagement.client_name}</td>
                                    <td className="py-2">{engagement.engagement_type}</td>
                                    <td className="py-2">{engagement.status}</td>
                                    <td className="py-2">
                                      {(() => {
                                        const nextStates = Array.isArray(engagement.next_review_flow_statuses)
                                          ? engagement.next_review_flow_statuses
                                          : (reviewFlowTransitions[String(engagement.review_flow_status || 'not_started')] || [])
                                        return (
                                      <div className="space-y-1">
                                        <p>{formatWorkflowLabel(engagement.review_flow_status || 'not_started')}</p>
                                        <p className="text-[11px] text-text-light">
                                          Next: {nextStates
                                            .map((status) => formatWorkflowLabel(status))
                                            .join(', ') || 'none'}
                                        </p>
                                      </div>
                                        )
                                      })()}
                                    </td>
                                    <td className="py-2 text-xs text-text-light">
                                      {Number(engagement.open_review_note_count || 0) > 0 || Number(engagement.unreviewed_lead_sheet_count || 0) > 0
                                        ? `Open notes: ${Number(engagement.open_review_note_count || 0)} | Unreviewed sheets: ${Number(engagement.unreviewed_lead_sheet_count || 0)}`
                                        : 'None'}
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-text-light">
                                          {engagement.approval_ready ? 'Ready' : 'Blocked'}
                                        </span>
                                        {engagement.blocked_by_open_notes && (
                                          <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-text-light">Notes</span>
                                        )}
                                        {engagement.blocked_by_unreviewed_lead_sheets && (
                                          <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-text-light">Lead sheets</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-2">{new Date(engagement.period_end).toLocaleDateString()}</td>
                                    <td className="py-2">{engagement.due_date ? new Date(engagement.due_date).toLocaleDateString() : '—'}</td>
                                    <td className="py-2">{Array.isArray(engagement.deliverables) ? engagement.deliverables.length : 0}</td>
                                    <td className="py-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        {(Array.isArray(engagement.next_review_flow_statuses)
                                          ? engagement.next_review_flow_statuses
                                          : (reviewFlowTransitions[String(engagement.review_flow_status || 'not_started')] || [])
                                        ).slice(0, 2).map((status) => (
                                          <button
                                            key={`${engagement.id}-${status}`}
                                            type="button"
                                            className="text-xs text-primary-dark underline"
                                            disabled={transitioningEngagementId === engagement.id || status === engagement.review_flow_status}
                                            onClick={() => { void onAdvanceReviewFlowForEngagement(engagement.id, status) }}
                                          >
                                            Move to {formatWorkflowLabel(status)}
                                          </button>
                                        ))}
                                        <button
                                          type="button"
                                          className="text-xs text-primary-dark underline"
                                          onClick={() => { void onDeleteEngagement(engagement.id) }}
                                        >
                                          Delete
                                        </button>
                                        {transitioningEngagementId === engagement.id && (
                                          <span className="text-[11px] text-text-light">Updating…</span>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {view === 'newEngagement' && (
                      <form className="space-y-4" onSubmit={onCreateEngagement}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-text-light mb-1">{clientLabel}</label>
                            <select
                              className="border border-border rounded-md px-3 py-2 text-sm w-full"
                              value={newEngagement.clientId}
                              onChange={(e) => setNewEngagement((prev) => ({ ...prev, clientId: e.target.value }))}
                              required
                            >
                              <option value="">Select {clientLabel.toLowerCase()}</option>
                              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-text-light mb-1">New {clientLabel.toLowerCase()} (optional quick add)</label>
                            <div className="flex gap-2">
                              <input className="border border-border rounded-md px-3 py-2 text-sm w-full" placeholder={`New ${clientLabel.toLowerCase()} name`} value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
                              <button type="button" className="btn btn--primary text-sm py-2 px-4" disabled={saving} onClick={() => { void onCreateClient() }}>
                                Add
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-text-light mb-1">Engagement name</label>
                            <input
                              className="border border-border rounded-md px-3 py-2 text-sm w-full"
                              value={newEngagement.name}
                              onChange={(e) => setNewEngagement((prev) => ({ ...prev, name: e.target.value }))}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-text-light mb-1">Engagement type</label>
                            <select
                              className="border border-border rounded-md px-3 py-2 text-sm w-full"
                              value={newEngagement.engagementType}
                              onChange={(e) => setNewEngagement((prev) => ({ ...prev, engagementType: e.target.value }))}
                            >
                              {engagementTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-text-light mb-1">Fiscal year</label>
                            <input
                              type="number"
                              className="border border-border rounded-md px-3 py-2 text-sm w-full"
                              value={newEngagement.fiscalYear}
                              onChange={(e) => setNewEngagement((prev) => ({ ...prev, fiscalYear: Number(e.target.value) }))}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-text-light mb-1">Due date</label>
                            <input
                              type="date"
                              className="border border-border rounded-md px-3 py-2 text-sm w-full"
                              value={newEngagement.dueDate}
                              onChange={(e) => setNewEngagement((prev) => ({ ...prev, dueDate: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-text-light mb-1">Source type</label>
                            <select
                              className="border border-border rounded-md px-3 py-2 text-sm w-full"
                              value={newEngagement.sourceType}
                              onChange={(e) => setNewEngagement((prev) => ({ ...prev, sourceType: e.target.value }))}
                            >
                              {sourceTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-text-light mb-1">Period start</label>
                            <input
                              type="date"
                              className="border border-border rounded-md px-3 py-2 text-sm w-full"
                              value={newEngagement.periodStart}
                              onChange={(e) => setNewEngagement((prev) => ({ ...prev, periodStart: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-text-light mb-1">Period end</label>
                            <input
                              type="date"
                              className="border border-border rounded-md px-3 py-2 text-sm w-full"
                              value={newEngagement.periodEnd}
                              onChange={(e) => setNewEngagement((prev) => ({ ...prev, periodEnd: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-text-light mb-1">Review flow status</label>
                            <select
                              className="border border-border rounded-md px-3 py-2 text-sm w-full"
                              value={newEngagement.reviewFlowStatus}
                              onChange={(e) => setNewEngagement((prev) => ({ ...prev, reviewFlowStatus: e.target.value }))}
                            >
                              {reviewFlowStatusOptions.map((status) => <option key={status} value={status}>{formatWorkflowLabel(status)}</option>)}
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs text-text-light mb-1">Deliverables (comma or line separated)</label>
                            <textarea
                              className="border border-border rounded-md px-3 py-2 text-sm w-full min-h-[92px]"
                              value={newEngagement.deliverablesText}
                              onChange={(e) => setNewEngagement((prev) => ({ ...prev, deliverablesText: e.target.value }))}
                              placeholder="Working paper package, analytics memo, signoff checklist"
                            />
                          </div>
                        </div>
                        <button type="submit" className="btn btn--primary text-sm py-2 px-4" disabled={saving}>
                          {saving ? 'Creating…' : 'Create engagement'}
                        </button>
                      </form>
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
                          </div>
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
                          <Link to={`/portal/accounting/working-papers/engagements/${engagementId}/trial-balance`} className="btn btn--primary text-sm py-2 px-4">Trial Balance</Link>
                          <Link to={`/portal/accounting/working-papers/engagements/${engagementId}/lead-sheets`} className="btn btn--primary text-sm py-2 px-4">Lead Sheets</Link>
                          <Link to={`/portal/accounting/working-papers/engagements/${engagementId}/documents`} className="btn btn--primary text-sm py-2 px-4">Documents</Link>
                          <Link to={`/portal/accounting/working-papers/engagements/${engagementId}/review`} className="btn btn--primary text-sm py-2 px-4">Review</Link>
                          <Link to={`/portal/accounting/working-papers/engagements/${engagementId}/settings`} className="btn btn--primary text-sm py-2 px-4">Settings</Link>
                        </div>
                      </div>
                    )}

                    {view === 'trialBalance' && (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-border p-4 space-y-3">
                          <h3 className="font-semibold text-primary-dark">Import Trial Balance (CSV/XLSX)</h3>
                          <input
                            type="file"
                            accept=".csv,.xlsx"
                            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                          />
                          <div className="flex gap-2">
                            <button type="button" className="btn btn--primary text-sm py-2 px-4" disabled={!importFile || saving} onClick={() => { void onPreviewImport() }}>
                              Preview Import
                            </button>
                            <button type="button" className="btn btn--primary text-sm py-2 px-4" disabled={!trialBalancePreview || saving} onClick={() => { void onImportTrialBalance() }}>
                              Import Trial Balance
                            </button>
                            <button type="button" className="btn btn--primary text-sm py-2 px-4" disabled={saving} onClick={() => { void onGenerateLeadSheets() }}>
                              Generate Lead Sheets
                            </button>
                          </div>
                        </div>
                        {trialBalancePreview && (
                          <div className="rounded-lg border border-border p-4 space-y-2">
                            <p className="text-sm text-text">Rows: {trialBalancePreview.summary.totalRows}</p>
                            <p className="text-sm text-text">Warnings: {trialBalancePreview.summary.warningCount}</p>
                            {trialBalancePreview.warnings.slice(0, 8).map((warning, idx) => (
                              <p key={`${warning.type}-${idx}`} className="text-xs text-text-light">{warning.message}</p>
                            ))}
                          </div>
                        )}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border text-left text-text-light">
                                <th className="py-2">Account</th>
                                <th className="py-2">Current</th>
                                <th className="py-2">Prior</th>
                                <th className="py-2">Variance</th>
                                <th className="py-2">%</th>
                                <th className="py-2">Flags</th>
                              </tr>
                            </thead>
                            <tbody>
                              {trialBalanceAccounts.length === 0 ? (
                                <tr>
                                  <td className="py-3 text-text-light" colSpan={6}>No trial balance accounts imported yet.</td>
                                </tr>
                              ) : trialBalanceAccounts.map((account) => (
                                  <tr key={account.id} className="border-b border-border/70">
                                    <td className="py-2">{account.account_number || '—'} {account.account_name}</td>
                                    <td className="py-2">{account.current_period_balance}</td>
                                    <td className="py-2">{account.prior_period_balance ?? '—'}</td>
                                    <td className="py-2">{account.variance_amount ?? '—'}</td>
                                    <td className="py-2">{account.variance_percent != null ? `${(Number(account.variance_percent) * 100).toFixed(1)}%` : account.variance_label || '—'}</td>
                                    <td className="py-2">{account.is_material ? 'Material' : account.is_unusual ? 'Unusual' : '—'}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {view === 'leadSheets' && (
                      <div className="space-y-3">
                        <div className="flex justify-end">
                          <button type="button" className="btn btn--primary text-sm py-2 px-4" disabled={saving} onClick={() => { void onGenerateLeadSheets() }}>
                            Generate or Refresh Lead Sheets
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border text-left text-text-light">
                                <th className="py-2">Section</th>
                                <th className="py-2">Status</th>
                                <th className="py-2">Risk</th>
                                <th className="py-2">Open notes</th>
                                <th className="py-2">Docs</th>
                                <th className="py-2">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {leadSheets.length === 0 ? (
                                <tr>
                                  <td className="py-3 text-text-light" colSpan={6}>No lead sheets generated yet.</td>
                                </tr>
                              ) : leadSheets.map((sheet) => (
                                  <tr key={sheet.id} className="border-b border-border/70">
                                    <td className="py-2">
                                      <Link className="text-primary-dark hover:underline" to={`/portal/accounting/working-papers/engagements/${engagementId}/lead-sheets/${sheet.id}`}>
                                        {sheet.section_code} - {sheet.section_name}
                                      </Link>
                                    </td>
                                    <td className="py-2">{sheet.status}</td>
                                    <td className="py-2">{sheet.risk_level}</td>
                                    <td className="py-2">{sheet.open_note_count}</td>
                                    <td className="py-2">{sheet.document_count}</td>
                                    <td className="py-2">
                                      <button
                                        type="button"
                                        className="text-xs text-primary-dark underline"
                                        onClick={() => { void onDeleteLeadSheet(sheet.id) }}
                                      >
                                        Delete
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
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
                          </div>
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
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border text-left text-text-light">
                                <th className="py-2">Priority</th>
                                <th className="py-2">Status</th>
                                <th className="py-2">Note</th>
                                <th className="py-2">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reviewNotes.length === 0 ? (
                                <tr>
                                  <td className="py-3 text-text-light" colSpan={4}>No review notes for this engagement.</td>
                                </tr>
                              ) : reviewNotes.map((note) => (
                                  <tr key={note.id} className="border-b border-border/70">
                                    <td className="py-2">{note.priority}</td>
                                    <td className="py-2">{note.status}</td>
                                    <td className="py-2">{note.note_text}</td>
                                    <td className="py-2">
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
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {view === 'settings' && (
                      <div className="space-y-3">
                        <div className="rounded-lg border border-border p-4 space-y-3">
                          <h3 className="font-semibold text-primary-dark">
                            Team access (managed in Workspace Admin)
                          </h3>
                          <p className="text-xs text-text-light">
                            {isFirmWorkspace
                              ? 'Use this mode when your firm has employees serving multiple accounting clients.'
                              : 'Use this mode when one company has employees managing internal accounting work.'}
                          </p>
                          <p className="text-sm text-text-light">
                            Use <Link className="font-medium underline" to="/portal/accounting/workspaces">Workspace Administration</Link> for employee onboarding and member management.
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
                            {clientLabelPlural} in active workspace: {clients.length} | Tasks in engagement: {tasks.length}
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
                          {integrationsData.providers.map((provider: any) => (
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
                          {integrationsData.connections.length === 0 ? (
                            <p className="text-sm text-text-light">No integration connections recorded yet for this workspace.</p>
                          ) : (
                            <ul className="space-y-1 text-sm text-text">
                              {integrationsData.connections.map((connection: any) => (
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

              {view !== 'companyProfile' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(view === 'workspaceAdmin' ? workspaceAdminQuickLinks : quickLinks).map((item) => (
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
