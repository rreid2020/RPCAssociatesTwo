import { useMemo } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { parseEngagementIdFromPathname } from './engagementPaths'

export function useEngagementRouteParams () {
  const params = useParams() ?? {}
  const { pathname } = useLocation()
  const paramEngagementId = String(params.engagementId || '').trim()
  const paramLeadSheetId = String(params.leadSheetId || '').trim()

  const engagementId = useMemo(() => {
    if (paramEngagementId) return paramEngagementId
    return parseEngagementIdFromPathname(pathname) || ''
  }, [paramEngagementId, pathname])

  const leadSheetId = paramLeadSheetId || null

  return { engagementId, leadSheetId }
}
