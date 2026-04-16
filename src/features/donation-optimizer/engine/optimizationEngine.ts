/**
 * Charitable (federal + ON) and federal political credits are independent under this module’s rules
 * (no donation-to-income caps, no shared pools between credit types). The household optimum is therefore
 * max(charitable configurations) + max(political splits) — see comments on each optimizer.
 */

import {
  calculateCharitableCredit,
  calculatePoliticalCredit,
  round2,
} from './donationEngine'
import type {
  CharitableClaimant,
  CreditBreakdown,
  InputPayload,
  OptimizationResult,
  PoliticalSplit,
  ScenarioResult,
} from './types'

const POLITICAL_KINKS = [0, 400, 750, 1275] as const

function politicalSplitCredit(split: PoliticalSplit): { federal: number; total: number } {
  const a = calculatePoliticalCredit(split.taxpayerAmount)
  const b = calculatePoliticalCredit(split.spouseAmount)
  const federal = round2(a + b)
  return { federal, total: federal }
}

/** Enumerate split points where either spouse’s contribution hits a political credit tier boundary. */
export function enumeratePoliticalSplits(total: number, filingType: InputPayload['filingType']): PoliticalSplit[] {
  if (total <= 0 || filingType === 'single') {
    return [{ taxpayerAmount: Math.max(0, total), spouseAmount: 0 }]
  }
  const candidates = new Set<number>()
  candidates.add(0)
  candidates.add(total)
  for (const k of POLITICAL_KINKS) {
    candidates.add(clamp(k, 0, total))
    candidates.add(clamp(total - k, 0, total))
  }
  return [...candidates].sort((x, y) => x - y).map((taxpayerAmount) => ({
    taxpayerAmount,
    spouseAmount: round2(total - taxpayerAmount),
  }))
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

interface CharitableOption {
  charitablePool: number
  useCarryforward: boolean
  charitableClaimant: CharitableClaimant
  charitableBreakdown: CreditBreakdown['charitable']
}

function buildCharitableOptions(inputs: InputPayload): CharitableOption[] {
  const { charitableDonations, priorCharitableDonations, filingType, taxpayerIncome, spouseIncome, province } =
    inputs
  const options: CharitableOption[] = []

  const carryforwardChoices: boolean[] = priorCharitableDonations > 0 ? [true, false] : [false]

  for (const useCarryforward of carryforwardChoices) {
    const pool = round2(charitableDonations + (useCarryforward ? priorCharitableDonations : 0))
    if (pool < 0) continue

    if (filingType === 'single') {
      const charitableBreakdown = calculateCharitableCredit({
        amount: pool,
        taxableIncome: taxpayerIncome,
        province,
      })
      options.push({
        charitablePool: pool,
        useCarryforward,
        charitableClaimant: 'taxpayer',
        charitableBreakdown,
      })
    } else {
      for (const charitableClaimant of ['taxpayer', 'spouse'] as const) {
        const taxableIncome = charitableClaimant === 'taxpayer' ? taxpayerIncome : spouseIncome
        const charitableBreakdown = calculateCharitableCredit({
          amount: pool,
          taxableIncome,
          province,
        })
        options.push({
          charitablePool: pool,
          useCarryforward,
          charitableClaimant,
          charitableBreakdown,
        })
      }
    }
  }

  return options
}

function bestCharitableOption(inputs: InputPayload): CharitableOption {
  const opts = buildCharitableOptions(inputs)
  if (opts.length === 0) {
    return {
      charitablePool: 0,
      useCarryforward: false,
      charitableClaimant: 'taxpayer',
      charitableBreakdown: calculateCharitableCredit({
        amount: 0,
        taxableIncome: inputs.taxpayerIncome,
        province: inputs.province,
      }),
    }
  }
  return opts.reduce((a, b) => (a.charitableBreakdown.total >= b.charitableBreakdown.total ? a : b))
}

function bestPoliticalSplit(inputs: InputPayload): PoliticalSplit {
  const total = Math.max(0, inputs.politicalDonations)
  const splits = enumeratePoliticalSplits(total, inputs.filingType)
  let best = splits[0]!
  let bestScore = politicalSplitCredit(best).total
  for (const s of splits) {
    const score = politicalSplitCredit(s).total
    if (score > bestScore) {
      best = s
      bestScore = score
    }
  }
  return best
}

function mergeToScenario(
  id: string,
  label: string,
  charitable: CharitableOption,
  politicalSplit: PoliticalSplit,
  inputs: InputPayload
): ScenarioResult {
  const pol = politicalSplitCredit(politicalSplit)
  const political = { federal: pol.federal, total: pol.total }
  const combined = round2(charitable.charitableBreakdown.total + political.total)
  const breakdown: CreditBreakdown = {
    charitable: charitable.charitableBreakdown,
    political,
    combined,
  }
  return {
    id,
    label,
    charitablePool: charitable.charitablePool,
    useCarryforward: charitable.useCarryforward,
    charitableClaimant: inputs.filingType === 'single' ? 'taxpayer' : charitable.charitableClaimant,
    politicalSplit,
    breakdown,
    totalCredit: combined,
  }
}

/** Every combination of charitable option × political split (small finite set). */
export function runOptimizationScenarios(inputs: InputPayload): ScenarioResult[] {
  const charitableOpts = buildCharitableOptions(inputs)
  const polSplits = enumeratePoliticalSplits(Math.max(0, inputs.politicalDonations), inputs.filingType)
  const out: ScenarioResult[] = []
  let idx = 0
  for (const c of charitableOpts) {
    for (const p of polSplits) {
      idx += 1
      const label = `${c.useCarryforward ? 'Carryforward: use · ' : 'Carryforward: defer · '}Claim: ${c.charitableClaimant} · Pol split ${p.taxpayerAmount}/${p.spouseAmount}`
      out.push(mergeToScenario(`s${idx}`, label, c, p, inputs))
    }
  }
  return out
}

export function compareScenarios(a: ScenarioResult, b: ScenarioResult): number {
  return round2(a.totalCredit - b.totalCredit)
}

export function returnBestScenario(scenarios: ScenarioResult[]): ScenarioResult {
  return scenarios.reduce((best, s) => (s.totalCredit > best.totalCredit ? s : best))
}

function buildNaiveScenario(inputs: InputPayload): ScenarioResult {
  const pool = round2(inputs.charitableDonations + inputs.priorCharitableDonations)
  const useCF = inputs.priorCharitableDonations > 0
  const charitableBreakdown = calculateCharitableCredit({
    amount: pool,
    taxableIncome: inputs.taxpayerIncome,
    province: inputs.province,
  })
  const charitable: CharitableOption = {
    charitablePool: pool,
    useCarryforward: useCF,
    charitableClaimant: 'taxpayer',
    charitableBreakdown,
  }
  const politicalSplit: PoliticalSplit = {
    taxpayerAmount: Math.max(0, inputs.politicalDonations),
    spouseAmount: 0,
  }
  return mergeToScenario('naive', 'Naive: all donations claimed on taxpayer return', charitable, politicalSplit, inputs)
}

function buildInsights(
  inputs: InputPayload,
  best: ScenarioResult,
  naive: ScenarioResult,
  bestPolitical: PoliticalSplit
): string[] {
  const insights: string[] = []
  const delta = round2(best.totalCredit - naive.totalCredit)
  if (delta > 0.005) {
    insights.push(
      `Compared to putting all donations on the taxpayer return (naive), the optimized allocation increases combined credits by about ${formatMoney(delta)} in this model.`
    )
  }

  if (inputs.filingType === 'couple') {
    const hi =
      inputs.taxpayerIncome >= inputs.spouseIncome
        ? ('taxpayer' as const)
        : ('spouse' as const)
    const hiInc = hi === 'taxpayer' ? inputs.taxpayerIncome : inputs.spouseIncome
    const loInc = hi === 'taxpayer' ? inputs.spouseIncome : inputs.taxpayerIncome
    if (hiInc > 253_414 && loInc <= 253_414 && best.charitableClaimant === hi) {
      insights.push(
        'Assigning charitable donations to the higher-income spouse can increase the federal credit above $200 (33% vs 29% in this simplified model).'
      )
    }
    if (bestPolitical.spouseAmount > 0.005 && bestPolitical.taxpayerAmount > 0.005) {
      insights.push(
        'Splitting political contributions between spouses can raise total federal political credits when the combined amount would otherwise exceed the per-person effective cap range.'
      )
    }
  }

  if (best.useCarryforward === false && inputs.priorCharitableDonations > 0 && naive.useCarryforward) {
    insights.push(
      'Deferring carryforward (planning-only here) scored higher this year; confirm with a full return or carryforward schedule before deciding not to claim.'
    )
  }

  return insights
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n)
}

