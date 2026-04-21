import { useMemo, useState } from 'react'
import {
  evaluateCcpcExtraction,
  optimizeSalaryDividend,
  PROVINCIAL_DATA,
  type OptimizationCell,
  type OptimizationResult,
  type Province,
} from '@/tax'

const CCPC_DEFAULT = { isSbdEligible: true as const }

const inputClass =
  'w-full rounded border border-border bg-white px-2 py-1.5 text-sm text-text shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'
const labelClass = 'block text-xs sm:text-sm font-medium text-text'

function num(v: string): number {
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n)
}

const PROVINCE_OPTIONS = (Object.keys(PROVINCIAL_DATA) as Province[]).sort()

function Row({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <div
      className={`flex flex-wrap justify-between gap-2 border-b border-border py-1.5 ${muted ? 'text-xs text-text-light' : ''}`}
    >
      <span className={strong ? 'font-semibold text-text' : 'text-text-light'}>{label}</span>
      <span className={`tabular-nums ${strong ? 'font-semibold text-text' : 'font-medium'}`}>{value}</span>
    </div>
  )
}

function sameStrategy(a: OptimizationCell, b: OptimizationCell): boolean {
  return (
    Math.abs(a.salary - b.salary) < 0.02 &&
    Math.abs(a.dividend - b.dividend) < 0.02 &&
    Math.abs(a.result.totalTax - b.result.totalTax) < 0.02
  )
}

/** Grid points the optimizer used to pick the lowest-tax strategy (matches engine logic). */
function getWorkingGrid(o: OptimizationResult): OptimizationCell[] {
  const min = o.minimumNetCashToOwner
  const feasible = o.feasibleGrid
  const useFeasible = min != null && feasible.length > 0
  return useFeasible ? feasible : o.grid
}

function uniqueByStrategy(cells: OptimizationCell[]): OptimizationCell[] {
  const map = new Map<string, OptimizationCell>()
  for (const c of cells) {
    const k = `${Math.round(c.salary * 100)}_${Math.round(c.dividend * 100)}`
    const prev = map.get(k)
    if (!prev || c.result.totalTax < prev.result.totalTax - 1e-6) {
      map.set(k, c)
    }
  }
  return [...map.values()]
}

function lowestTaxLeaders(workingGrid: OptimizationCell[], limit: number): OptimizationCell[] {
  return uniqueByStrategy(workingGrid)
    .sort((a, b) => a.result.totalTax - b.result.totalTax || a.salary - b.salary || a.dividend - b.dividend)
    .slice(0, limit)
}

