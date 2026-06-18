const SCHEDULE_FORM_NUMBERS = new Set([
  'T2125', 'T776', 'T777', 'T2042', 'T2121', 'T1163', 'T1164', 'T1273', 'T1274',
  'T101', 'T1229', 'RC376', '5013-SA', 'TD1X', 'T5003', 'E638A'
])

const SCHEDULE_TITLE_PATTERNS = [
  /business or professional activities/i,
  /farming activities/i,
  /fishing activities/i,
  /real estate rentals/i,
  /employment expenses/i,
  /resource expenses/i,
  /deferred security options/i,
  /world income/i,
  /tax shelter information/i,
  /commission income and expenses for payroll/i,
  /taxpayer relief request/i
]

export function normalizeFormNumber (value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '')
}

export function inferPayerLabel (formNumber) {
  const code = normalizeFormNumber(formNumber)
  if (code === 'T4') return 'Employer name'
  if (code === 'T5') return 'Payer name'
  if (code === 'T3') return 'Trust name'
  if (code === 'T5013') return 'Partnership name'
  if (code === 'T2202') return 'Educational institution'
  if (code === 'T5008') return 'Broker or dealer name'
  if (code === 'T4PS') return 'Plan administrator'
  if (code === 'T5018') return 'Payer name'
  return 'Issuer name'
}

export function isInformationSlipCandidate (formNumber, title) {
  const code = normalizeFormNumber(formNumber)
  const normalizedTitle = String(title || '').trim()
  if (!code || !normalizedTitle) return false
  if (SCHEDULE_FORM_NUMBERS.has(code)) return false
  if (SCHEDULE_TITLE_PATTERNS.some((pattern) => pattern.test(normalizedTitle))) return false
  if (/\(slip\)/i.test(normalizedTitle)) return true
  if (/^T4/.test(code) && !/-SUM$/.test(code) && !/SUM$/.test(code)) return true
  if (/^T5/.test(code)) return true
  if (code === 'T3') return true
  if (['T2202', 'T5007', 'T5008', 'T5013', 'T5018', 'T4FHSA', 'NR4', 'NR4OAS', 'RC62', 'AGR-1', 'T1198', 'T1212', 'T737-RCA', 'T4A-RCA', 'T4A-NR', 'T4EQ', 'T5003'].includes(code)) return true
  if (/^statement of /i.test(normalizedTitle) && !/summary/i.test(normalizedTitle)) return true
  return false
}

