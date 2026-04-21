/**
 * Dividend extraction: corporate tax on full gross, remaining cash paid as non-eligible dividends (typical CCPC).
 */

import { calculateCorporateTax } from '../engine/corporateTax'
import { calculatePersonalTax } from '../engine/personalTax'
import type { CorporateInput, Province, StrategyResult } from '../types/taxTypes'

export interface DividendAllocationParams {
  corporateGross: number
  province: Province
  corporate: Pick<CorporateInput, 'isSbdEligible' | 'sbdRoom'>
}

export function evaluateDividendOnly(params: DividendAllocationParams): StrategyResult {
  const { corporateGross, province, corporate } = params
  const G = Math.max(0, corporateGross)

  const corp = calculateCorporateTax({
    income: G,
    province,
    isSbdEligible: corporate.isSbdEligible,
    sbdRoom: corporate.sbdRoom,
  })

  const dividend = Math.max(0, round2(G - corp.total))
  const personal = calculatePersonalTax({
    employmentIncome: 0,
    otherIncome: 0,
    dividendEligible: 0,
    dividendNonEligible: dividend,
    province,
  })

  const personalTotal = round2(
    personal.federal.netTax + personal.provincial.netTax + personal.cpp.employee
  )
  const netCash = round2(dividend - personalTotal)

  return {
    corporateTax: corp.total,
    personalTax: personalTotal,
    totalTax: round2(corp.total + personalTotal),
    netCash,
    rrspRoom: 0,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
