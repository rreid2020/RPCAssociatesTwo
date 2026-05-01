function normalizeMaritalStatus (v) {
  const value = String(v || '').toLowerCase().trim()
  if (['single', 'married', 'common_law', 'separated', 'divorced', 'widowed'].includes(value)) return value
  return 'single'
}

function normalizeSpouseReturnMode (v) {
  const value = String(v || '').toLowerCase().trim()
  if (value === 'full') return 'full'
  return 'summary'
}

function normalizeYesNo (v) {
  if (v === true) return true
  if (v === false) return false
  const value = String(v || '').toLowerCase().trim()
  if (value === 'yes') return true
  if (value === 'no') return false
  if (value === 'true' || value === '1') return true
  if (value === 'false' || value === '0') return false
  return null
}

function sanitizeSin (v) {
  return String(v || '').replace(/\D/g, '').slice(0, 9)
}

async function getColumnSet (conn, tableName) {
  const { rows } = await conn.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'taxgpt' AND table_name = $1`,
    [tableName]
  )
  return new Set(rows.map((r) => String(r.column_name || '').toLowerCase()))
}

function selectExpr (availableColumns, name, castType = 'text') {
  if (availableColumns.has(name)) return `pr.${name}`
  return `NULL::${castType} AS ${name}`
}

function readLegacyProfileFromSetup (setupJson) {
  const setup = setupJson && typeof setupJson === 'object' ? setupJson : {}
  const p = setup.taxpayerProfile && typeof setup.taxpayerProfile === 'object' ? setup.taxpayerProfile : {}
  const spouse = p.spouse && typeof p.spouse === 'object' ? p.spouse : {}
  const dependents = Array.isArray(p.dependents) ? p.dependents : []
  return {
    maritalStatus: normalizeMaritalStatus(p.maritalStatus),
    spouseReturnMode: normalizeSpouseReturnMode(p.spouseReturnMode),
    email: String(p.email || '').trim(),
    mailingAddressLine1: String(p.mailingAddressLine1 || '').trim(),
    mailingPoBox: String(p.mailingPoBox || '').trim(),
    mailingRR: String(p.mailingRR || '').trim(),
    mailingCity: String(p.mailingCity || '').trim(),
    mailingProvinceCode: String(p.mailingProvinceCode || '').trim(),
    mailingPostalCode: String(p.mailingPostalCode || '').trim(),
    residenceProvinceDec31: String(p.residenceProvinceDec31 || '').trim(),
    residenceProvinceCurrent: String(p.residenceProvinceCurrent || '').trim(),
    selfEmploymentProvinces: String(p.selfEmploymentProvinces || '').trim(),
    languageCorrespondence: String(p.languageCorrespondence || 'en').toLowerCase() === 'fr' ? 'fr' : 'en',
    becameResidentDate: p.becameResidentDate || null,
    ceasedResidentDate: p.ceasedResidentDate || null,
    maritalStatusChangeDate: p.maritalStatusChangeDate || null,
    deceasedDate: p.deceasedDate || null,
    electionsCanadianCitizen: normalizeYesNo(p.electionsCanadianCitizen),
    electionsAuthorize: normalizeYesNo(p.electionsAuthorize),
    firstTimeFiler: normalizeYesNo(p.firstTimeFiler),
    soldPrincipalResidence: normalizeYesNo(p.soldPrincipalResidence),
    treatyExemptForeignService: normalizeYesNo(p.treatyExemptForeignService),
    indianActExemptIncome: Boolean(normalizeYesNo(p.indianActExemptIncome)),
    foreignPropertyOver100k: normalizeYesNo(p.foreignPropertyOver100k),
    organDonorConsent: normalizeYesNo(p.organDonorConsent),
    craEmailNotificationsConsent: normalizeYesNo(p.craEmailNotificationsConsent),
    craEmailConfirmed: normalizeYesNo(p.craEmailConfirmed),
    craHasForeignMailingAddress: normalizeYesNo(p.craHasForeignMailingAddress),
    spouseSameAddress: p.spouseSameAddress == null ? true : Boolean(normalizeYesNo(p.spouseSameAddress)),
    spouseSelfEmployed: Boolean(p.spouseSelfEmployed),
    spouseNetIncome23600: Number(p.spouseNetIncome23600 || 0),
    spouseUccb11700: Number(p.spouseUccb11700 || 0),
    spouseUccbRepayment21300: Number(p.spouseUccbRepayment21300 || 0),
    spouse: {
      fullName: String(spouse.fullName || '').trim(),
      firstName: String(spouse.firstName || '').trim(),
      lastName: String(spouse.lastName || '').trim(),
      dateOfBirth: spouse.dateOfBirth || null,
      fullSin: sanitizeSin(spouse.fullSin || spouse.sin || ''),
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
  const profileColumns = await getColumnSet(conn, 'taxpayer_profiles')
  const profileSelect = [
    'pr.marital_status',
    'pr.spouse_return_mode',
    'pr.email',
    'pr.mailing_address_line1',
    'pr.mailing_address_po_box',
    'pr.mailing_address_rr',
    'pr.mailing_city',
    'pr.mailing_province_code',
    'pr.mailing_postal_code',
    'pr.residence_province_dec31',
    'pr.residence_province_current',
    'pr.self_employment_provinces',
    'pr.language_correspondence',
    'pr.became_resident_date',
    'pr.ceased_resident_date',
    'pr.marital_status_change_date',
    'pr.deceased_date',
    'pr.elections_canadian_citizen',
    'pr.elections_authorize',
    selectExpr(profileColumns, 'first_time_filer', 'boolean'),
    selectExpr(profileColumns, 'sold_principal_residence', 'boolean'),
    selectExpr(profileColumns, 'treaty_exempt_foreign_service', 'boolean'),
    'pr.indian_act_exempt_income',
    'pr.foreign_property_over_100k',
    'pr.organ_donor_consent',
    selectExpr(profileColumns, 'cra_email_notifications_consent', 'boolean'),
    selectExpr(profileColumns, 'cra_email_confirmed', 'boolean'),
    selectExpr(profileColumns, 'cra_has_foreign_mailing_address', 'boolean'),
    selectExpr(profileColumns, 'spouse_same_address', 'boolean'),
    'pr.spouse_self_employed',
    'pr.spouse_net_income_23600',
    'pr.spouse_uccb_11700',
    'pr.spouse_uccb_repayment_21300'
  ].join(',\n              ')

  const [profileRes, spouseRes, dependentsRes] = await Promise.all([
    conn.query(
      `SELECT ${profileSelect}
       FROM taxgpt.taxpayer_profiles
       pr
       WHERE clerk_user_id = $1 AND tax_return_id = $2::uuid`,
      [clerkUserId, taxReturnId]
    ),
    conn.query(
      `SELECT full_name, first_name, last_name, date_of_birth, full_sin, sin_last4, net_income
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
    spouseReturnMode: normalizeSpouseReturnMode(profileRes.rows[0]?.spouse_return_mode),
    email: String(profileRes.rows[0]?.email || ''),
    mailingAddressLine1: String(profileRes.rows[0]?.mailing_address_line1 || ''),
    mailingPoBox: String(profileRes.rows[0]?.mailing_address_po_box || ''),
    mailingRR: String(profileRes.rows[0]?.mailing_address_rr || ''),
    mailingCity: String(profileRes.rows[0]?.mailing_city || ''),
    mailingProvinceCode: String(profileRes.rows[0]?.mailing_province_code || ''),
    mailingPostalCode: String(profileRes.rows[0]?.mailing_postal_code || ''),
    residenceProvinceDec31: String(profileRes.rows[0]?.residence_province_dec31 || ''),
    residenceProvinceCurrent: String(profileRes.rows[0]?.residence_province_current || ''),
    selfEmploymentProvinces: String(profileRes.rows[0]?.self_employment_provinces || ''),
    languageCorrespondence: String(profileRes.rows[0]?.language_correspondence || 'en'),
    becameResidentDate: profileRes.rows[0]?.became_resident_date || null,
    ceasedResidentDate: profileRes.rows[0]?.ceased_resident_date || null,
    maritalStatusChangeDate: profileRes.rows[0]?.marital_status_change_date || null,
    deceasedDate: profileRes.rows[0]?.deceased_date || null,
    electionsCanadianCitizen: profileRes.rows[0]?.elections_canadian_citizen == null ? null : Boolean(profileRes.rows[0]?.elections_canadian_citizen),
    electionsAuthorize: profileRes.rows[0]?.elections_authorize == null ? null : Boolean(profileRes.rows[0]?.elections_authorize),
    firstTimeFiler: profileRes.rows[0]?.first_time_filer == null ? null : Boolean(profileRes.rows[0]?.first_time_filer),
    soldPrincipalResidence: profileRes.rows[0]?.sold_principal_residence == null ? null : Boolean(profileRes.rows[0]?.sold_principal_residence),
    treatyExemptForeignService: profileRes.rows[0]?.treaty_exempt_foreign_service == null ? null : Boolean(profileRes.rows[0]?.treaty_exempt_foreign_service),
    indianActExemptIncome: Boolean(profileRes.rows[0]?.indian_act_exempt_income),
    foreignPropertyOver100k: profileRes.rows[0]?.foreign_property_over_100k == null ? null : Boolean(profileRes.rows[0]?.foreign_property_over_100k),
    organDonorConsent: profileRes.rows[0]?.organ_donor_consent == null ? null : Boolean(profileRes.rows[0]?.organ_donor_consent),
    craEmailNotificationsConsent: profileRes.rows[0]?.cra_email_notifications_consent == null ? null : Boolean(profileRes.rows[0]?.cra_email_notifications_consent),
    craEmailConfirmed: profileRes.rows[0]?.cra_email_confirmed == null ? null : Boolean(profileRes.rows[0]?.cra_email_confirmed),
    craHasForeignMailingAddress: profileRes.rows[0]?.cra_has_foreign_mailing_address == null ? null : Boolean(profileRes.rows[0]?.cra_has_foreign_mailing_address),
    spouseSameAddress: profileRes.rows[0]?.spouse_same_address == null ? true : Boolean(profileRes.rows[0]?.spouse_same_address),
    spouseSelfEmployed: Boolean(profileRes.rows[0]?.spouse_self_employed),
    spouseNetIncome23600: Number(profileRes.rows[0]?.spouse_net_income_23600 || 0),
    spouseUccb11700: Number(profileRes.rows[0]?.spouse_uccb_11700 || 0),
    spouseUccbRepayment21300: Number(profileRes.rows[0]?.spouse_uccb_repayment_21300 || 0),
    spouse: {
      fullName: String(spouseRes.rows[0]?.full_name || ''),
      firstName: String(spouseRes.rows[0]?.first_name || ''),
      lastName: String(spouseRes.rows[0]?.last_name || ''),
      dateOfBirth: spouseRes.rows[0]?.date_of_birth || null,
      fullSin: String(spouseRes.rows[0]?.full_sin || ''),
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
  const spouseReturnMode = normalizeSpouseReturnMode(profile.spouseReturnMode)
  const toBoolOrNull = (v) => {
    if (v == null || v === '') return null
    const normalized = normalizeYesNo(v)
    if (normalized == null) return null
    return normalized
  }

  const profileColumns = await getColumnSet(client, 'taxpayer_profiles')
  const columnBindings = [
    ['marital_status', maritalStatus],
    ['spouse_return_mode', spouseReturnMode],
    ['email', String(profile.email || '').trim() || null],
    ['mailing_address_line1', String(profile.mailingAddressLine1 || '').trim() || null],
    ['mailing_address_po_box', String(profile.mailingPoBox || '').trim() || null],
    ['mailing_address_rr', String(profile.mailingRR || '').trim() || null],
    ['mailing_city', String(profile.mailingCity || '').trim() || null],
    ['mailing_province_code', String(profile.mailingProvinceCode || '').trim() || null],
    ['mailing_postal_code', String(profile.mailingPostalCode || '').trim() || null],
    ['residence_province_dec31', String(profile.residenceProvinceDec31 || '').trim() || null],
    ['residence_province_current', String(profile.residenceProvinceCurrent || '').trim() || null],
    ['self_employment_provinces', String(profile.selfEmploymentProvinces || '').trim() || null],
    ['language_correspondence', String(profile.languageCorrespondence || 'en').toLowerCase() === 'fr' ? 'fr' : 'en'],
    ['became_resident_date', profile.becameResidentDate || null],
    ['ceased_resident_date', profile.ceasedResidentDate || null],
    ['marital_status_change_date', profile.maritalStatusChangeDate || null],
    ['deceased_date', profile.deceasedDate || null],
    ['elections_canadian_citizen', toBoolOrNull(profile.electionsCanadianCitizen)],
    ['elections_authorize', toBoolOrNull(profile.electionsAuthorize)],
    ['first_time_filer', toBoolOrNull(profile.firstTimeFiler)],
    ['sold_principal_residence', toBoolOrNull(profile.soldPrincipalResidence)],
    ['treaty_exempt_foreign_service', toBoolOrNull(profile.treatyExemptForeignService)],
    ['indian_act_exempt_income', Boolean(profile.indianActExemptIncome)],
    ['foreign_property_over_100k', toBoolOrNull(profile.foreignPropertyOver100k)],
    ['organ_donor_consent', toBoolOrNull(profile.organDonorConsent)],
    ['cra_email_notifications_consent', toBoolOrNull(profile.craEmailNotificationsConsent)],
    ['cra_email_confirmed', toBoolOrNull(profile.craEmailConfirmed)],
    ['cra_has_foreign_mailing_address', toBoolOrNull(profile.craHasForeignMailingAddress)],
    ['spouse_same_address', profile.spouseSameAddress == null ? true : Boolean(profile.spouseSameAddress)],
    ['spouse_self_employed', Boolean(profile.spouseSelfEmployed)],
    ['spouse_net_income_23600', Number(profile.spouseNetIncome23600 || 0)],
    ['spouse_uccb_11700', Number(profile.spouseUccb11700 || 0)],
    ['spouse_uccb_repayment_21300', Number(profile.spouseUccbRepayment21300 || 0)]
  ].filter(([columnName]) => profileColumns.has(String(columnName)))

  const insertColumns = ['clerk_user_id', 'tax_return_id', ...columnBindings.map(([columnName]) => String(columnName))]
  const insertValues = [clerkUserId, taxReturnId, ...columnBindings.map(([, value]) => value)]
  const placeholders = insertColumns.map((_, idx) => `$${idx + 1}`)
  const updates = columnBindings.map(([columnName]) => `${String(columnName)} = EXCLUDED.${String(columnName)}`)

  await client.query(
    `INSERT INTO taxgpt.taxpayer_profiles
     (${insertColumns.join(', ')}, updated_at)
     VALUES (${placeholders.join(', ')}, now())
     ON CONFLICT (tax_return_id)
     DO UPDATE SET ${updates.join(', ')}, updated_at = now()`,
    insertValues
  )

  const spouseFirstName = String(spouse.firstName || '').trim()
  const spouseLastName = String(spouse.lastName || '').trim()
  const spouseName = spouseReturnMode === 'full'
    ? `${spouseFirstName} ${spouseLastName}`.trim()
    : String(spouse.fullName || '').trim()
  if (spouseName) {
    const spouseSin = sanitizeSin(spouse.fullSin || spouse.sin || '')
    await client.query(
      `INSERT INTO taxgpt.taxpayer_spouses
       (clerk_user_id, tax_return_id, full_name, first_name, last_name, date_of_birth, full_sin, sin_last4, net_income, updated_at)
       VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8, $9, now())
       ON CONFLICT (tax_return_id)
       DO UPDATE SET full_name = EXCLUDED.full_name,
                     first_name = EXCLUDED.first_name,
                     last_name = EXCLUDED.last_name,
                     date_of_birth = EXCLUDED.date_of_birth,
                     full_sin = EXCLUDED.full_sin,
                     sin_last4 = EXCLUDED.sin_last4,
                     net_income = EXCLUDED.net_income,
                     updated_at = now()`,
      [
        clerkUserId,
        taxReturnId,
        spouseName,
        spouseFirstName || null,
        spouseLastName || null,
        spouse.dateOfBirth || null,
        spouseSin || null,
        (spouseSin ? spouseSin.slice(-4) : null),
        Number(spouse.netIncome || 0)
      ]
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

async function findLinkedSpouseReturnId (client, clerkUserId, primaryTaxReturnId) {
  const { rows } = await client.query(
    `SELECT id, parent_tax_return_id, workspace_role, setup_json
     FROM taxgpt.tax_returns
     WHERE clerk_user_id = $1 AND id <> $2::uuid`,
    [clerkUserId, primaryTaxReturnId]
  )
  const match = rows.find((row) => {
    const role = String(row.workspace_role || row.setup_json?.workflow?.workspaceRole || '').toLowerCase()
    const parentId = row.parent_tax_return_id || row.setup_json?.workflow?.parentTaxReturnId || null
    return role === 'spouse' && String(parentId || '') === String(primaryTaxReturnId)
  })
  return match?.id || null
}

export async function listTaxReturns (pool, clerkUserId) {
  const profileColumns = await getColumnSet(pool, 'taxpayer_profiles')
  const firstTimeFilerExpr = selectExpr(profileColumns, 'first_time_filer', 'boolean')
  const soldPrincipalResidenceExpr = selectExpr(profileColumns, 'sold_principal_residence', 'boolean')
  const treatyExemptExpr = selectExpr(profileColumns, 'treaty_exempt_foreign_service', 'boolean')
  const craEmailNotifExpr = selectExpr(profileColumns, 'cra_email_notifications_consent', 'boolean')
  const craEmailConfirmedExpr = selectExpr(profileColumns, 'cra_email_confirmed', 'boolean')
  const craForeignMailingExpr = selectExpr(profileColumns, 'cra_has_foreign_mailing_address', 'boolean')
  const { rows } = await pool.query(
    `SELECT tr.*,
            tp.full_name AS taxpayer_name,
            tp.first_name AS taxpayer_first_name,
            tp.last_name AS taxpayer_last_name,
            tp.sin AS taxpayer_sin,
            tp.date_of_birth AS taxpayer_date_of_birth,
            pr.marital_status,
            pr.spouse_return_mode,
            pr.email,
            pr.mailing_address_line1,
            pr.mailing_city,
            pr.mailing_province_code,
            pr.mailing_postal_code,
            pr.residence_province_dec31,
            pr.language_correspondence,
            pr.elections_canadian_citizen,
            pr.elections_authorize,
            ${firstTimeFilerExpr},
            ${soldPrincipalResidenceExpr},
            ${treatyExemptExpr},
            pr.foreign_property_over_100k,
            pr.organ_donor_consent,
            ${craEmailNotifExpr},
            ${craEmailConfirmedExpr},
            ${craForeignMailingExpr},
            sp.full_name AS spouse_full_name,
            sp.first_name AS spouse_first_name,
            sp.last_name AS spouse_last_name,
            sp.full_sin AS spouse_full_sin,
            sp.date_of_birth AS spouse_date_of_birth
     FROM taxgpt.tax_returns tr
     INNER JOIN taxgpt.taxpayers tp ON tp.id = tr.taxpayer_id
     LEFT JOIN taxgpt.taxpayer_profiles pr ON pr.tax_return_id = tr.id AND pr.clerk_user_id = tr.clerk_user_id
     LEFT JOIN taxgpt.taxpayer_spouses sp ON sp.tax_return_id = tr.id AND sp.clerk_user_id = tr.clerk_user_id
     WHERE tr.clerk_user_id = $1
     ORDER BY tr.tax_year DESC, tr.updated_at DESC`,
    [clerkUserId]
  )
  return rows.map((row) => ({
    ...row,
    workspace_role: row.workspace_role || row.setup_json?.workflow?.workspaceRole || 'primary',
    parent_tax_return_id: row.parent_tax_return_id || row.setup_json?.workflow?.parentTaxReturnId || null,
    related_person_name: row.related_person_name || row.setup_json?.workflow?.relatedPersonName || null,
    interview_stage: row.interview_stage || row.setup_json?.workflow?.interviewStage || null,
    taxpayer_profile: {
      maritalStatus: normalizeMaritalStatus(row.marital_status),
      spouseReturnMode: normalizeSpouseReturnMode(row.spouse_return_mode),
      email: row.email || '',
      mailingAddressLine1: row.mailing_address_line1 || '',
      mailingCity: row.mailing_city || '',
      mailingProvinceCode: row.mailing_province_code || '',
      mailingPostalCode: row.mailing_postal_code || '',
      residenceProvinceDec31: row.residence_province_dec31 || '',
      languageCorrespondence: row.language_correspondence || 'en',
      electionsCanadianCitizen: row.elections_canadian_citizen,
      electionsAuthorize: row.elections_authorize,
      firstTimeFiler: row.first_time_filer,
      soldPrincipalResidence: row.sold_principal_residence,
      treatyExemptForeignService: row.treaty_exempt_foreign_service,
      foreignPropertyOver100k: row.foreign_property_over_100k,
      organDonorConsent: row.organ_donor_consent,
      craEmailNotificationsConsent: row.cra_email_notifications_consent,
      craEmailConfirmed: row.cra_email_confirmed,
      craHasForeignMailingAddress: row.cra_has_foreign_mailing_address,
      spouse: {
        fullName: row.spouse_full_name || '',
        firstName: row.spouse_first_name || '',
        lastName: row.spouse_last_name || '',
        dateOfBirth: row.spouse_date_of_birth || null,
        fullSin: row.spouse_full_sin || ''
      }
    }
  }))
}

function splitNameParts (fullName) {
  const cleaned = String(fullName || '').trim().replace(/\s+/g, ' ')
  if (!cleaned) return { firstName: '', lastName: '' }
  const parts = cleaned.split(' ')
  if (parts.length === 1) return { firstName: cleaned, lastName: '' }
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.slice(-1).join(' ')
  }
}

function normalizeDateInput (v) {
  const value = String(v || '').trim()
  return value || null
}

function parseBoolean (v, fallback = false) {
  if (typeof v === 'boolean') return v
  const value = String(v || '').toLowerCase().trim()
  if (['true', '1', 'yes', 'y'].includes(value)) return true
  if (['false', '0', 'no', 'n'].includes(value)) return false
  return fallback
}

async function createReturnWorkspace (client, clerkUserId, payload) {
  const taxpayerSin = sanitizeSin(payload.sin || '')
  const fullName = String(payload.fullName || '').trim()
  if (!fullName) throw new Error('taxpayerName is required')
  const firstName = String(payload.firstName || '').trim()
  const lastName = String(payload.lastName || '').trim()
  const setup = payload.setup && typeof payload.setup === 'object' ? { ...payload.setup } : {}
  if (Object.prototype.hasOwnProperty.call(setup, 'taxpayerProfile')) delete setup.taxpayerProfile

  const { rows: taxpayerRows } = await client.query(
    `INSERT INTO taxgpt.taxpayers
     (clerk_user_id, full_name, first_name, last_name, sin, sin_last4, date_of_birth, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now())
     RETURNING *`,
    [
      clerkUserId,
      fullName,
      firstName || null,
      lastName || null,
      taxpayerSin || null,
      taxpayerSin ? taxpayerSin.slice(-4) : null,
      payload.dateOfBirth || null
    ]
  )
  const taxpayer = taxpayerRows[0]

  const { rows: columnRows } = await client.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'taxgpt' AND table_name = 'tax_returns'`
  )
  const availableColumns = new Set(columnRows.map((r) => String(r.column_name || '').toLowerCase()))
  const hasWorkflowColumns = (
    availableColumns.has('workspace_role') &&
    availableColumns.has('parent_tax_return_id') &&
    availableColumns.has('related_person_name') &&
    availableColumns.has('interview_stage')
  )

  let effectiveSetup = setup
  if (!hasWorkflowColumns) {
    effectiveSetup = {
      ...setup,
      workflow: {
        ...(setup?.workflow && typeof setup.workflow === 'object' ? setup.workflow : {}),
        workspaceRole: String(payload.workspaceRole || 'primary'),
        parentTaxReturnId: payload.parentTaxReturnId || null,
        relatedPersonName: payload.relatedPersonName || null,
        interviewStage: payload.interviewStage || 'setup'
      }
    }
  }

  let returnRows
  if (hasWorkflowColumns) {
    ({ rows: returnRows } = await client.query(
      `INSERT INTO taxgpt.tax_returns
       (clerk_user_id, taxpayer_id, tax_year, status, workspace_role, parent_tax_return_id, related_person_name, interview_stage, title, province_code, setup_json, review_notes, updated_at)
       VALUES ($1, $2, $3, 'draft', $4, $5, $6, $7, $8, $9, $10::jsonb, $11, now())
       RETURNING *`,
      [
        clerkUserId,
        taxpayer.id,
        payload.taxYear,
        String(payload.workspaceRole || 'primary'),
        payload.parentTaxReturnId || null,
        payload.relatedPersonName || null,
        payload.interviewStage || 'setup',
        payload.title || `${payload.taxYear} T1 Return`,
        payload.provinceCode || 'ON',
        JSON.stringify(effectiveSetup),
        payload.reviewNotes || null
      ]
    ))
  } else {
    ({ rows: returnRows } = await client.query(
      `INSERT INTO taxgpt.tax_returns
       (clerk_user_id, taxpayer_id, tax_year, status, title, province_code, setup_json, review_notes, updated_at)
       VALUES ($1, $2, $3, 'draft', $4, $5, $6::jsonb, $7, now())
       RETURNING *`,
      [
        clerkUserId,
        taxpayer.id,
        payload.taxYear,
        payload.title || `${payload.taxYear} T1 Return`,
        payload.provinceCode || 'ON',
        JSON.stringify(effectiveSetup),
        payload.reviewNotes || null
      ]
    ))
  }
  return { taxpayer, taxReturn: returnRows[0] }
}

export async function createTaxReturn (pool, clerkUserId, payload) {
  const taxYear = Number(payload.taxYear)
  if (!Number.isInteger(taxYear) || taxYear < 2000 || taxYear > 2100) {
    throw new Error('taxYear must be a valid year')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const interview = payload.interview && typeof payload.interview === 'object' ? payload.interview : null
    if (interview) {
      const main = interview.mainTaxpayer && typeof interview.mainTaxpayer === 'object' ? interview.mainTaxpayer : {}
      const household = interview.household && typeof interview.household === 'object' ? interview.household : {}
      const spouse = interview.spouse && typeof interview.spouse === 'object' ? interview.spouse : {}
      const cra = interview.cra && typeof interview.cra === 'object' ? interview.cra : {}
      const dependentItems = Array.isArray(interview.dependents) ? interview.dependents : []

      const mainFullName = String(main.fullName || payload.taxpayerName || '').trim()
      if (!mainFullName) throw new Error('taxpayerName is required')
      const fallbackMainParts = splitNameParts(mainFullName)
      const mainFirstName = String(main.firstName || payload.firstName || fallbackMainParts.firstName).trim()
      const mainLastName = String(main.lastName || payload.lastName || fallbackMainParts.lastName).trim()
      const maritalStatus = normalizeMaritalStatus(household.maritalStatus || main.maritalStatus)
      const married = maritalStatus === 'married' || maritalStatus === 'common_law'
      const spouseReturnMode = normalizeSpouseReturnMode(household.spouseReturnMode || 'summary')

      const spouseSummaryName = String(
        spouse.fullName ||
        spouse.summaryName ||
        household.spouseFullName ||
        ''
      ).trim()
      const spouseFirstName = String(spouse.firstName || '').trim()
      const spouseLastName = String(spouse.lastName || '').trim()
      const spouseFullName = spouseReturnMode === 'full'
        ? `${spouseFirstName} ${spouseLastName}`.trim()
        : spouseSummaryName

      const normalizedDependents = dependentItems
        .map((d) => ({
          fullName: String(d?.fullName || '').trim(),
          relationship: String(d?.relationship || '').trim(),
          dateOfBirth: normalizeDateInput(d?.dateOfBirth),
          disability: parseBoolean(d?.disability, false),
          createWorkspace: parseBoolean(d?.createWorkspace, false)
        }))
        .filter((d) => d.fullName)

      const mainWorkspace = await createReturnWorkspace(client, clerkUserId, {
        taxYear,
        fullName: mainFullName,
        firstName: mainFirstName,
        lastName: mainLastName,
        sin: main.sin || payload.sin,
        dateOfBirth: normalizeDateInput(main.dateOfBirth || payload.dateOfBirth),
        title: payload.title || `${taxYear} T1 Return`,
        provinceCode: main.provinceCode || payload.provinceCode || 'ON',
        setup: {
          ...(payload.setup && typeof payload.setup === 'object' ? payload.setup : {}),
          interview: { ...interview, completedAt: new Date().toISOString() }
        },
        reviewNotes: payload.reviewNotes || null,
        workspaceRole: 'primary',
        interviewStage: 'interview-complete'
      })

      await upsertTaxpayerProfileTables(client, clerkUserId, mainWorkspace.taxReturn.id, {
        maritalStatus,
        spouseReturnMode,
        spouseSameAddress: true,
        email: String(main.email || '').trim(),
        mailingAddressLine1: String(main.mailingAddressLine1 || '').trim(),
        mailingCity: String(main.mailingCity || '').trim(),
        mailingProvinceCode: String(main.mailingProvinceCode || '').trim(),
        mailingPostalCode: String(main.mailingPostalCode || '').trim(),
        residenceProvinceDec31: String(main.residenceProvinceDec31 || main.provinceCode || payload.provinceCode || 'ON').trim(),
        becameResidentDate: normalizeDateInput(cra.becameResidentDate),
        ceasedResidentDate: normalizeDateInput(cra.ceasedResidentDate),
        maritalStatusChangeDate: normalizeDateInput(cra.maritalStatusChangeDate),
        deceasedDate: normalizeDateInput(cra.deceasedDate),
        electionsCanadianCitizen: normalizeYesNo(cra.electionsCanadianCitizen),
        electionsAuthorize: normalizeYesNo(cra.electionsAuthorize),
        foreignPropertyOver100k: normalizeYesNo(cra.foreignPropertyOver100k),
        spouse: married
          ? {
              fullName: spouseFullName,
              firstName: spouseFirstName,
              lastName: spouseLastName,
              dateOfBirth: normalizeDateInput(spouse.dateOfBirth),
              fullSin: sanitizeSin(spouse.fullSin || ''),
              netIncome: Number(spouse.netIncome || 0)
            }
          : {},
        dependents: normalizedDependents.map((d) => ({
          fullName: d.fullName,
          relationship: d.relationship,
          dateOfBirth: d.dateOfBirth,
          disability: d.disability
        }))
      })

      const createdLinkedWorkspaces = []

      if (married && spouseReturnMode === 'full' && spouseFullName) {
        const spouseParts = splitNameParts(spouseFullName)
        const spouseWorkspace = await createReturnWorkspace(client, clerkUserId, {
          taxYear,
          fullName: spouseFullName,
          firstName: spouseFirstName || spouseParts.firstName,
          lastName: spouseLastName || spouseParts.lastName,
          sin: sanitizeSin(spouse.fullSin || ''),
          dateOfBirth: normalizeDateInput(spouse.dateOfBirth),
          title: `${taxYear} T1 Return — Spouse`,
          provinceCode: main.provinceCode || payload.provinceCode || 'ON',
          setup: {
            workflow: {
              source: 'household-interview',
              linkedPrimaryReturnId: mainWorkspace.taxReturn.id
            }
          },
          workspaceRole: 'spouse',
          parentTaxReturnId: mainWorkspace.taxReturn.id,
          relatedPersonName: spouseFullName,
          interviewStage: 'interview-generated'
        })
        await upsertTaxpayerProfileTables(client, clerkUserId, spouseWorkspace.taxReturn.id, {
          maritalStatus,
          spouseReturnMode: 'summary',
          spouseSameAddress: true,
          spouse: {
            fullName: mainFullName,
            firstName: mainFirstName,
            lastName: mainLastName,
            dateOfBirth: normalizeDateInput(main.dateOfBirth || payload.dateOfBirth),
            fullSin: sanitizeSin(main.sin || payload.sin || '')
          },
          dependents: []
        })
        createdLinkedWorkspaces.push({
          id: spouseWorkspace.taxReturn.id,
          role: 'spouse',
          taxpayerName: spouseWorkspace.taxpayer.full_name
        })
      }

      for (const dependent of normalizedDependents) {
        if (!dependent.createWorkspace) continue
        const dependentParts = splitNameParts(dependent.fullName)
        const dependentWorkspace = await createReturnWorkspace(client, clerkUserId, {
          taxYear,
          fullName: dependent.fullName,
          firstName: dependentParts.firstName,
          lastName: dependentParts.lastName,
          sin: '',
          dateOfBirth: dependent.dateOfBirth,
          title: `${taxYear} T1 Return — Dependent`,
          provinceCode: main.provinceCode || payload.provinceCode || 'ON',
          setup: {
            workflow: {
              source: 'household-interview',
              linkedPrimaryReturnId: mainWorkspace.taxReturn.id
            }
          },
          workspaceRole: 'dependent',
          parentTaxReturnId: mainWorkspace.taxReturn.id,
          relatedPersonName: dependent.fullName,
          interviewStage: 'interview-generated'
        })
        await upsertTaxpayerProfileTables(client, clerkUserId, dependentWorkspace.taxReturn.id, {
          maritalStatus: 'single',
          spouseReturnMode: 'summary',
          dependents: []
        })
        createdLinkedWorkspaces.push({
          id: dependentWorkspace.taxReturn.id,
          role: 'dependent',
          taxpayerName: dependentWorkspace.taxpayer.full_name
        })
      }

      await client.query('COMMIT')
      return {
        ...mainWorkspace.taxReturn,
        taxpayer_name: mainWorkspace.taxpayer.full_name,
        createdLinkedWorkspaces
      }
    }

    const fullName = String(payload.taxpayerName || '').trim()
    if (!fullName) throw new Error('taxpayerName is required')
    const workspace = await createReturnWorkspace(client, clerkUserId, {
      taxYear,
      fullName,
      firstName: String(payload.firstName || '').trim(),
      lastName: String(payload.lastName || '').trim(),
      sin: payload.sin || '',
      dateOfBirth: payload.dateOfBirth || null,
      title: payload.title || `${taxYear} T1 Return`,
      provinceCode: payload.provinceCode || 'ON',
      setup: payload.setup && typeof payload.setup === 'object' ? payload.setup : {},
      reviewNotes: payload.reviewNotes || null,
      workspaceRole: 'primary',
      interviewStage: 'setup'
    })
    const legacyFromSetup = readLegacyProfileFromSetup(payload.setup || {})
    const incomingProfile = payload.taxpayerProfile && typeof payload.taxpayerProfile === 'object' ? payload.taxpayerProfile : legacyFromSetup
    await upsertTaxpayerProfileTables(client, clerkUserId, workspace.taxReturn.id, incomingProfile)
    await client.query('COMMIT')
    return { ...workspace.taxReturn, taxpayer_name: workspace.taxpayer.full_name }
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
            tp.sin AS taxpayer_sin,
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
    const nextSin = payload.sin != null ? sanitizeSin(payload.sin) : sanitizeSin(current.taxpayer_sin || '')
    const nextSinLast4 = nextSin ? nextSin.slice(-4) : (current.taxpayer_sin_last4 || null)
    const nextDateOfBirth = payload.dateOfBirth != null ? payload.dateOfBirth : (current.taxpayer_date_of_birth || null)
    const legacyProfile = readLegacyProfileFromSetup(current.setup_json)
    const currentProfileFromTables = current.taxpayer_profile && typeof current.taxpayer_profile === 'object'
      ? current.taxpayer_profile
      : legacyProfile
    const incomingProfile = payload.taxpayerProfile && typeof payload.taxpayerProfile === 'object'
      ? payload.taxpayerProfile
      : currentProfileFromTables
    if (!Object.prototype.hasOwnProperty.call(incomingProfile, 'spouseSameAddress')) {
      incomingProfile.spouseSameAddress = true
    }

    await client.query(
      `UPDATE taxgpt.taxpayers
       SET full_name = $1,
           first_name = $2,
           last_name = $3,
           sin = $4,
           sin_last4 = $5,
           date_of_birth = $6,
           updated_at = now()
       WHERE id = $7::uuid AND clerk_user_id = $8`,
      [
        nextFullName || current.taxpayer_name,
        nextFirstName || null,
        nextLastName || null,
        nextSin || null,
        nextSinLast4 || null,
        nextDateOfBirth || null,
        current.taxpayer_id,
        clerkUserId
      ]
    )
    await upsertTaxpayerProfileTables(client, clerkUserId, taxReturnId, incomingProfile)

    const currentRole = String(current.workspace_role || current.setup_json?.workflow?.workspaceRole || 'primary')
    const married = incomingProfile.maritalStatus === 'married' || incomingProfile.maritalStatus === 'common_law'
    const spouseMode = normalizeSpouseReturnMode(incomingProfile.spouseReturnMode)
    const spouseSameAddress = incomingProfile.spouseSameAddress == null ? true : Boolean(incomingProfile.spouseSameAddress)
    if (currentRole === 'primary' && married && spouseMode === 'full' && spouseSameAddress) {
      const spouseReturnId = await findLinkedSpouseReturnId(client, clerkUserId, taxReturnId)
      if (spouseReturnId) {
        const spouseProfileExisting = await loadTaxpayerProfileFromTables(client, clerkUserId, spouseReturnId)
        await upsertTaxpayerProfileTables(client, clerkUserId, spouseReturnId, {
          ...spouseProfileExisting,
          mailingAddressLine1: incomingProfile.mailingAddressLine1 || '',
          mailingPoBox: incomingProfile.mailingPoBox || '',
          mailingRR: incomingProfile.mailingRR || '',
          mailingCity: incomingProfile.mailingCity || '',
          mailingProvinceCode: incomingProfile.mailingProvinceCode || '',
          mailingPostalCode: incomingProfile.mailingPostalCode || '',
          residenceProvinceDec31: incomingProfile.residenceProvinceDec31 || '',
          residenceProvinceCurrent: incomingProfile.residenceProvinceCurrent || '',
          spouseSameAddress: true
        })
      }
    }

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
