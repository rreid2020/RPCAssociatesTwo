import { FC, ReactNode } from 'react'
import { AuthGuard, OnboardingGuard, WorkspaceGuard } from '../platform/api/guards'

interface ProtectedRouteProps {
  children: ReactNode
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => (
  <AuthGuard>
    <WorkspaceGuard>
      <OnboardingGuard>{children}</OnboardingGuard>
    </WorkspaceGuard>
  </AuthGuard>
)

