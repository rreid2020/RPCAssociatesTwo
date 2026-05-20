export type FeatureFlagKey =
  | 'accounting_workspace'
  | 'working_papers'
  | 'qbo_connect'
  | 'google_sheets_connect'
  | 'ai_review'

export type FeatureFlagState = Record<FeatureFlagKey, boolean>

