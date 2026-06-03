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
import { useAuth, useOrganization } from '@clerk/clerk-react'
import { portalFetch } from '../../lib/portalApi'

export type AccountSummary = {
  businessType: 'business' | 'firm' | string
  profileBusinessType: string | null
  role: string | null
  organizationId: string | null
  name: string | null
  isPersonal: boolean
  profileOnboardingCompletedAt: string | null
}

type AccountContextValue = {
  account: AccountSummary | null
  profile: Record<string, unknown> | null
  loading: boolean
  refreshAccount: () => Promise<void>
}

const AccountContext = createContext<AccountContextValue | null>(null)

const AccountContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { organization, isLoaded: isOrganizationLoaded } = useOrganization()
  const [account, setAccount] = useState<AccountSummary | null>(null)
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const inFlightRef = useRef<Promise<void> | null>(null)

  const refreshAccount = useCallback(async () => {
    if (inFlightRef.current) {
      await inFlightRef.current
      return
    }
    const run = async () => {
      setLoading(true)
      try {
        const data = await portalFetch<{
          account: AccountSummary
          profile: Record<string, unknown> | null
        }>('/v1/accounting/account', getToken)
        setAccount(data.account || null)
        setProfile(data.profile || null)
      } catch {
        setAccount(null)
        setProfile(null)
      } finally {
        setLoading(false)
        inFlightRef.current = null
      }
    }
    const pending = run()
    inFlightRef.current = pending
    await pending
  }, [getToken])

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !isOrganizationLoaded) {
      if (!isSignedIn) {
        setAccount(null)
        setProfile(null)
      }
      return
    }
    void refreshAccount()
  }, [isLoaded, isOrganizationLoaded, isSignedIn, organization?.id, refreshAccount])

  const value = useMemo(
    () => ({ account, profile, loading, refreshAccount }),
    [account, loading, profile, refreshAccount]
  )

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccountContext (): AccountContextValue {
  const context = useContext(AccountContext)
  if (!context) {
    throw new Error('useAccountContext must be used within AccountContextProvider')
  }
  return context
}

export default AccountContextProvider