function unusedOpportunities(): string[] {
  return [
    'Donation limits as a percentage of net income (federal / provincial) are not modeled.',
    'Full Schedule 9 apportionment of the 33% federal rate to income taxed at the top marginal rate is simplified to a single income threshold.',
    'Quebec federal tax abatement and other cross-credit interactions are not modeled.',
    'Ontario surtax-driven effective donation rates and trust-specific ON rates are not modeled.',
    'Marginal rates are illustrative (tax on the next dollar of taxable income) and exclude CPP/EI and other levies.',
  ]
}

export function optimizeDonations(inputs: InputPayload): OptimizationResult {
  const scenarios = runOptimizationScenarios(inputs)
  const naive = buildNaiveScenario(inputs)
  const bestCharitable = bestCharitableOption(inputs)
  const bestPolitical = bestPoliticalSplit(inputs)

  const recomputedBest = mergeToScenario(
    'best',
    'Optimized allocation',
    {
      charitablePool: bestCharitable.charitablePool,
      useCarryforward: bestCharitable.useCarryforward,
      charitableClaimant: bestCharitable.charitableClaimant,
      charitableBreakdown: bestCharitable.charitableBreakdown,
    },
    bestPolitical,
    inputs
  )

  const deltaDollars = round2(recomputedBest.totalCredit - naive.totalCredit)
  const deltaPercent =
    naive.totalCredit > 0.005 ? round2((deltaDollars / naive.totalCredit) * 100) : deltaDollars > 0 ? 100 : 0

  const insights = buildInsights(inputs, recomputedBest, naive, bestPolitical)

  return {
    taxYear: 2025,
    naiveScenario: naive,
    bestScenario: recomputedBest,
    optimalTotalCredit: recomputedBest.totalCredit,
    optimalAllocation: {
      charitableClaimant:
        inputs.filingType === 'single' ? 'n/a' : recomputedBest.charitableClaimant ?? 'taxpayer',
      charitableUseCarryforward: recomputedBest.useCarryforward,
      politicalSplit: recomputedBest.politicalSplit,
    },
    insights,
    unusedOpportunities: unusedOpportunities(),
    deltaVsNaive: { dollars: deltaDollars, percent: deltaPercent },
    scenarios: [...scenarios, naive].sort((a, b) => b.totalCredit - a.totalCredit),
  }
}
