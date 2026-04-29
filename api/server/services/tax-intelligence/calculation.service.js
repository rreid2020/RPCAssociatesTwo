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

function getRole (metadata) {
  const role = String(metadata?.taxpayerRole || 'self').toLowerCase()
  return role === 'spouse' ? 'spouse' : 'self'
}

function computeBaseTax (taxableIncome, provinceBrackets) {
  const federal = progressiveTax(taxableIncome, FEDERAL_BRACKETS_2024)
  const provincial = progressiveTax(taxableIncome, provinceBrackets)
  return { federal, provincial, total: federal + provincial }
}

function computeHouseholdTaxWithSplit ({
  selfIncome,
  spouseIncome,
  selfDeductions,
  spouseDeductions,
  splitFromSelfToSpouse,
  provinceBrackets
}) {
  const selfTaxable = Math.max(0, selfIncome - splitFromSelfToSpouse - selfDeductions)
  const spouseTaxable = Math.max(0, spouseIncome + splitFromSelfToSpouse - spouseDeductions)
  const selfTax = computeBaseTax(selfTaxable, provinceBrackets)
  const spouseTax = computeBaseTax(spouseTaxable, provinceBrackets)
  return {
    selfTaxable,
    spouseTaxable,
    householdTax: selfTax.total + spouseTax.total
  }
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
      'SELECT category, amount, metadata FROM taxgpt.income_entries WHERE tax_return_id = $1::uuid AND clerk_user_id = $2',
      [taxReturnId, clerkUserId]
    ),
    pool.query(
      'SELECT category, amount, is_credit, metadata FROM taxgpt.deductions WHERE tax_return_id = $1::uuid AND clerk_user_id = $2',
      [taxReturnId, clerkUserId]
    )
  ])

  const provincialBrackets = PROVINCIAL_BRACKETS_2024[taxReturn.province_code] || PROVINCIAL_BRACKETS_2024.ON
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

  const selfIncome = incomeRows.rows.reduce((sum, r) => {
    const role = getRole(r.metadata)
    const isWithholding = r?.metadata?.asWithholding === true || String(r?.category || '') === 'tax_withheld'
    if (role !== 'self' || isWithholding) return sum
    return sum + Number(r.amount || 0)
  }, 0)
  const spouseIncome = incomeRows.rows.reduce((sum, r) => {
    const role = getRole(r.metadata)
    const isWithholding = r?.metadata?.asWithholding === true || String(r?.category || '') === 'tax_withheld'
    if (role !== 'spouse' || isWithholding) return sum
    return sum + Number(r.amount || 0)
  }, 0)
  const selfDeductions = deductionRows.rows
    .filter((r) => !r.is_credit && getRole(r.metadata) === 'self')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0)
  const spouseDeductions = deductionRows.rows
    .filter((r) => !r.is_credit && getRole(r.metadata) === 'spouse')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0)
  const selfTaxable = Math.max(0, selfIncome - selfDeductions)
  const spouseTaxable = Math.max(0, spouseIncome - spouseDeductions)
  const selfTaxBase = computeBaseTax(selfTaxable, provincialBrackets)
  const spouseTaxBase = computeBaseTax(spouseTaxable, provincialBrackets)

  const selfWithheld = incomeRows.rows.reduce((sum, r) => {
    if (getRole(r.metadata) !== 'self') return sum
    const isWithholding = r?.metadata?.asWithholding === true || String(r?.category || '') === 'tax_withheld'
    const withheld = Number(r?.metadata?.incomeTaxDeducted || (isWithholding ? r.amount : 0) || 0)
    return sum + (Number.isFinite(withheld) ? withheld : 0)
  }, 0)
  const spouseWithheld = incomeRows.rows.reduce((sum, r) => {
    if (getRole(r.metadata) !== 'spouse') return sum
    const isWithholding = r?.metadata?.asWithholding === true || String(r?.category || '') === 'tax_withheld'
    const withheld = Number(r?.metadata?.incomeTaxDeducted || (isWithholding ? r.amount : 0) || 0)
    return sum + (Number.isFinite(withheld) ? withheld : 0)
  }, 0)

  const netIncome = Math.max(0, grossIncome - totalDeductions)
  const taxableIncome = netIncome
  const federalTax = progressiveTax(taxableIncome, FEDERAL_BRACKETS_2024)
  const provincialTax = progressiveTax(taxableIncome, provincialBrackets)
  const totalCredits = Math.min(federalTax + provincialTax, creditsFromDeductions)
  const totalPayable = Math.max(0, federalTax + provincialTax - totalCredits)
  const refundOrBalance = round2(taxesWithheld - totalPayable)

  const pensionEligibleCategories = new Set(['pension_income', 'rrif_income'])
  const selfEligiblePensionIncome = incomeRows.rows
    .filter((r) => getRole(r.metadata) === 'self' && pensionEligibleCategories.has(String(r.category || '')))
    .reduce((sum, r) => sum + Number(r.amount || 0), 0)
  const spouseEligiblePensionIncome = incomeRows.rows
    .filter((r) => getRole(r.metadata) === 'spouse' && pensionEligibleCategories.has(String(r.category || '')))
    .reduce((sum, r) => sum + Number(r.amount || 0), 0)

  let pensionSplitOptimization = null
  if (spouseIncome > 0 || spouseEligiblePensionIncome > 0) {
    const baseCombinedTaxBeforeCredits = selfTaxBase.total + spouseTaxBase.total
    const splitSourceRole = selfTaxable >= spouseTaxable ? 'self' : 'spouse'
    const sourceEligible = splitSourceRole === 'self' ? selfEligiblePensionIncome : spouseEligiblePensionIncome
    const maxSplit = Math.max(0, sourceEligible * 0.5)
    if (maxSplit > 0) {
      let bestSplit = 0
      let bestTax = baseCombinedTaxBeforeCredits
      const steps = Math.max(10, Math.min(80, Math.floor(maxSplit / 500)))
      for (let i = 0; i <= steps; i += 1) {
        const trialSplit = (maxSplit * i) / steps
        const splitFromSelfToSpouse = splitSourceRole === 'self' ? trialSplit : -trialSplit
        const trial = computeHouseholdTaxWithSplit({
          selfIncome,
          spouseIncome,
          selfDeductions,
          spouseDeductions,
          splitFromSelfToSpouse,
          provinceBrackets
        })
        if (trial.householdTax < bestTax) {
          bestTax = trial.householdTax
          bestSplit = trialSplit
        }
      }
      pensionSplitOptimization = {
        splitSourceRole,
        maxEligibleSplit: round2(maxSplit),
        recommendedSplit: round2(bestSplit),
        estimatedTaxSavingsBeforeCredits: round2(Math.max(0, baseCombinedTaxBeforeCredits - bestTax))
      }
    }
  }

  const assumptions = {
    federalBrackets: '2024-scaffold',
    provincialBrackets: `${taxReturn.province_code || 'ON'}-2024-scaffold`,
    comparative: {
      self: {
        netIncome: round2(Math.max(0, selfIncome - selfDeductions)),
        taxableIncome: round2(selfTaxable),
        estimatedTaxBeforeCredits: round2(selfTaxBase.total),
        taxesWithheld: round2(selfWithheld)
      },
      spouse: {
        netIncome: round2(Math.max(0, spouseIncome - spouseDeductions)),
        taxableIncome: round2(spouseTaxable),
        estimatedTaxBeforeCredits: round2(spouseTaxBase.total),
        taxesWithheld: round2(spouseWithheld)
      },
      household: {
        totalIncome: round2(selfIncome + spouseIncome),
        totalTaxBeforeCredits: round2(selfTaxBase.total + spouseTaxBase.total)
      }
    },
    optimization: {
      pensionSplit: pensionSplitOptimization
    },
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
