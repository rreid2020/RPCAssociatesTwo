import type {
  CharitableBreakdown,
  ComparisonInputPayload,
  PoliticalBreakdown,
  ProvinceCode,
  ThisOrThatResult,
} from './types'
import { calculateProvincialCharitableCreditForProvince } from './provincialCharitableCredits'
import {
  FEDERAL_CHARITY_ABOVE_200_RATE_HIGH,
  FEDERAL_CHARITY_ABOVE_200_RATE_STANDARD,
  FEDERAL_CHARITY_FIRST_200_RATE,
  FEDERAL_TOP_BRACKET_START,
  POLITICAL_MAX_CREDIT,
  POLITICAL_TIER_1_MAX,
  POLITICAL_TIER_1_RATE,
  POLITICAL_TIER_2_MAX,
  POLITICAL_TIER_2_RATE,
  POLITICAL_TIER_3_MAX,
  POLITICAL_TIER_3_RATE,
} from './taxRates'

export const round2 = (n: number): number => Math.round(n * 100) / 100

/**
 * Line 41000 — federal political contribution tax credit (same tier structure as CRA tables).
 * Max credit $650 once contributions reach $1,275+.
 */
export function calculatePoliticalCredit(contributions: number): number {
  if (contributions <= 0) return 0
  if (contributions >= POLITICAL_TIER_3_MAX) return POLITICAL_MAX_CREDIT

  if (contributions <= POLITICAL_TIER_1_MAX) {
    return round2(contributions * POLITICAL_TIER_1_RATE)
  }
  if (contributions <= POLITICAL_TIER_2_MAX) {
    return round2((contributions - POLITICAL_TIER_1_MAX) * POLITICAL_TIER_2_RATE + POLITICAL_TIER_1_MAX * POLITICAL_TIER_1_RATE)
  }
  return round2(
    (contributions - POLITICAL_TIER_2_MAX) * POLITICAL_TIER_3_RATE +
      (POLITICAL_TIER_2_MAX - POLITICAL_TIER_1_MAX) * POLITICAL_TIER_2_RATE +
      POLITICAL_TIER_1_MAX * POLITICAL_TIER_1_RATE
  )
}

/**
 * Federal charitable donation credit for amounts claimed on one return.
 * First $200 at the lowest federal rate (14.5% for 2025); above $200 at 29%, or 33% when taxable income exceeds the top bracket start
 * (simplified proxy for Schedule 9’s tie to income taxed at the highest federal rate).
 */
export function calculateFederalCharitableCredit(amount: number, taxableIncome: number): number {
  if (amount <= 0) return 0
  const first = Math.min(amount, 200)
  const rest = Math.max(0, amount - 200)
  const highIncome = taxableIncome > FEDERAL_TOP_BRACKET_START
  const rateAbove200 = highIncome ? FEDERAL_CHARITY_ABOVE_200_RATE_HIGH : FEDERAL_CHARITY_ABOVE_200_RATE_STANDARD
  return round2(first * FEDERAL_CHARITY_FIRST_200_RATE + rest * rateAbove200)
}

/** Provincial charitable donation credit using jurisdiction-specific two-tier (and optional high-income balance) rates. */
export function calculateProvincialCharitableCredit(
  amount: number,
  province: ProvinceCode,
  taxableIncome: number
): number {
  return calculateProvincialCharitableCreditForProvince(amount, province, taxableIncome)
}

export interface CharitableCreditInput {
  amount: number
  taxableIncome: number
  province: ProvinceCode
}

export function calculateCharitableCredit({ amount, taxableIncome, province }: CharitableCreditInput): CharitableBreakdown {
  const federal = calculateFederalCharitableCredit(amount, taxableIncome)
  const provincial = calculateProvincialCharitableCredit(amount, province, taxableIncome)
  return {
    federal,
    provincial,
    total: round2(federal + provincial),
  }
}

export interface TotalCreditInput {
  charitableAmount: number
  charitableTaxableIncome: number
  province: ProvinceCode
  politicalAmount: number
}

