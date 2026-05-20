import { FC, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'

interface ProtectedRouteProps {
  children: ReactNode
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => (
  <>
    <SignedOut>
      <Navigate to="/portal/sign-in" replace />
    </SignedOut>
    <SignedIn>{children}</SignedIn>
  </>
)

