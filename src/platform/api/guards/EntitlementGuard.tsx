import { FC, ReactNode } from 'react'
import { useFeatureAccess } from '../../../lib/subscriptions/hooks'
import UpgradePrompt from '../../../components/UpgradePrompt'

type EntitlementFeature = 'workingPapers' | 'integrations' | 'taxgpt'

type Props = {
  children: ReactNode
  feature: EntitlementFeature
  featureLabel: string
}

const EntitlementGuard: FC<Props> = ({ children, feature, featureLabel }) => {
  const allowed = useFeatureAccess(feature)
  if (!allowed) {
    return <UpgradePrompt feature={featureLabel} />
  }
  return <>{children}</>
}

export default EntitlementGuard
