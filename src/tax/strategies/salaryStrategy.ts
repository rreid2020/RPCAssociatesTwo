/**
 * Salary extraction: reduces corporate ABI, full employment taxation + CPP, RRSP room from salary.
 */

import { calculateCorporateTax } from '../engine/corporateTax'
import { calculatePersonalTax } from '../engine/personalTax'
import type { CorporateInput, Province, StrategyResult } from '../types/taxTypes'

const RRSP_EARNED_RATE = 0.18

export interface SalaryAllocationParams {
  /** Gross active business income before salary. */
  corporateGross: number
  salary: number
  province: Province
  /** Passed to corporate engine (SBD eligibility). */
  corporate: Pick<CorporateInput, 'isSbdEligible' | 'sbdRoom'>
}

/**
 * Corporate tax on (gross − salary); personal tax on salary only (no dividends in this slice).
 */
export function evaluateSalarySlice(params: SalaryAllocationParams): StrategyResult {
  const { corporateGross, salary, province, corporate } = params
  const S = Math.max(0, Math.min(salary, corporateGross))
  const corporateIncome = Math.max(0, corporateGross - S)

  const corp = calculateCorporateTax({
    income: corporateIncome,
    province,
    isSbdEligible: corporate.isSbdEligible,
    sbdRoom: corporate.sbdRoom,
  })

  const personal = calculatePersonalTax({
    employmentIncome: S,
    otherIncome: 0,
    dividendEligible: 0,
    dividendNonEligible: 0,
    province,
  })

  const netCash = round2(S - (personal.federal.netTax + personal.provincial.netTax + personal.cpp.employee))
  const rrspRoom = round2(S * RRSP_EARNED_RATE)

  return {
    corporateTax: corp.total,
    personalTax: round2(personal.federal.netTax + personal.provincial.netTax + personal.cpp.employee),
    totalTax: round2(corp.total + personal.federal.netTax + personal.provincial.netTax + personal.cpp.employee),
    netCash,
    rrspRoom,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
