import { Fragment } from 'react'
import { Route } from 'react-router-dom'
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import SignIn from '../pages/portal/SignIn'
import SignUp from '../pages/portal/SignUp'

export function getAuthRoutes () {
  return (
    <Fragment>
      <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
      <Route path="/portal/sign-in" element={<SignIn />} />
      <Route path="/portal/sign-up" element={<SignUp />} />
    </Fragment>
  )
}

