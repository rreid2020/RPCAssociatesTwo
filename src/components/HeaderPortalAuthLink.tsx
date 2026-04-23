import { FC } from 'react'
import { Link } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'

type Props = {
  /** e.g. desktop: inline with nav; mobile: block w-full */
  classNameSignIn: string
  classNameSignedIn: string
  signInLabel?: string
  onNavigate?: () => void
}

/**
 * Shown in the main site header. When Clerk is configured and the user is
 * signed in, link to the portal dashboard instead of a dead sign-in page.
 */
const HeaderPortalAuthLink: FC<Props> = ({
  classNameSignIn,
  classNameSignedIn,
  signInLabel = 'Sign in',
  onNavigate,
}) => {
  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    return (
      <Link to="/portal/sign-in" className={classNameSignIn} onClick={onNavigate}>
        {signInLabel}
      </Link>
    )
  }

  return (
    <>
      <SignedOut>
        <Link to="/portal/sign-in" className={classNameSignIn} onClick={onNavigate}>
          {signInLabel}
        </Link>
      </SignedOut>
      <SignedIn>
        <Link
          to="/portal/dashboard"
          className={classNameSignedIn}
          onClick={onNavigate}
        >
          Dashboard
        </Link>
      </SignedIn>
    </>
  )
}

export default HeaderPortalAuthLink
