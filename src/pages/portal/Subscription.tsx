import { FC } from 'react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'
import { useSubscription, useSubscriptionPlan } from '../../lib/subscriptions/hooks'
import { SUBSCRIPTION_PLANS } from '../../lib/subscriptions/types'
import { formatSubscriptionPrice } from '../../lib/subscriptions/utils'

const Subscription: FC = () => {
  const currentPlan = useSubscription()
  const currentPlanConfig = useSubscriptionPlan()

  return (
    <>
      <SEO
        title="Subscription | Client Portal"
        description="Manage your RPC Associates Client Portal subscription"
        canonical="/portal/subscription"
      />
      <ClientPortalShell>
        <div>
          <h1 className="text-3xl font-bold text-primary-dark mb-6">Subscription</h1>

          {/* Current Plan */}
          <div className="bg-white p-6 rounded-lg border border-border shadow-sm mb-8">
            <h2 className="text-xl font-semibold text-primary-dark mb-4">Current Plan</h2>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary-dark">{currentPlanConfig.name}</h3>
                <p className="text-text-light">{currentPlanConfig.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-dark">
                  {formatSubscriptionPrice(currentPlanConfig.price)}
                </p>
                {currentPlan === 'free' && (
                  <p className="text-sm text-text-light mt-1">Always free for development</p>
                )}
              </div>
            </div>
          </div>

          {/* Available Plans */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-primary-dark mb-4">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.values(SUBSCRIPTION_PLANS).map((plan) => {
                const isCurrentPlan = plan.id === currentPlan
                return (
                  <div
                    key={plan.id}
                    className={`bg-white p-6 rounded-lg border shadow-sm ${
                      isCurrentPlan ? 'border-accent border-2' : 'border-border'
                    }`}
                  >
                    {isCurrentPlan && (
                      <div className="mb-4">
                        <span className="inline-block px-3 py-1 bg-accent text-white text-xs font-semibold rounded-full">
                          Current Plan
                        </span>
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-primary-dark mb-2">{plan.name}</h3>
                    <p className="text-text-light text-sm mb-4">{plan.description}</p>
                    <div className="mb-4">
                      <p className="text-2xl font-bold text-primary-dark">
                        {formatSubscriptionPrice(plan.price)}
                      </p>
                    </div>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center gap-2 text-sm">
                        {plan.features.dashboard ? (
                          <span className="text-accent">✓</span>
                        ) : (
                          <span className="text-text-light">✗</span>
                        )}
                        <span className={plan.features.dashboard ? 'text-text' : 'text-text-light'}>
                          Dashboard
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        {plan.features.taxgpt ? (
                          <span className="text-accent">✓</span>
                        ) : (
                          <span className="text-text-light">✗</span>
                        )}
                        <span className={plan.features.taxgpt ? 'text-text' : 'text-text-light'}>
                          TaxGPT
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        {plan.features.taxgptPremium ? (
                          <span className="text-accent">✓</span>
                        ) : (
                          <span className="text-text-light">✗</span>
                        )}
                        <span className={plan.features.taxgptPremium ? 'text-text' : 'text-text-light'}>
                          TaxGPT Premium
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        {plan.features.fileRepository ? (
                          <span className="text-accent">✓</span>
                        ) : (
                          <span className="text-text-light">✗</span>
                        )}
                        <span className={plan.features.fileRepository ? 'text-text' : 'text-text-light'}>
                          File Repository
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        {plan.features.workingPapers ? (
                          <span className="text-accent">✓</span>
                        ) : (
                          <span className="text-text-light">✗</span>
                        )}
                        <span className={plan.features.workingPapers ? 'text-text' : 'text-text-light'}>
                          Working Papers
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        {plan.features.integrations ? (
                          <span className="text-accent">✓</span>
                        ) : (
                          <span className="text-text-light">✗</span>
                        )}
                        <span className={plan.features.integrations ? 'text-text' : 'text-text-light'}>
                          Integrations
                        </span>
                      </li>
                    </ul>
                    {!isCurrentPlan && plan.id !== 'free' && (
                      <button
                        disabled
                        className="w-full btn btn--primary opacity-50 cursor-not-allowed"
                        title="Paid plans coming soon"
                      >
                        Coming Soon
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Note about free plan */}
          {currentPlan === 'free' && (
            <div className="bg-background p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-primary-dark mb-2">Free Plan Active</h3>
              <p className="text-text-light">
                You are on the free plan: Dashboard and TaxGPT are included. Upgrade to Basic for File Repository, or Professional
                and Enterprise for Working Papers and the integrations request workflow.
              </p>
            </div>
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default Subscription
