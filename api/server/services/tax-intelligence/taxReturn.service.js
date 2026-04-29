function normalizeMaritalStatus (v) {
  const value = String(v || '').toLowerCase().trim()
  if (['single', 'married', 'common_law', 'separated', 'divorced', 'widowed'].includes(value)) return value
  return 'single'
}

function readLegacyProfileFromSetup (setupJson) {
  const setup = setupJson && typeof setupJson === 'object' ? setupJson : {}
  const p = setup.taxpayerProfile && typeof setup.taxpayerProfile === 'object' ? setup.taxpayerProfile : {}
  const spouse = p.spouse && typeof p.spouse === 'object' ? p.spouse : {}
  const dependents = Array.isArray(p.dependents) ? p.dependents : []
  return {
    maritalStatus: normalizeMaritalStatus(p.maritalStatus),
    spouse: {
      fullName: String(spouse.fullName || '').trim(),
      sinLast4: String(spouse.sinLast4 || '').trim().slice(-4),
      netIncome: Number(spouse.netIncome || 0)
    },
    dependents: dependents.map((d) => ({
      fullName: String(d?.fullName || '').trim(),
      relationship: String(d?.relationship || '').trim(),
      dateOfBirth: d?.dateOfBirth || null,
      disability: Boolean(d?.disability)
    }))
  }
}

async function loadTaxpayerProfileFromTables (conn, clerkUserId, taxReturnId) {
  const [profileRes, spouseRes, dependentsRes] = await Promise.all([
    conn.query(
      `SELECT marital_status
       FROM taxgpt.taxpayer_profiles
       WHERE clerk_user_id = $1 AND tax_return_id = $2::uuid`,
      [clerkUserId, taxReturnId]
    ),
    conn.query(
      `SELECT full_name, sin_last4, net_income
       FROM taxgpt.taxpayer_spouses
       WHERE clerk_user_id = $1 AND tax_return_id = $2::uuid`,
      [clerkUserId, taxReturnId]
    ),
    conn.query(
      `SELECT full_name, relationship, date_of_birth, has_disability
       FROM taxgpt.taxpayer_dependents
       WHERE clerk_user_id = $1 AND tax_return_id = $2::uuid
       ORDER BY sort_order ASC, created_at ASC`,
      [clerkUserId, taxReturnId]
    )
  ])

  return {
    maritalStatus: normalizeMaritalStatus(profileRes.rows[0]?.marital_status),
    spouse: {
      fullName: String(spouseRes.rows[0]?.full_name || ''),
      sinLast4: String(spouseRes.rows[0]?.sin_last4 || ''),
      netIncome: Number(spouseRes.rows[0]?.net_income || 0)
    },
    dependents: dependentsRes.rows.map((d) => ({
      fullName: String(d.full_name || ''),
      relationship: String(d.relationship || ''),
      dateOfBirth: d.date_of_birth || null,
      disability: Boolean(d.has_disability)
    }))
  }
}

async function upsertTaxpayerProfileTables (client, clerkUserId, taxReturnId, taxpayerProfile) {
  const profile = taxpayerProfile && typeof taxpayerProfile === 'object' ? taxpayerProfile : {}
  const spouse = profile.spouse && typeof profile.spouse === 'object' ? profile.spouse : {}
  const dependents = Array.isArray(profile.dependents) ? profile.dependents : []
  const maritalStatus = normalizeMaritalStatus(profile.maritalStatus)

  await client.query(
    `INSERT INTO taxgpt.taxpayer_profiles
     (clerk_user_id, tax_return_id, marital_status, updated_at)
     VALUES ($1, $2::uuid, $3, now())
     ON CONFLICT (tax_return_id)
     DO UPDATE SET marital_status = EXCLUDED.marital_status,
                   updated_at = now()`,
    [clerkUserId, taxReturnId, maritalStatus]
  )

  const spouseName = String(spouse.fullName || '').trim()
  if (spouseName) {
    await client.query(
      `INSERT INTO taxgpt.taxpayer_spouses
       (clerk_user_id, tax_return_id, full_name, sin_last4, net_income, updated_at)
       VALUES ($1, $2::uuid, $3, $4, $5, now())
       ON CONFLICT (tax_return_id)
       DO UPDATE SET full_name = EXCLUDED.full_name,
                     sin_last4 = EXCLUDED.sin_last4,
                     net_income = EXCLUDED.net_income,
                     updated_at = now()`,
      [clerkUserId, taxReturnId, spouseName, String(spouse.sinLast4 || '').trim().slice(-4) || null, Number(spouse.netIncome || 0)]
    )
  } else {
    await client.query(
      `DELETE FROM taxgpt.taxpayer_spouses
       WHERE clerk_user_id = $1 AND tax_return_id = $2::uuid`,
      [clerkUserId, taxReturnId]
    )
  }

  await client.query(
    `DELETE FROM taxgpt.taxpayer_dependents
     WHERE clerk_user_id = $1 AND tax_return_id = $2::uuid`,
    [clerkUserId, taxReturnId]
  )
  for (let i = 0; i < dependents.length; i += 1) {
    const d = dependents[i] || {}
    const fullName = String(d.fullName || '').trim()
    if (!fullName) continue
    await client.query(
      `INSERT INTO taxgpt.taxpayer_dependents
       (clerk_user_id, tax_return_id, full_name, relationship, date_of_birth, has_disability, sort_order, updated_at)
       VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, now())`,
      [
        clerkUserId,
        taxReturnId,
        fullName,
        String(d.relationship || '').trim() || null,
        d.dateOfBirth || null,
        Boolean(d.disability),
        i
      ]
    )
  }
}

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
  const firstName = String(payload.firstName || '').trim()
  const lastName = String(payload.lastName || '').trim()
  const setup = payload.setup && typeof payload.setup === 'object' ? { ...payload.setup } : {}
  if (Object.prototype.hasOwnProperty.call(setup, 'taxpayerProfile')) delete setup.taxpayerProfile

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
        firstName || null,
        lastName || null,
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
        JSON.stringify(setup),
        payload.reviewNotes || null
      ]
    )
    const legacyFromSetup = readLegacyProfileFromSetup(payload.setup || {})
    const incomingProfile = payload.taxpayerProfile && typeof payload.taxpayerProfile === 'object' ? payload.taxpayerProfile : legacyFromSetup
    await upsertTaxpayerProfileTables(client, clerkUserId, returnRows[0].id, incomingProfile)
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
    `SELECT tr.*,
            tp.full_name AS taxpayer_name,
            tp.first_name AS taxpayer_first_name,
            tp.last_name AS taxpayer_last_name,
            tp.sin_last4 AS taxpayer_sin_last4,
            tp.date_of_birth AS taxpayer_date_of_birth
     FROM taxgpt.tax_returns tr
     INNER JOIN taxgpt.taxpayers tp ON tp.id = tr.taxpayer_id
     WHERE tr.id = $1::uuid AND tr.clerk_user_id = $2`,
    [taxReturnId, clerkUserId]
  )
  const row = rows[0]
  if (!row) return null
  const profile = await loadTaxpayerProfileFromTables(pool, clerkUserId, taxReturnId)
  return { ...row, taxpayer_profile: profile }
}