export function calculateTotalCredit({
  charitableAmount,
  charitableTaxableIncome,
  province,
  politicalAmount,
}: TotalCreditInput): { charitable: CharitableBreakdown; political: PoliticalBreakdown; total: number } {
  const charitable = calculateCharitableCredit({
    amount: charitableAmount,
    taxableIncome: charitableTaxableIncome,
    province,
  })
  const politicalFederal = calculatePoliticalCredit(politicalAmount)
  const political: PoliticalBreakdown = {
    federal: politicalFederal,
    total: politicalFederal,
  }
  return {
    charitable,
    political,
    total: round2(charitable.total + political.total),
  }
}

const TIE_EPS = 0.005

/**
 * Taxable income used for charitable **credit** tiers (federal 29% vs 33% on amount over $200; some provincial balance rates).
 * For couples, uses the **higher** of the two incomes — a common planning assumption when pooling claims on one return.
 */
export function charitableTaxableIncomeForCredits(inputs: ComparisonInputPayload): number {
  const t = Math.max(0, inputs.taxpayerIncome)
  const s = Math.max(0, inputs.spouseIncome)
  if (inputs.filingType === 'couple') return Math.max(t, s)
  return t
}

/**
 * “This or that”: same dollar amount X is modeled as 100% charitable contributions vs 100% federal political contributions.
 * Credits are not additive between the two rows — you are comparing mutually exclusive uses of X.
 */
export function compareThisOrThat(inputs: ComparisonInputPayload): ThisOrThatResult {
  const x = Math.max(0, inputs.contributionAmount)
  const taxableIncome = charitableTaxableIncomeForCredits(inputs)
  const charitableIncomeBasisLabel =
    inputs.filingType === 'couple' ? 'Higher of taxpayer and spouse' : 'Taxpayer'

  const charitableBreakdown = calculateCharitableCredit({
    amount: x,
    taxableIncome,
    province: inputs.province,
  })
  const politicalFederal = calculatePoliticalCredit(x)
  const politicalBreakdown: PoliticalBreakdown = {
    federal: politicalFederal,
    total: politicalFederal,
  }

  const c = charitableBreakdown.total
  const p = politicalBreakdown.total
  let betterStrategy: ThisOrThatResult['betterStrategy']
  if (Math.abs(c - p) < TIE_EPS) betterStrategy = 'tie'
  else betterStrategy = c > p ? 'charitable' : 'political'

  const advantageDollars = round2(Math.max(c, p) - Math.min(c, p))

  const fmt = (n: number) =>
    n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 })

  let summary: string
  if (x <= 0) {
    summary = 'Enter a contribution amount greater than zero to compare credits.'
  } else if (betterStrategy === 'tie') {
    summary = `For ${fmt(x)}, charitable and federal political credits are about the same in this model (${fmt(c)} each).`
  } else if (betterStrategy === 'charitable') {
    summary = `For ${fmt(x)}, charitable donations yield about ${fmt(advantageDollars)} more in combined federal + provincial credits than the same amount as a federal political contribution (${fmt(c)} vs ${fmt(p)}).`
  } else {
    summary = `For ${fmt(x)}, a federal political contribution yields about ${fmt(advantageDollars)} more in federal credits than the same amount as charitable donations (${fmt(p)} vs ${fmt(c)}). Provincial credits apply only to charitable donations.`
  }

  const coupleNote =
    inputs.filingType === 'couple'
      ? 'When filing as a couple, the model uses the higher of the two taxable incomes for charitable tier rules (as if donations were claimed on the higher earner’s return).'
      : 'When filing single, only the taxpayer’s taxable income affects charitable tier rules.'

  const footnotes = [
    `${coupleNote} Income used for those rules: ${fmt(taxableIncome)}.`,
    'Political path: federal political credits depend only on the contribution amount (tiers and a maximum credit), not on taxable income or filing type.',
    'You cannot claim both scenarios for the same dollars — this compares which use of the same budget produces higher credits.',
    `Charitable credits for this donation size only change when income crosses certain thresholds (for example federal taxable income above about ${fmt(FEDERAL_TOP_BRACKET_START)} in this model switches the federal rate on donations over $200 from 29% to 33%; BC and Quebec have additional high-income balance rates).`,
  ]

  return {
    contributionAmount: x,
    charitableIncomeUsed: taxableIncome,
    charitableIncomeBasisLabel,
    charitable: { totalCredit: c, breakdown: charitableBreakdown },
    political: { totalCredit: p, breakdown: politicalBreakdown },
    betterStrategy,
    advantageDollars,
    summary,
    footnotes,
  }
}
