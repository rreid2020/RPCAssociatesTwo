async function assertReturnOwnership (pool, clerkUserId, taxReturnId) {
  const { rows } = await pool.query(
    'SELECT id FROM taxgpt.tax_returns WHERE id = $1::uuid AND clerk_user_id = $2',
    [taxReturnId, clerkUserId]
  )
  return Boolean(rows[0])
}

export async function listIncomeEntries (pool, clerkUserId, taxReturnId) {
  const ok = await assertReturnOwnership(pool, clerkUserId, taxReturnId)
  if (!ok) return null
  const { rows } = await pool.query(
    `SELECT *
     FROM taxgpt.income_entries
     WHERE tax_return_id = $1::uuid AND clerk_user_id = $2
     ORDER BY created_at ASC`,
    [taxReturnId, clerkUserId]
  )
  return rows
}

export async function upsertIncomeEntries (pool, clerkUserId, taxReturnId, entries = []) {
  const ok = await assertReturnOwnership(pool, clerkUserId, taxReturnId)
  if (!ok) return null

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      'DELETE FROM taxgpt.income_entries WHERE tax_return_id = $1::uuid AND clerk_user_id = $2',
      [taxReturnId, clerkUserId]
    )
    for (const entry of entries) {
      await client.query(
        `INSERT INTO taxgpt.income_entries
         (clerk_user_id, tax_return_id, source_type, source_ref_id, category, description, amount, currency, is_manual, metadata, updated_at)
         VALUES ($1, $2::uuid, $3, $4::uuid, $5, $6, $7, $8, $9, $10::jsonb, now())`,
        [
          clerkUserId,
          taxReturnId,
          entry.sourceType || 'manual',
          entry.sourceRefId || null,
          entry.category || 'other_income',
          entry.description || null,
          Number(entry.amount || 0),
          entry.currency || 'CAD',
          entry.isManual !== false,
          JSON.stringify(entry.metadata || {})
        ]
      )
    }
    await client.query('COMMIT')
  } catch (e) {
    try { await client.query('ROLLBACK') } catch {}
    throw e
  } finally {
    client.release()
  }
  return listIncomeEntries(pool, clerkUserId, taxReturnId)
}

export async function listDeductions (pool, clerkUserId, taxReturnId) {
  const ok = await assertReturnOwnership(pool, clerkUserId, taxReturnId)
  if (!ok) return null
  const { rows } = await pool.query(
    `SELECT *
     FROM taxgpt.deductions
     WHERE tax_return_id = $1::uuid AND clerk_user_id = $2
     ORDER BY created_at ASC`,
    [taxReturnId, clerkUserId]
  )
  return rows
}

export async function upsertDeductions (pool, clerkUserId, taxReturnId, entries = []) {
  const ok = await assertReturnOwnership(pool, clerkUserId, taxReturnId)
  if (!ok) return null
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      'DELETE FROM taxgpt.deductions WHERE tax_return_id = $1::uuid AND clerk_user_id = $2',
      [taxReturnId, clerkUserId]
    )
    for (const entry of entries) {
      await client.query(
        `INSERT INTO taxgpt.deductions
         (clerk_user_id, tax_return_id, category, description, amount, is_credit, metadata, updated_at)
         VALUES ($1, $2::uuid, $3, $4, $5, $6, $7::jsonb, now())`,
        [
          clerkUserId,
          taxReturnId,
          entry.category || 'other_deduction',
          entry.description || null,
          Number(entry.amount || 0),
          Boolean(entry.isCredit),
          JSON.stringify(entry.metadata || {})
        ]
      )
    }
    await client.query('COMMIT')
  } catch (e) {
    try { await client.query('ROLLBACK') } catch {}
    throw e
  } finally {
    client.release()
  }
  return listDeductions(pool, clerkUserId, taxReturnId)
}
