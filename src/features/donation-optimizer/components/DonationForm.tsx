import type { ComparisonInputPayload, FilingType, ProvinceCode } from '../engine/types'
import { PROVINCE_SELECT_OPTIONS } from './provinceOptions'

const inputClass =
  'w-full rounded border border-border bg-white px-2 py-1.5 text-sm text-text shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'
const labelClass = 'block text-xs sm:text-sm font-medium text-text'

function num(v: string): number {
  const n = Number.parseFloat(v)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export interface DonationFormProps {
  inputs: ComparisonInputPayload
  onChange: (patch: Partial<ComparisonInputPayload>) => void
}

export function DonationForm({ inputs, onChange }: DonationFormProps) {
  const showSpouse = inputs.filingType === 'couple'

  return (
    <section className="rounded-lg border border-border bg-white p-4 shadow-sm md:p-6">
      <h2 className="mb-2 text-lg font-semibold text-text">This or that</h2>
      <p className="mb-4 text-sm text-text-light">
        Enter one contribution total. The calculator compares the tax credits if you donate that full amount to{' '}
        <strong className="font-semibold text-text">registered charitable causes</strong> versus the same amount to{' '}
        <strong className="font-semibold text-text">federal political contributions</strong> — two separate scenarios,
        not a split.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-1">
          <label
            className={labelClass}
            htmlFor="contributionAmount"
            title="Same dollar amount applied entirely to charity in one scenario and entirely to political contributions in the other."
          >
            Contribution amount to compare (CAD)
          </label>
          <input
            id="contributionAmount"
            type="number"
            min={0}
            step={50}
            className={inputClass}
            value={inputs.contributionAmount || ''}
            onChange={(e) => onChange({ contributionAmount: num(e.target.value) })}
          />
        </div>
        <div>
          <label
            className={labelClass}
            htmlFor="province"
            title="Province or territory of residence — sets provincial charitable credit rates and marginal provincial tax bracket."
          >
            Province / territory
          </label>
          <select
            id="province"
            className={inputClass}
            value={inputs.province}
            onChange={(e) => onChange({ province: e.target.value as ProvinceCode })}
          >
            {PROVINCE_SELECT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="filingType" title="Couple: charitable tiers use the higher spouse income.">
            Filing type
          </label>
          <select
            id="filingType"
            className={inputClass}
            value={inputs.filingType}
            onChange={(e) => onChange({ filingType: e.target.value as FilingType })}
          >
            <option value="single">Single</option>
            <option value="couple">Couple</option>
          </select>
          <p className="mt-1.5 text-xs leading-relaxed text-text-light">
            <strong className="font-medium text-text">Couple:</strong> charitable credits use the{' '}
            <strong className="font-medium text-text">higher</strong> of taxpayer and spouse taxable income (common when
            claiming donations on one return). <strong className="font-medium text-text">Single:</strong> only
            taxpayer income applies. Political credits never use income.
          </p>
        </div>
        <div>
          <label className={labelClass} htmlFor="taxpayerIncome">
            Taxpayer taxable income (CAD)
          </label>
          <input
            id="taxpayerIncome"
            type="number"
            min={0}
            step={100}
            className={inputClass}
            value={inputs.taxpayerIncome || ''}
            onChange={(e) => onChange({ taxpayerIncome: num(e.target.value) })}
          />
        </div>
        {showSpouse && (
          <div>
            <label className={labelClass} htmlFor="spouseIncome">
              Spouse taxable income (CAD)
            </label>
            <input
              id="spouseIncome"
              type="number"
              min={0}
              step={100}
              className={inputClass}
              value={inputs.spouseIncome || ''}
              onChange={(e) => onChange({ spouseIncome: num(e.target.value) })}
            />
            <p className="mt-1.5 text-xs text-text-light">
              If this is higher than the taxpayer income, charitable credit tiers follow this amount instead.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
