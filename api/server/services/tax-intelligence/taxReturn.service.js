export async function listTaxReturns (pool, clerkUserId) {
  const { rows } = await pool.query(
    `SELECT tr.*, tp.full_name AS taxpayer_name
     FROM taxgpt.tax_returns tr
     INNER JOIN taxgpt.taxpayers tp ON tp.id = tr.taxpayer_id
     WHERE tr.clerk_user_id = $1
     ORDER BY tr.tax_year DESC, tr.updated_at DESC`,
    [clerkUserId]
  )
  return rows
}

export async function createTaxReturn (pool, clerkUserId, payload) {
  const taxYear = Number(payload.taxYear)
  if (!Number.isInteger(taxYear) || taxYear < 2000 || taxYear > 2100) {
    throw new Error('taxYear must be a valid year')
  }
  const fullName = String(payload.taxpayerName || '').trim()
  if (!fullName) throw new Error('taxpayerName is required')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows: taxpayerRows } = await client.query(
      `INSERT INTO taxgpt.taxpayers
       (clerk_user_id, full_name, first_name, last_name, sin_last4, date_of_birth, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       RETURNING *`,
      [
        clerkUserId,
        fullName,
        payload.firstName || null,
        payload.lastName || null,
        payload.sinLast4 || null,
        payload.dateOfBirth || null
      ]
    )
    const taxpayer = taxpayerRows[0]

    const { rows: returnRows } = await client.query(
      `INSERT INTO taxgpt.tax_returns
       (clerk_user_id, taxpayer_id, tax_year, status, title, province_code, setup_json, review_notes, updated_at)
       VALUES ($1, $2, $3, 'draft', $4, $5, $6::jsonb, $7, now())
       RETURNING *`,
      [
        clerkUserId,
        taxpayer.id,
        taxYear,
        payload.title || `${taxYear} T1 Return`,
        payload.provinceCode || 'ON',
        JSON.stringify(payload.setup || {}),
        payload.reviewNotes || null
      ]
    )
    await client.query('COMMIT')
    return { ...returnRows[0], taxpayer_name: taxpayer.full_name }
  } catch (e) {
    try { await client.query('ROLLBACK') } catch {}
    throw e
  } finally {
    client.release()
  }
}

export async function getTaxReturnById (pool, clerkUserId, taxReturnId) {
  const { rows } = await pool.query(
    `SELECT tr.*, tp.full_name AS taxpayer_name
     FROM taxgpt.tax_returns tr
     INNER JOIN taxgpt.taxpayers tp ON tp.id = tr.taxpayer_id
     WHERE tr.id = $1::uuid AND tr.clerk_user_id = $2`,
    [taxReturnId, clerkUserId]
  )
  return rows[0] || null
}

export async function updateTaxReturn (pool, clerkUserId, taxReturnId, payload) {
  const current = await getTaxReturnById(pool, clerkUserId, taxReturnId)
  if (!current) return null

  const nextSetup = payload.setup != null ? payload.setup : current.setup_json
  const nextStatus = payload.status || current.status
  const nextTitle = payload.title || current.title
  const nextProvince = payload.provinceCode || current.province_code
  const nextNotes = payload.reviewNotes != null ? payload.reviewNotes : current.review_notes

  const { rows } = await pool.query(
    `UPDATE taxgpt.tax_returns
     SET status = $1,
         title = $2,
         province_code = $3,
         setup_json = $4::jsonb,
         review_notes = $5,
         updated_at = now()
     WHERE id = $6::uuid AND clerk_user_id = $7
     RETURNING *`,
    [nextStatus, nextTitle, nextProvince, JSON.stringify(nextSetup || {}), nextNotes, taxReturnId, clerkUserId]
  )
  return rows[0] || null
}
