import { FC, FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../../components/SEO'
import ClientPortalShell from '../../../components/ClientPortalShell'
import { ACCOUNTING_WORKSPACE_STORAGE_KEY, portalFetch } from '../../../lib/portalApi'

type AccountingView =
  | 'landing'
  | 'workspaceAdmin'
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
  { to: '/portal/accounting/workspaces', label: 'Workspace Admin' },
  { to: '/portal/accounting/working-papers/engagements', label: 'Engagements' },
  { to: '/portal/accounting/working-papers', label: 'Working Papers' },
  { to: '/portal/accounting/working-papers/engagements/new', label: 'Create Engagement' },
  { to: '/portal/accounting/integrations', label: 'Integrations' },
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
  status: string
  source_type: string
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

function getStoredWorkspaceId (): string {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(ACCOUNTING_WORKSPACE_STORAGE_KEY) || ''
}

const AccountingWorkspacePage: FC<AccountingWorkspacePageProps> = ({ view }) => {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { engagementId, leadSheetId } = useParams()
  const [clients, setClients] = useState<Client[]>([])
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [statusSummary, setStatusSummary] = useState<Array<{ status: string; c: number }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [engagementTypeFilter, setEngagementTypeFilter] = useState('')
  const [newClientName, setNewClientName] = useState('')
  const [newEngagement, setNewEngagement] = useState({
    clientId: '',
    name: '',
    engagementType: 'year_end_working_papers',
    fiscalYear: new Date().getFullYear(),
    periodStart: `${new Date().getFullYear()}-01-01`,
    periodEnd: `${new Date().getFullYear()}-12-31`,
    sourceType: 'csv',
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
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(getStoredWorkspaceId())
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [newWorkspaceType, setNewWorkspaceType] = useState<'business' | 'firm'>('business')
  const [showWorkspaceTools, setShowWorkspaceTools] = useState(false)
  const [newMemberClerkUserId, setNewMemberClerkUserId] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('preparer')
  const [newInviteEmail, setNewInviteEmail] = useState('')
  const [newInviteRole, setNewInviteRole] = useState('preparer')
  const [lastInviteLink, setLastInviteLink] = useState('')
  const [trialBalanceAccounts, setTrialBalanceAccounts] = useState<any[]>([])
  const [trialBalancePreview, setTrialBalancePreview] = useState<TrialBalancePreview | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [importPayload, setImportPayload] = useState<{ fileName: string; base64Content: string } | null>(null)

  const loadClients = useCallback(async () => {
    const { clients: rows } = await portalFetch<{ clients: Client[] }>('/v1/accounting/clients', getToken)
    setClients(rows)
  }, [getToken])

  const loadEngagements = useCallback(async () => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (clientFilter) params.set('clientId', clientFilter)
    if (engagementTypeFilter) params.set('engagementType', engagementTypeFilter)
    if (search.trim()) params.set('search', search.trim())
    const url = `/v1/accounting/engagements${params.toString() ? `?${params.toString()}` : ''}`
    const { engagements: rows } = await portalFetch<{ engagements: Engagement[] }>(url, getToken)
    setEngagements(rows)
  }, [clientFilter, engagementTypeFilter, getToken, search, statusFilter])

  const loadStatusSummary = useCallback(async () => {
    const { summary } = await portalFetch<{ summary: Array<{ status: string; c: number }> }>('/v1/accounting/engagements/status-summary', getToken)
    setStatusSummary(summary)
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
    setSelectedWorkspaceId((current) => {
      if (current && rows.some((workspace) => workspace.id === current)) return current
      return rows[0]?.id || ''
    })
  }, [getToken])

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!selectedWorkspaceId) {
      window.localStorage.removeItem(ACCOUNTING_WORKSPACE_STORAGE_KEY)
      return
    }
    window.localStorage.setItem(ACCOUNTING_WORKSPACE_STORAGE_KEY, selectedWorkspaceId)
  }, [selectedWorkspaceId])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setError(null)
      setNotice(null)
      setLoading(true)
      try {
        if (view === 'joinWorkspaceInvite') {
          await loadWorkspaces()
          return
        }
        await loadClients()
        if (['workingPapersDashboard', 'engagementList', 'newEngagement', 'landing'].includes(view)) {
          await Promise.all([loadEngagements(), loadStatusSummary()])
        }
        await loadWorkspaces()
        if (view === 'engagementDashboard') await loadEngagementDashboard()
        if (view === 'trialBalance') await loadTrialBalance()
        if (view === 'leadSheets') await loadLeadSheets()
        if (view === 'leadSheetDetail') await loadLeadSheetDetail()
        if (view === 'documents') {
          await loadDocuments()
          await loadRepositoryFiles()
        }
        if (view === 'review') await loadReviewNotes()
        if (view === 'settings') await loadTasks()
        if (view === 'settings') await loadWorkspaceMembers()
        if (view === 'integrations') await loadIntegrations()
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Could not load data')
      } finally {
        if (mounted) setLoading(false)
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
    loadRepositoryFiles,
    loadReviewNotes,
    loadStatusSummary,
    loadTasks,
    loadTrialBalance,
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

  useEffect(() => {
    if (!showWorkspaceTools || !selectedWorkspaceId) return
    void loadWorkspaceMembers()
    void loadWorkspaceInvites()
  }, [loadWorkspaceInvites, loadWorkspaceMembers, selectedWorkspaceId, showWorkspaceTools])

  const onCreateClient = async () => {
    const name = newClientName.trim()
    if (!name) return
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

  const onCreateEngagement = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { engagement } = await portalFetch<{ engagement: Engagement }>('/v1/accounting/engagements', getToken, {
        method: 'POST',
        body: JSON.stringify({
          ...newEngagement,
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

  const onGenerateLeadSheets = async () => {
    if (!engagementId) return
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
    if (!engagementId || !importFile) return
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
    if (!engagementId || !importPayload) return
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
    if (!engagementId) return
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
      await loadReviewNotes()
      setNotice('Review note updated')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update review note')
    } finally {
      setSaving(false)
    }
  }

  const onPreparerSignoff = async () => {
    if (!leadSheetId) return
    setSaving(true)
    setError(null)
    try {
      await portalFetch(`/v1/accounting/lead-sheets/${leadSheetId}/preparer-signoff`, getToken, { method: 'POST' })
      await loadLeadSheetDetail()
      setNotice('Preparer signoff completed')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign off')
    } finally {
      setSaving(false)
    }
  }

  const onReviewerSignoff = async () => {
    if (!leadSheetId) return
    setSaving(true)
    setError(null)
    try {
      await portalFetch(`/v1/accounting/lead-sheets/${leadSheetId}/reviewer-signoff`, getToken, {
        method: 'POST',
        headers: { 'x-portal-role': 'reviewer' }
      })
      await loadLeadSheetDetail()
      setNotice('Reviewer signoff completed')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign off')
    } finally {
      setSaving(false)
    }
  }

  const onArchiveEngagement = async () => {
    if (!engagementId) return
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
    if (!newWorkspaceName.trim()) return
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

  const onAddWorkspaceMember = async () => {
    if (!selectedWorkspaceId || !newMemberClerkUserId.trim()) return
    setSaving(true)
    setError(null)
    try {
      await portalFetch(`/v1/accounting/workspaces/${selectedWorkspaceId}/members`, getToken, {
        method: 'POST',
        body: JSON.stringify({
          clerkUserId: newMemberClerkUserId.trim(),
          role: newMemberRole
        })
      })
      setNewMemberClerkUserId('')
      await loadWorkspaceMembers()
      setNotice('Workspace member added')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add workspace member')
    } finally {
      setSaving(false)
    }
  }

  const onCreateWorkspaceInvite = async () => {
    if (!selectedWorkspaceId) return
    setSaving(true)
    setError(null)
    try {
      const { invite } = await portalFetch<{ invite: any }>(
        `/v1/accounting/workspaces/${selectedWorkspaceId}/invites`,
        getToken,
        {
          method: 'POST',
          body: JSON.stringify({
            email: newInviteEmail.trim() || null,
            role: newInviteRole
          })
        }
      )
      const inviteLink = `${window.location.origin}/portal/accounting/join?token=${encodeURIComponent(invite.invite_token)}`
      setLastInviteLink(inviteLink)
      setNewInviteEmail('')
      await loadWorkspaceInvites()
      setNotice('Invite link generated. Share it with your employee.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create workspace invite')
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
      setSelectedWorkspaceId(accepted.workspace.id)
      setNotice(`Invite accepted. You joined ${accepted.workspace.name}.`)
      navigate('/portal/accounting', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not accept invite')
    } finally {
      setSaving(false)
    }
  }, [getToken, location.search, navigate, view])

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
                        onChange={(e) => setSelectedWorkspaceId(e.target.value)}
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
                              disabled={saving || !newWorkspaceName.trim()}
                              onClick={() => { void onCreateWorkspace() }}
                            >
                              Create Workspace
                            </button>
                          </div>
                        </div>
                        <div className="rounded-lg border border-border p-3 space-y-3">
                          <h4 className="text-sm font-semibold text-primary-dark">Employee onboarding</h4>
                          <ol className="text-xs text-text-light space-y-1 list-decimal pl-4">
                            <li>Select the workspace where the employee should work.</li>
                            <li>Create an invite link (optionally restricted to employee email) and share it.</li>
                            <li>Employee signs in with Clerk and opens the invite link to auto-join the workspace.</li>
                          </ol>
                          <div className="rounded-md border border-border p-2 space-y-2">
                            <p className="text-xs text-text-light">Step 1: Invite employee with secure join link</p>
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                className="border border-border rounded-md px-3 py-2 text-sm min-w-64"
                                placeholder="Employee email (optional but recommended)"
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
                                disabled={saving || !selectedWorkspaceId || !canManageWorkspaceMembers}
                                onClick={() => { void onCreateWorkspaceInvite() }}
                              >
                                Create Invite Link
                              </button>
                            </div>
                            {lastInviteLink && (
                              <div className="flex flex-wrap items-center gap-2">
                                <input className="border border-border rounded-md px-3 py-2 text-xs min-w-64 flex-1" readOnly value={lastInviteLink} />
                                <button
                                  type="button"
                                  className="btn btn--secondary text-sm py-2 px-3"
                                  onClick={() => {
                                    void navigator.clipboard.writeText(lastInviteLink)
                                    setNotice('Invite link copied to clipboard')
                                  }}
                                >
                                  Copy Link
                                </button>
                              </div>
                            )}
                            {workspaceInvites.length > 0 && (
                              <div className="max-h-32 overflow-auto rounded-md border border-border">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-border text-left text-text-light">
                                      <th className="py-2 px-2">Email</th>
                                      <th className="py-2 px-2">Role</th>
                                      <th className="py-2 px-2">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {workspaceInvites.map((invite) => (
                                      <tr key={invite.id} className="border-b border-border/70">
                                        <td className="py-2 px-2">{invite.invite_email || 'Any signed-in user with link'}</td>
                                        <td className="py-2 px-2">{invite.role}</td>
                                        <td className="py-2 px-2">{invite.status}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            {workspaceInvites.length === 0 && (
                              <p className="text-xs text-text-light">No pending workspace invites yet.</p>
                            )}
                          </div>
                          <div className="rounded-md border border-border p-2 space-y-2">
                            <p className="text-xs text-text-light">Step 2: Manual fallback (Clerk User ID)</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              className="border border-border rounded-md px-3 py-2 text-sm min-w-64"
                              placeholder="Employee Clerk User ID (user_...)"
                              value={newMemberClerkUserId}
                              onChange={(e) => setNewMemberClerkUserId(e.target.value)}
                            />
                            <select
                              className="border border-border rounded-md px-3 py-2 text-sm"
                              value={newMemberRole}
                              onChange={(e) => setNewMemberRole(e.target.value)}
                            >
                              {['admin', 'manager', 'reviewer', 'preparer', 'read_only', 'client'].map((role) => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn btn--primary text-sm py-2 px-4"
                              disabled={saving || !selectedWorkspaceId || !newMemberClerkUserId.trim() || !canManageWorkspaceMembers}
                              onClick={() => { void onAddWorkspaceMember() }}
                            >
                              Add Employee
                            </button>
                            <button
                              type="button"
                              className="btn btn--secondary text-sm py-2 px-4"
                              disabled={!selectedWorkspaceId || saving}
                              onClick={() => { void Promise.all([loadWorkspaceMembers(), loadWorkspaceInvites()]) }}
                            >
                              Refresh Workspace Team
                            </button>
                          </div>
                          </div>
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
                                </tr>
                              </thead>
                              <tbody>
                                {workspaceMembers.length === 0 ? (
                                  <tr>
                                    <td className="py-2 px-2 text-text-light" colSpan={3}>No team members in this workspace yet.</td>
                                  </tr>
                                ) : workspaceMembers.map((member) => (
                                  <tr key={member.clerk_user_id} className="border-b border-border/70">
                                    <td className="py-2 px-2 font-mono">{member.clerk_user_id}</td>
                                    <td className="py-2 px-2">{member.role}</td>
                                    <td className="py-2 px-2">{member.status}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
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
                            Organization (business or firm) → workspace(s) → employee assignments → engagements → working papers.
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
                        <div className="flex flex-wrap gap-2">
                          <Link to="/portal/accounting/working-papers/engagements" className="btn btn--primary text-sm py-2 px-4">
                            Open Engagements
                          </Link>
                          <Link to="/portal/accounting/working-papers" className="btn btn--primary text-sm py-2 px-4">
                            Open Working Papers
                          </Link>
                          <Link to="/portal/accounting/integrations" className="btn btn--primary text-sm py-2 px-4">
                            Open Integrations
                          </Link>
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
                          <select className="border border-border rounded-md px-3 py-2 text-sm" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
                            <option value="">{`All ${clientLabelPlural.toLowerCase()}`}</option>
                            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                          </select>
                          <select className="border border-border rounded-md px-3 py-2 text-sm" value={engagementTypeFilter} onChange={(e) => setEngagementTypeFilter(e.target.value)}>
                            <option value="">All types</option>
                            {engagementTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                          </select>
                          <button type="button" className="btn btn--primary text-sm py-2 px-4" onClick={() => { void loadEngagements() }}>
                            Apply Filters
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
                                <th className="py-2">Period End</th>
                              </tr>
                            </thead>
                            <tbody>
                              {engagements.length === 0 ? (
                                <tr>
                                  <td className="py-3 text-text-light" colSpan={5}>No engagements match the current filters.</td>
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
                                    <td className="py-2">{new Date(engagement.period_end).toLocaleDateString()}</td>
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
                        </div>
                        <button type="submit" className="btn btn--primary text-sm py-2 px-4" disabled={saving}>
                          {saving ? 'Creating…' : 'Create engagement'}
                        </button>
                      </form>
                    )}

                    {view === 'engagementDashboard' && dashboard && (
                      <div className="space-y-4">
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
                              </tr>
                            </thead>
                            <tbody>
                              {leadSheets.length === 0 ? (
                                <tr>
                                  <td className="py-3 text-text-light" colSpan={5}>No lead sheets generated yet.</td>
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
          </>
        </div>
      </ClientPortalShell>
    </>
  )
}

export default AccountingWorkspacePage
