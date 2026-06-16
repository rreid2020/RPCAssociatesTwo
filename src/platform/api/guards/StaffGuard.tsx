import { FC, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useOpsAccess } from '../../../modules/ops/hooks/useOpsAccess'

type StaffGuardProps = {
  children: ReactNode
}

const StaffGuard: FC<StaffGuardProps> = ({ children }) => {
  const { loading, isStaff, error } = useOpsAccess()

  if (loading) {
    return <p className="p-4 text-sm text-text-light">Checking platform operator access...</p>
  }

  if (!isStaff) {
    return (
      <div className="p-6 max-w-xl">
        <h1 className="text-2xl font-bold text-primary-dark mb-2">Platform operations</h1>
        <p className="text-sm text-text-light mb-4">
          This area is restricted to SaaS platform operators. Your Clerk user is not listed in `PORTAL_STAFF_CLERK_IDS`.
        </p>
        {error && <p className="text-sm text-red-700 mb-4">{error}</p>}
        <Link to="/portal/dashboard" className="text-sm text-accent font-medium hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  return <>{children}</>
}

export default StaffGuard
