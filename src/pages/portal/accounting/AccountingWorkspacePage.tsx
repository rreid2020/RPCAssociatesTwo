import { FC, FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../../components/SEO'
import ClientPortalShell from '../../../components/ClientPortalShell'
import { portalFetch } from '../../../lib/portalApi'

type AccountingView =
  | 'landing'
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

interface AccountingWorkspacePageProps {
  view: AccountingView
}

const titleByView: Record<AccountingView, string> = {
  landing: 'Accounting Workspace',
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
  integrations: 'Accounting Integrations',
}

const descriptionByView: Record<AccountingView, string> = {
  landing: 'Manage engagements, trial balances, lead sheets, and accounting integrations.',
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
}

const quickLinks = [
  { to: '/portal/accounting/working-papers', label: 'Working Papers' },
  { to: '/portal/accounting/working-papers/engagements', label: 'Engagements' },
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

const AccountingWorkspacePage: FC<AccountingWorkspacePageProps> = ({ view }) => {
  const { getToken } = useAuth()
  const navigate = useNavigate()
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
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('')
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [newMemberClerkUserId, setNewMemberClerkUserId] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('preparer')
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
    if (!selectedWorkspaceId && rows[0]?.id) {
      setSelectedWorkspaceId(rows[0].id)
    }
  }, [getToken, selectedWorkspaceId])

  const loadWorkspaceMembers = useCallback(async () => {
    if (!selectedWorkspaceId) return
    const data = await portalFetch<{ members: any[] }>(`/v1/accounting/workspaces/${selectedWorkspaceId}/members`, getToken)
    setWorkspaceMembers(data.members || [])
  }, [getToken, selectedWorkspaceId])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setError(null)
      setNotice(null)
      setLoading(true)
      try {
        await loadClients()
        if (['workingPapersDashboard', 'engagementList', 'newEngagement', 'landing'].includes(view)) {
          await Promise.all([loadEngagements(), loadStatusSummary()])
        }
        if (['landing', 'settings', 'integrations'].includes(view)) {
          await loadWorkspaces()
        }
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
    loadWorkspaceMembers,
    loadWorkspaces,
    view
  ])

  const activeEngagements = useMemo(() => engagements.filter((e) => e.status !== 'archived'), [engagements])

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
        body: JSON.stringify({ name: newWorkspaceName.trim() })
      })
      setNewWorkspaceName('')
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

  return (
    <>
      <SEO
        title={`${titleByView[view]} | Client Portal`}
        description={descriptionByView[view]}
        canonical={
          view === 'landing'
            ? '/portal/accounting'
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
              <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
              {loading ? (
                  <p className="text-sm text-text-light">Loading&hellip;</p>
                ) : (
                  <div className="space-y-4">
                    {view === 'landing' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <Link to="/portal/accounting/working-papers/engagements/new" className="btn btn--primary text-sm py-2 px-4">New engagement</Link>
                          <Link to="/portal/accounting/working-papers/engagements" className="btn btn--primary text-sm py-2 px-4">View engagements</Link>
                        </div>
                      </div>
                    )}

                    {view === 'engagementList' && (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <input
                            className="border border-border rounded-md px-3 py-2 text-sm"
                            placeholder="Search engagement or client"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                          <select className="border border-border rounded-md px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">All statuses</option>
                            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                          <select className="border border-border rounded-md px-3 py-2 text-sm" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
                            <option value="">All clients</option>
                            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                          </select>
                          <select className="border border-border rounded-md px-3 py-2 text-sm" value={engagementTypeFilter} onChange={(e) => setEngagementTypeFilter(e.target.value)}>
                            <option value="">All types</option>
                            {engagementTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                          </select>
                          <button type="button" className="btn btn--primary text-sm py-2 px-4" onClick={() => { void loadEngagements() }}>
                            Apply
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border text-left text-text-light">
                                <th className="py-2">Engagement</th>
                                <th className="py-2">Client</th>
                                <th className="py-2">Type</th>
                                <th className="py-2">Status</th>
                                <th className="py-2">Period End</th>
                              </tr>
                            </thead>
                            <tbody>
                              {engagements.map((engagement) => (
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
                            <label className="block text-xs text-text-light mb-1">Client</label>
                            <select
                              className="border border-border rounded-md px-3 py-2 text-sm w-full"
                              value={newEngagement.clientId}
                              onChange={(e) => setNewEngagement((prev) => ({ ...prev, clientId: e.target.value }))}
                              required
                            >
                              <option value="">Select a client</option>
                              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-text-light mb-1">New client (optional quick add)</label>
                            <div className="flex gap-2">
                              <input className="border border-border rounded-md px-3 py-2 text-sm w-full" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
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
                          <Link to={`/portal/accounting/working-papers/engagements/${engagementId}/trial-balance`} className="btn btn--primary text-sm py-2 px-4">Trial balance</Link>
                          <Link to={`/portal/accounting/working-papers/engagements/${engagementId}/lead-sheets`} className="btn btn--primary text-sm py-2 px-4">Lead sheets</Link>
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
                              Preview import
                            </button>
                            <button type="button" className="btn btn--primary text-sm py-2 px-4" disabled={!trialBalancePreview || saving} onClick={() => { void onImportTrialBalance() }}>
                              Import trial balance
                            </button>
                            <button type="button" className="btn btn--primary text-sm py-2 px-4" disabled={saving} onClick={() => { void onGenerateLeadSheets() }}>
                              Generate lead sheets
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
                              {trialBalanceAccounts.map((account) => (
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
                            Generate / refresh lead sheets
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
                              {leadSheets.map((sheet) => (
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
                              Preparer signoff
                            </button>
                            <button type="button" className="btn btn--primary text-sm py-2 px-4" disabled={saving} onClick={() => { void onReviewerSignoff() }}>
                              Reviewer signoff
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {view === 'documents' && (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-border p-4">
                          <h3 className="font-semibold text-primary-dark mb-2">Link existing repository documents</h3>
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
                              {documents.map((document) => (
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
                              {reviewNotes.map((note) => (
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
                          <h3 className="font-semibold text-primary-dark">Workspace team access</h3>
                          <div className="flex flex-wrap gap-2">
                            <select
                              className="border border-border rounded-md px-3 py-2 text-sm"
                              value={selectedWorkspaceId}
                              onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                            >
                              {workspaces.map((workspace) => (
                                <option key={workspace.id} value={workspace.id}>
                                  {workspace.name} ({workspace.role})
                                </option>
                              ))}
                            </select>
                            <input
                              className="border border-border rounded-md px-3 py-2 text-sm"
                              placeholder="New workspace name"
                              value={newWorkspaceName}
                              onChange={(e) => setNewWorkspaceName(e.target.value)}
                            />
                            <button type="button" className="btn btn--primary text-sm py-2 px-4" disabled={saving} onClick={() => { void onCreateWorkspace() }}>
                              Create workspace
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <input
                              className="border border-border rounded-md px-3 py-2 text-sm"
                              placeholder="Employee Clerk User ID"
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
                            <button type="button" className="btn btn--primary text-sm py-2 px-4" disabled={saving || !selectedWorkspaceId} onClick={() => { void onAddWorkspaceMember() }}>
                              Add employee
                            </button>
                          </div>
                          <ul className="space-y-1 text-sm text-text">
                            {workspaceMembers.map((member) => (
                              <li key={member.clerk_user_id}>
                                {member.clerk_user_id} - {member.role} ({member.status})
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-lg border border-border p-4">
                          <h3 className="font-semibold text-primary-dark mb-2">Task summary</h3>
                          <p className="text-sm text-text-light mb-2">Tasks in engagement: {tasks.length}</p>
                          <Link to={`/portal/accounting/working-papers/engagements/${engagementId}/review`} className="text-sm text-primary-dark underline">
                            Manage review notes and workflow
                          </Link>
                        </div>
                        <div className="rounded-lg border border-red-200 p-4 bg-red-50">
                          <h3 className="font-semibold text-red-700 mb-2">Danger zone</h3>
                          <p className="text-sm text-red-700 mb-3">Archive this engagement after completion.</p>
                          <button type="button" className="btn btn--primary text-sm py-2 px-4" disabled={saving} onClick={() => { void onArchiveEngagement() }}>
                            Archive engagement
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
                                disabled={!provider.configured || !provider.enabled}
                                className="btn btn--primary text-sm py-2 px-4 w-full disabled:opacity-50"
                              >
                                {provider.configured && provider.enabled ? 'Connect' : 'Coming soon'}
                              </button>
                            </div>
                          ))}
                        </div>
                        {integrationsData.connections.length > 0 && (
                          <div className="rounded-lg border border-border p-4">
                            <h3 className="font-semibold text-primary-dark mb-2">Connection records</h3>
                            <ul className="space-y-1 text-sm text-text">
                              {integrationsData.connections.map((connection: any) => (
                                <li key={connection.id}>
                                  {connection.provider} - {connection.connection_status}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
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
