import { randomUUID } from 'crypto'
import { listDeductions, listIncomeEntries } from './income.service.js'
import { getSlipSchemasByCode } from './slipSchema.service.js'

function n (value) {
  const out = Number(value || 0)
  return Number.isFinite(out) ? out : 0
}

async function assertReturnOwnership (pool, clerkUserId, taxReturnId) {
  const { rows } = await pool.query(
    'SELECT id FROM taxgpt.tax_returns WHERE id = $1::uuid AND clerk_user_id = $2',
    [taxReturnId, clerkUserId]
  )
  return Boolean(rows[0])
}

function buildSlipBaseMeta (slip, manualSlipId) {
  return {
    slipType: slip.slipCode,
    payerName: slip.payerName || null,
    taxYear: Number(slip.taxYear || new Date().getFullYear()),
    taxpayerRole: slip.taxpayerRole || 'self',
    manualSlipId,
    source: 'manual_slip'
  }
}

function pushSlipShellEntry (incomeEntries, slipCode, baseMeta, schemaStatus = 'complete') {
  incomeEntries.push({
    category: 'slip_shell',
    description: `${slipCode} slip instance`,
    amount: 0,
    sourceType: 'manual_slip',
    isManual: true,
    metadata: {
      ...baseMeta,
      slipShell: true,
      schemaStatus
    }
  })
}

export function mapSlipInstancesToEntries (slips = [], schemasByCode = {}) {
  const incomeEntries = []
  const deductionEntries = []

  for (const slip of slips) {
    const slipCode = String(slip.slipCode || '').toUpperCase()
    const schema = schemasByCode[slipCode]
    const manualSlipId = slip.manualSlipId || randomUUID()
    const baseMeta = buildSlipBaseMeta(slip, manualSlipId)
    const boxes = slip.boxes && typeof slip.boxes === 'object' ? slip.boxes : {}
    let entriesForSlip = 0

    const trackIncome = (entry) => {
      incomeEntries.push(entry)
      entriesForSlip += 1
    }
    const trackDeduction = (entry) => {
      deductionEntries.push(entry)
      entriesForSlip += 1
    }

    if (!schema) {
      for (const [boxCode, rawValue] of Object.entries(boxes)) {
        const boxValue = n(rawValue)
        if (boxValue === 0) continue
        trackIncome({
          category: 'unmapped_slip_income',
          description: `${slipCode} box ${boxCode}`,
          amount: boxValue,
          sourceType: 'manual_slip',
          isManual: true,
          metadata: {
            ...baseMeta,
            boxCode,
            boxValue,
            schemaStatus: 'catalog_only',
            unmapped: true,
            reviewRequired: true
          }
        })
      }
      if (entriesForSlip === 0) pushSlipShellEntry(incomeEntries, slipCode, baseMeta, 'catalog_only')
      continue
    }

    if (schema.schemaStatus === 'catalog_only' && (!schema.boxes || schema.boxes.length === 0)) {
      for (const [boxCode, rawValue] of Object.entries(boxes)) {
        const boxValue = n(rawValue)
        if (boxValue === 0) continue
        trackIncome({
          category: 'unmapped_slip_income',
          description: `${schema.code} box ${boxCode}`,
          amount: boxValue,
          sourceType: 'manual_slip',
          isManual: true,
          metadata: {
            ...baseMeta,
            boxCode,
            boxValue,
            schemaStatus: 'catalog_only',
            unmapped: true,
            reviewRequired: true
          }
        })
      }
      if (entriesForSlip === 0) pushSlipShellEntry(incomeEntries, schema.code, baseMeta, 'catalog_only')
      continue
    }

    const knownBoxCodes = new Set((schema.boxes || []).map((box) => String(box.code)))
    for (const boxDef of schema.boxes || []) {
      const boxValue = n(boxes[boxDef.code])
      if (boxValue === 0) continue
      const targets = Array.isArray(boxDef.targets) ? boxDef.targets : []
      if (targets.length === 0) continue
      for (const target of targets) {
        const entry = {
          category: target.category,
          description: `${schema.code} box ${boxDef.code}: ${target.description}`,
          amount: boxValue,
          sourceType: 'manual_slip',
          isManual: true,
          metadata: {
            ...baseMeta,
            boxCode: boxDef.code,
            boxValue,
            lineRef: target.lineRef || null,
            scheduleRef: target.scheduleRef || null,
            asWithholding: Boolean(target.asWithholding),
            incomeTaxDeducted: target.asWithholding ? boxValue : 0,
            schemaStatus: schema.schemaStatus
          }
        }
        if (target.kind === 'deduction') trackDeduction(entry)
        else trackIncome(entry)
      }
    }

    for (const [boxCode, rawValue] of Object.entries(boxes)) {
      if (knownBoxCodes.has(String(boxCode))) continue
      const boxValue = n(rawValue)
      if (boxValue === 0) continue
      trackIncome({
        category: 'unmapped_slip_income',
        description: `${schema.code} box ${boxCode}`,
        amount: boxValue,
        sourceType: 'manual_slip',
        isManual: true,
        metadata: {
          ...baseMeta,
          boxCode,
          boxValue,
          schemaStatus: schema.schemaStatus,
          unmapped: true,
          reviewRequired: true
        }
      })
    }

    if (entriesForSlip === 0) pushSlipShellEntry(incomeEntries, schema.code, baseMeta, schema.schemaStatus)
  }

  return { incomeEntries, deductionEntries }
}

