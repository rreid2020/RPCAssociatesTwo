import { useMemo } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { parseEngagementIdFromPathname } from './engagementPaths'

export function useEngagementRouteParams () {
  const params = useParams()
  const { pathname } = useLocation()

  const engagementId = useMemo(() => {
    const paramId = String(params.engagementId || '').trim()
    if (paramId) return paramId
    return parseEngagementIdFromPathname(pathname) || ''
  }, [params.engagementId, pathname])

  const leadSheetId = String(params.leadSheetId || '').trim() || null

  return { engagementId, leadSheetId }
}
