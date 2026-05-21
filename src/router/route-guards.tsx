import { FC, ReactNode } from 'react'
import { AuthGuard, OnboardingGuard } from '../platform/api/guards'

interface ProtectedRouteProps {
  children: ReactNode
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => (
  <AuthGuard>
    <OnboardingGuard>{children}</OnboardingGuard>
  </AuthGuard>
)

