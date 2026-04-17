import type { ComparisonInputPayload, ThisOrThatResult } from '../engine/types'
import { marginalRateBreakdown } from '../engine/marginalTaxRates'

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n)
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`
}

function formatMarginalRate(r: number): string {
  return `${(r * 100).toFixed(1)}%`
}

export interface ResultsPanelProps {
  inputs: ComparisonInputPayload
  result: ThisOrThatResult
}

/**
 * Effective credit % = total credits for that path / contribution amount.
 */
export function ResultsPanel({ inputs, result }: ResultsPanelProps) {
  const x = Math.max(0, result.contributionAmount)
  const denom = Math.max(1, x)
  const charitablePct = (result.charitable.totalCredit / denom) * 100
  const politicalPct = (result.political.totalCredit / denom) * 100

  const mTaxpayer = marginalRateBreakdown(inputs.taxpayerIncome, inputs.province)
  const mSpouse =
    inputs.filingType === 'couple' ? marginalRateBreakdown(inputs.spouseIncome, inputs.province) : null

  const winCharitable = result.betterStrategy === 'charitable'
  const winPolitical = result.betterStrategy === 'political'
  const tie = result.betterStrategy === 'tie'

  const cardBase = 'rounded-xl border p-5 shadow-sm transition-colors'
  const highlightCharitable = winCharitable ? 'border-accent bg-accent/5 ring-1 ring-accent/30' : 'border-border bg-white'
  const highlightPolitical = winPolitical ? 'border-accent bg-accent/5 ring-1 ring-accent/30' : 'border-border bg-white'

  return (
    <section className="rounded-lg border border-border bg-white p-4 shadow-sm md:p-6">
      <h2 className="mb-2 text-lg font-semibold text-text">Results</h2>
      <p className="mb-6 text-sm text-text-light">{result.summary}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className={`${cardBase} ${highlightCharitable}`}>
          <div className="mb-1 flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-text">This: Charitable</h3>
            {x > 0 && (winCharitable || tie) && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">
                {tie ? 'Tie' : 'More credits'}
              </span>
            )}
          </div>
          <p className="mb-3 text-xs text-text-light">All {formatCurrency(x)} to registered charity (federal + provincial credits).</p>
          <p className="text-2xl font-bold tabular-nums text-text">{formatCurrency(result.charitable.totalCredit)}</p>
          <p className="mt-1 text-xs text-text-light">
            Effective credit on amount: <span className="font-medium text-text">{formatPct(charitablePct)}</span>
          </p>
          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-text-light">Federal charitable</dt>
              <dd className="font-medium tabular-nums">{formatCurrency(result.charitable.breakdown.federal)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-text-light">Provincial / territorial</dt>
              <dd className="font-medium tabular-nums">{formatCurrency(result.charitable.breakdown.provincial)}</dd>
            </div>
          </dl>
        </div>

        <div className={`${cardBase} ${highlightPolitical}`}>
          <div className="mb-1 flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-text">That: Political</h3>
            {x > 0 && (winPolitical || tie) && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">
                {tie ? 'Tie' : 'More credits'}
              </span>
            )}
          </div>
          <p className="mb-3 text-xs text-text-light">All {formatCurrency(x)} to federal political contributions (federal credit only).</p>
          <p className="text-2xl font-bold tabular-nums text-text">{formatCurrency(result.political.totalCredit)}</p>
          <p className="mt-1 text-xs text-text-light">
            Effective credit on amount: <span className="font-medium text-text">{formatPct(politicalPct)}</span>
          </p>
          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-text-light">Federal political</dt>
              <dd className="font-medium tabular-nums">{formatCurrency(result.political.breakdown.federal)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {!tie && x > 0 && (
        <div className="mt-6 rounded-lg bg-background p-4 text-center text-sm text-text">
          <span className="font-semibold text-text">{result.betterStrategy === 'charitable' ? 'Charitable' : 'Political'}</span>{' '}
          yields{' '}
          <span className="font-semibold tabular-nums text-text">{formatCurrency(result.advantageDollars)}</span> more in
          credits than the other option for this amount.
        </div>
      )}

      <div className="mt-8 rounded-md border border-border p-4">
        <h3 className="text-sm font-semibold text-text">Approximate marginal income tax rates (2025 brackets)</h3>
        <p className="mt-1 text-xs text-text-light">
          Combined federal + provincial rate on the next dollar of taxable income — context only; credits use statutory
          credit rates.
        </p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex flex-wrap justify-between gap-2 border-b border-border py-2">
            <dt className="text-text-light">Taxpayer — federal</dt>
            <dd className="font-medium tabular-nums text-text">{formatMarginalRate(mTaxpayer.federal)}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-b border-border py-2">
            <dt className="text-text-light">Taxpayer — provincial</dt>
            <dd className="font-medium tabular-nums text-text">{formatMarginalRate(mTaxpayer.provincial)}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-b border-border py-2 sm:col-span-2">
            <dt className="text-text-light">Taxpayer — combined</dt>
            <dd className="font-medium tabular-nums text-text">{formatMarginalRate(mTaxpayer.combined)}</dd>
          </div>
          {mSpouse && (
            <>
              <div className="flex flex-wrap justify-between gap-2 border-b border-border py-2">
                <dt className="text-text-light">Spouse — federal</dt>
                <dd className="font-medium tabular-nums text-text">{formatMarginalRate(mSpouse.federal)}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 border-b border-border py-2">
                <dt className="text-text-light">Spouse — provincial</dt>
                <dd className="font-medium tabular-nums text-text">{formatMarginalRate(mSpouse.provincial)}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 border-b border-border py-2 sm:col-span-2">
                <dt className="text-text-light">Spouse — combined</dt>
                <dd className="font-medium tabular-nums text-text">{formatMarginalRate(mSpouse.combined)}</dd>
              </div>
            </>
          )}
        </dl>
      </div>

      <div className="mt-6 text-xs text-text-light">
        <p className="font-medium text-text">Notes</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          {result.footnotes.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
