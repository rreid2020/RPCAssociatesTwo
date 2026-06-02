import { portalFetch } from '../../lib/portalApi'

export type TrialBalanceReviewStatus = 'needs_work' | 'in_review' | 'complete'

export type TrialBalanceAccount = {
  id: string
  account_number: string | null
  account_name: string
  account_type?: string
  current_period_balance: string | number
  prior_period_balance: string | number | null
  variance_amount: string | number | null
  variance_percent: string | number | null
  variance_label: string | null
  is_material: boolean
  is_unusual: boolean
  adjustment_debit?: string | number
  adjustment_credit?: string | number
  review_status?: TrialBalanceReviewStatus | string
  workpaper_note?: string | null
}

export type TrialBalanceAccountWorkingPaperPatch = {
  adjustmentDebit?: number
  adjustmentCredit?: number
  reviewStatus?: TrialBalanceReviewStatus
  workpaperNote?: string | null
}

export async function fetchTrialBalanceAccountsDomain (getToken: () => Promise<string | null>, engagementId: string) {
  return portalFetch<{ accounts: TrialBalanceAccount[] }>(`/v1/accounting/engagements/${engagementId}/trial-balance/accounts`, getToken)
}

export async function patchTrialBalanceAccountWorkingPaperDomain (
  getToken: () => Promise<string | null>,
  accountId: string,
  patch: TrialBalanceAccountWorkingPaperPatch
) {
  return portalFetch<{ account: TrialBalanceAccount }>(
    `/v1/accounting/trial-balance/accounts/${encodeURIComponent(accountId)}/working-paper`,
    getToken,
    {
      method: 'PATCH',
      body: JSON.stringify(patch)
    }
  )
}
