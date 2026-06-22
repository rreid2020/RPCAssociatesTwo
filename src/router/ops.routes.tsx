import { Fragment } from 'react'
import { Route } from 'react-router-dom'
import { ProtectedRoute } from './route-guards'
import RouteSuspense from './route-suspense'
import StaffGuard from '../platform/api/guards/StaffGuard'
import { routeLazy } from '../shared/loading/routeLazy'

const OpsDashboardPage = routeLazy(async () => await import('../modules/ops/pages/OpsDashboardPage'))
const CorpusOpsPage = routeLazy(async () => await import('../modules/ops/pages/CorpusOpsPage'))
const FormRegistryOpsPage = routeLazy(async () => await import('../modules/ops/pages/FormRegistryOpsPage'))
const ExternalLinksPage = routeLazy(async () => await import('../modules/ops/pages/ExternalLinksPage'))
const FeedbackOpsPage = routeLazy(async () => await import('../modules/ops/pages/FeedbackOpsPage'))
const FeedbackDetailOpsPage = routeLazy(async () => await import('../modules/ops/pages/FeedbackDetailOpsPage'))
const UsersOpsPage = routeLazy(async () => await import('../modules/ops/pages/UsersOpsPage'))

function opsRoute (path: string, element: JSX.Element) {
  return (
    <Route
      key={path}
      path={path}
      element={
        <ProtectedRoute>
          <StaffGuard>
            <RouteSuspense>{element}</RouteSuspense>
          </StaffGuard>
        </ProtectedRoute>
      }
    />
  )
}

export function getOpsRoutes () {
  return (
    <Fragment>
      {opsRoute('/portal/ops', <OpsDashboardPage />)}
      {opsRoute('/portal/ops/corpus', <CorpusOpsPage />)}
      {opsRoute('/portal/ops/forms-registry', <FormRegistryOpsPage />)}
      {opsRoute('/portal/ops/feedback', <FeedbackOpsPage />)}
      {opsRoute('/portal/ops/feedback/:id', <FeedbackDetailOpsPage />)}
      {opsRoute('/portal/ops/users', <UsersOpsPage />)}
      {opsRoute('/portal/ops/links', <ExternalLinksPage />)}
    </Fragment>
  )
}
