import { normalizeFormNumber } from './slipSchema.repository.js'

export async function upsertFormWorksheetSchema (pool, row) {
  const formNumber = normalizeFormNumber(row.formNumber)
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.form_worksheet_schemas (
      form_number, title, form_family, schema_status, landing_url, metadata, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, now())
    ON CONFLICT (form_number) DO UPDATE SET
      title = EXCLUDED.title,
      form_family = EXCLUDED.form_family,
      schema_status = EXCLUDED.schema_status,
      landing_url = COALESCE(EXCLUDED.landing_url, taxgpt.form_worksheet_schemas.landing_url),
      metadata = taxgpt.form_worksheet_schemas.metadata || EXCLUDED.metadata,
      updated_at = now()
    RETURNING *`,
    [
      formNumber,
      row.title,
      row.formFamily || 't1_form',
      row.schemaStatus || 'complete',
      row.landingUrl || null,
      JSON.stringify(row.metadata || {})
    ]
  )
  return rows[0]
}

export async function replaceFormWorksheetFields (pool, schemaId, sections = []) {
  await pool.query('DELETE FROM taxgpt.form_worksheet_fields WHERE form_worksheet_schema_id = $1::uuid', [schemaId])
  let sortOrder = 0
  for (const section of sections) {
    for (const field of section.fields || []) {
      await pool.query(
        `INSERT INTO taxgpt.form_worksheet_fields (
          form_worksheet_schema_id, section_id, section_title, section_description,
          field_code, label, field_type, line_ref, sort_order, targets, metadata, updated_at
        )
        VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, now())`,
        [
          schemaId,
          section.id,
          section.title,
          section.description || null,
          String(field.code),
          field.label,
          field.type || 'currency',
          field.lineRef || null,
          sortOrder,
          JSON.stringify(field.targets || []),
          JSON.stringify({
            compute: field.compute || null,
            readOnly: Boolean(field.readOnly),
            placeholder: field.placeholder || null
          })
        ]
      )
      sortOrder += 1
    }
  }
}

export async function listFormWorksheetSchemasWithFields (pool) {
  const { rows: schemas } = await pool.query(
    `SELECT *
     FROM taxgpt.form_worksheet_schemas
     ORDER BY form_number ASC`
  )
  if (!schemas.length) return []

  const { rows: fields } = await pool.query(
    `SELECT *
     FROM taxgpt.form_worksheet_fields
     WHERE form_worksheet_schema_id = ANY($1::uuid[])
     ORDER BY sort_order ASC`,
    [schemas.map((row) => row.id)]
  )

  const fieldsBySchema = new Map()
  for (const field of fields) {
    const bucket = fieldsBySchema.get(field.form_worksheet_schema_id) || []
    bucket.push(field)
    fieldsBySchema.set(field.form_worksheet_schema_id, bucket)
  }

  return schemas.map((schema) => ({
    ...schema,
    fields: fieldsBySchema.get(schema.id) || []
  }))
}

export async function getFormWorksheetSchemaByFormNumber (pool, formNumber) {
  const code = normalizeFormNumber(formNumber)
  const { rows } = await pool.query(
    `SELECT *
     FROM taxgpt.form_worksheet_schemas
     WHERE form_number = $1`,
    [code]
  )
  const schema = rows[0]
  if (!schema) return null
  const { rows: fields } = await pool.query(
    `SELECT *
     FROM taxgpt.form_worksheet_fields
     WHERE form_worksheet_schema_id = $1::uuid
     ORDER BY sort_order ASC`,
    [schema.id]
  )
  return { ...schema, fields }
}

export async function queryFormWorksheetValuesForReturn (pool, taxReturnId, clerkUserId) {
  const { rows } = await pool.query(
    `SELECT *
     FROM taxgpt.form_worksheet_values
     WHERE tax_return_id = $1::uuid AND clerk_user_id = $2
     ORDER BY form_code ASC, taxpayer_role ASC, field_code ASC`,
    [taxReturnId, clerkUserId]
  )
  return rows
}

export async function replaceFormWorksheetValues (
  pool,
  clerkUserId,
  taxReturnId,
  formCode,
  taxpayerRole,
  values = {}
) {
  const normalizedFormCode = normalizeFormNumber(formCode)
  const role = taxpayerRole === 'spouse' ? 'spouse' : 'self'

  await pool.query(
    `DELETE FROM taxgpt.form_worksheet_values
     WHERE tax_return_id = $1::uuid
       AND clerk_user_id = $2
       AND form_code = $3
       AND taxpayer_role = $4`,
    [taxReturnId, clerkUserId, normalizedFormCode, role]
  )

  for (const [fieldCode, rawValue] of Object.entries(values)) {
    const code = String(fieldCode || '').trim()
    if (!code) continue
    const fieldType = typeof rawValue === 'number' ? 'currency' : 'text'
    const amount = fieldType === 'currency' ? Number(rawValue || 0) : null
    const textValue = fieldType === 'text' ? String(rawValue || '') : null
    if (fieldType === 'currency' && (!Number.isFinite(amount) || amount === 0)) continue
    if (fieldType === 'text' && !textValue) continue

    await pool.query(
      `INSERT INTO taxgpt.form_worksheet_values (
        clerk_user_id, tax_return_id, form_code, taxpayer_role, field_code, field_type, amount, text_value, updated_at
      )
      VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8, now())`,
      [clerkUserId, taxReturnId, normalizedFormCode, role, code, fieldType, amount, textValue]
    )
  }
}

export async function upsertFormRegistryEntry (pool, row) {
  const formNumber = normalizeFormNumber(row.formNumber)
  if (!formNumber || !row.title || !row.landingUrl) return null
  try {
    const normalizedLandingUrl = String(row.landingUrl).split('#')[0].split('?')[0]
    const { rows } = await pool.query(
      `INSERT INTO taxgpt.form_registry (
        form_number, title, landing_url, normalized_landing_url, status, form_family, metadata, catalog_discovered_at, updated_at
      )
      VALUES ($1, $2, $3, $4, 'active', $5, $6::jsonb, now(), now())
      ON CONFLICT (form_number) DO UPDATE SET
        title = EXCLUDED.title,
        landing_url = EXCLUDED.landing_url,
        normalized_landing_url = EXCLUDED.normalized_landing_url,
        status = 'active',
        form_family = EXCLUDED.form_family,
        updated_at = now()
      RETURNING form_number, title, status`,
      [
        formNumber,
        row.title,
        row.landingUrl,
        normalizedLandingUrl,
        row.formFamily || 't1_form',
        JSON.stringify(row.metadata || { seededFrom: 'form_worksheet_definitions' })
      ]
    )
    return rows[0]
  } catch (error) {
    if (error?.code === '42P01') return null
    throw error
  }
}
