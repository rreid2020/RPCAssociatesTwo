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
import {
  fetchEngagementExecutionBundle,
  type EngagementExecutionBundle
} from '../../working-papers/services/executionApi'
import { isPortalRequestAborted } from '../../../lib/portalApi'

type EngagementWorkspaceContextValue = {
  engagementId: string
  bundle: EngagementExecutionBundle | null
  bundleLoading: boolean
  bundleError: string | null
  refreshBundle: (options?: { force?: boolean }) => Promise<EngagementExecutionBundle | null>
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
  const bundleRef = useRef<EngagementExecutionBundle | null>(null)
  const loadedEngagementIdRef = useRef<string | null>(null)

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

  useEffect(() => {
    bundleRef.current = bundle
  }, [bundle])

  useEffect(() => {
    if (!engagementId) {
      bundleRef.current = null
      setBundle(null)
      setBundleError(null)
      setBundleLoading(false)
      loadedEngagementIdRef.current = null
      return
    }

    const controller = new AbortController()
    void refreshBundle({ signal: controller.signal }).catch(() => {})
    return () => {
      controller.abort()
    }
  }, [engagementId, refreshBundle])

  const value = useMemo<EngagementWorkspaceContextValue>(() => ({
    engagementId,
    bundle,
    bundleLoading,
    bundleError,
    refreshBundle
  }), [bundle, bundleError, bundleLoading, engagementId, refreshBundle])

  return (
    <EngagementWorkspaceContext.Provider value={value}>
      {children}
    </EngagementWorkspaceContext.Provider>
  )
}

export function useEngagementWorkspace (): EngagementWorkspaceContextValue | null {
  return useContext(EngagementWorkspaceContext)
}
