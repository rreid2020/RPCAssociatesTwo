/**
 * Insert sample portal rows for a Clerk user (for local/staging smoke tests).
 * Usage: TARGET_CLERK_USER_ID=user_xxx node scripts/seed-portal.js
 */
import dotenv from 'dotenv'
import { createPool } from '../db/pool.js'
import { ensurePortalSchema } from '../db/ensurePortalSchema.js'

dotenv.config()

const target = process.env.TARGET_CLERK_USER_ID || 'dev_clerk_user'

async function main () {
  const pool = createPool()
  await ensurePortalSchema(pool)
  await pool.query(
    `INSERT INTO taxgpt.portal_open_items (clerk_user_id, title, description, status, due_at)
     VALUES ($1, 'Upload T2 supporting schedules', 'Please upload your year-end trial balance.', 'open', now() + interval '14 days')`,
    [target]
  )
  await pool.query(
    `INSERT INTO taxgpt.portal_deadlines (clerk_user_id, title, due_at, category)
     VALUES ($1, 'Corporate tax instalment', now() + interval '30 days', 'Tax')`,
    [target]
  )
  await pool.query(
    `INSERT INTO taxgpt.portal_activity (clerk_user_id, kind, title, body)
     VALUES ($1, 'note', 'Welcome to the client portal', 'Your team can add tasks and deadlines here.')`,
    [target]
  )
  console.log('Seeded portal data for', target)
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
