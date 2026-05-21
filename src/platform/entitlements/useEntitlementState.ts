import { useFeatureAccess } from '../../lib/subscriptions/hooks'

export function useEntitlementState () {
  const workingPapers = useFeatureAccess('workingPapers')
  const integrations = useFeatureAccess('integrations')
  return {
    workingPapers,
    integrations
  }
}
