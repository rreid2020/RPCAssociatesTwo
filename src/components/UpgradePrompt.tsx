import { FC } from 'react'
import { Link } from 'react-router-dom'
import { useSubscriptionPlan } from '../lib/subscriptions/hooks'

interface UpgradePromptProps {
  feature: string
  requiredPlan?: string
}

const UpgradePrompt: FC<UpgradePromptProps> = ({ feature }) => {
  const currentPlan = useSubscriptionPlan()

  return (
    <div className="bg-white p-8 rounded-lg border border-border shadow-sm text-center">
      <svg className="h-12 w-12 text-text-light mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <h2 className="text-xl font-semibold text-primary-dark mb-2">Premium Feature</h2>
      <p className="text-text-light mb-4">
        {feature} is available with a paid subscription plan.
      </p>
      {currentPlan.id === 'free' && (
        <div className="space-y-3">
          <p className="text-sm text-text-light">
            You're currently on the <strong>{currentPlan.name}</strong>. Upgrade to unlock this feature.
          </p>
          <Link to="/portal/subscription" className="btn btn--primary inline-block">
            View Subscription Plans
          </Link>
        </div>
      )}
    </div>
  )
}

export default UpgradePrompt