export async function upsertSlipSchema (pool, row) {
  const formNumber = normalizeFormNumber(row.formNumber)
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.slip_schemas (
      form_number, title, payer_label, slip_kind, schema_status, tax_years_supported, catalog_title, metadata, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8::jsonb, now())
    ON CONFLICT (form_number) DO UPDATE SET
      title = CASE
        WHEN taxgpt.slip_schemas.schema_status = 'complete' AND EXCLUDED.schema_status = 'catalog_only'
          THEN taxgpt.slip_schemas.title
        ELSE EXCLUDED.title
      END,
      payer_label = CASE
        WHEN taxgpt.slip_schemas.schema_status = 'complete' THEN taxgpt.slip_schemas.payer_label
        ELSE EXCLUDED.payer_label
      END,
      schema_status = CASE
        WHEN EXCLUDED.schema_status = 'complete' THEN 'complete'
        WHEN taxgpt.slip_schemas.schema_status = 'complete' THEN taxgpt.slip_schemas.schema_status
        ELSE EXCLUDED.schema_status
      END,
      catalog_title = COALESCE(EXCLUDED.catalog_title, taxgpt.slip_schemas.catalog_title),
      metadata = taxgpt.slip_schemas.metadata || EXCLUDED.metadata,
      updated_at = now()
    RETURNING *`,
    [
      formNumber,
      row.title,
      row.payerLabel || inferPayerLabel(formNumber),
      row.slipKind || 'information_slip',
      row.schemaStatus || 'catalog_only',
      JSON.stringify(row.taxYearsSupported || []),
      row.catalogTitle || row.title,
      JSON.stringify(row.metadata || {})
    ]
  )
  return rows[0]
}

export async function replaceSlipBoxSchemas (pool, slipSchemaId, boxes = []) {
  await pool.query('DELETE FROM taxgpt.slip_box_schemas WHERE slip_schema_id = $1::uuid', [slipSchemaId])
  for (const [index, box] of boxes.entries()) {
    await pool.query(
      `INSERT INTO taxgpt.slip_box_schemas (
        slip_schema_id, box_code, label, field_type, sort_order, targets, extraction_hints, updated_at
      )
      VALUES ($1::uuid, $2, $3, $4, $5, $6::jsonb, $7::jsonb, now())`,
      [
        slipSchemaId,
        String(box.code),
        box.label,
        box.type || 'currency',
        index,
        JSON.stringify(box.targets || []),
        JSON.stringify(box.extractionHints || {})
      ]
    )
  }
}

export async function listSlipSchemasWithBoxes (pool, { schemaStatus } = {}) {
  const params = []
  let where = 'WHERE 1=1'
  if (schemaStatus) {
    params.push(schemaStatus)
    where += ` AND s.schema_status = $${params.length}`
  }
  const { rows } = await pool.query(
    `SELECT
      s.id,
      s.form_number AS "formNumber",
      s.title,
      s.payer_label AS "payerLabel",
      s.slip_kind AS "slipKind",
      s.schema_status AS "schemaStatus",
      s.tax_years_supported AS "taxYearsSupported",
      s.catalog_title AS "catalogTitle",
      COALESCE(
        json_agg(
          json_build_object(
            'code', b.box_code,
            'label', b.label,
            'type', b.field_type,
            'targets', b.targets,
            'extractionHints', b.extraction_hints
          )
          ORDER BY b.sort_order
        ) FILTER (WHERE b.id IS NOT NULL),
        '[]'::json
      ) AS boxes
    FROM taxgpt.slip_schemas s
    LEFT JOIN taxgpt.slip_box_schemas b ON b.slip_schema_id = s.id
    ${where}
    GROUP BY s.id
    ORDER BY s.form_number ASC`,
    params
  )
  return rows
}

export async function getSlipSchemaByFormNumber (pool, formNumber) {
  const normalized = normalizeFormNumber(formNumber)
  const { rows } = await pool.query(
    `SELECT
      s.id,
      s.form_number AS "formNumber",
      s.title,
      s.payer_label AS "payerLabel",
      s.slip_kind AS "slipKind",
      s.schema_status AS "schemaStatus",
      s.tax_years_supported AS "taxYearsSupported",
      s.catalog_title AS "catalogTitle",
      COALESCE(
        json_agg(
          json_build_object(
            'code', b.box_code,
            'label', b.label,
            'type', b.field_type,
            'targets', b.targets,
            'extractionHints', b.extraction_hints
          )
          ORDER BY b.sort_order
        ) FILTER (WHERE b.id IS NOT NULL),
        '[]'::json
      ) AS boxes
    FROM taxgpt.slip_schemas s
    LEFT JOIN taxgpt.slip_box_schemas b ON b.slip_schema_id = s.id
    WHERE s.form_number = $1
    GROUP BY s.id
    LIMIT 1`,
    [normalized]
  )
  return rows[0] || null
}

export async function listCatalogSlipCandidates (pool) {
  const { rows } = await pool.query(
    `SELECT form_number, title
     FROM taxgpt.form_registry
     WHERE status = 'active'
     ORDER BY form_number ASC`
  )
  return rows.filter((row) => isInformationSlipCandidate(row.form_number, row.title))
}

export async function countSlipSchemas (pool) {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS total FROM taxgpt.slip_schemas`
  )
  return rows[0]?.total || 0
}
