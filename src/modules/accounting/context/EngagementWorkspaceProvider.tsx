import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useAuth } from '@clerk/clerk-react'
import { fetchReviewNotesDomain } from '../../../domains/reviews'
import { isPortalRequestAborted, portalFetch } from '../../../lib/portalApi'
import {
  fetchEngagementExecutionBundle,
  type EngagementExecutionBundle
} from '../../working-papers/services/executionApi'

type WorkspaceMember = {
  clerk_user_id: string
  display_name?: string
  email?: string
  role?: string
  status?: string
}

type EngagementWorkspaceContextValue = {
  engagementId: string
  bundle: EngagementExecutionBundle | null
  bundleLoading: boolean
  bundleError: string | null
  members: WorkspaceMember[]
  membersLoading: boolean
  membersError: string | null
  reviewNotes: any[] | null
  reviewNotesLoading: boolean
  refreshBundle: (options?: { force?: boolean }) => Promise<EngagementExecutionBundle | null>
  refreshMembers: (options?: { force?: boolean }) => Promise<WorkspaceMember[]>
  refreshReviewNotes: (options?: { force?: boolean }) => Promise<any[]>
}

const EngagementWorkspaceContext = createContext<EngagementWorkspaceContextValue | null>(null)

type EngagementWorkspaceProviderProps = {
  engagementId: string
  children: ReactNode
}

export const EngagementWorkspaceProvider: FC<EngagementWorkspaceProviderProps> = ({
  engagementId,
  children
}) => {
  const { getToken } = useAuth()
  const [bundle, setBundle] = useState<EngagementExecutionBundle | null>(null)
  const [bundleLoading, setBundleLoading] = useState(false)
  const [bundleError, setBundleError] = useState<string | null>(null)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState<any[] | null>(null)
  const [reviewNotesLoading, setReviewNotesLoading] = useState(false)

  const bundleRef = useRef<EngagementExecutionBundle | null>(null)
  const membersRef = useRef<WorkspaceMember[]>([])
  const reviewNotesRef = useRef<any[] | null>(null)
  const loadedEngagementIdRef = useRef<string | null>(null)
  const loadedMembersRef = useRef(false)

  const refreshBundle = useCallback(async (options?: { force?: boolean; signal?: AbortSignal }) => {
    if (!engagementId) return null
    if (!options?.force && loadedEngagementIdRef.current === engagementId && bundleRef.current) {
      return bundleRef.current
    }

    setBundleLoading(true)
    setBundleError(null)
    try {
      const nextBundle = await fetchEngagementExecutionBundle(engagementId, getToken, {
        signal: options?.signal
      })
      if (options?.signal?.aborted) return null
      bundleRef.current = nextBundle
      setBundle(nextBundle)
      loadedEngagementIdRef.current = engagementId
      return nextBundle
    } catch (error) {
      if (isPortalRequestAborted(error) || options?.signal?.aborted) {
        return null
      }
      const message = error instanceof Error ? error.message : 'Could not load engagement data'
      setBundleError(message)
      throw error
    } finally {
      if (!options?.signal?.aborted) {
        setBundleLoading(false)
      }
    }
  }, [engagementId, getToken])

  const refreshMembers = useCallback(async (options?: { force?: boolean; signal?: AbortSignal }) => {
    if (!options?.force && loadedMembersRef.current && membersRef.current.length > 0) {
      return membersRef.current
    }

    setMembersLoading(true)
    setMembersError(null)
    try {
      const data = await portalFetch<{ members: WorkspaceMember[] }>('/v1/accounting/members', getToken, {
        signal: options?.signal
      })
      if (options?.signal?.aborted) return membersRef.current
      const nextMembers = Array.isArray(data.members) ? data.members : []
      membersRef.current = nextMembers
      setMembers(nextMembers)
      loadedMembersRef.current = true
      return nextMembers
    } catch (error) {
      if (isPortalRequestAborted(error) || options?.signal?.aborted) {
        return membersRef.current
      }
      const message = error instanceof Error ? error.message : 'Could not load workspace members'
      setMembersError(message)
      throw error
    } finally {
      if (!options?.signal?.aborted) {
        setMembersLoading(false)
      }
    }
  }, [getToken])

  const refreshReviewNotes = useCallback(async (options?: { force?: boolean; signal?: AbortSignal }) => {
    if (!engagementId) return []
    if (!options?.force && reviewNotesRef.current) {
      return reviewNotesRef.current
    }

    setReviewNotesLoading(true)
    try {
      const { notes } = await fetchReviewNotesDomain(getToken, engagementId)
      if (options?.signal?.aborted) return reviewNotesRef.current || []
      const nextNotes = Array.isArray(notes) ? notes : []
      reviewNotesRef.current = nextNotes
      setReviewNotes(nextNotes)
      return nextNotes
    } catch (error) {
      if (isPortalRequestAborted(error) || options?.signal?.aborted) {
        return reviewNotesRef.current || []
      }
      throw error
    } finally {
      if (!options?.signal?.aborted) {
        setReviewNotesLoading(false)
      }
    }
  }, [engagementId, getToken])

  useEffect(() => {
    bundleRef.current = bundle
  }, [bundle])

  useEffect(() => {
    membersRef.current = members
  }, [members])

  useEffect(() => {
    reviewNotesRef.current = reviewNotes
  }, [reviewNotes])

  useEffect(() => {
    if (!engagementId) {
      bundleRef.current = null
      reviewNotesRef.current = null
      loadedEngagementIdRef.current = null
      setBundle(null)
      setBundleError(null)
      setBundleLoading(false)
      setReviewNotes(null)
      setReviewNotesLoading(false)
      return
    }

    reviewNotesRef.current = null
    setReviewNotes(null)

    const controller = new AbortController()
    const signal = controller.signal
    void Promise.all([
      refreshBundle({ signal }).catch(() => null),
      refreshMembers({ signal }).catch(() => membersRef.current)
    ])
    return () => {
      controller.abort()
    }
  }, [engagementId, refreshBundle, refreshMembers])

  const value = useMemo<EngagementWorkspaceContextValue>(() => ({
    engagementId,
    bundle,
    bundleLoading,
    bundleError,
    members,
    membersLoading,
    membersError,
    reviewNotes,
    reviewNotesLoading,
    refreshBundle,
    refreshMembers,
    refreshReviewNotes
  }), [
    bundle,
    bundleError,
    bundleLoading,
    engagementId,
    members,
    membersError,
    membersLoading,
    refreshBundle,
    refreshMembers,
    refreshReviewNotes,
    reviewNotes,
    reviewNotesLoading
  ])

  return (
    <EngagementWorkspaceContext.Provider value={value}>
      {children}
    </EngagementWorkspaceContext.Provider>
  )
}

export function useEngagementWorkspace (): EngagementWorkspaceContextValue | null {
  return useContext(EngagementWorkspaceContext)
}
