import { useAuth } from '@clerk/clerk-react'
import { useCallback, useEffect, useState } from 'react'
import { getOpsAccess } from '../services'

export function useOpsAccess () {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isStaff, setIsStaff] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false)
      setIsStaff(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const access = await getOpsAccess(getToken)
      setIsStaff(Boolean(access.isStaff))
    } catch (e) {
      setIsStaff(false)
      setError(e instanceof Error ? e.message : 'Could not verify platform access')
    } finally {
      setLoading(false)
    }
  }, [getToken, isLoaded, isSignedIn])

  useEffect(() => {
    void reload()
  }, [reload])

  return { loading, isStaff, error, reload }
}
