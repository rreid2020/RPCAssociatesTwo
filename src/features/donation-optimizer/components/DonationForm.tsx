import type { FilingType, InputPayload, ProvinceCode } from '../engine/types'

const inputClass =
  'w-full rounded border border-border bg-white px-2 py-1.5 text-sm text-text shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'
const labelClass = 'block text-xs sm:text-sm font-medium text-text'

function num(v: string): number {
  const n = Number.parseFloat(v)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export interface DonationFormProps {
  inputs: InputPayload
  onChange: (patch: Partial<InputPayload>) => void
}

export function DonationForm({ inputs, onChange }: DonationFormProps) {
  const showSpouse = inputs.filingType === 'couple'

  return (
    <section className="rounded-lg border border-border bg-white p-4 shadow-sm md:p-6">
      <h2 className="mb-4 text-lg font-semibold text-text">Donations & income</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="province" title="Provincial charitable credit; only Ontario modeled.">
            Province
          </label>
          <select
            id="province"
            className={inputClass}
            value={inputs.province}
            onChange={(e) => onChange({ province: e.target.value as ProvinceCode })}
          >
            <option value="ON">Ontario</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="filingType">
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
        </div>
        <div>
          <label className={labelClass} htmlFor="taxpayerIncome">
            Taxpayer income (CAD)
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
              Spouse income (CAD)
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
          </div>
        )}
        <div>
          <label
            className={labelClass}
            htmlFor="charitableDonations"
            title="Current-year charitable donations (cash or gifts in kind)."
          >
            Charitable donations
          </label>
          <input
            id="charitableDonations"
            type="number"
            min={0}
            step={50}
            className={inputClass}
            value={inputs.charitableDonations || ''}
            onChange={(e) => onChange({ charitableDonations: num(e.target.value) })}
          />
        </div>
        <div>
          <label
            className={labelClass}
            htmlFor="politicalDonations"
            title="Federal political contributions — credit tiers apply per person."
          >
            Political donations
          </label>
          <input
            id="politicalDonations"
            type="number"
            min={0}
            step={50}
            className={inputClass}
            value={inputs.politicalDonations || ''}
            onChange={(e) => onChange({ politicalDonations: num(e.target.value) })}
          />
        </div>
        <div>
          <label
            className={labelClass}
            htmlFor="priorCharitableDonations"
            title="Unused charitable donations carried forward from prior years (simplified)."
          >
            Prior charitable carryforward
          </label>
          <input
            id="priorCharitableDonations"
            type="number"
            min={0}
            step={50}
            className={inputClass}
            value={inputs.priorCharitableDonations || ''}
            onChange={(e) => onChange({ priorCharitableDonations: num(e.target.value) })}
          />
        </div>
      </div>
    </section>
  )
}
