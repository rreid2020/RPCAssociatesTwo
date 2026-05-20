import { FC } from 'react'
import { Routes } from 'react-router-dom'
import { getAuthRoutes } from '../modules/auth/routes'
import { getPortalRoutes } from '../modules/portal/routes'
import { getAccountingRoutes } from '../modules/accounting/routes'
import { getTaxRoutes } from '../modules/tax-intelligence/routes'
import { getMarketingRoutes } from '../modules/marketing/routes'

const AppRoutes: FC = () => {
  return (
    <Routes>
      {getAuthRoutes()}
      {getPortalRoutes()}
      {getAccountingRoutes()}
      {getTaxRoutes()}
      {getMarketingRoutes()}
    </Routes>
  )
}

export default AppRoutes

