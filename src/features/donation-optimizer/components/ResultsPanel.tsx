import type { InputPayload, OptimizationResult } from '../engine/types'

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n)
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`
}

export interface ResultsPanelProps {
  inputs: InputPayload
  result: OptimizationResult
  /** Optional what-if optimization when charitable sensitivity is non-zero. */
  sensitivityResult: OptimizationResult | null
}

/**
 * Effective credit % = total combined credits / max($1, charitable + political dollars in).
 * Measures how much of each contributed dollar comes back as non-refundable credits in this model.
 */
export function ResultsPanel({ inputs, result, sensitivityResult }: ResultsPanelProps) {
  const { bestScenario } = result
  const donationDenominator = Math.max(1, inputs.charitableDonations + inputs.politicalDonations)
  const effectivePct = (bestScenario.totalCredit / donationDenominator) * 100

  return (
    <section className="rounded-lg border border-border bg-white p-4 shadow-sm md:p-6">
      <h2 className="mb-4 text-lg font-semibold text-text">Optimized results</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-md bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-light">Total tax credits (model)</p>
          <p className="mt-1 text-2xl font-semibold text-text">{formatCurrency(bestScenario.totalCredit)}</p>
          <p className="mt-2 text-xs text-text-light">
            Effective credit on donations entered:{' '}
            <span className="font-medium text-text">{formatPct(effectivePct)}</span>
          </p>
        </div>
        <div className="rounded-md border border-border p-4">
          <p className="text-xs font-medium text-text-light">Allocation summary</p>
          <ul className="mt-2 space-y-1 text-sm text-text">
            <li>
              <span className="text-text-light">Charitable: </span>
              {inputs.filingType === 'couple'
                ? `Claim on ${result.optimalAllocation.charitableClaimant} return · carryforward: ${
                    result.optimalAllocation.charitableUseCarryforward ? 'use now' : 'defer (planning)'
                  }`
                : 'Single return'}
            </li>
            <li>
              <span className="text-text-light">Political split: </span>
              taxpayer {formatCurrency(result.optimalAllocation.politicalSplit.taxpayerAmount)} · spouse{' '}
              {formatCurrency(result.optimalAllocation.politicalSplit.spouseAmount)}
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-text">Credit breakdown</h3>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-2 border-b border-border py-2">
            <dt className="text-text-light">Charitable — federal</dt>
            <dd className="font-medium text-text">{formatCurrency(bestScenario.breakdown.charitable.federal)}</dd>
          </div>
          <div className="flex justify-between gap-2 border-b border-border py-2">
            <dt className="text-text-light">Charitable — Ontario</dt>
            <dd className="font-medium text-text">{formatCurrency(bestScenario.breakdown.charitable.provincial)}</dd>
          </div>
          <div className="flex justify-between gap-2 border-b border-border py-2">
            <dt className="text-text-light">Charitable — total</dt>
            <dd className="font-medium text-text">{formatCurrency(bestScenario.breakdown.charitable.total)}</dd>
          </div>
          <div className="flex justify-between gap-2 border-b border-border py-2">
            <dt className="text-text-light">Political — federal</dt>
            <dd className="font-medium text-text">{formatCurrency(bestScenario.breakdown.political.federal)}</dd>
          </div>
        </dl>
      </div>

      {result.insights.length > 0 && (
        <div className="mt-6 rounded-md border border-accent/30 bg-background p-4">
          <h3 className="text-sm font-semibold text-text">Insights</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-text-light">
            {result.insights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {result.unusedOpportunities.length > 0 && (
        <div className="mt-4 text-xs text-text-light">
          <span className="font-medium text-text">Not modeled: </span>
          {result.unusedOpportunities.join(' ')}
        </div>
      )}

      {sensitivityResult && (
        <div className="mt-6 rounded-md border border-dashed border-border p-4">
          <h3 className="text-sm font-semibold text-text">What-if (charitable sensitivity)</h3>
          <p className="mt-1 text-sm text-text-light">
            Total credits if charitable donations were adjusted as on the slider:{' '}
            <span className="font-semibold text-text">{formatCurrency(sensitivityResult.optimalTotalCredit)}</span>
          </p>
        </div>
      )}
    </section>
  )
}