function ReferenceBenchmarks({
  corpGross,
  province,
  bestTotalTax,
}: {
  corpGross: number
  province: Province
  bestTotalTax: number
}) {
  const rows = useMemo(
    () => [
      {
        label: 'No salary, no dividends (retain after corporate tax)',
        result: evaluateCcpcExtraction(corpGross, 0, 0, province, CCPC_DEFAULT),
      },
      {
        label: '$0 salary — pay full after-tax pool as dividends',
        result: evaluateCcpcExtraction(corpGross, 0, Number.POSITIVE_INFINITY, province, CCPC_DEFAULT),
      },
      {
        label: 'Pay full ABI as salary — no dividends',
        result: evaluateCcpcExtraction(corpGross, corpGross, 0, province, CCPC_DEFAULT),
      },
    ],
    [corpGross, province]
  )

  return (
    <div className="mt-6 border-t border-border pt-4">
      <h4 className="font-semibold text-text">Reference scenarios (same tax rules)</h4>
      <p className="mt-1 text-xs text-text-light">
        Fixed payout patterns—not necessarily on your grid steps. If total tax here is lower than rank 1 in the table,
        the grid was too coarse; reduce the salary and dividend steps and re-run.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border text-text-light">
              <th className="py-2 pr-3 font-medium">Scenario</th>
              <th className="py-2 pr-3 font-medium">Total tax</th>
              <th className="py-2 font-medium">vs grid best</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const delta = row.result.totalTax - bestTotalTax
              const tie = Math.abs(delta) < 0.02
              return (
                <tr key={row.label} className="border-b border-border">
                  <td className="py-2 pr-3 text-text-light">{row.label}</td>
                  <td className="py-2 pr-3 font-medium tabular-nums">{fmt(row.result.totalTax)}</td>
                  <td className="py-2 tabular-nums text-text-light">{tie ? '—' : `${delta > 0 ? '+' : ''}${fmt(delta)}`}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ComparisonSection({
  optimization,
  corpGross,
  province,
}: {
  optimization: OptimizationResult
  corpGross: number
  province: Province
}) {
  const workingGrid = getWorkingGrid(optimization)
  const best = optimization.bestByTotalTax
  const bestTax = best.result.totalTax
  const leaders = lowestTaxLeaders(workingGrid, 10)

  const totalScanned = optimization.grid.length
  const comparedCount = workingGrid.length
  const minCash = optimization.minimumNetCashToOwner
  const scopeNote =
    minCash != null && optimization.constraintFeasible
      ? `${comparedCount} strategies met your minimum cash floor (out of ${totalScanned} grid points).`
      : minCash != null && !optimization.constraintFeasible
        ? `Your cash floor was not met; all ${totalScanned} grid points were considered.`
        : `${totalScanned} grid points were searched (every salary × dividend step combination).`

  return (
    <div className="rounded-lg border border-border bg-white p-4 text-sm">
      <h3 className="font-semibold text-text">How this compares on the grid</h3>
      <p className="mt-2 text-text-light">
        {scopeNote} The ranked rows are the lowest total tax combinations in that search (up to 10).
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border text-text-light">
              <th className="py-2 pr-3 font-medium">Rank</th>
              <th className="py-2 pr-3 font-medium">Salary</th>
              <th className="py-2 pr-3 font-medium">Dividends</th>
              <th className="py-2 pr-3 font-medium">Corp tax</th>
              <th className="py-2 pr-3 font-medium">Personal</th>
              <th className="py-2 pr-3 font-medium">Total tax</th>
              <th className="py-2 pr-3 font-medium">vs best</th>
              <th className="py-2 font-medium">Net cash</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((cell, i) => {
              const delta = cell.result.totalTax - bestTax
              const isTiedBest = Math.abs(delta) < 0.02
              return (
                <tr
                  key={`${cell.salary}-${cell.dividend}`}
                  className={`border-b border-border ${isTiedBest ? 'bg-primary/5' : ''}`}
                >
                  <td className="py-2 pr-3 tabular-nums">{i + 1}</td>
                  <td className="py-2 pr-3 tabular-nums">{fmt(cell.salary)}</td>
                  <td className="py-2 pr-3 tabular-nums">{fmt(cell.dividend)}</td>
                  <td className="py-2 pr-3 tabular-nums">{fmt(cell.result.corporateTax)}</td>
                  <td className="py-2 pr-3 tabular-nums">{fmt(cell.result.personalTax)}</td>
                  <td className="py-2 pr-3 font-medium tabular-nums">{fmt(cell.result.totalTax)}</td>
                  <td className="py-2 pr-3 tabular-nums text-text-light">
                    {isTiedBest ? '—' : `+${fmt(delta)}`}
                  </td>
                  <td className="py-2 tabular-nums">{fmt(cell.result.netCash)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-text-light">
        “vs best” is extra total tax versus the optimal total in this search ({fmt(bestTax)}). Highlighted rows tie that
        minimum. The detail card above shows the same optimum as rank 1 unless several ties exist.
      </p>

      <ReferenceBenchmarks corpGross={corpGross} province={province} bestTotalTax={bestTax} />
    </div>
  )
}

function TaxOutcomeCard({
  title,
  cell,
  note,
  constrainedNote,
}: {
  title: string
  cell: OptimizationCell
  note?: string
  constrainedNote?: string
}) {
  const r = cell.result
  const pool = r.poolAfterCorpTax ?? 0
  const retained = r.retainedInCorporation ?? 0
  const hasPersonalBreakdown =
    r.personalFederalNet != null && r.personalProvincialNet != null && r.cppEmployee != null

  return (
    <div className="rounded-md border border-accent/30 bg-background p-4 text-sm">
      <p className="font-semibold text-text">{title}</p>
      {constrainedNote && <p className="mt-1 text-xs text-primary-dark">{constrainedNote}</p>}
      {note && <p className="mt-1 text-xs text-text-light">{note}</p>}

      <div className="mt-4 space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text">Compensation & corporation</p>
          <div>
            <Row label="Salary" value={fmt(cell.salary)} />
            <Row label="Non-eligible dividends paid" value={fmt(r.dividendPaid ?? 0)} />
            <Row label="Retained in corporation (after corp tax)" value={fmt(retained)} />
            <Row label="After-tax pool (dividend or retention)" value={fmt(pool)} muted />
          </div>
        </div>

        <div className="rounded-md border border-border bg-white px-3 py-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text">Corporate</p>
          <div>
            <Row label="Corporate income tax" value={fmt(r.corporateTax)} />
          </div>
        </div>

        <div className="rounded-md border border-border bg-white px-3 py-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text">Personal (shareholder)</p>
          <div>
            {hasPersonalBreakdown ? (
              <>
                <Row label="Federal income tax (net)" value={fmt(r.personalFederalNet!)} />
                <Row label="Provincial income tax (net)" value={fmt(r.personalProvincialNet!)} />
                <Row label="CPP / QPP (employee)" value={fmt(r.cppEmployee!)} />
                <Row label="Subtotal — personal layer" value={fmt(r.personalTax)} strong />
              </>
            ) : (
              <Row label="Personal income tax + CPP / QPP" value={fmt(r.personalTax)} />
            )}
          </div>
        </div>

        <div className="rounded-md border-2 border-primary/30 bg-white px-3 py-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text">Combined</p>
          <div>
            <Row label="Total tax (corporate + personal)" value={fmt(r.totalTax)} strong />
          </div>
        </div>

        <div>
          <Row label="Net cash to you (after personal taxes & CPP/QPP)" value={fmt(r.netCash)} muted />
        </div>
      </div>
    </div>
  )
}

/**
 * CCPC-only model: the shareholder has no other income. Optimizes salary, dividends, and retention.
 */
export default function TaxEngineCalculator() {
  const [province, setProvince] = useState<Province>('ON')
  const [corpGross, setCorpGross] = useState(200_000)
  const [salaryStep, setSalaryStep] = useState(5000)
  const [dividendStep, setDividendStep] = useState(5000)
  const [minNetCashInput, setMinNetCashInput] = useState('')

  const minimumNetCashToOwner = useMemo(() => {
    const v = num(minNetCashInput)
    return v > 0 ? v : undefined
  }, [minNetCashInput])

  const optimization = useMemo(() => {
    if (corpGross <= 0) return null
    return optimizeSalaryDividend({
      corporateGross: corpGross,
      province,
      corporate: { isSbdEligible: true },
      salaryStep,
      dividendStep,
      taxWeight: 0.35,
      minimumNetCashToOwner,
    })
  }, [corpGross, province, salaryStep, dividendStep, minimumNetCashToOwner])

  const constrainedNote =
    optimization?.resultsRespectMinimumNetCash && optimization.minimumNetCashToOwner != null
      ? `Only strategies with net cash to you ≥ ${fmt(optimization.minimumNetCashToOwner)}.`
      : undefined

  const showFullDistributionCompare =
    optimization != null && !sameStrategy(optimization.bestByTotalTax, optimization.bestFullDistribution)

  return (
    <div className="flex flex-col gap-6 text-text">
      <p className="text-sm text-text-light">
        This planner assumes you are the owner–manager and your <strong className="font-medium text-text">only</strong>{' '}
        income for the year is what you extract from this CCPC. The search aims to{' '}
        <strong className="font-medium text-text">minimize total tax</strong> (corporate plus personal)—lower tax
        generally means more cash left for you after the same gross profit. Money retained in the company avoids personal
        tax until you pay dividends.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="te-province">
            Province / territory (personal residence)
          </label>
          <select
            id="te-province"
            className={inputClass}
            value={province}
            onChange={(e) => setProvince(e.target.value as Province)}
          >
            {PROVINCE_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="te-corp">
            Active business income (before salary)
          </label>
          <input
            id="te-corp"
            type="number"
            min={0}
            step={1000}
            className={inputClass}
            value={corpGross || ''}
            onChange={(e) => setCorpGross(Math.max(0, num(e.target.value)))}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className={labelClass} htmlFor="te-min-cash">
            Minimum cash you need after tax, optional
          </label>
          <input
            id="te-min-cash"
            type="number"
            min={0}
            step={1000}
            className={inputClass}
            placeholder="e.g. 100000"
            value={minNetCashInput}
            onChange={(e) => setMinNetCashInput(e.target.value)}
          />
          <p className="mt-1 text-xs text-text-light">
            If set, only combinations where your net cash (salary + dividends minus personal tax and CPP/QPP) is at
            least this amount are considered when picking the lowest-tax strategy. Leave blank to minimize tax over the
            full grid.
          </p>
        </div>
        <div>
          <label className={labelClass} htmlFor="te-sal-step">
            Salary grid step ($)
          </label>
          <input
            id="te-sal-step"
            type="number"
            min={500}
            step={500}
            className={inputClass}
            value={salaryStep || ''}
            onChange={(e) => setSalaryStep(Math.max(500, num(e.target.value)))}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="te-div-step">
            Dividend grid step ($)
          </label>
          <input
            id="te-div-step"
            type="number"
            min={500}
            step={500}
            className={inputClass}
            value={dividendStep || ''}
            onChange={(e) => setDividendStep(Math.max(500, num(e.target.value)))}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white p-4 text-sm text-text-light">
        <p className="font-medium text-text">How the grid steps work</p>
        <p className="mt-2">
          The model cannot try every dollar. It steps through <strong className="font-medium text-text">salary</strong>{' '}
          from $0 up to your active business income in increments of the salary step. For each salary, it steps through{' '}
          <strong className="font-medium text-text">dividends paid</strong> from $0 up to the after-tax corporate pool
          using the dividend step, and always includes paying out the full pool so the top is not missed. Smaller steps
          are finer but slower.
        </p>
      </div>

      {!optimization && corpGross <= 0 && (
        <p className="text-sm text-text-light">Enter active business income greater than zero to run the model.</p>
      )}

      {optimization && !optimization.constraintFeasible && optimization.minimumNetCashToOwner != null && (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-text"
          role="alert"
        >
          <p className="font-medium">No strategy reaches your minimum cash after tax</p>
          <p className="mt-1 text-text-light">
            None of the combinations on this grid deliver at least {fmt(optimization.minimumNetCashToOwner)} net to you.
            Try lowering the minimum, increasing active business income, or using smaller grid steps. The result below
            ignores that floor.
          </p>
        </div>
      )}

      {optimization && (
        <div className="flex flex-col gap-5">
          <TaxOutcomeCard
            title="Lowest total tax"
            note={
              optimization.resultsRespectMinimumNetCash
                ? 'Minimum combined corporate and personal tax among allowed combinations.'
                : 'Minimum combined corporate and personal tax on the grid (may retain earnings and pay you little cash this year).'
            }
            constrainedNote={constrainedNote}
            cell={optimization.bestByTotalTax}
          />

          <ComparisonSection optimization={optimization} corpGross={corpGross} province={province} />

          {showFullDistributionCompare && (
            <TaxOutcomeCard
              title="Comparison: pay out all after-tax profit as dividends"
              note="Same grid, but only strategies where the full corporate after-tax pool is paid as non-eligible dividends (no retention). Often higher total tax than the best mix above."
              constrainedNote={constrainedNote}
              cell={optimization.bestFullDistribution}
            />
          )}
        </div>
      )}
    </div>
  )
}
