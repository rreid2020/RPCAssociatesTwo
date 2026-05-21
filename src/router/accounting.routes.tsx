import { Fragment, lazy } from 'react'
import { Navigate, Route } from 'react-router-dom'
import { ProtectedRoute } from './route-guards'
import RouteSuspense from './route-suspense'
import { EntitlementGuard } from '../platform/api/guards'

const AccountingWorkspacePage = lazy(async () => await import('../pages/portal/accounting/AccountingWorkspacePage'))

function accountingViewRoute (
  path: string,
  view: 'landing' | 'workspaceAdmin' | 'joinWorkspaceInvite' | 'workingPapersDashboard' | 'engagementList' | 'newEngagement' | 'engagementDashboard' | 'trialBalance' | 'leadSheets' | 'leadSheetDetail' | 'documents' | 'review' | 'settings' | 'integrations',
  feature: 'workingPapers' | 'integrations' | null = null
) {
  const content = (
    <RouteSuspense>
      <AccountingWorkspacePage view={view} />
    </RouteSuspense>
  )
  const gatedContent = feature
    ? (
      <EntitlementGuard feature={feature} featureLabel={feature === 'integrations' ? 'Integrations' : 'Working Papers'}>
        {content}
      </EntitlementGuard>
      )
    : content
  return (
    <Route
      key={path}
      path={path}
      element={
        <ProtectedRoute>
          {gatedContent}
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
      {accountingViewRoute('/portal/accounting/working-papers', 'workingPapersDashboard', 'workingPapers')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements', 'engagementList', 'workingPapers')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/new', 'newEngagement', 'workingPapers')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId', 'engagementDashboard', 'workingPapers')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId/trial-balance', 'trialBalance', 'workingPapers')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId/lead-sheets', 'leadSheets', 'workingPapers')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId/lead-sheets/:leadSheetId', 'leadSheetDetail', 'workingPapers')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId/documents', 'documents', 'workingPapers')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId/review', 'review', 'workingPapers')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId/settings', 'settings', 'workingPapers')}
      {accountingViewRoute('/portal/accounting/integrations', 'integrations', 'integrations')}
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

