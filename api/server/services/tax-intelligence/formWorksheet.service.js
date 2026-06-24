import {
  COMPLETE_FORM_WORKSHEET_DEFINITIONS
} from '../../lib/taxSlips/formWorksheetDefinitions.seed.js'
import {
  buildFormWorksheetLedgerEntry,
  getFormWorksheetCoverageSummary
} from '../../lib/taxSlips/formWorksheetComputations.js'
import { buildT1ReturnFormsManifest } from '../../lib/taxSlips/t1ReturnForms.manifest.js'
import { listIncomeEntries, listDeductions } from './income.service.js'
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
  const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {})
  return {
    code: row.form_number,
    name: row.title,
    formFamily: row.form_family,
    schemaStatus: row.schema_status,
    landingUrl: row.landing_url,
    metadata,
    fieldCount: Array.isArray(row.fields) ? row.fields.length : 0,
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
      metadata: {
        seededFrom: 'complete_form_worksheet_definitions_v3',
        artifactKind: 't1_form'
      }
    })
    await replaceFormWorksheetFields(pool, schema.id, definition.sections)
  }
}

export async function seedCatalogFormWorksheetSchemas (pool) {
  const completeCodes = new Set(
    COMPLETE_FORM_WORKSHEET_DEFINITIONS.map((definition) => String(definition.code).toUpperCase())
  )
  const manifest = buildT1ReturnFormsManifest()

  for (const entry of manifest) {
    const code = String(entry.code || '').toUpperCase()
    if (completeCodes.has(code)) continue

    const existing = await getFormWorksheetSchemaByFormNumber(pool, code)
    if (existing?.schema_status === 'complete') continue

    await upsertFormRegistryEntry(pool, {
      formNumber: code,
      title: entry.title,
      landingUrl: entry.landingUrl,
      formFamily: entry.artifactKind === 't1_schedule' ? 't1_schedule' : 't1_form',
      metadata: {
        lineRefs: entry.lineRefs,
        artifactKind: entry.artifactKind,
        t1Steps: entry.t1Steps,
        sources: entry.sources
      }
    })

    await upsertFormWorksheetSchema(pool, {
      formNumber: code,
      title: entry.title,
      formFamily: entry.artifactKind === 't1_schedule' ? 't1_schedule' : 't1_form',
      schemaStatus: 'catalog_only',
      landingUrl: entry.landingUrl,
      metadata: {
        seededFrom: 't1_return_forms_manifest_v1',
        lineRefs: entry.lineRefs,
        artifactKind: entry.artifactKind,
        t1Steps: entry.t1Steps,
        sources: entry.sources
      }
    })
  }
}

export async function ensureFormWorksheetSchemasSeeded (pool) {
  if (!formWorksheetSeedPromise) {
    formWorksheetSeedPromise = (async () => {
      await seedCompleteFormWorksheetSchemas(pool)
      await seedCatalogFormWorksheetSchemas(pool)
    })().catch((error) => {
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

export async function getFormWorksheetCoverage (pool) {
  await ensureFormWorksheetSchemasSeeded(pool)
  const schemas = await listFormWorksheetsForReturnBuilder(pool)
  const manifest = buildT1ReturnFormsManifest()
  const summary = getFormWorksheetCoverageSummary(schemas)
  return {
    ...summary,
    manifestTotal: manifest.length,
    manifestForms: manifest.map((entry) => {
      const schema = schemas.find((row) => String(row.code).toUpperCase() === String(entry.code).toUpperCase())
      return {
        code: entry.code,
        title: entry.title,
        artifactKind: entry.artifactKind,
        lineRefs: entry.lineRefs,
        schemaStatus: schema?.schemaStatus || 'missing',
        fieldCount: schema?.fieldCount || 0,
        landingUrl: schema?.landingUrl || entry.landingUrl || null
      }
    })
  }
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
      await client.query(
        `DELETE FROM taxgpt.deductions
         WHERE tax_return_id = $1::uuid
           AND clerk_user_id = $2
           AND COALESCE(metadata->>'source', '') = 'form_worksheet'
           AND COALESCE(metadata->>'formCode', '') = $3
           AND COALESCE(metadata->>'taxpayerRole', 'self') = $4`,
        [taxReturnId, clerkUserId, formCode, role]
      )

      const ledgerEntry = buildFormWorksheetLedgerEntry(formCode, role, values)
      if (!ledgerEntry) continue

      if (ledgerEntry.isDeduction) {
        await client.query(
          `INSERT INTO taxgpt.deductions
           (clerk_user_id, tax_return_id, category, description, amount, is_credit, metadata, updated_at)
           VALUES ($1, $2::uuid, $3, $4, $5, $6, $7::jsonb, now())`,
          [
            clerkUserId,
            taxReturnId,
            ledgerEntry.category,
            ledgerEntry.description,
            ledgerEntry.amount,
            Boolean(ledgerEntry.isCredit),
            JSON.stringify(ledgerEntry.metadata)
          ]
        )
      } else {
        await client.query(
          `INSERT INTO taxgpt.income_entries
           (clerk_user_id, tax_return_id, source_type, source_ref_id, category, description, amount, currency, is_manual, metadata, updated_at)
           VALUES ($1, $2::uuid, $3, $4::uuid, $5, $6, $7, $8, $9, $10::jsonb, now())`,
          [
            clerkUserId,
            taxReturnId,
            ledgerEntry.sourceType,
            null,
            ledgerEntry.category,
            ledgerEntry.description,
            ledgerEntry.amount,
            'CAD',
            true,
            JSON.stringify(ledgerEntry.metadata)
          ]
        )
      }
    }

    await client.query('COMMIT')
  } catch (error) {
    try { await client.query('ROLLBACK') } catch {}
    throw error
  } finally {
    client.release()
  }

  const [values, incomeEntries, deductions] = await Promise.all([
    listFormWorksheetValuesForReturn(pool, clerkUserId, taxReturnId),
    listIncomeEntries(pool, clerkUserId, taxReturnId),
    listDeductions(pool, clerkUserId, taxReturnId)
  ])
  return {
    formWorksheetValues: values,
    incomeEntries: incomeEntries || [],
    deductions: deductions || []
  }
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
