import { useMemo, useState } from 'react'
import {
  calculatePersonalTax,
  optimizeSalaryDividend,
  PROVINCIAL_DATA,
  type Province,
  type TaxInput,
} from '@/tax'

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

const defaultPersonal: TaxInput = {
  employmentIncome: 85_000,
  otherIncome: 0,
  dividendEligible: 0,
  dividendNonEligible: 0,
  province: 'ON',
}

/**
 * Interactive surface for the `src/tax` engine — personal estimates + optional CCPC salary/dividend grid.
 */
export default function TaxEngineCalculator() {
  const [personal, setPersonal] = useState<TaxInput>(defaultPersonal)
  const [corpGross, setCorpGross] = useState(200_000)
  const [gridStep, setGridStep] = useState(5000)

  const personalResult = useMemo(() => calculatePersonalTax(personal), [personal])

  const optimization = useMemo(() => {
    if (corpGross <= 0) return null
    return optimizeSalaryDividend({
      corporateGross: corpGross,
      province: personal.province,
      corporate: { isSbdEligible: true },
      step: gridStep,
      taxWeight: 0.35,
    })
  }, [corpGross, personal.province, gridStep])

  const patch = (p: Partial<TaxInput>) => setPersonal((prev) => ({ ...prev, ...p }))

  return (
    <div className="flex flex-col gap-8 text-text">
      <section className="rounded-lg border border-border bg-white p-4 shadow-sm md:p-6">
        <h2 className="mb-4 text-lg font-semibold text-text">Personal income (2025 model)</h2>
        <p className="mb-4 text-sm text-text-light">
          Employment, other ordinary income, eligible and non-eligible dividends, by province. CPP/QPP on employment
          only. Illustrative — confirm with your return or advisor.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="te-province">
              Province / territory
            </label>
            <select
              id="te-province"
              className={inputClass}
              value={personal.province}
              onChange={(e) => patch({ province: e.target.value as Province })}
            >
              {PROVINCE_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="te-employment">
              Employment income
            </label>
            <input
              id="te-employment"
              type="number"
              className={inputClass}
              value={personal.employmentIncome || ''}
              onChange={(e) => patch({ employmentIncome: num(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="te-other">
              Other income
            </label>
            <input
              id="te-other"
              type="number"
              className={inputClass}
              value={personal.otherIncome || ''}
              onChange={(e) => patch({ otherIncome: num(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="te-elig">
              Eligible dividends
            </label>
            <input
              id="te-elig"
              type="number"
              className={inputClass}
              value={personal.dividendEligible || ''}
              onChange={(e) => patch({ dividendEligible: num(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="te-non">
              Non-eligible dividends
            </label>
            <input
              id="te-non"
              type="number"
              className={inputClass}
              value={personal.dividendNonEligible || ''}
              onChange={(e) => patch({ dividendNonEligible: num(e.target.value) })}
            />
          </div>
        </div>

        <div className="mt-6 rounded-md bg-background p-4">
          <h3 className="text-sm font-semibold text-text">Estimated personal tax + CPP/QPP</h3>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-2 border-b border-border py-1">
              <dt className="text-text-light">Taxable income</dt>
              <dd className="font-medium tabular-nums">{fmt(personalResult.taxableIncome)}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-border py-1">
              <dt className="text-text-light">Federal (net)</dt>
              <dd className="font-medium tabular-nums">{fmt(personalResult.federal.netTax)}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-border py-1">
              <dt className="text-text-light">Provincial (net)</dt>
              <dd className="font-medium tabular-nums">{fmt(personalResult.provincial.netTax)}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-border py-1">
              <dt className="text-text-light">CPP / QPP (employee)</dt>
              <dd className="font-medium tabular-nums">{fmt(personalResult.cpp.employee)}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-border py-1 sm:col-span-2">
              <dt className="text-text-light font-semibold text-text">Total (income taxes + contribution)</dt>
              <dd className="font-semibold tabular-nums text-text">{fmt(personalResult.totalNetTax)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-white p-4 shadow-sm md:p-6">
        <h2 className="mb-2 text-lg font-semibold text-text">CCPC: salary vs dividend mix</h2>
        <p className="mb-4 text-sm text-text-light">
          Grid search over salary paid from active business income; remainder paid as non-eligible dividends after
          corporate tax. Uses the same province as above for personal taxes.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
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
            <label className={labelClass} htmlFor="te-step">
              Grid step ($)
            </label>
            <input
              id="te-step"
              type="number"
              min={500}
              step={500}
              className={inputClass}
              value={gridStep || ''}
              onChange={(e) => setGridStep(Math.max(500, num(e.target.value)))}
            />
          </div>
        </div>

        {optimization && (
          <div className="mt-6 rounded-md border border-accent/30 bg-background p-4 text-sm">
            <p className="font-semibold text-text">Lowest total tax (corporate + personal)</p>
            <p className="mt-2 text-text-light">
              Best salary: <span className="font-medium text-text">{fmt(optimization.bestByTotalTax.salary)}</span> ·
              Total tax:{' '}
              <span className="font-medium text-text">{fmt(optimization.bestByTotalTax.result.totalTax)}</span> · Net
              cash (owner):{' '}
              <span className="font-medium text-text">{fmt(optimization.bestByTotalTax.result.netCash)}</span>
            </p>
            <p className="mt-3 font-semibold text-text">Balanced (net cash − 0.35 × total tax)</p>
            <p className="mt-2 text-text-light">
              Salary: <span className="font-medium text-text">{fmt(optimization.bestBalanced.salary)}</span> · Score:{' '}
              <span className="font-medium text-text">{optimization.bestBalanced.score.toFixed(0)}</span> · Total tax:{' '}
              <span className="font-medium text-text">{fmt(optimization.bestBalanced.result.totalTax)}</span>
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