export async function updateTaxReturn (pool, clerkUserId, taxReturnId, payload) {
  const current = await getTaxReturnById(pool, clerkUserId, taxReturnId)
  if (!current) return null

  const nextSetup = payload.setup != null ? payload.setup : current.setup_json
  const sanitizedSetup = nextSetup && typeof nextSetup === 'object' ? { ...nextSetup } : {}
  if (Object.prototype.hasOwnProperty.call(sanitizedSetup, 'taxpayerProfile')) delete sanitizedSetup.taxpayerProfile
  const nextStatus = payload.status || current.status
  const nextTitle = payload.title || current.title
  const nextProvince = payload.provinceCode || current.province_code
  const nextNotes = payload.reviewNotes != null ? payload.reviewNotes : current.review_notes

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const nextFullName = String(payload.taxpayerName || current.taxpayer_name || '').trim()
    const nextFirstName = payload.firstName != null ? String(payload.firstName || '').trim() : (current.taxpayer_first_name || null)
    const nextLastName = payload.lastName != null ? String(payload.lastName || '').trim() : (current.taxpayer_last_name || null)
    const nextSinLast4 = payload.sinLast4 != null ? String(payload.sinLast4 || '').trim() : (current.taxpayer_sin_last4 || null)
    const nextDateOfBirth = payload.dateOfBirth != null ? payload.dateOfBirth : (current.taxpayer_date_of_birth || null)
    const legacyProfile = readLegacyProfileFromSetup(current.setup_json)
    const currentProfileFromTables = current.taxpayer_profile && typeof current.taxpayer_profile === 'object'
      ? current.taxpayer_profile
      : legacyProfile
    const incomingProfile = payload.taxpayerProfile && typeof payload.taxpayerProfile === 'object'
      ? payload.taxpayerProfile
      : currentProfileFromTables

    await client.query(
      `UPDATE taxgpt.taxpayers
       SET full_name = $1,
           first_name = $2,
           last_name = $3,
           sin_last4 = $4,
           date_of_birth = $5,
           updated_at = now()
       WHERE id = $6::uuid AND clerk_user_id = $7`,
      [
        nextFullName || current.taxpayer_name,
        nextFirstName || null,
        nextLastName || null,
        nextSinLast4 || null,
        nextDateOfBirth || null,
        current.taxpayer_id,
        clerkUserId
      ]
    )
    await upsertTaxpayerProfileTables(client, clerkUserId, taxReturnId, incomingProfile)

    const { rows } = await client.query(
      `UPDATE taxgpt.tax_returns
       SET status = $1,
           title = $2,
           province_code = $3,
           setup_json = $4::jsonb,
           review_notes = $5,
           updated_at = now()
       WHERE id = $6::uuid AND clerk_user_id = $7
       RETURNING *`,
      [nextStatus, nextTitle, nextProvince, JSON.stringify(sanitizedSetup || {}), nextNotes, taxReturnId, clerkUserId]
    )
    await client.query('COMMIT')
    return rows[0] || null
  } catch (e) {
    try { await client.query('ROLLBACK') } catch {}
    throw e
  } finally {
    client.release()
  }
}

export async function deleteTaxReturn (pool, clerkUserId, taxReturnId) {
  const current = await getTaxReturnById(pool, clerkUserId, taxReturnId)
  if (!current) return false
  const { rowCount } = await pool.query(
    `DELETE FROM taxgpt.tax_returns
     WHERE id = $1::uuid AND clerk_user_id = $2`,
    [taxReturnId, clerkUserId]
  )
  return rowCount > 0
}
