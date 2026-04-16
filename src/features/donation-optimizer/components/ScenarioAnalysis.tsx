import type { OptimizationResult, ScenarioResult } from '../engine/types'

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n)
}

function formatPctOfBest(total: number, best: number): string {
  if (best <= 0) return '—'
  return `${((total / best) * 100).toFixed(0)}%`
}

function shortScenarioLabel(s: ScenarioResult): string {
  const cf = s.useCarryforward ? 'Use carryforward' : 'Defer carryforward'
  const claim = s.charitableClaimant === 'taxpayer' ? 'Charity: taxpayer' : 'Charity: spouse'
  const pol =
    s.politicalSplit.spouseAmount < 0.01
      ? 'Political: one spouse'
      : `Political: ${Math.round(s.politicalSplit.taxpayerAmount)} / ${Math.round(s.politicalSplit.spouseAmount)}`
  return `${cf} · ${claim} · ${pol}`
}

export interface ScenarioAnalysisProps {
  result: OptimizationResult
  /** Max rows (default 14). */
  limit?: number
}

/**
 * Side-by-side style scenario grid (similar in spirit to donation “what-if” videos):
 * ranks combinations of carryforward, charitable claimant, and political split by total credits.
 */
export function ScenarioAnalysis({ result, limit = 14 }: ScenarioAnalysisProps) {
  const sorted = [...result.scenarios].sort((a, b) => b.totalCredit - a.totalCredit)
  const bestCredit = sorted[0]?.totalCredit ?? 0
  const rows = sorted.slice(0, limit)

  return (
    <section className="rounded-lg border border-border bg-white p-4 shadow-sm md:p-6">
      <h2 className="mb-1 text-lg font-semibold text-text">Scenario analysis</h2>
      <p className="mb-4 text-sm text-text-light">
        Every combination of carryforward strategy, who claims charitable donations (one return), and how political
        contributions are split. Compare total non-refundable credits in this model — higher is better.
      </p>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-light">
              <th className="py-2 pr-2 font-medium">#</th>
              <th className="py-2 pr-3 font-medium">Strategy</th>
              <th className="py-2 pr-3 font-medium text-right">Total</th>
              <th className="py-2 pr-3 font-medium text-right">vs best</th>
              <th className="py-2 font-medium">Scale</th>
            </tr>
          </thead>
          <tbody className="text-text">
            {rows.map((s, i) => (
              <tr key={s.id} className="border-b border-border/70">
                <td className="py-2.5 pr-2 text-text-light">{i + 1}</td>
                <td className="max-w-[340px] py-2.5 pr-3">
                  <span className="font-medium leading-snug">{shortScenarioLabel(s)}</span>
                </td>
                <td className="py-2.5 pr-3 text-right font-semibold tabular-nums">{formatCurrency(s.totalCredit)}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums text-text-light">
                  {formatPctOfBest(s.totalCredit, bestCredit)}
                </td>
                <td className="py-2.5 align-middle">
                  <div className="h-2.5 overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full rounded-full bg-accent/80"
                      style={{ width: `${bestCredit > 0 ? Math.min(100, (s.totalCredit / bestCredit) * 100) : 0}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {rows.map((s, i) => (
          <li key={s.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold text-text-light">#{i + 1}</span>
              <span className="text-right font-semibold tabular-nums text-text">{formatCurrency(s.totalCredit)}</span>
            </div>
            <p className="mt-1 text-sm leading-snug text-text">{shortScenarioLabel(s)}</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full bg-accent/80"
                style={{ width: `${bestCredit > 0 ? Math.min(100, (s.totalCredit / bestCredit) * 100) : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-text-light">
        Naive baseline (all on taxpayer) is included in the list when applicable. Political credits are federal only;
        charitable credits use federal + selected province or territory.
      </p>
    </section>
  )
}
