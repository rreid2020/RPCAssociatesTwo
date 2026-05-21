import { FC, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'

type Props = {
  children: ReactNode
}

const AuthGuard: FC<Props> = ({ children }) => {
  return (
    <>
      <SignedOut>
        <Navigate to="/portal/sign-in" replace />
      </SignedOut>
      <SignedIn>{children}</SignedIn>
    </>
  )
}

export default AuthGuard
