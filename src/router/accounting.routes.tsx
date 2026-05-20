import { Fragment, lazy } from 'react'
import { Navigate, Route } from 'react-router-dom'
import { ProtectedRoute } from './route-guards'
import RouteSuspense from './route-suspense'

const AccountingWorkspacePage = lazy(async () => await import('../pages/portal/accounting/AccountingWorkspacePage'))

function accountingViewRoute (path: string, view: 'landing' | 'workspaceAdmin' | 'joinWorkspaceInvite' | 'workingPapersDashboard' | 'engagementList' | 'newEngagement' | 'engagementDashboard' | 'trialBalance' | 'leadSheets' | 'leadSheetDetail' | 'documents' | 'review' | 'settings' | 'integrations') {
  return (
    <Route
      key={path}
      path={path}
      element={
        <ProtectedRoute>
          <RouteSuspense>
            <AccountingWorkspacePage view={view} />
          </RouteSuspense>
        </ProtectedRoute>
      }
    />
  )
}

export function getAccountingRoutes () {
  return (
    <Fragment>
      {accountingViewRoute('/portal/accounting', 'landing')}
      {accountingViewRoute('/portal/accounting/workspaces', 'workspaceAdmin')}
      {accountingViewRoute('/portal/accounting/join', 'joinWorkspaceInvite')}
      {accountingViewRoute('/portal/accounting/working-papers', 'workingPapersDashboard')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements', 'engagementList')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/new', 'newEngagement')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId', 'engagementDashboard')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId/trial-balance', 'trialBalance')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId/lead-sheets', 'leadSheets')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId/lead-sheets/:leadSheetId', 'leadSheetDetail')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId/documents', 'documents')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId/review', 'review')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId/settings', 'settings')}
      {accountingViewRoute('/portal/accounting/integrations', 'integrations')}
      <Route
        path="/portal/working-papers"
        element={
          <ProtectedRoute>
            <Navigate to="/portal/accounting/working-papers" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/integrations"
        element={
          <ProtectedRoute>
            <Navigate to="/portal/accounting/integrations" replace />
          </ProtectedRoute>
        }
      />
    </Fragment>
  )
}

