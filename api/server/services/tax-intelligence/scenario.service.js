import { calculateReturnTotals, getSavedCalculation } from './calculation.service.js'

function mergeOverrideEntries (entries, overrides = {}) {
  if (!Array.isArray(entries)) return []
  return entries.map((entry) => {
    const key = `${entry.category}:${entry.description || ''}`
    if (!Object.prototype.hasOwnProperty.call(overrides, key)) return entry
    return { ...entry, amount: Number(overrides[key] || 0) }
  })
}

export async function createScenario (pool, clerkUserId, taxReturnId, payload = {}) {
  const name = String(payload.name || '').trim() || 'Scenario'
  const overrides = payload.inputOverrides || {}

  const { rows: incomeRows } = await pool.query(
    `SELECT category, description, amount
     FROM taxgpt.income_entries
     WHERE tax_return_id = $1::uuid AND clerk_user_id = $2`,
    [taxReturnId, clerkUserId]
  )
  const { rows: deductionRows } = await pool.query(
    `SELECT category, description, amount, is_credit
     FROM taxgpt.deductions
     WHERE tax_return_id = $1::uuid AND clerk_user_id = $2`,
    [taxReturnId, clerkUserId]
  )
  const baseCalculation = await getSavedCalculation(pool, clerkUserId, taxReturnId) || await calculateReturnTotals(pool, clerkUserId, taxReturnId)
  const adjustedIncome = mergeOverrideEntries(incomeRows, overrides.income || {})
  const adjustedDeductions = mergeOverrideEntries(deductionRows, overrides.deductions || {})

  const totalIncome = adjustedIncome.reduce((sum, row) => sum + Number(row.amount || 0), 0)
  const totalDeductions = adjustedDeductions
    .filter((d) => !d.is_credit)
    .reduce((sum, row) => sum + Number(row.amount || 0), 0)
  const totalCredits = adjustedDeductions
    .filter((d) => d.is_credit)
    .reduce((sum, row) => sum + Number(row.amount || 0), 0)

  const scenarioSnapshot = {
    totalIncome,
    totalDeductions,
    totalCredits,
    estimatedTaxableIncome: Math.max(0, totalIncome - totalDeductions)
  }
  const comparison = {
    base: {
      refundOrBalance: Number(baseCalculation.refund_or_balance ?? baseCalculation.refundOrBalance ?? 0),
      totalPayable: Number(baseCalculation.total_payable ?? baseCalculation.totalPayable ?? 0)
    },
    scenario: scenarioSnapshot,
    delta: {
      taxableIncome: Number(scenarioSnapshot.estimatedTaxableIncome) - Number(baseCalculation.taxable_income ?? baseCalculation.taxableIncome ?? 0)
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO taxgpt.optimization_scenarios
     (clerk_user_id, tax_return_id, base_calculation_id, name, scenario_type, input_overrides, comparison_json, updated_at)
     VALUES ($1, $2::uuid, $3::uuid, $4, $5, $6::jsonb, $7::jsonb, now())
     RETURNING *`,
    [
      clerkUserId,
      taxReturnId,
      baseCalculation.id || null,
      name,
      payload.scenarioType || 'manual',
      JSON.stringify(overrides),
      JSON.stringify(comparison)
    ]
  )
  return rows[0] || null
}

export async function listScenarios (pool, clerkUserId, taxReturnId) {
  const { rows } = await pool.query(
    `SELECT *
     FROM taxgpt.optimization_scenarios
     WHERE tax_return_id = $1::uuid AND clerk_user_id = $2
     ORDER BY created_at DESC`,
    [taxReturnId, clerkUserId]
  )
  return rows
}
