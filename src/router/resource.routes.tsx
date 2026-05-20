import { Fragment } from 'react'
import { Route } from 'react-router-dom'
import Resources from '../pages/Resources'
import ResourceCategory from '../pages/ResourceCategory'
import ResourceDetail from '../pages/ResourceDetail'
import TaxCalculator from '../pages/TaxCalculator'
import CashFlowCalculator from '../pages/CashFlowCalculator'
import CashFlowStatementDirectMethod from '../pages/CashFlowStatementDirectMethod'
import DonationOptimizerPage from '../pages/DonationOptimizerPage'
import TaxEngineCalculatorPage from '../pages/TaxEngineCalculatorPage'

export function getResourceRoutes () {
  return (
    <Fragment>
      <Route path="/resources" element={<Resources />} />
      <Route path="/resources/canadian-personal-income-tax-calculator" element={<TaxCalculator />} />
      <Route path="/resources/cash-flow-calculator" element={<CashFlowCalculator />} />
      <Route path="/resources/cash-flow-statement-direct-method" element={<CashFlowStatementDirectMethod />} />
      <Route path="/resources/donation-credit-optimizer" element={<DonationOptimizerPage />} />
      <Route path="/resources/ccpc-salary-dividend-calculator" element={<TaxEngineCalculatorPage />} />
      <Route path="/resources/cash-flow-statement-template" element={<ResourceDetail />} />
      <Route path="/resources/cfi-financial-ratios-guide" element={<ResourceDetail />} />
      <Route path="/resources/category/:slug" element={<ResourceCategory />} />
      <Route path="/resources/:slug" element={<ResourceDetail />} />
    </Fragment>
  )
}

