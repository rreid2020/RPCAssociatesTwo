import { FC } from 'react'
import { Link, Outlet, useParams } from 'react-router-dom'

const EngagementLayout: FC = () => {
  const { engagementId = '' } = useParams()

  const basePath = `/portal/accounting/working-papers/engagements/${engagementId}`

  return (
    <div>
      <div className="lg:pl-64 px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex flex-wrap gap-2">
        <Link to={basePath} className="btn btn--secondary text-sm py-2 px-3">Dashboard</Link>
        <Link to={`${basePath}/execution`} className="btn btn--secondary text-sm py-2 px-3">Execution</Link>
        <Link to={`${basePath}/trial-balance`} className="btn btn--secondary text-sm py-2 px-3">Trial Balance</Link>
        <Link to={`${basePath}/datasets`} className="btn btn--secondary text-sm py-2 px-3">Datasets</Link>
        <Link to={`${basePath}/lead-sheets`} className="btn btn--secondary text-sm py-2 px-3">Lead Sheets</Link>
        <Link to={`${basePath}/documents`} className="btn btn--secondary text-sm py-2 px-3">Documents</Link>
        <Link to={`${basePath}/review`} className="btn btn--secondary text-sm py-2 px-3">Review</Link>
        <Link to={`${basePath}/adjustments`} className="btn btn--secondary text-sm py-2 px-3">Adjustments</Link>
        <Link to={`${basePath}/settings`} className="btn btn--secondary text-sm py-2 px-3">Settings</Link>
        </div>
      </div>
      <Outlet />
    </div>
  )
}

export default EngagementLayout
