import { FC, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'

type Props = {
  children: ReactNode
}

const AuthGuard: FC<Props> = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-text-light">Loading portal…</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/portal/sign-in" replace />
  }

  return <>{children}</>
}

export default AuthGuard