export async function saveReturnSlipsAndIncome (pool, clerkUserId, taxReturnId, payload = {}) {
  const ok = await assertReturnOwnership(pool, clerkUserId, taxReturnId)
  if (!ok) return null

  const schemasByCode = await getSlipSchemasByCode(pool)
  const manualIncomeRows = Array.isArray(payload.manualIncomeRows) ? payload.manualIncomeRows : []
  const slips = Array.isArray(payload.slips) ? payload.slips : []

  const manualEntries = manualIncomeRows.map((row) => ({
    category: row.category || 'other_income',
    description: row.description || '',
    amount: n(row.amount),
    sourceType: 'manual',
    isManual: true,
    metadata: {
      taxpayerRole: row.taxpayerRole || 'self'
    }
  }))

  const mapped = mapSlipInstancesToEntries(slips, schemasByCode)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(
      `DELETE FROM taxgpt.income_entries
       WHERE tax_return_id = $1::uuid
         AND clerk_user_id = $2
         AND source_type IN ('manual', 'manual_slip', 'manual_t4')`,
      [taxReturnId, clerkUserId]
    )

    await client.query(
      `DELETE FROM taxgpt.deductions
       WHERE tax_return_id = $1::uuid
         AND clerk_user_id = $2
         AND COALESCE(metadata->>'source', '') = 'manual_slip'`,
      [taxReturnId, clerkUserId]
    )

    const allIncomeEntries = [...manualEntries, ...mapped.incomeEntries]
    for (const entry of allIncomeEntries) {
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
          n(entry.amount),
          entry.currency || 'CAD',
          entry.isManual !== false,
          JSON.stringify(entry.metadata || {})
        ]
      )
    }

    for (const entry of mapped.deductionEntries) {
      await client.query(
        `INSERT INTO taxgpt.deductions
         (clerk_user_id, tax_return_id, category, description, amount, is_credit, metadata, updated_at)
         VALUES ($1, $2::uuid, $3, $4, $5, false, $6::jsonb, now())`,
        [
          clerkUserId,
          taxReturnId,
          entry.category || 'other_deduction',
          entry.description || null,
          n(entry.amount),
          JSON.stringify(entry.metadata || {})
        ]
      )
    }

    await client.query('COMMIT')
  } catch (error) {
    try { await client.query('ROLLBACK') } catch {}
    throw error
  } finally {
    client.release()
  }

  const [incomeEntries, deductions] = await Promise.all([
    listIncomeEntries(pool, clerkUserId, taxReturnId),
    listDeductions(pool, clerkUserId, taxReturnId)
  ])

  return { incomeEntries, deductions }
}

function resolveManualSlipId (meta, entryId, slipType) {
  if (meta.manualSlipId) return String(meta.manualSlipId)
  const payer = String(meta.payerName || '').trim()
  const year = String(meta.taxYear || '')
  const role = String(meta.taxpayerRole || 'self')
  if (payer || year) {
    return `legacy-${slipType}-${payer}-${year}-${role}`.replace(/\s+/g, '_')
  }
  return `${slipType}-${entryId}`
}

export function buildSlipInstancesFromReturnData (incomeEntries = [], deductions = [], schemasByCode = {}) {
  const grouped = new Map()

  const absorbEntry = (entry) => {
    const meta = entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {}
    const slipType = String(meta.slipType || '')
    if (!slipType) return
    const manualSlipId = resolveManualSlipId(meta, entry.id, slipType)
    const boxCode = String(meta.boxCode || '')
    const boxValue = n(meta.boxValue ?? entry.amount)

    if (!grouped.has(manualSlipId)) {
      const schema = schemasByCode[slipType.toUpperCase()]
      const defaultBoxes = {}
      for (const box of schema?.boxes || []) defaultBoxes[box.code] = 0
      grouped.set(manualSlipId, {
        slipCode: slipType,
        payerName: String(meta.payerName || ''),
        taxYear: Number(meta.taxYear || new Date().getFullYear()),
        taxpayerRole: String(meta.taxpayerRole || 'self') === 'spouse' ? 'spouse' : 'self',
        manualSlipId,
        boxes: defaultBoxes
      })
    }

    const row = grouped.get(manualSlipId)
    if (boxCode) row.boxes[boxCode] = boxValue
  }

  for (const entry of incomeEntries) {
    if (entry.source_type === 'manual_slip' || entry.source_type === 'manual_t4' || entry.metadata?.slipType) {
      absorbEntry(entry)
    }
  }
  for (const entry of deductions) {
    if (entry.metadata?.source === 'manual_slip' || entry.metadata?.manualSlipId) {
      absorbEntry(entry)
    }
  }

  return Array.from(grouped.values())
}
