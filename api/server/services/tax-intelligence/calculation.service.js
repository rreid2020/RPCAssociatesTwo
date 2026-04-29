const FEDERAL_BRACKETS_2024 = [
  { upTo: 55867, rate: 0.15 },
  { upTo: 111733, rate: 0.205 },
  { upTo: 173205, rate: 0.26 },
  { upTo: 246752, rate: 0.29 },
  { upTo: Infinity, rate: 0.33 }
]

const PROVINCIAL_BRACKETS_2024 = {
  ON: [
    { upTo: 51446, rate: 0.0505 },
    { upTo: 102894, rate: 0.0915 },
    { upTo: 150000, rate: 0.1116 },
    { upTo: 220000, rate: 0.1216 },
    { upTo: Infinity, rate: 0.1316 }
  ]
}

function progressiveTax (taxableIncome, brackets) {
  let remaining = Math.max(0, Number(taxableIncome || 0))
  let prev = 0
  let tax = 0
  for (const bracket of brackets) {
    const span = Math.max(0, Math.min(remaining, bracket.upTo - prev))
    if (span <= 0) break
    tax += span * bracket.rate
    remaining -= span
    prev = bracket.upTo
    if (remaining <= 0) break
  }
  return tax
}

function round2 (n) {
  return Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100
}

export async function calculateReturnTotals (pool, clerkUserId, taxReturnId) {
  const { rows: returnRows } = await pool.query(
    'SELECT * FROM taxgpt.tax_returns WHERE id = $1::uuid AND clerk_user_id = $2',
    [taxReturnId, clerkUserId]
  )
  const taxReturn = returnRows[0]
  if (!taxReturn) return null

  const [incomeRows, deductionRows] = await Promise.all([
    pool.query(
      'SELECT amount, metadata FROM taxgpt.income_entries WHERE tax_return_id = $1::uuid AND clerk_user_id = $2',
      [taxReturnId, clerkUserId]
    ),
    pool.query(
      'SELECT amount, is_credit FROM taxgpt.deductions WHERE tax_return_id = $1::uuid AND clerk_user_id = $2',
      [taxReturnId, clerkUserId]
    )
  ])

  const grossIncome = incomeRows.rows.reduce((sum, r) => {
    const isWithholding = r?.metadata?.asWithholding === true || String(r?.category || '') === 'tax_withheld'
    if (isWithholding) return sum
    return sum + Number(r.amount || 0)
  }, 0)
  const totalDeductions = deductionRows.rows
    .filter((r) => !r.is_credit)
    .reduce((sum, r) => sum + Number(r.amount || 0), 0)
  const creditsFromDeductions = deductionRows.rows
    .filter((r) => r.is_credit)
    .reduce((sum, r) => sum + Number(r.amount || 0), 0)
  const taxesWithheld = incomeRows.rows.reduce((sum, r) => {
    const isWithholding = r?.metadata?.asWithholding === true || String(r?.category || '') === 'tax_withheld'
    const withheld = Number(r?.metadata?.incomeTaxDeducted || (isWithholding ? r.amount : 0) || 0)
    return sum + (Number.isFinite(withheld) ? withheld : 0)
  }, 0)

  const netIncome = Math.max(0, grossIncome - totalDeductions)
  const taxableIncome = netIncome
  const federalTax = progressiveTax(taxableIncome, FEDERAL_BRACKETS_2024)
  const provincialBrackets = PROVINCIAL_BRACKETS_2024[taxReturn.province_code] || PROVINCIAL_BRACKETS_2024.ON
  const provincialTax = progressiveTax(taxableIncome, provincialBrackets)
  const totalCredits = Math.min(federalTax + provincialTax, creditsFromDeductions)
  const totalPayable = Math.max(0, federalTax + provincialTax - totalCredits)
  const refundOrBalance = round2(taxesWithheld - totalPayable)

  const assumptions = {
    federalBrackets: '2024-scaffold',
    provincialBrackets: `${taxReturn.province_code || 'ON'}-2024-scaffold`,
    notes: [
      'Deterministic scaffold only; CRA worksheet parity is not yet complete.',
      'Some credits/surtaxes/benefits are intentionally excluded in this phase.'
    ]
  }

  const payload = {
    netIncome: round2(netIncome),
    taxableIncome: round2(taxableIncome),
    federalTax: round2(federalTax),
    provincialTax: round2(provincialTax),
    totalCredits: round2(totalCredits),
    totalPayable: round2(totalPayable),
    taxesWithheld: round2(taxesWithheld),
    refundOrBalance,
    assumptions
  }

  await pool.query(
    `INSERT INTO taxgpt.tax_calculations
     (clerk_user_id, tax_return_id, net_income, taxable_income, federal_tax, provincial_tax, total_credits, total_payable, taxes_withheld, refund_or_balance, assumptions, updated_at)
     VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, now())
     ON CONFLICT (tax_return_id)
     DO UPDATE SET net_income = EXCLUDED.net_income,
                   taxable_income = EXCLUDED.taxable_income,
                   federal_tax = EXCLUDED.federal_tax,
                   provincial_tax = EXCLUDED.provincial_tax,
                   total_credits = EXCLUDED.total_credits,
                   total_payable = EXCLUDED.total_payable,
                   taxes_withheld = EXCLUDED.taxes_withheld,
                   refund_or_balance = EXCLUDED.refund_or_balance,
                   assumptions = EXCLUDED.assumptions,
                   updated_at = now()`,
    [
      clerkUserId,
      taxReturnId,
      payload.netIncome,
      payload.taxableIncome,
      payload.federalTax,
      payload.provincialTax,
      payload.totalCredits,
      payload.totalPayable,
      payload.taxesWithheld,
      payload.refundOrBalance,
      JSON.stringify(payload.assumptions)
    ]
  )

  return payload
}

export async function getSavedCalculation (pool, clerkUserId, taxReturnId) {
  const { rows } = await pool.query(
    `SELECT *
     FROM taxgpt.tax_calculations
     WHERE tax_return_id = $1::uuid AND clerk_user_id = $2`,
    [taxReturnId, clerkUserId]
  )
  return rows[0] || null
}
