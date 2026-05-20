import type { FeatureFlagKey } from './types'

export function isFeatureEnabled (flags: Partial<Record<FeatureFlagKey, boolean>>, key: FeatureFlagKey): boolean {
  return Boolean(flags[key])
}

export type { FeatureFlagKey, FeatureFlagState } from './types'

