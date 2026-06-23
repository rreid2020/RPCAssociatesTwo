import {
  COMPLETE_FORM_WORKSHEET_DEFINITIONS,
  computeT2125Totals
} from '../../lib/taxSlips/formWorksheetDefinitions.seed.js'
import { listIncomeEntries } from './income.service.js'
import {
  getFormWorksheetSchemaByFormNumber,
  listFormWorksheetSchemasWithFields,
  queryFormWorksheetValuesForReturn,
  replaceFormWorksheetValues,
  replaceFormWorksheetFields,
  upsertFormRegistryEntry,
  upsertFormWorksheetSchema
} from './formWorksheet.repository.js'

let formWorksheetSeedPromise = null

function groupFieldsIntoSections (fields = []) {
  const sections = []
  const byId = new Map()
  for (const field of fields) {
    const sectionId = field.section_id || 'default'
    if (!byId.has(sectionId)) {
      const section = {
        id: sectionId,
        title: field.section_title || sectionId,
        description: field.section_description || '',
        fields: []
      }
      byId.set(sectionId, section)
      sections.push(section)
    }
    const metadata = typeof field.metadata === 'string' ? JSON.parse(field.metadata) : (field.metadata || {})
    const targets = typeof field.targets === 'string' ? JSON.parse(field.targets) : (field.targets || [])
    byId.get(sectionId).fields.push({
      code: field.field_code,
      label: field.label,
      type: field.field_type,
      lineRef: field.line_ref || undefined,
      targets: Array.isArray(targets) ? targets : [],
      compute: metadata.compute || null,
      readOnly: Boolean(metadata.readOnly),
      placeholder: metadata.placeholder || undefined
    })
  }
  return sections
}

function mapSchemaRow (row) {
  if (!row) return null
  return {
    code: row.form_number,
    name: row.title,
    formFamily: row.form_family,
    schemaStatus: row.schema_status,
    landingUrl: row.landing_url,
    sections: groupFieldsIntoSections(row.fields || [])
  }
}

async function assertReturnOwnership (pool, clerkUserId, taxReturnId) {
  const { rows } = await pool.query(
    'SELECT id FROM taxgpt.tax_returns WHERE id = $1::uuid AND clerk_user_id = $2',
    [taxReturnId, clerkUserId]
  )
  return Boolean(rows[0])
}

export async function seedCompleteFormWorksheetSchemas (pool) {
  for (const definition of COMPLETE_FORM_WORKSHEET_DEFINITIONS) {
    await upsertFormRegistryEntry(pool, {
      formNumber: definition.code,
      title: definition.registryTitle || definition.name,
      landingUrl: definition.landingUrl,
      formFamily: definition.formFamily || 't1_form'
    })
    const schema = await upsertFormWorksheetSchema(pool, {
      formNumber: definition.code,
      title: definition.name,
      formFamily: definition.formFamily || 't1_form',
      schemaStatus: 'complete',
      landingUrl: definition.landingUrl,
      metadata: { seededFrom: 'complete_form_worksheet_definitions_v1' }
    })
    await replaceFormWorksheetFields(pool, schema.id, definition.sections)
  }
}

export async function ensureFormWorksheetSchemasSeeded (pool) {
  if (!formWorksheetSeedPromise) {
    formWorksheetSeedPromise = seedCompleteFormWorksheetSchemas(pool).catch((error) => {
      formWorksheetSeedPromise = null
      throw error
    })
  }
  return formWorksheetSeedPromise
}

export async function listFormWorksheetsForReturnBuilder (pool) {
  await ensureFormWorksheetSchemasSeeded(pool)
  const rows = await listFormWorksheetSchemasWithFields(pool)
  return rows.map(mapSchemaRow)
}

export async function getFormWorksheetSchema (pool, formNumber) {
  await ensureFormWorksheetSchemasSeeded(pool)
  const row = await getFormWorksheetSchemaByFormNumber(pool, formNumber)
  return mapSchemaRow(row)
}

