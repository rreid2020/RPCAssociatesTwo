import { FC, ReactNode } from 'react'
import { useSubscriptionPlan } from '../../../lib/subscriptions/hooks'
import UpgradePrompt from '../../../components/UpgradePrompt'

type Props = {
  children: ReactNode
  requirePaidPlan?: boolean
  featureName?: string
}

const SubscriptionGuard: FC<Props> = ({ children, requirePaidPlan = false, featureName = 'This feature' }) => {
  const plan = useSubscriptionPlan()
  if (requirePaidPlan && plan.id === 'FREE') {
    return <UpgradePrompt feature={featureName} />
  }
  return <>{children}</>
}

export default SubscriptionGuard
