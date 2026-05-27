import { portalFetch } from '../../lib/portalApi'

export type TrialBalanceAccount = {
  id: string
  account_number: string | null
  account_name: string
  current_period_balance: string | number
  prior_period_balance: string | number | null
  variance_amount: string | number | null
  variance_percent: string | number | null
  variance_label: string | null
  is_material: boolean
  is_unusual: boolean
}

export async function fetchTrialBalanceAccountsDomain (getToken: () => Promise<string | null>, engagementId: string) {
  return portalFetch<{ accounts: TrialBalanceAccount[] }>(`/v1/accounting/engagements/${engagementId}/trial-balance/accounts`, getToken)
}

