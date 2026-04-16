import type { CharitableBreakdown, PoliticalBreakdown, ProvinceCode } from './types'
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
