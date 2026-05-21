import { useAuth } from '@clerk/clerk-react'
import { useCallback, useEffect, useState } from 'react'
import { getBillingOverview } from '../services'
import type { BillingOverview } from '../types'

export function useWorkspaceBilling () {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overview, setOverview] = useState<BillingOverview | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await getBillingOverview(getToken)
      setOverview(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load billing overview')
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void reload()
  }, [reload])

  return {
    loading,
    error,
    overview,
    reload
  }
}
