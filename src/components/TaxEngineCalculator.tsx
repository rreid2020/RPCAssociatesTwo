import { useMemo, useState } from 'react'
import { optimizeSalaryDividend, PROVINCIAL_DATA, type Province, type StrategyResult } from '@/tax'

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

function ResultBlock({
  title,
  cell,
  note,
}: {
  title: string
  cell: { salary: number; dividend: number; result: StrategyResult; score?: number }
  note?: string
}) {
  const r = cell.result
  const pool = r.poolAfterCorpTax ?? 0
  const retained = r.retainedInCorporation ?? 0
  return (
    <div className="rounded-md border border-accent/30 bg-background p-4 text-sm">
      <p className="font-semibold text-text">{title}</p>
      {note && <p className="mt-1 text-xs text-text-light">{note}</p>}
      <dl className="mt-3 space-y-2">
        <div className="flex flex-wrap justify-between gap-2 border-b border-border py-1">
          <dt className="text-text-light">Salary</dt>
          <dd className="font-medium tabular-nums">{fmt(cell.salary)}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-b border-border py-1">
          <dt className="text-text-light">Non-eligible dividends paid</dt>
          <dd className="font-medium tabular-nums">{fmt(r.dividendPaid ?? 0)}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-b border-border py-1">
          <dt className="text-text-light">Retained in corporation (after corp tax)</dt>
          <dd className="font-medium tabular-nums">{fmt(retained)}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-b border-border py-1 text-xs text-text-light">
          <dt>After-tax pool (available for dividend or retention)</dt>
          <dd className="tabular-nums">{fmt(pool)}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-b border-border py-1">
          <dt className="text-text-light">Corporate tax</dt>
          <dd className="font-medium tabular-nums">{fmt(r.corporateTax)}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-b border-border py-1">
          <dt className="text-text-light">Personal tax + CPP/QPP</dt>
          <dd className="font-medium tabular-nums">{fmt(r.personalTax)}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-b border-border py-1">
          <dt className="text-text-light font-semibold text-text">Total tax (corp + personal)</dt>
          <dd className="font-semibold tabular-nums text-text">{fmt(r.totalTax)}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 py-1">
          <dt className="text-text-light">Net cash to you (salary + dividends − personal)</dt>
          <dd className="font-medium tabular-nums">{fmt(r.netCash)}</dd>
        </div>
        {typeof cell.score === 'number' && (
          <div className="pt-1 text-xs text-text-light">
            Balanced score (net cash − 0.35 × total tax): {cell.score.toFixed(0)}
          </div>
        )}
      </dl>
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

  const optimization = useMemo(() => {
    if (corpGross <= 0) return null
    return optimizeSalaryDividend({
      corporateGross: corpGross,
      province,
      corporate: { isSbdEligible: true },
      salaryStep,
      dividendStep,
      taxWeight: 0.35,
    })
  }, [corpGross, province, salaryStep, dividendStep])

  return (
    <div className="flex flex-col gap-6 text-text">
      <p className="text-sm text-text-light">
        This planner assumes you are the owner–manager and your <strong className="font-medium text-text">only</strong>{' '}
        income for the year is what you extract from this CCPC (salary and/or non-eligible dividends). Money left in the
        company after corporate tax is not taxed personally until paid out as dividends.
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

      {!optimization && corpGross <= 0 && (
        <p className="text-sm text-text-light">Enter active business income greater than zero to run the model.</p>
      )}

      {optimization && (
        <div className="flex flex-col gap-5">
          <ResultBlock
            title="Lowest total tax (corp + personal)"
            note="May pay no salary or dividends and retain all after-tax profits—lowest combined tax, but little or no cash to you this year."
            cell={optimization.bestByTotalTax}
          />
          <ResultBlock
            title="Highest net cash to you"
            note="Maximizes cash after personal taxes; often pays more in total tax than the minimum above."
            cell={optimization.bestByNetCash}
          />
          <ResultBlock title="Balanced (net cash − 0.35 × total tax)" cell={optimization.bestBalanced} />
          <ResultBlock
            title="Best when all after-tax profit is paid as dividends"
            note="For each salary level, the model pays the full corporate after-tax pool as non-eligible dividends (no discretionary retention). Picks the salary that minimizes total tax under that rule—similar to the older one-payout-path model."
            cell={optimization.bestFullDistribution}
          />
        </div>
      )}
    </div>
  )
}
