/**
 * Provincial / territorial charitable donation **credit** rates (non-refundable), 2025.
 * Source summary: [TaxTips — 2025 Donation Tax Credit Rates](https://www.taxtips.ca/filing/donations/tax-credit-rates-2025.htm)
 * Simplifications: BC/QC use a higher balance rate when taxable income exceeds published thresholds;
 * Ontario surtax-driven effective rates and QC federal abatement interactions are not modeled.
 */

import type { ProvinceCode } from './types'

const round2 = (n: number): number => Math.round(n * 100) / 100

export interface ProvincialCharityRateRule {
  /** Credit rate on first $200 of donations claimed provincially. */
  first200: number
  /** Default credit rate on donations over $200. */
  balance: number
  /** Optional: use alternate balance rate when taxable income exceeds threshold (BC, QC). */
  balanceHighIncome?: { threshold: number; rate: number }
}

/** Rates per TaxTips 2025 table; AB first $200 at 60% per Alberta measure from 2023. */
export const PROVINCIAL_CHARITY_RATES: Record<ProvinceCode, ProvincialCharityRateRule> = {
  AB: { first200: 0.6, balance: 0.21 },
  BC: {
    first200: 0.0506,
    balance: 0.168,
    balanceHighIncome: { threshold: 259_829, rate: 0.205 },
  },
  MB: { first200: 0.108, balance: 0.174 },
  NB: { first200: 0.094, balance: 0.1795 },
  NL: { first200: 0.087, balance: 0.218 },
  NS: { first200: 0.0879, balance: 0.21 },
  NT: { first200: 0.059, balance: 0.1405 },
  NU: { first200: 0.04, balance: 0.115 },
  ON: { first200: 0.0505, balance: 0.1116 },
  PE: { first200: 0.095, balance: 0.19 },
  QC: {
    first200: 0.2,
    balance: 0.24,
    balanceHighIncome: { threshold: 129_590, rate: 0.2575 },
  },
  SK: { first200: 0.105, balance: 0.145 },
  YT: { first200: 0.064, balance: 0.128 },
}

function balanceRate(rule: ProvincialCharityRateRule, taxableIncome: number): number {
  const hi = rule.balanceHighIncome
  if (hi && taxableIncome > hi.threshold) return hi.rate
  return rule.balance
}

export function calculateProvincialCharitableCreditForProvince(
  amount: number,
  province: ProvinceCode,
  taxableIncome: number
): number {
  if (amount <= 0) return 0
  const rule = PROVINCIAL_CHARITY_RATES[province]
  const first = Math.min(amount, 200)
  const rest = Math.max(0, amount - 200)
  const rBal = balanceRate(rule, taxableIncome)
  return round2(first * rule.first200 + rest * rBal)
}
