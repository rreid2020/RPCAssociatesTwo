import { Fragment } from 'react'
import { Navigate, Outlet, Route } from 'react-router-dom'
import { ProtectedRoute } from './route-guards'
import RouteSuspense from './route-suspense'
import { EntitlementGuard, PermissionGuard } from '../platform/api/guards'
import { routeLazy } from '../shared/loading/routeLazy'

const AccountingWorkspacePage = routeLazy(async () => await import('../pages/portal/accounting/AccountingWorkspacePage'))
const EngagementLayout = routeLazy(async () => await import('../modules/accounting/layouts/EngagementLayout'))
const EngagementExecutionRoute = routeLazy(async () => await import('../modules/engagement-execution/EngagementExecutionRoute'))
const EngagementDatasetsRoute = routeLazy(async () => await import('../modules/engagement-datasets/EngagementDatasetsRoute'))

function CompanyProfileOutlet () {
  return <Outlet />
}

type AccountingPageView =
  | 'landing'
  | 'companyProfile'
  | 'companyProfileEntities'
  | 'companyProfileEmployees'
  | 'companyProfileRoles'
  | 'joinWorkspaceInvite'
  | 'engagementList'
  | 'newEngagement'
  | 'engagementDashboard'
  | 'trialBalance'
  | 'leadSheets'
  | 'leadSheetDetail'
  | 'documents'
  | 'review'
  | 'adjustments'
  | 'settings'
  | 'integrations'

function accountingViewRoute (
  path: string,
  view: AccountingPageView,
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
      <Route
        path="/portal/accounting/company-profile"
        element={guardedElement(<CompanyProfileOutlet />)}
      >
        <Route
          index
          element={guardedElement(<AccountingWorkspacePage view="companyProfile" />, null, 'workspace.manage')}
        />
        <Route
          path="entities"
          element={guardedElement(<AccountingWorkspacePage view="companyProfileEntities" />, null, 'workspace.manage')}
        />
        <Route
          path="employees"
          element={guardedElement(<AccountingWorkspacePage view="companyProfileEmployees" />, null, 'workspace.invite')}
        />
        <Route
          path="roles-and-permissions"
          element={guardedElement(<AccountingWorkspacePage view="companyProfileRoles" />, null, 'rbac.read')}
        />
      </Route>
      <Route
        path="/portal/accounting/workspaces"
        element={
          <ProtectedRoute>
            <Navigate to="/portal/accounting/company-profile" replace />
          </ProtectedRoute>
        }
      />
      {accountingViewRoute('/portal/accounting/join', 'joinWorkspaceInvite')}
      {accountingViewRoute('/portal/accounting/working-papers/engagements', 'engagementList', 'workingPapers', 'engagement.read')}
      <Route
        path="/portal/accounting/working-papers/workspace"
        element={
          <ProtectedRoute>
            <Navigate to="/portal/accounting/working-papers/engagements" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/accounting/working-papers/engagements/new"
        element={
          <ProtectedRoute>
            <Navigate to="/portal/accounting/working-papers/engagements?create=1" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/accounting/working-papers/engagements/:engagementId"
        element={guardedElement(<EngagementLayout />, 'workingPapers', 'engagement.read')}
      >
        <Route
          index
          element={guardedElement(<AccountingWorkspacePage view="engagementDashboard" />, 'workingPapers', 'engagement.read')}
        />
        <Route
          path="execution"
          element={guardedElement(<EngagementExecutionRoute />, 'workingPapers', 'execution.read')}
        />
        <Route
          path="trial-balance"
          element={guardedElement(<AccountingWorkspacePage view="trialBalance" />, 'workingPapers', 'working_papers.manage')}
        />
        <Route
          path="datasets"
          element={guardedElement(<EngagementDatasetsRoute />, 'workingPapers', 'working_papers.manage')}
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

