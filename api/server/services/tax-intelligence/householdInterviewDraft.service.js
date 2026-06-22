function normalizeStep (value) {
  const step = Number(value)
  if (step >= 4) return 4
  if (step === 3 || step === 2) return step
  return 1
}

export async function getHouseholdInterviewDraft (pool, clerkUserId) {
  const { rows } = await pool.query(
    `SELECT current_step, draft_json, updated_at
     FROM taxgpt.household_interview_drafts
     WHERE clerk_user_id = $1`,
    [clerkUserId]
  )
  const row = rows[0]
  if (!row) return null
  return {
    step: normalizeStep(row.current_step),
    draft: row.draft_json && typeof row.draft_json === 'object' ? row.draft_json : {},
    updatedAt: row.updated_at
  }
}

export async function saveHouseholdInterviewDraft (pool, clerkUserId, payload = {}) {
  const step = normalizeStep(payload.step)
  const draft = payload.draft && typeof payload.draft === 'object' ? payload.draft : {}
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.household_interview_drafts
       (clerk_user_id, current_step, draft_json, updated_at)
     VALUES ($1, $2, $3::jsonb, now())
     ON CONFLICT (clerk_user_id) DO UPDATE
       SET current_step = EXCLUDED.current_step,
           draft_json = EXCLUDED.draft_json,
           updated_at = now()
     RETURNING current_step, draft_json, updated_at`,
    [clerkUserId, step, JSON.stringify(draft)]
  )
  const row = rows[0]
  return {
    step: normalizeStep(row.current_step),
    draft: row.draft_json && typeof row.draft_json === 'object' ? row.draft_json : {},
    updatedAt: row.updated_at
  }
}

export async function deleteHouseholdInterviewDraft (pool, clerkUserId) {
  await pool.query(
    `DELETE FROM taxgpt.household_interview_drafts WHERE clerk_user_id = $1`,
    [clerkUserId]
  )
  return true
}
