import { Fragment, lazy } from 'react'
import { Navigate, Route } from 'react-router-dom'
import { ProtectedRoute } from './route-guards'
import RouteSuspense from './route-suspense'

const BillingSettingsPage = lazy(async () => await import('../modules/billing/pages/BillingSettingsPage'))
const SubscriptionManagementPage = lazy(async () => await import('../modules/billing/pages/SubscriptionManagementPage'))
const UsageDashboardPage = lazy(async () => await import('../modules/billing/pages/UsageDashboardPage'))

function billingRoute (path: string, element: JSX.Element) {
  return (
    <Route
      key={path}
      path={path}
      element={
        <ProtectedRoute>
          <RouteSuspense>{element}</RouteSuspense>
        </ProtectedRoute>
      }
    />
  )
}

export function getBillingRoutes () {
  return (
    <Fragment>
      {billingRoute('/portal/billing/settings', <BillingSettingsPage />)}
      {billingRoute('/portal/billing/subscription', <SubscriptionManagementPage />)}
      {billingRoute('/portal/billing/usage', <UsageDashboardPage />)}
      <Route
        path="/portal/billing"
        element={
          <ProtectedRoute>
            <Navigate to="/portal/billing/subscription" replace />
          </ProtectedRoute>
        }
      />
    </Fragment>
  )
}
