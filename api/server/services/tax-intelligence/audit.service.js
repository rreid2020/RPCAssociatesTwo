import { calculateReturnTotals, getSavedCalculation } from './calculation.service.js'

function asRule (ruleCode, severity, title, detail, metadata = {}) {
  return { ruleCode, severity, title, detail, metadata }
}

export async function runAuditRules (pool, clerkUserId, taxReturnId) {
  const calc = await getSavedCalculation(pool, clerkUserId, taxReturnId) || await calculateReturnTotals(pool, clerkUserId, taxReturnId)
  if (!calc) return null

  const [deductionsRes, extractionRes] = await Promise.all([
    pool.query(
      `SELECT category, amount
       FROM taxgpt.deductions
       WHERE tax_return_id = $1::uuid AND clerk_user_id = $2`,
      [taxReturnId, clerkUserId]
    ),
    pool.query(
      `SELECT extracted_json
       FROM taxgpt.document_extractions
       WHERE tax_return_id = $1::uuid AND clerk_user_id = $2`,
      [taxReturnId, clerkUserId]
    )
  ])

  const deductions = deductionsRes.rows
  const extractionRows = extractionRes.rows
  const donationTotal = deductions
    .filter((d) => String(d.category).toLowerCase().includes('donation'))
    .reduce((sum, d) => sum + Number(d.amount || 0), 0)
  const totalDeductions = deductions.reduce((sum, d) => sum + Number(d.amount || 0), 0)
  const taxableIncome = Number(calc.taxable_income ?? calc.taxableIncome ?? 0)
  const donationRatio = taxableIncome > 0 ? donationTotal / taxableIncome : 0

  const extractedTypes = new Set(
    extractionRows
      .map((r) => r.extracted_json?.slipType)
      .filter(Boolean)
  )

  const flags = []
  if (donationRatio > 0.35) {
    flags.push(asRule(
      'DONATION_RATIO_HIGH',
      'HIGH',
      'Donation ratio is unusually high',
      'Charitable donations are more than 35% of taxable income.',
      { donationRatio }
    ))
  }
  if (!extractedTypes.has('T4') && !extractedTypes.has('T5') && !extractedTypes.has('T3')) {
    flags.push(asRule(
      'MISSING_CORE_SLIPS',
      'HIGH',
      'No key slips detected',
      'No T4/T5/T3 slips were extracted for this return.',
      { extractedTypes: Array.from(extractedTypes) }
    ))
  }
  if (totalDeductions > taxableIncome * 0.45 && taxableIncome > 0) {
    flags.push(asRule(
      'DEDUCTIONS_ELEVATED',
      'MEDIUM',
      'Large deductions relative to income',
      'Total deductions exceed 45% of taxable income.',
      { totalDeductions, taxableIncome }
    ))
  }

  await pool.query('DELETE FROM taxgpt.audit_flags WHERE tax_return_id = $1::uuid AND clerk_user_id = $2', [taxReturnId, clerkUserId])
  for (const flag of flags) {
    await pool.query(
      `INSERT INTO taxgpt.audit_flags
       (clerk_user_id, tax_return_id, rule_code, severity, title, detail, status, metadata, updated_at)
       VALUES ($1, $2::uuid, $3, $4, $5, $6, 'open', $7::jsonb, now())`,
      [clerkUserId, taxReturnId, flag.ruleCode, flag.severity, flag.title, flag.detail, JSON.stringify(flag.metadata || {})]
    )
  }
  return flags
}

export async function listAuditFlags (pool, clerkUserId, taxReturnId) {
  const params = [clerkUserId]
  let where = 'clerk_user_id = $1'
  if (taxReturnId) {
    params.push(taxReturnId)
    where += ' AND tax_return_id = $2::uuid'
  }
  const { rows } = await pool.query(
    `SELECT *
     FROM taxgpt.audit_flags
     WHERE ${where}
     ORDER BY created_at DESC`,
    params
  )
  return rows
}
