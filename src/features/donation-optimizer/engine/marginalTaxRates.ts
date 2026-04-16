/**
 * Approximate **marginal** income tax rates (tax on the next dollar of taxable income) for 2025.
 * Uses bracket JSON aligned with `src/tax-data/2025/` — same source as the main site tax calculator.
 */

import type { ProvinceCode } from './types'
import federalData from '../../../tax-data/2025/federal.json'
import provincesData from '../../../tax-data/2025/provinces.json'

type JsonBracket = { upTo: number | null; rate: number }

function marginalRateFromBrackets(taxableIncome: number, brackets: JsonBracket[]): number {
  if (!brackets.length) return 0
  const income = Math.max(0, taxableIncome)
  for (const b of brackets) {
    const ceiling = b.upTo ?? Number.POSITIVE_INFINITY
    if (income <= ceiling) return b.rate
  }
  return brackets[brackets.length - 1]!.rate
}

export function marginalFederalRate(taxableIncome: number): number {
  return marginalRateFromBrackets(taxableIncome, federalData.brackets as JsonBracket[])
}

export function marginalProvincialRate(taxableIncome: number, province: ProvinceCode): number {
  const raw = (provincesData as Record<string, unknown>)[province]
  if (!raw || typeof raw !== 'object' || !('brackets' in raw)) return 0
  return marginalRateFromBrackets(taxableIncome, (raw as { brackets: JsonBracket[] }).brackets)
}

export interface MarginalRateBreakdown {
  federal: number
  provincial: number
  /** federal + provincial (not including payroll; illustrative only). */
  combined: number
}

export function marginalRateBreakdown(taxableIncome: number, province: ProvinceCode): MarginalRateBreakdown {
  const federal = marginalFederalRate(taxableIncome)
  const provincial = marginalProvincialRate(taxableIncome, province)
  return {
    federal,
    provincial,
    combined: Math.round((federal + provincial) * 10000) / 10000,
  }
}
