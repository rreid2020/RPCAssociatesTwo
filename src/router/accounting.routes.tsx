import { Fragment, lazy } from 'react'
import { Navigate, Route } from 'react-router-dom'
import { ProtectedRoute } from './route-guards'
import RouteSuspense from './route-suspense'
import { EntitlementGuard, PermissionGuard } from '../platform/api/guards'

const AccountingWorkspacePage = lazy(async () => await import('../pages/portal/accounting/AccountingWorkspacePage'))

function accountingViewRoute (
  path: string,
  view: 'landing' | 'workspaceAdmin' | 'companyProfile' | 'joinWorkspaceInvite' | 'workingPapersDashboard' | 'engagementList' | 'newEngagement' | 'engagementDashboard' | 'trialBalance' | 'leadSheets' | 'leadSheetDetail' | 'documents' | 'review' | 'settings' | 'integrations',
  feature: 'workingPapers' | 'integrations' | null = null,
  permission: string | null = null,
  allowRolloutBypass = true
) {
  const content = (
    <RouteSuspense>
      <AccountingWorkspacePage view={view} />
    </RouteSuspense>
  )
  const entitlementContent = feature
    ? (
      <EntitlementGuard feature={feature} featureLabel={feature === 'integrations' ? 'Integrations' : 'Working Papers'}>
        {content}
      </EntitlementGuard>
      )
    : content
  const gatedContent = permission
    ? (
      <PermissionGuard permission={permission} permissionLabel={permission} allowRolloutBypass={allowRolloutBypass}>
        {entitlementContent}
      </PermissionGuard>
      )
    : entitlementContent
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
      {accountingViewRoute('/portal/accounting/company-profile', 'companyProfile', null, 'workspace.manage', false)}
      {accountingViewRoute('/portal/accounting/workspaces', 'workspaceAdmin', null, 'workspace.manage')}
      {accountingViewRoute('/portal/accounting/join', 'joinWorkspaceInvite')}
      {accountingViewRoute('/portal/accounting/working-papers', 'workingPapersDashboard', 'workingPapers', 'working_papers.read')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements', 'engagementList', 'workingPapers', 'engagement.read')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/new', 'newEngagement', 'workingPapers', 'engagement.manage')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId', 'engagementDashboard', 'workingPapers', 'engagement.read')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId/trial-balance', 'trialBalance', 'workingPapers', 'working_papers.manage')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId/lead-sheets', 'leadSheets', 'workingPapers', 'working_papers.read')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId/lead-sheets/:leadSheetId', 'leadSheetDetail', 'workingPapers', 'working_papers.read')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId/documents', 'documents', 'workingPapers', 'documents.manage')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId/review', 'review', 'workingPapers', 'review_notes.manage')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/:engagementId/settings', 'settings', 'workingPapers', 'engagement.manage')}
      {accountingViewRoute('/portal/accounting/integrations', 'integrations', 'integrations', 'integrations.manage')}
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

