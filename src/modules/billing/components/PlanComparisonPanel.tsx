import { FC } from 'react'
import { BILLING_PLAN_ORDER, BILLING_PLANS } from '../types'
import { formatBillingCurrency } from '../utils/formatters'

const PlanComparisonPanel: FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {BILLING_PLAN_ORDER.map((planId) => {
        const plan = BILLING_PLANS[planId]
        return (
          <article key={plan.id} className="rounded-lg border border-border bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-primary-dark">{plan.displayName}</h3>
            <p className="text-sm text-text-light mt-1">
              {plan.monthlyPrice === 0 ? 'Free' : `${formatBillingCurrency(plan.monthlyPrice)} / month`}
            </p>
            <ul className="mt-3 space-y-1 text-sm text-text">
              <li>Users: {plan.entitlements.maxUsers}</li>
              <li>Storage: {plan.entitlements.maxStorageMb} MB</li>
              <li>AI credits: {plan.entitlements.aiMonthlyCredits}/mo</li>
              <li>Working Papers: {plan.entitlements.canAccessWorkingPapers ? 'Included' : 'Not included'}</li>
            </ul>
          </article>
        )
      })}
    </div>
  )
}

export default PlanComparisonPanel
