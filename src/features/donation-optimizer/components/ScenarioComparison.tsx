import type { OptimizationResult } from '../engine/types'

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n)
}

export interface ScenarioComparisonProps {
  result: OptimizationResult
}

export function ScenarioComparison({ result }: ScenarioComparisonProps) {
  const { naiveScenario, bestScenario, deltaVsNaive } = result
  const improved = deltaVsNaive.dollars > 0.005

  return (
    <section className="rounded-lg border border-border bg-white p-4 shadow-sm md:p-6">
      <h2 className="mb-4 text-lg font-semibold text-text">Naive vs optimized</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[280px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-light">
              <th className="py-2 pr-4 font-medium">Scenario</th>
              <th className="py-2 pr-4 font-medium">Total credit</th>
            </tr>
          </thead>
          <tbody className="text-text">
            <tr className="border-b border-border/80">
              <td className="py-3 pr-4">{naiveScenario.label}</td>
              <td className="py-3 font-medium">{formatCurrency(naiveScenario.totalCredit)}</td>
            </tr>
            <tr>
              <td className="py-3 pr-4">{bestScenario.label}</td>
              <td className="py-3 font-medium">{formatCurrency(bestScenario.totalCredit)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-4 rounded-md bg-background p-4 text-sm">
        {improved ? (
          <p className="text-text">
            Improvement over naive:{' '}
            <span className="font-semibold text-text">{formatCurrency(deltaVsNaive.dollars)}</span>
            {naiveScenario.totalCredit > 0.005 && (
              <>
                {' '}
                (<span className="font-semibold">{deltaVsNaive.percent.toFixed(1)}%</span> higher)
              </>
            )}
          </p>
        ) : (
          <p className="text-text-light">No material improvement over the naive allocation for these inputs.</p>
        )}
      </div>
    </section>
  )
}
