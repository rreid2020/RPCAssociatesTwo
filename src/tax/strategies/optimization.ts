/**
 * Grid search over salary vs remainder as non-eligible dividends after corporate tax.
 */

import { calculateCorporateTax } from '../engine/corporateTax'
import { calculatePersonalTax } from '../engine/personalTax'
import type { CorporateInput, Province, StrategyResult } from '../types/taxTypes'

export interface OptimizationParams {
  corporateGross: number
  province: Province
  corporate: Pick<CorporateInput, 'isSbdEligible' | 'sbdRoom'>
  /** Salary grid step (CAD). */
  step?: number
  /** Weight on total tax in balanced score (higher = prefer lower tax vs cash). */
  taxWeight?: number
}

export interface OptimizationResult {
  bestByTotalTax: { salary: number; result: StrategyResult }
  bestBalanced: { salary: number; score: number; result: StrategyResult }
  grid: { salary: number; result: StrategyResult }[]
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function evaluateCombined(
  corporateGross: number,
  salary: number,
  province: Province,
  corporate: Pick<CorporateInput, 'isSbdEligible' | 'sbdRoom'>
): StrategyResult {
  const S = Math.max(0, Math.min(salary, corporateGross))
  const abi = Math.max(0, corporateGross - S)
  const corp = calculateCorporateTax({
    income: abi,
    province,
    isSbdEligible: corporate.isSbdEligible,
    sbdRoom: corporate.sbdRoom,
  })
  const dividend = Math.max(0, round2(abi - corp.total))
  const personal = calculatePersonalTax({
    employmentIncome: S,
    otherIncome: 0,
    dividendEligible: 0,
    dividendNonEligible: dividend,
    province,
  })
  const personalTotal = round2(
    personal.federal.netTax + personal.provincial.netTax + personal.cpp.employee
  )
  const netCash = round2(S + dividend - personalTotal)
  const rrspRoom = round2(S * 0.18)
  return {
    corporateTax: corp.total,
    personalTax: personalTotal,
    totalTax: round2(corp.total + personalTotal),
    netCash,
    rrspRoom,
  }
}

/**
 * Scan salary from 0 to corporate gross (inclusive) and return best total tax and balanced (netCash − λ·totalTax) outcomes.
 */
export function optimizeSalaryDividend(params: OptimizationParams): OptimizationResult {
  const step = params.step ?? 1000
  const taxWeight = params.taxWeight ?? 0.35
  const { corporateGross, province, corporate } = params
  const G = Math.max(0, corporateGross)

  const grid: { salary: number; result: StrategyResult }[] = []
  for (let salary = 0; salary <= G; salary += step) {
    const result = evaluateCombined(G, salary, province, corporate)
    grid.push({ salary, result })
  }
  if (G > 0 && (grid.length === 0 || grid[grid.length - 1]!.salary < G)) {
    grid.push({ salary: G, result: evaluateCombined(G, G, province, corporate) })
  }

  let bestByTotalTax = grid[0]!
  let bestBalanced = grid[0]!
  let bestScore = bestBalanced.result.netCash - taxWeight * bestBalanced.result.totalTax

  for (const cell of grid) {
    if (cell.result.totalTax < bestByTotalTax.result.totalTax) {
      bestByTotalTax = cell
    }
    const score = cell.result.netCash - taxWeight * cell.result.totalTax
    if (score > bestScore) {
      bestScore = score
      bestBalanced = cell
    }
  }

  return { bestByTotalTax, bestBalanced: { ...bestBalanced, score: bestScore }, grid }
}