export function valuesMapFromRows (rows = []) {
  const map = {}
  for (const row of rows) {
    const formCode = String(row.form_code || '').toUpperCase()
    const role = row.taxpayer_role === 'spouse' ? 'spouse' : 'self'
    if (!map[formCode]) map[formCode] = { self: {}, spouse: {} }
    if (row.field_type === 'text') {
      map[formCode][role][row.field_code] = row.text_value || ''
    } else {
      map[formCode][role][row.field_code] = Number(row.amount || 0)
    }
  }
  return map
}

export async function listFormWorksheetValuesForReturn (pool, clerkUserId, taxReturnId) {
  const ok = await assertReturnOwnership(pool, clerkUserId, taxReturnId)
  if (!ok) return null
  const rows = await queryFormWorksheetValuesForReturn(pool, taxReturnId, clerkUserId)
  return valuesMapFromRows(rows)
}

function buildT2125IncomeEntry (formCode, role, values, totals) {
  const net = Number(totals.netIncome || 0)
  if (!Number.isFinite(net) || net === 0) return null
  return {
    category: 'business_income',
    description: `${formCode} net business income (line 13500)`,
    amount: net,
    sourceType: 'form_worksheet',
    isManual: true,
    metadata: {
      source: 'form_worksheet',
      formCode,
      fieldCode: '9946',
      lineRef: '13500',
      scheduleRef: formCode,
      taxpayerRole: role,
      grossIncome: totals.grossIncome,
      totalExpenses: totals.totalExpenses
    }
  }
}

export async function saveReturnFormWorksheet (
  pool,
  clerkUserId,
  taxReturnId,
  payload = {}
) {
  const ok = await assertReturnOwnership(pool, clerkUserId, taxReturnId)
  if (!ok) return null

  const forms = Array.isArray(payload.forms) ? payload.forms : []
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    for (const item of forms) {
      const formCode = String(item.formCode || '').trim().toUpperCase()
      const role = item.taxpayerRole === 'spouse' ? 'spouse' : 'self'
      const values = item.values && typeof item.values === 'object' ? item.values : {}
      await replaceFormWorksheetValues(client, clerkUserId, taxReturnId, formCode, role, values)

      await client.query(
        `DELETE FROM taxgpt.income_entries
         WHERE tax_return_id = $1::uuid
           AND clerk_user_id = $2
           AND source_type = 'form_worksheet'
           AND COALESCE(metadata->>'formCode', '') = $3
           AND COALESCE(metadata->>'taxpayerRole', 'self') = $4`,
        [taxReturnId, clerkUserId, formCode, role]
      )

      if (formCode === 'T2125') {
        const totals = computeT2125Totals(values)
        const incomeEntry = buildT2125IncomeEntry(formCode, role, values, totals)
        if (incomeEntry) {
          await client.query(
            `INSERT INTO taxgpt.income_entries
             (clerk_user_id, tax_return_id, source_type, source_ref_id, category, description, amount, currency, is_manual, metadata, updated_at)
             VALUES ($1, $2::uuid, $3, $4::uuid, $5, $6, $7, $8, $9, $10::jsonb, now())`,
            [
              clerkUserId,
              taxReturnId,
              incomeEntry.sourceType,
              null,
              incomeEntry.category,
              incomeEntry.description,
              incomeEntry.amount,
              'CAD',
              true,
              JSON.stringify(incomeEntry.metadata)
            ]
          )
        }
      }
    }

    await client.query('COMMIT')
  } catch (error) {
    try { await client.query('ROLLBACK') } catch {}
    throw error
  } finally {
    client.release()
  }

  const [values, incomeEntries] = await Promise.all([
    listFormWorksheetValuesForReturn(pool, clerkUserId, taxReturnId),
    listIncomeEntries(pool, clerkUserId, taxReturnId)
  ])
  return { formWorksheetValues: values, incomeEntries: incomeEntries || [] }
}

export async function saveReturnFormWorksheetsBatch (
  pool,
  clerkUserId,
  taxReturnId,
  formWorksheetValues = {}
) {
  const forms = Object.entries(formWorksheetValues).flatMap(([formCode, byRole]) => (
    ['self', 'spouse'].map((role) => ({
      formCode,
      taxpayerRole: role,
      values: byRole?.[role] || {}
    }))
  ))
  return saveReturnFormWorksheet(pool, clerkUserId, taxReturnId, { forms })
}
