/**
 * Grid search over salary, dividend payout, and implicit retention (pool − dividends).
 */

import { calculateCorporateTax } from '../engine/corporateTax'
import { calculatePersonalTax } from '../engine/personalTax'
import type { CorporateInput, Province, StrategyResult } from '../types/taxTypes'

export interface OptimizationParams {
  corporateGross: number
  province: Province
  corporate: Pick<CorporateInput, 'isSbdEligible' | 'sbdRoom'>
  /** Salary grid step (CAD). */
  salaryStep?: number
  /** Dividend payout grid step (CAD). */
  dividendStep?: number
  /** @deprecated Use `salaryStep` */
  step?: number
  /** Weight on total tax in balanced score (higher = prefer lower tax vs cash). */
  taxWeight?: number
  /**
   * If set (CAD), only strategies where net cash to the owner (salary + dividends − personal tax/CPP) is at least this
   * amount are considered for the “best” outcomes. Use 0 or omit for no floor.
   */
  minimumNetCashToOwner?: number
}

export interface OptimizationCell {
  salary: number
  dividend: number
  result: StrategyResult
}

export interface OptimizationResult {
  /** Lowest corporate + personal tax; may retain earnings (zero personal cash). */
  bestByTotalTax: OptimizationCell
  /** Highest net cash to the owner (salary + dividends − personal taxes/CPP). */
  bestByNetCash: OptimizationCell
  /** Maximizes netCash − λ·totalTax. */
  bestBalanced: OptimizationCell & { score: number }
  /**
   * Best outcome when all after-tax corporate cash is paid as non-eligible dividends (no discretionary retention).
   * Comparable to the historical one-dimensional “full payout” model.
   */
  bestFullDistribution: OptimizationCell
  /** Every salary × dividend combination evaluated (before applying a net-cash floor). */
  grid: OptimizationCell[]
  /** Subset of `grid` meeting `minimumNetCashToOwner`, if that parameter was used. */
  feasibleGrid: OptimizationCell[]
  /** True when no minimum was set, or at least one grid point meets the minimum. */
  constraintFeasible: boolean
  /** Echo of the minimum net cash requirement, if any. */
  minimumNetCashToOwner?: number
  /** True when results below were chosen from `feasibleGrid` rather than the full `grid`. */
  resultsRespectMinimumNetCash: boolean
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Owner is assumed to have no income outside this CCPC. Salary S, then corporate tax on (gross − S);
 * optional non-eligible dividend D up to the after-tax pool; the rest stays in the corporation.
 */
export function evaluateCcpcExtraction(
  corporateGross: number,
  salary: number,
  dividendPayout: number,
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
  const pool = Math.max(0, round2(abi - corp.total))
  const D = Math.max(0, Math.min(dividendPayout, pool))
  const retained = round2(pool - D)
  const personal = calculatePersonalTax({
    employmentIncome: S,
    otherIncome: 0,
    dividendEligible: 0,
    dividendNonEligible: D,
    province,
  })
  const personalTotal = round2(
    personal.federal.netTax + personal.provincial.netTax + personal.cpp.employee
  )
  const netCash = round2(S + D - personalTotal)
  const rrspRoom = round2(S * 0.18)
  const fedNet = round2(personal.federal.netTax)
  const provNet = round2(personal.provincial.netTax)
  const cppEmp = round2(personal.cpp.employee)
  return {
    corporateTax: corp.total,
    personalTax: personalTotal,
    totalTax: round2(corp.total + personalTotal),
    netCash,
    rrspRoom,
    dividendPaid: D,
    retainedInCorporation: retained,
    poolAfterCorpTax: pool,
    personalFederalNet: fedNet,
    personalProvincialNet: provNet,
    cppEmployee: cppEmp,
  }
}

function pushSalaryEndpoint(
  G: number,
  province: Province,
  corporate: Pick<CorporateInput, 'isSbdEligible' | 'sbdRoom'>,
  salary: number,
  dividendStep: number,
  out: OptimizationCell[]
): void {
  const pool = evaluateCcpcExtraction(G, salary, Number.POSITIVE_INFINITY, province, corporate).poolAfterCorpTax ?? 0
  let lastD = -1
  for (let d = 0; d <= pool; d += dividendStep) {
    out.push({
      salary,
      dividend: d,
      result: evaluateCcpcExtraction(G, salary, d, province, corporate),
    })
    lastD = d
  }
  if (pool > 0 && lastD < pool - 0.005) {
    out.push({
      salary,
      dividend: pool,
      result: evaluateCcpcExtraction(G, salary, pool, province, corporate),
    })
  }
}

function pickBests(
  grid: OptimizationCell[],
  taxWeight: number
): Pick<OptimizationResult, 'bestByTotalTax' | 'bestByNetCash' | 'bestBalanced' | 'bestFullDistribution'> {
  let bestByTotalTax = grid[0]!
  let bestByNetCash = grid[0]!
  let bestBalanced = grid[0]!
  let bestScore = bestBalanced.result.netCash - taxWeight * bestBalanced.result.totalTax

  for (const cell of grid) {
    if (cell.result.totalTax < bestByTotalTax.result.totalTax) {
      bestByTotalTax = cell
    }
    if (cell.result.netCash > bestByNetCash.result.netCash) {
      bestByNetCash = cell
    }
    const score = cell.result.netCash - taxWeight * cell.result.totalTax
    if (score > bestScore) {
      bestScore = score
      bestBalanced = cell
    }
  }

  let bestFullDistribution: OptimizationCell | null = null
  for (const cell of grid) {
    const pool = cell.result.poolAfterCorpTax ?? 0
    const paid = cell.result.dividendPaid ?? 0
    if (Math.abs(paid - pool) > 0.02) continue
    if (!bestFullDistribution || cell.result.totalTax < bestFullDistribution.result.totalTax) {
      bestFullDistribution = cell
    }
  }

  return {
    bestByTotalTax,
    bestByNetCash,
    bestBalanced: { ...bestBalanced, score: bestScore },
    bestFullDistribution: bestFullDistribution ?? bestByTotalTax,
  }
}

/**
 * 2D grid: salary and dividend payout. Retention = pool − dividend (no personal tax on retained amounts this year).
 */
export function optimizeSalaryDividend(params: OptimizationParams): OptimizationResult {
  const salaryStep = params.salaryStep ?? params.step ?? 1000
  const dividendStep = params.dividendStep ?? params.salaryStep ?? params.step ?? 1000
  const taxWeight = params.taxWeight ?? 0.35
  const minRaw = params.minimumNetCashToOwner
  const minimumNetCashToOwner =
    minRaw != null && Number.isFinite(minRaw) && minRaw > 0 ? minRaw : undefined
  const { corporateGross, province, corporate } = params
  const G = Math.max(0, corporateGross)

  const grid: OptimizationCell[] = []

  for (let salary = 0; salary <= G; salary += salaryStep) {
    pushSalaryEndpoint(G, province, corporate, salary, dividendStep, grid)
  }
  if (G > 0) {
    const lastRow = grid.filter((c) => c.salary >= G - 0.005)
    if (lastRow.length === 0 || lastRow[0]!.salary < G) {
      pushSalaryEndpoint(G, province, corporate, G, dividendStep, grid)
    }
  }

  if (grid.length === 0) {
    const empty: StrategyResult = {
      corporateTax: 0,
      personalTax: 0,
      totalTax: 0,
      netCash: 0,
      rrspRoom: 0,
      dividendPaid: 0,
      retainedInCorporation: 0,
      poolAfterCorpTax: 0,
      personalFederalNet: 0,
      personalProvincialNet: 0,
      cppEmployee: 0,
    }
    const cell: OptimizationCell = { salary: 0, dividend: 0, result: empty }
    return {
      bestByTotalTax: cell,
      bestByNetCash: cell,
      bestBalanced: { ...cell, score: 0 },
      bestFullDistribution: cell,
      grid: [],
      feasibleGrid: [],
      constraintFeasible: true,
      minimumNetCashToOwner,
      resultsRespectMinimumNetCash: false,
    }
  }

  const feasibleGrid =
    minimumNetCashToOwner != null
      ? grid.filter((c) => c.result.netCash + 1e-6 >= minimumNetCashToOwner)
      : grid
  const constraintFeasible = minimumNetCashToOwner == null || feasibleGrid.length > 0
  const useFeasible =
    minimumNetCashToOwner != null && feasibleGrid.length > 0
  const workingGrid = useFeasible ? feasibleGrid : grid
  const resultsRespectMinimumNetCash = useFeasible

  const bests = pickBests(workingGrid, taxWeight)

  return {
    ...bests,
    grid,
    feasibleGrid,
    constraintFeasible,
    minimumNetCashToOwner,
    resultsRespectMinimumNetCash,
  }
}
