import { Fragment, lazy } from 'react'
import { Navigate, Route } from 'react-router-dom'
import { ProtectedRoute } from './route-guards'
import RouteSuspense from './route-suspense'

const TaxReturns = lazy(async () => await import('../pages/portal/tax-intelligence/TaxReturns'))
const ReturnBuilder = lazy(async () => await import('../pages/portal/tax-intelligence/ReturnBuilder'))
const DocumentProcessing = lazy(async () => await import('../pages/portal/tax-intelligence/DocumentProcessing'))
const Optimization = lazy(async () => await import('../pages/portal/tax-intelligence/Optimization'))
const Scenarios = lazy(async () => await import('../pages/portal/tax-intelligence/Scenarios'))
const AuditRisk = lazy(async () => await import('../pages/portal/tax-intelligence/AuditRisk'))
const FormsSchedules = lazy(async () => await import('../pages/portal/tax-intelligence/FormsSchedules'))

function protectedTaxElement (element: JSX.Element) {
  return (
    <ProtectedRoute>
      <RouteSuspense>{element}</RouteSuspense>
    </ProtectedRoute>
  )
}

export function getTaxRoutes () {
  return (
    <Fragment>
      <Route path="/app/tax-intelligence" element={<ProtectedRoute><Navigate to="/app/tax-intelligence/returns" replace /></ProtectedRoute>} />
      <Route path="/app/tax-intelligence/returns" element={protectedTaxElement(<TaxReturns />)} />
      <Route path="/app/tax-intelligence/returns/:id" element={protectedTaxElement(<ReturnBuilder />)} />
      <Route path="/app/tax-intelligence/documents" element={protectedTaxElement(<DocumentProcessing />)} />
      <Route path="/app/tax-intelligence/optimization" element={protectedTaxElement(<Optimization />)} />
      <Route path="/app/tax-intelligence/scenarios" element={protectedTaxElement(<Scenarios />)} />
      <Route path="/app/tax-intelligence/risk" element={protectedTaxElement(<AuditRisk />)} />
      <Route path="/app/tax-intelligence/forms-schedules" element={protectedTaxElement(<FormsSchedules />)} />

      <Route path="/portal/tax-intelligence" element={<ProtectedRoute><Navigate to="/app/tax-intelligence/returns" replace /></ProtectedRoute>} />
      <Route path="/portal/tax-intelligence/returns" element={<ProtectedRoute><Navigate to="/app/tax-intelligence/returns" replace /></ProtectedRoute>} />
      <Route path="/portal/tax-intelligence/returns/:id" element={protectedTaxElement(<ReturnBuilder />)} />
      <Route path="/portal/tax-intelligence/documents" element={<ProtectedRoute><Navigate to="/app/tax-intelligence/documents" replace /></ProtectedRoute>} />
      <Route path="/portal/tax-intelligence/optimization" element={<ProtectedRoute><Navigate to="/app/tax-intelligence/optimization" replace /></ProtectedRoute>} />
      <Route path="/portal/tax-intelligence/scenarios" element={<ProtectedRoute><Navigate to="/app/tax-intelligence/scenarios" replace /></ProtectedRoute>} />
      <Route path="/portal/tax-intelligence/risk" element={<ProtectedRoute><Navigate to="/app/tax-intelligence/risk" replace /></ProtectedRoute>} />
      <Route path="/portal/tax-intelligence/forms-schedules" element={<ProtectedRoute><Navigate to="/app/tax-intelligence/forms-schedules" replace /></ProtectedRoute>} />
    </Fragment>
  )
}

