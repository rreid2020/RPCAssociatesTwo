import { FC, ReactNode, useEffect, useState } from 'react'
import { CANADIAN_PROVINCE_OPTIONS } from './dependentModel'

export const T4_PROVINCE_NUMERIC: Record<string, number> = {
  NL: 1,
  PE: 2,
  NS: 3,
  NB: 4,
  QC: 5,
  ON: 6,
  MB: 7,
  SK: 8,
  AB: 9,
  BC: 10,
  YT: 11,
  NT: 12,
  NU: 13
}

export const T4_NUMERIC_PROVINCE: Record<number, string> = Object.fromEntries(
  Object.entries(T4_PROVINCE_NUMERIC).map(([code, value]) => [value, code])
)

export const TaxWorksheetHelpButton: FC<{ text?: string }> = ({ text }) => (
  <button
    type="button"
    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-white text-[11px] font-semibold text-text-light hover:bg-background hover:text-text"
    title={text || 'Field help'}
    aria-label={text || 'Field help'}
  >
    ?
  </button>
)

export const TaxWorksheetRow: FC<{
  label: string
  boxCode?: string
  lineRef?: string
  helpText?: string
  striped?: boolean
  children: ReactNode
}> = ({ label, boxCode, lineRef, helpText, striped = false, children }) => (
  <div
    className={`flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
      striped ? 'bg-slate-50/90' : 'bg-white'
    }`}
  >
    <span className="min-w-0 flex-1 text-sm text-text">{label}</span>
    <div className="flex items-center justify-end gap-2 sm:shrink-0">
      {(boxCode || lineRef) && (
        <span
          className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded border border-border bg-white px-1.5 text-xs font-semibold text-text"
          aria-hidden
        >
          {boxCode || lineRef}
        </span>
      )}
      <div className="w-full min-w-[10rem] sm:w-56 lg:w-64 xl:w-80">{children}</div>
      <TaxWorksheetHelpButton text={helpText} />
    </div>
  </div>
)

export const TaxWorksheetCurrencyInput: FC<{
  value: number | undefined
  onChange: (value: number | undefined) => void
}> = ({ value, onChange }) => {
  const [draft, setDraft] = useState(() => formatCurrencyDisplay(value))

  useEffect(() => {
    setDraft(formatCurrencyDisplay(value))
  }, [value])

  const commit = (raw: string) => {
    onChange(parseCurrencyInput(raw))
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-light">$</span>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className="block w-full rounded-md border border-border bg-white py-2 pl-7 pr-3 text-right text-sm tabular-nums"
        placeholder="0.00"
        value={draft}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') {
            setDraft('')
            onChange(undefined)
            return
          }
          if (!/^\d*\.?\d{0,2}$/.test(raw)) return
          setDraft(raw)
          if (!raw.endsWith('.')) commit(raw)
        }}
        onBlur={() => {
          commit(draft)
          setDraft(formatCurrencyDisplay(parseCurrencyInput(draft)))
        }}
      />
    </div>
  )
}

export const TaxWorksheetNumberInput: FC<{
  value: number | undefined
  onChange: (value: number | undefined) => void
}> = ({ value, onChange }) => (
  <input
    type="text"
    inputMode="numeric"
    autoComplete="off"
    className="block w-full rounded-md border border-border bg-white px-3 py-2 text-right text-sm tabular-nums"
    placeholder="0"
    value={value == null || value === 0 ? '' : String(value)}
    onChange={(e) => {
      const raw = e.target.value
      if (raw === '') {
        onChange(undefined)
        return
      }
      if (!/^\d*$/.test(raw)) return
      onChange(Number(raw))
    }}
  />
)

export const TaxWorksheetTextInput: FC<{
  value: string
  onChange: (value: string) => void
  placeholder?: string
}> = ({ value, onChange, placeholder }) => (
  <input
    type="text"
    autoComplete="off"
    className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
)

export const TaxWorksheetProvinceSelect: FC<{
  value: number | undefined
  onChange: (value: number | undefined) => void
}> = ({ value, onChange }) => {
  const alpha = value != null ? T4_NUMERIC_PROVINCE[value] || '' : ''
  return (
    <select
      className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
      value={alpha}
      onChange={(e) => {
        const next = e.target.value
        if (!next) {
          onChange(undefined)
          return
        }
        onChange(T4_PROVINCE_NUMERIC[next])
      }}
    >
      <option value="">Select province…</option>
      {CANADIAN_PROVINCE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  )
}

export const TaxWorksheetSectionHeader: FC<{
  title: string
  description?: string
}> = ({ title, description }) => (
  <div className="border-b border-border bg-white px-4 py-3">
    <h3 className="text-base font-bold text-primary-dark">{title}</h3>
    {description && <p className="mt-1 text-xs leading-relaxed text-text-light">{description}</p>}
  </div>
)

export const TaxWorksheetGroupHeader: FC<{ title: string }> = ({ title }) => (
  <div className="border-y border-border bg-background px-4 py-2">
    <h4 className="text-[11px] font-bold uppercase tracking-wide text-text">{title}</h4>
  </div>
)

function formatCurrencyDisplay (value: number | undefined): string {
  if (value == null || !Number.isFinite(value) || value === 0) return ''
  return String(value)
}

function parseCurrencyInput (raw: string): number | undefined {
  const trimmed = raw.trim().replace(/,/g, '')
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}
