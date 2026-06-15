import { Fragment, lazy } from 'react'
import { Navigate, Route } from 'react-router-dom'
import Dashboard from '../pages/portal/Dashboard'
import FileRepository from '../pages/portal/FileRepository'
import Profile from '../pages/portal/Profile'
import Subscription from '../pages/portal/Subscription'
import { ProtectedRoute } from './route-guards'
import RouteSuspense from './route-suspense'

const TaxGPT = lazy(async () => await import('../pages/portal/TaxGPT'))
const TaxGPTFeedback = lazy(async () => await import('../pages/portal/TaxGPTFeedback'))

export function getPortalRoutes () {
  return (
    <Fragment>
      <Route
        path="/portal/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/taxgpt"
        element={
          <ProtectedRoute>
            <RouteSuspense>
              <TaxGPT />
            </RouteSuspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/taxgpt/feedback"
        element={
          <ProtectedRoute>
            <RouteSuspense>
              <TaxGPTFeedback />
            </RouteSuspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/files"
        element={
          <ProtectedRoute>
            <FileRepository />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/subscription"
        element={
          <ProtectedRoute>
            <Subscription />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal"
        element={
          <ProtectedRoute>
            <Navigate to="/portal/dashboard" replace />
          </ProtectedRoute>
        }
      />
    </Fragment>
  )
}

