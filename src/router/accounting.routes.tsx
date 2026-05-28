import { Fragment, lazy } from 'react'
import { Route } from 'react-router-dom'
import { ProtectedRoute } from './route-guards'
import RouteSuspense from './route-suspense'
import { EntitlementGuard, PermissionGuard } from '../platform/api/guards'

const AccountingWorkspacePage = lazy(async () => await import('../pages/portal/accounting/AccountingWorkspacePage'))
const EngagementLayout = lazy(async () => await import('../modules/accounting/layouts/EngagementLayout'))

function accountingViewRoute (
  path: string,
  view: 'landing' | 'workspaceAdmin' | 'companyProfile' | 'joinWorkspaceInvite' | 'engagementList' | 'workingPapersWorkspace' | 'newEngagement' | 'engagementDashboard' | 'trialBalance' | 'leadSheets' | 'leadSheetDetail' | 'documents' | 'review' | 'adjustments' | 'settings' | 'integrations',
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

function guardedElement (
  element: JSX.Element,
  feature: 'workingPapers' | 'integrations' | null = null,
  permission: string | null = null,
  allowRolloutBypass = true
) {
  const content = (
    <RouteSuspense>
      {element}
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
    <ProtectedRoute>
      {gatedContent}
    </ProtectedRoute>
  )
}

export function getAccountingRoutes () {
  return (
    <Fragment>
      {accountingViewRoute('/portal/accounting', 'landing')}
      {accountingViewRoute('/portal/accounting/company-profile', 'companyProfile')}
      {accountingViewRoute('/portal/accounting/workspaces', 'workspaceAdmin')}
      {accountingViewRoute('/portal/accounting/join', 'joinWorkspaceInvite')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements', 'engagementList', 'workingPapers', 'engagement.read')}
      {accountingViewRoute('/portal/accounting/working-papers/workspace', 'workingPapersWorkspace', 'workingPapers', 'working_papers.read')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements/new', 'newEngagement', 'workingPapers', 'engagement.manage')}
      <Route
        path="/portal/accounting/working-papers/engagements/:engagementId"
        element={guardedElement(<EngagementLayout />, 'workingPapers', 'engagement.read')}
      >
        <Route
          index
          element={guardedElement(<AccountingWorkspacePage view="engagementDashboard" />, 'workingPapers', 'engagement.read')}
        />
        <Route
          path="trial-balance"
          element={guardedElement(<AccountingWorkspacePage view="trialBalance" />, 'workingPapers', 'working_papers.manage')}
        />
        <Route
          path="lead-sheets"
          element={guardedElement(<AccountingWorkspacePage view="leadSheets" />, 'workingPapers', 'working_papers.read')}
        />
        <Route
          path="lead-sheets/:leadSheetId"
          element={guardedElement(<AccountingWorkspacePage view="leadSheetDetail" />, 'workingPapers', 'working_papers.read')}
        />
        <Route
          path="documents"
          element={guardedElement(<AccountingWorkspacePage view="documents" />, 'workingPapers', 'documents.manage')}
        />
        <Route
          path="review"
          element={guardedElement(<AccountingWorkspacePage view="review" />, 'workingPapers', 'review_notes.manage')}
        />
        <Route
          path="adjustments"
          element={guardedElement(<AccountingWorkspacePage view="adjustments" />, 'workingPapers', 'working_papers.manage')}
        />
        <Route
          path="settings"
          element={guardedElement(<AccountingWorkspacePage view="settings" />, 'workingPapers', 'engagement.manage')}
        />
      </Route>
      {accountingViewRoute('/portal/accounting/integrations', 'integrations', 'integrations', 'integrations.manage')}
    </Fragment>
  )
}

