import { BILLING_PLANS } from '../billing/planCatalog.js'

const FREE_PLAN_ID = 'FREE'

export async function ensureWorkspaceBillingRows (pool, workspaceId) {
  const freePlan = BILLING_PLANS[FREE_PLAN_ID]
  await pool.query(
    `INSERT INTO taxgpt.workspace_subscriptions
     (workspace_id, plan_id, status, interval, cancel_at_period_end, created_at, updated_at)
     VALUES ($1::uuid, $2, 'none', 'monthly', false, now(), now())
     ON CONFLICT (workspace_id) DO NOTHING`,
    [workspaceId, FREE_PLAN_ID]
  )
  await pool.query(
    `INSERT INTO taxgpt.workspace_entitlements
     (workspace_id, can_access_working_papers, can_access_taxgpt, can_use_qbo_integration, can_use_google_sheets_integration,
      can_invite_users, max_storage_mb, max_users, ai_monthly_credits, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())
     ON CONFLICT (workspace_id) DO NOTHING`,
    [
      workspaceId,
      freePlan.entitlements.canAccessWorkingPapers,
      freePlan.entitlements.canAccessTaxGPT,
      freePlan.entitlements.canUseQBOIntegration,
      freePlan.entitlements.canUseGoogleSheetsIntegration,
      freePlan.entitlements.canInviteUsers,
      freePlan.entitlements.maxStorageMb,
      freePlan.entitlements.maxUsers,
      freePlan.entitlements.aiMonthlyCredits
    ]
  )
  await pool.query(
    `INSERT INTO taxgpt.workspace_usage_tracking
     (workspace_id, storage_mb_used, active_users, ai_credits_used_this_month, billing_cycle_month, created_at, updated_at)
     VALUES ($1::uuid, 0, 1, 0, to_char(now(), 'YYYY-MM'), now(), now())
     ON CONFLICT (workspace_id) DO NOTHING`,
    [workspaceId]
  )
}

export async function getWorkspaceSubscriptionRow (pool, workspaceId) {
  const { rows } = await pool.query(
    `SELECT workspace_id, plan_id, status, interval, stripe_customer_id, stripe_subscription_id,
            cancel_at_period_end, current_period_start, current_period_end, trial_ends_at, updated_at
     FROM taxgpt.workspace_subscriptions
     WHERE workspace_id = $1::uuid
     LIMIT 1`,
    [workspaceId]
  )
  return rows[0] || null
}

export async function getWorkspaceEntitlementRow (pool, workspaceId) {
  const { rows } = await pool.query(
    `SELECT workspace_id, can_access_working_papers, can_access_taxgpt, can_use_qbo_integration,
            can_use_google_sheets_integration, can_invite_users, max_storage_mb, max_users, ai_monthly_credits, updated_at
     FROM taxgpt.workspace_entitlements
     WHERE workspace_id = $1::uuid
     LIMIT 1`,
    [workspaceId]
  )
  return rows[0] || null
}

export async function getWorkspaceUsageRow (pool, workspaceId) {
  const { rows } = await pool.query(
    `SELECT workspace_id, storage_mb_used, active_users, ai_credits_used_this_month, billing_cycle_month, updated_at
     FROM taxgpt.workspace_usage_tracking
     WHERE workspace_id = $1::uuid
     LIMIT 1`,
    [workspaceId]
  )
  return rows[0] || null
}

export async function upsertWorkspaceSubscriptionRow (pool, workspaceId, patch) {
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.workspace_subscriptions
     (workspace_id, plan_id, status, interval, stripe_customer_id, stripe_subscription_id, cancel_at_period_end,
      current_period_start, current_period_end, trial_ends_at, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8::timestamp, $9::timestamp, $10::timestamp, now(), now())
     ON CONFLICT (workspace_id) DO UPDATE SET
      plan_id = EXCLUDED.plan_id,
      status = EXCLUDED.status,
      interval = EXCLUDED.interval,
      stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, taxgpt.workspace_subscriptions.stripe_customer_id),
      stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, taxgpt.workspace_subscriptions.stripe_subscription_id),
      cancel_at_period_end = EXCLUDED.cancel_at_period_end,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      trial_ends_at = EXCLUDED.trial_ends_at,
      updated_at = now()
     RETURNING *`,
    [
      workspaceId,
      patch.planId,
      patch.status,
      patch.interval,
      patch.stripeCustomerId || null,
      patch.stripeSubscriptionId || null,
      Boolean(patch.cancelAtPeriodEnd),
      patch.currentPeriodStart || null,
      patch.currentPeriodEnd || null,
      patch.trialEndsAt || null
    ]
  )
  return rows[0]
}

export async function upsertWorkspaceEntitlementsRow (pool, workspaceId, entitlements) {
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.workspace_entitlements
     (workspace_id, can_access_working_papers, can_access_taxgpt, can_use_qbo_integration, can_use_google_sheets_integration,
      can_invite_users, max_storage_mb, max_users, ai_monthly_credits, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())
     ON CONFLICT (workspace_id) DO UPDATE SET
      can_access_working_papers = EXCLUDED.can_access_working_papers,
      can_access_taxgpt = EXCLUDED.can_access_taxgpt,
      can_use_qbo_integration = EXCLUDED.can_use_qbo_integration,
      can_use_google_sheets_integration = EXCLUDED.can_use_google_sheets_integration,
      can_invite_users = EXCLUDED.can_invite_users,
      max_storage_mb = EXCLUDED.max_storage_mb,
      max_users = EXCLUDED.max_users,
      ai_monthly_credits = EXCLUDED.ai_monthly_credits,
      updated_at = now()
     RETURNING *`,
    [
      workspaceId,
      entitlements.canAccessWorkingPapers,
      entitlements.canAccessTaxGPT,
      entitlements.canUseQBOIntegration,
      entitlements.canUseGoogleSheetsIntegration,
      entitlements.canInviteUsers,
      entitlements.maxStorageMb,
      entitlements.maxUsers,
      entitlements.aiMonthlyCredits
    ]
  )
  return rows[0]
}

export async function recordWorkspaceBillingEvent (pool, payload) {
  const idempotencyKey = String(payload.idempotencyKey || '')
  if (!idempotencyKey) throw new Error('idempotencyKey is required')
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.workspace_billing_events
     (workspace_id, source, source_event_id, event_type, idempotency_key, payload_json, processed_at, created_at)
     VALUES ($1::uuid, $2, $3, $4, $5, $6::jsonb, now(), now())
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING *`,
    [
      payload.workspaceId,
      payload.source,
      payload.sourceEventId || null,
      payload.eventType,
      idempotencyKey,
      JSON.stringify(payload.payload || {})
    ]
  )
  return rows[0] || null
}
