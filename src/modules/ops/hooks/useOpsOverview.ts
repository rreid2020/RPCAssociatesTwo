import { useAuth } from '@clerk/clerk-react'
import { useCallback, useEffect, useState } from 'react'
import { getOpsOverview, type OpsOverview } from '../services'

export function useOpsOverview () {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overview, setOverview] = useState<OpsOverview | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await getOpsOverview(getToken)
      setOverview(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load ops overview')
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void reload()
  }, [reload])

  return { loading, error, overview, reload }
}
