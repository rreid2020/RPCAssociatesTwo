import { FC, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { EngagementWorkspaceProvider } from '../context/EngagementWorkspaceProvider'
import { preloadEngagementWorkspacePanels } from '../preloadEngagementPanels'
import {
  RESERVED_ENGAGEMENT_PATH_SEGMENTS,
  parseEngagementIdFromPathname
} from '../routing/engagementPaths'

const navItems = [
  { to: '.', label: 'Dashboard' },
  { to: 'execution', label: 'Execution' },
  { to: 'trial-balance', label: 'Trial Balance' },
  { to: 'datasets', label: 'Datasets' },
  { to: 'lead-sheets', label: 'Lead Sheets' },
  { to: 'documents', label: 'Documents' },
  { to: 'review', label: 'Review' },
  { to: 'adjustments', label: 'Adjustments' },
  { to: 'settings', label: 'Settings' }
] as const

const EngagementLayout: FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { engagementId: paramEngagementId = '' } = useParams() ?? {}
  const engagementId = paramEngagementId || parseEngagementIdFromPathname(location.pathname) || ''

  useEffect(() => {
    if (!engagementId) return
    preloadEngagementWorkspacePanels()
  }, [engagementId])

  useEffect(() => {
    const segment = location.pathname
      .split('/portal/accounting/working-papers/engagements/')[1]
      ?.split('/')
      .filter(Boolean)[0]

    if (segment && RESERVED_ENGAGEMENT_PATH_SEGMENTS.has(segment)) {
      navigate('/portal/accounting/working-papers/engagements', { replace: true })
    }
  }, [location.pathname, navigate])

  if (!engagementId) {
    return (
      <div className="lg:pl-64 px-4 sm:px-6 lg:px-8 pt-4">
        <p className="text-sm text-text-light">Select an engagement to open its working paper workspace.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="lg:pl-64 px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="btn btn--secondary text-sm py-2 px-3"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <EngagementWorkspaceProvider engagementId={engagementId}>
        <Outlet />
      </EngagementWorkspaceProvider>
    </div>
  )
}

export default EngagementLayout
