import { FC, ReactNode } from 'react'
import UpgradePrompt from '../../../components/UpgradePrompt'
import { useAccountAuthorization } from '../../permissions/AccountAuthorizationProvider'

type PermissionGuardProps = {
  permission: string
  children: ReactNode
  permissionLabel?: string
  allowRolloutBypass?: boolean
}

const PermissionGuard: FC<PermissionGuardProps> = ({ permission, children, permissionLabel, allowRolloutBypass = false }) => {
  const { permissions, loading } = useAccountAuthorization()
  const forceEnterpriseAccess = import.meta.env.VITE_FORCE_ENTERPRISE_ACCESS !== 'false'
  if (allowRolloutBypass && forceEnterpriseAccess) {
    return <>{children}</>
  }

  if (loading) {
    return <p className="p-4 text-sm text-text-light">Checking permissions...</p>
  }

  if (!permissions.includes(permission)) {
    return (
      <UpgradePrompt
        feature={permissionLabel || permission}
        requiredPlan="PROFESSIONAL"
      />
    )
  }

  return <>{children}</>
}

export default PermissionGuard
