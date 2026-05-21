import { Fragment, lazy } from 'react'
import { Navigate, Route } from 'react-router-dom'
import { ProtectedRoute } from './route-guards'
import RouteSuspense from './route-suspense'
import { PermissionGuard } from '../platform/api/guards'

const BillingSettingsPage = lazy(async () => await import('../modules/billing/pages/BillingSettingsPage'))
const SubscriptionManagementPage = lazy(async () => await import('../modules/billing/pages/SubscriptionManagementPage'))
const UsageDashboardPage = lazy(async () => await import('../modules/billing/pages/UsageDashboardPage'))

function billingRoute (path: string, element: JSX.Element, permission: string) {
  return (
    <Route
      key={path}
      path={path}
      element={
        <ProtectedRoute>
          <PermissionGuard permission={permission} permissionLabel={permission}>
            <RouteSuspense>{element}</RouteSuspense>
          </PermissionGuard>
        </ProtectedRoute>
      }
    />
  )
}

export function getBillingRoutes () {
  return (
    <Fragment>
      {billingRoute('/portal/billing/settings', <BillingSettingsPage />, 'billing.read')}
      {billingRoute('/portal/billing/subscription', <SubscriptionManagementPage />, 'billing.read')}
      {billingRoute('/portal/billing/usage', <UsageDashboardPage />, 'billing.read')}
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
