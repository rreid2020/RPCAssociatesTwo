import { Fragment, lazy } from 'react'
import { Route } from 'react-router-dom'
import { ProtectedRoute } from './route-guards'
import RouteSuspense from './route-suspense'
import StaffGuard from '../platform/api/guards/StaffGuard'

const OpsDashboardPage = lazy(async () => await import('../modules/ops/pages/OpsDashboardPage'))
const CorpusOpsPage = lazy(async () => await import('../modules/ops/pages/CorpusOpsPage'))
const FormRegistryOpsPage = lazy(async () => await import('../modules/ops/pages/FormRegistryOpsPage'))
const ExternalLinksPage = lazy(async () => await import('../modules/ops/pages/ExternalLinksPage'))

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
      {opsRoute('/portal/ops/links', <ExternalLinksPage />)}
    </Fragment>
  )
}
