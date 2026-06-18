import { getSlipSchemasByCode, getSlipSchema, listSlipSchemasForReturnBuilder } from './slipSchema.service.js'
import { mapSlipInstancesToEntries } from './slipEntry.service.js'
import { normalizeExtractedDataToBoxes } from './slipExtraction.service.js'

function n (value) {
  const out = Number(value || 0)
  return Number.isFinite(out) ? out : 0
}

function mergeMetadata (entry, baseMeta = {}) {
  return {
    ...entry,
    metadata: {
      ...(entry.metadata || {}),
      ...baseMeta,
      source: baseMeta.source || entry.metadata?.source || 'document_extraction'
    }
  }
}

export async function mapExtractedSlipToEntries (pool, slipType, extractedData, baseMeta = {}) {
  const schemasByCode = await getSlipSchemasByCode(pool)
  const schema = schemasByCode[String(slipType || '').toUpperCase()]
  if (!schema) return []

  const boxes = normalizeExtractedDataToBoxes(slipType, extractedData, schema)
  const mapped = mapSlipInstancesToEntries([{
    slipCode: schema.code,
    payerName: extractedData?.employer_name || extractedData?.payer_name || null,
    taxYear: Number(extractedData?.tax_year || new Date().getFullYear()),
    taxpayerRole: baseMeta.taxpayerRole || 'self',
    boxes
  }], schemasByCode)

  const entries = []
  for (const entry of mapped.incomeEntries) {
    entries.push(mergeMetadata({
      kind: 'income',
      category: entry.category,
      description: entry.description,
      amount: n(entry.amount),
      metadata: entry.metadata
    }, baseMeta))
  }
  for (const entry of mapped.deductionEntries) {
    entries.push(mergeMetadata({
      kind: 'deduction',
      category: entry.category,
      description: entry.description,
      amount: n(entry.amount),
      metadata: entry.metadata
    }, baseMeta))
  }
  return entries
}

export async function getSlipCodesForDetection (pool) {
  const schemas = await listSlipSchemasForReturnBuilder(pool)
  return schemas.map((schema) => schema.code)
}

export async function upsertDocumentMappedEntries (pool, clerkUserId, taxReturnId, documentId, entries = []) {
  const { rows } = await pool.query(
    'SELECT id FROM taxgpt.tax_returns WHERE id = $1::uuid AND clerk_user_id = $2',
    [taxReturnId, clerkUserId]
  )
  if (!rows[0]) return null

  const documentIdStr = String(documentId)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `DELETE FROM taxgpt.income_entries
       WHERE clerk_user_id = $1
         AND tax_return_id = $2::uuid
         AND source_type = 'document_extraction'
         AND metadata->>'documentId' = $3`,
      [clerkUserId, taxReturnId, documentIdStr]
    )
    await client.query(
      `DELETE FROM taxgpt.deductions
       WHERE clerk_user_id = $1
         AND tax_return_id = $2::uuid
         AND metadata->>'documentId' = $3`,
      [clerkUserId, taxReturnId, documentIdStr]
    )

    for (const entry of entries) {
      const amount = n(entry.amount)
      if (amount <= 0) continue
      const metadata = {
        ...(entry.metadata || {}),
        documentId: documentIdStr,
        source: entry.metadata?.source || 'document_extraction'
      }
      if (entry.kind === 'income') {
        await client.query(
          `INSERT INTO taxgpt.income_entries
           (clerk_user_id, tax_return_id, source_type, source_ref_id, category, description, amount, currency, is_manual, metadata, updated_at)
           VALUES ($1, $2::uuid, 'document_extraction', $3::uuid, $4, $5, $6, 'CAD', false, $7::jsonb, now())`,
          [clerkUserId, taxReturnId, documentId, entry.category, entry.description, amount, JSON.stringify(metadata)]
        )
      } else {
        await client.query(
          `INSERT INTO taxgpt.deductions
           (clerk_user_id, tax_return_id, category, description, amount, is_credit, metadata, updated_at)
           VALUES ($1, $2::uuid, $3, $4, $5, false, $6::jsonb, now())`,
          [clerkUserId, taxReturnId, entry.category, entry.description, amount, JSON.stringify(metadata)]
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

  return { documentId: documentIdStr, entryCount: entries.length }
}

export { getSlipSchema }
