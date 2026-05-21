import { FC, ReactNode } from 'react'
import UpgradePrompt from '../../../components/UpgradePrompt'
import { useWorkspaceAuthorization } from '../../permissions/WorkspaceAuthorizationProvider'

type PermissionGuardProps = {
  permission: string
  children: ReactNode
  permissionLabel?: string
}

const PermissionGuard: FC<PermissionGuardProps> = ({ permission, children, permissionLabel }) => {
  const { permissions, loading } = useWorkspaceAuthorization()

  if (loading) {
    return <p className="p-4 text-sm text-text-light">Checking workspace permissions...</p>
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
