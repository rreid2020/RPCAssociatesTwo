function toIsoStringOrNull (value) {
  if (!value) return null
  try {
    return new Date(value).toISOString()
  } catch {
    return null
  }
}

export function toWorkspaceSubscriptionDto (row) {
  return {
    workspace_id: row.workspace_id,
    plan_id: row.plan_id,
    status: row.status,
    interval: row.interval,
    stripe_customer_id: row.stripe_customer_id,
    stripe_subscription_id: row.stripe_subscription_id,
    cancel_at_period_end: Boolean(row.cancel_at_period_end),
    current_period_start: toIsoStringOrNull(row.current_period_start),
    current_period_end: toIsoStringOrNull(row.current_period_end),
    trial_ends_at: toIsoStringOrNull(row.trial_ends_at),
    updated_at: toIsoStringOrNull(row.updated_at)
  }
}

export function toWorkspaceEntitlementsDto (row) {
  return {
    workspace_id: row.workspace_id,
    can_access_working_papers: Boolean(row.can_access_working_papers),
    can_access_taxgpt: Boolean(row.can_access_taxgpt),
    can_use_qbo_integration: Boolean(row.can_use_qbo_integration),
    can_use_google_sheets_integration: Boolean(row.can_use_google_sheets_integration),
    can_invite_users: Boolean(row.can_invite_users),
    max_storage_mb: Number(row.max_storage_mb || 0),
    max_users: Number(row.max_users || 0),
    ai_monthly_credits: Number(row.ai_monthly_credits || 0),
    updated_at: toIsoStringOrNull(row.updated_at)
  }
}

export function toWorkspaceUsageDto (row) {
  return {
    workspace_id: row.workspace_id,
    storage_mb_used: Number(row.storage_mb_used || 0),
    active_users: Number(row.active_users || 0),
    ai_credits_used_this_month: Number(row.ai_credits_used_this_month || 0),
    billing_cycle_month: row.billing_cycle_month || null,
    updated_at: toIsoStringOrNull(row.updated_at)
  }
}
