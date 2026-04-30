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
    indianActExemptIncome: Boolean(normalizeYesNo(p.indianActExemptIncome)),
    foreignPropertyOver100k: normalizeYesNo(p.foreignPropertyOver100k),
    organDonorConsent: normalizeYesNo(p.organDonorConsent),
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
  const [profileRes, spouseRes, dependentsRes] = await Promise.all([
    conn.query(
      `SELECT marital_status, spouse_return_mode, email, mailing_address_line1, mailing_address_po_box, mailing_address_rr, mailing_city, mailing_province_code,
              mailing_postal_code, residence_province_dec31, residence_province_current, self_employment_provinces, language_correspondence,
              became_resident_date, ceased_resident_date, marital_status_change_date, deceased_date,
              elections_canadian_citizen, elections_authorize, indian_act_exempt_income, foreign_property_over_100k, organ_donor_consent,
              spouse_self_employed, spouse_net_income_23600, spouse_uccb_11700, spouse_uccb_repayment_21300
       FROM taxgpt.taxpayer_profiles
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
    indianActExemptIncome: Boolean(profileRes.rows[0]?.indian_act_exempt_income),
    foreignPropertyOver100k: profileRes.rows[0]?.foreign_property_over_100k == null ? null : Boolean(profileRes.rows[0]?.foreign_property_over_100k),
    organDonorConsent: profileRes.rows[0]?.organ_donor_consent == null ? null : Boolean(profileRes.rows[0]?.organ_donor_consent),
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

  await client.query(
    `INSERT INTO taxgpt.taxpayer_profiles
     (clerk_user_id, tax_return_id, marital_status, spouse_return_mode, email, mailing_address_line1, mailing_address_po_box, mailing_address_rr,
      mailing_city, mailing_province_code, mailing_postal_code, residence_province_dec31, residence_province_current, self_employment_provinces,
      language_correspondence, became_resident_date, ceased_resident_date, marital_status_change_date, deceased_date,
      elections_canadian_citizen, elections_authorize, indian_act_exempt_income, foreign_property_over_100k, organ_donor_consent,
      spouse_self_employed, spouse_net_income_23600, spouse_uccb_11700, spouse_uccb_repayment_21300, updated_at)
     VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, now())
     ON CONFLICT (tax_return_id)
     DO UPDATE SET marital_status = EXCLUDED.marital_status,
                   spouse_return_mode = EXCLUDED.spouse_return_mode,
                   email = EXCLUDED.email,
                   mailing_address_line1 = EXCLUDED.mailing_address_line1,
                   mailing_address_po_box = EXCLUDED.mailing_address_po_box,
                   mailing_address_rr = EXCLUDED.mailing_address_rr,
                   mailing_city = EXCLUDED.mailing_city,
                   mailing_province_code = EXCLUDED.mailing_province_code,
                   mailing_postal_code = EXCLUDED.mailing_postal_code,
                   residence_province_dec31 = EXCLUDED.residence_province_dec31,
                   residence_province_current = EXCLUDED.residence_province_current,
                   self_employment_provinces = EXCLUDED.self_employment_provinces,
                   language_correspondence = EXCLUDED.language_correspondence,
                   became_resident_date = EXCLUDED.became_resident_date,
                   ceased_resident_date = EXCLUDED.ceased_resident_date,
                   marital_status_change_date = EXCLUDED.marital_status_change_date,
                   deceased_date = EXCLUDED.deceased_date,
                   elections_canadian_citizen = EXCLUDED.elections_canadian_citizen,
                   elections_authorize = EXCLUDED.elections_authorize,
                   indian_act_exempt_income = EXCLUDED.indian_act_exempt_income,
                   foreign_property_over_100k = EXCLUDED.foreign_property_over_100k,
                   organ_donor_consent = EXCLUDED.organ_donor_consent,
                   spouse_self_employed = EXCLUDED.spouse_self_employed,
                   spouse_net_income_23600 = EXCLUDED.spouse_net_income_23600,
                   spouse_uccb_11700 = EXCLUDED.spouse_uccb_11700,
                   spouse_uccb_repayment_21300 = EXCLUDED.spouse_uccb_repayment_21300,
                   updated_at = now()`,
    [
      clerkUserId,
      taxReturnId,
      maritalStatus,
      spouseReturnMode,
      String(profile.email || '').trim() || null,
      String(profile.mailingAddressLine1 || '').trim() || null,
      String(profile.mailingPoBox || '').trim() || null,
      String(profile.mailingRR || '').trim() || null,
      String(profile.mailingCity || '').trim() || null,
      String(profile.mailingProvinceCode || '').trim() || null,
      String(profile.mailingPostalCode || '').trim() || null,
      String(profile.residenceProvinceDec31 || '').trim() || null,
      String(profile.residenceProvinceCurrent || '').trim() || null,
      String(profile.selfEmploymentProvinces || '').trim() || null,
      String(profile.languageCorrespondence || 'en').toLowerCase() === 'fr' ? 'fr' : 'en',
      profile.becameResidentDate || null,
      profile.ceasedResidentDate || null,
      profile.maritalStatusChangeDate || null,
      profile.deceasedDate || null,
      toBoolOrNull(profile.electionsCanadianCitizen),
      toBoolOrNull(profile.electionsAuthorize),
      Boolean(profile.indianActExemptIncome),
      toBoolOrNull(profile.foreignPropertyOver100k),
      toBoolOrNull(profile.organDonorConsent),
      Boolean(profile.spouseSelfEmployed),
      Number(profile.spouseNetIncome23600 || 0),
      Number(profile.spouseUccb11700 || 0),
      Number(profile.spouseUccbRepayment21300 || 0)
    ]
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

export async function listTaxReturns (pool, clerkUserId) {
  const { rows } = await pool.query(
    `SELECT tr.*,
            tp.full_name AS taxpayer_name,
            tp.first_name AS taxpayer_first_name,
            tp.last_name AS taxpayer_last_name,
            tp.sin AS taxpayer_sin,
            tp.date_of_birth AS taxpayer_date_of_birth,
            pr.marital_status,
            pr.spouse_return_mode,
            pr.mailing_address_line1,
            pr.mailing_city,
            pr.mailing_province_code,
            pr.mailing_postal_code,
            pr.residence_province_dec31,
            pr.elections_canadian_citizen,
            pr.elections_authorize,
            pr.foreign_property_over_100k,
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
      mailingAddressLine1: row.mailing_address_line1 || '',
      mailingCity: row.mailing_city || '',
      mailingProvinceCode: row.mailing_province_code || '',
      mailingPostalCode: row.mailing_postal_code || '',
      residenceProvinceDec31: row.residence_province_dec31 || '',
      electionsCanadianCitizen: row.elections_canadian_citizen,
      electionsAuthorize: row.elections_authorize,
      foreignPropertyOver100k: row.foreign_property_over_100k,
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
