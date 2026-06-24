import { FC, useEffect, useMemo, useState } from 'react'
import type { FormWorksheetSchema } from '../../../lib/taxIntelligenceApi'
import type { SectionSlipEntry } from './interviewArtifactSections'
import {
  TaxWorksheetCurrencyInput,
  TaxWorksheetGroupHeader,
  TaxWorksheetRow,
  TaxWorksheetSectionHeader,
  TaxWorksheetTextInput
} from './TaxWorksheet'
import { computeFormWorksheetTotals, resolveComputedFormFieldValue } from './formWorksheetUtils'

const FORM_TITLES: Record<string, string> = {
  T2125: 'Statement of Business or Professional Activities',
  T776: 'Statement of Real Estate Rentals',
  T777: 'Statement of Employment Expenses',
  T2200: 'Declaration of Conditions of Employment',
  T2042: 'Statement of Farming Activities',
  T2121: 'Statement of Fishing Activities',
  T778: 'Child Care Expenses Deduction',
  'SCHEDULE 3': 'Schedule 3 — Capital Gains (or Losses)',
  'SCHEDULE 7': 'Schedule 7 — RRSP, PRPP, and SPP',
  'SCHEDULE 9': 'Schedule 9 — Donations and Gifts',
  'SCHEDULE 11': 'Schedule 11 — Tuition Amounts',
  ON479: 'ON479 — Ontario Tax Credits',
  T1163: 'Statement A — AgriStability and AgriInvest Programs Information',
  T1164: 'Statement B — AgriStability and AgriInvest Programs Information',
  'SCHEDULE 13': 'Schedule 13 — Employment Insurance Premiums on Self-Employment and Other Eligible Earnings'
}

function resolveFormTitle (formCode: string, fallbackLabel: string): string {
  const normalized = String(formCode || '').trim().toUpperCase()
  return FORM_TITLES[normalized] || fallbackLabel || normalized
}

function formatCurrency (value: number | undefined): string {
  if (value == null || !Number.isFinite(value) || value === 0) return '—'
  return value.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const ScheduleFormWorksheet: FC<{
  entry: SectionSlipEntry
  schema?: FormWorksheetSchema | null
  returnRole: 'self' | 'spouse'
  values: Record<string, string | number>
  onChange: (fieldCode: string, value: string | number | undefined) => void
  loading?: boolean
}> = ({ entry, schema, returnRole, values, onChange, loading = false }) => {
  const formCode = entry.slipCode.toUpperCase()
  const title = resolveFormTitle(formCode, entry.label)
  const [draftValues, setDraftValues] = useState(values)

  useEffect(() => {
    setDraftValues(values)
  }, [values])

  const totals = useMemo(() => computeFormWorksheetTotals(formCode, draftValues), [draftValues, formCode])
  const lineRefs = (schema?.metadata?.lineRefs as string[] | undefined) || []
  const isCatalogOnly = schema?.schemaStatus === 'catalog_only'

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-white p-4 text-sm text-text-light">
        Loading {formCode} worksheet…
      </div>
    )
  }

  if (!schema) {
    return (
      <div className="overflow-hidden rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-text">{formCode} — {title}</p>
        <p className="mt-1 text-xs text-amber-800">
          This form is not registered in the worksheet catalog yet.
        </p>
      </div>
    )
  }

  if (isCatalogOnly || schema.sections.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
        <TaxWorksheetSectionHeader
          title={`${formCode} — ${title}`}
          description={entry.description}
        />
        <div className="space-y-3 px-4 py-4 text-sm text-text">
          <p className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
            Registered — line fields in development
          </p>
          <p>
            This CRA form is registered in the T1 Return Builder catalog and will appear when selected in interview setup.
            Line-by-line worksheet fields are being built form by form.
          </p>
          {lineRefs.length > 0 && (
            <p className="text-xs text-text-light">
              Related T1 lines: {lineRefs.map((line) => `Line ${line}`).join(', ')}
            </p>
          )}
          {schema.landingUrl && (
            <a
              className="inline-flex text-sm font-medium text-accent hover:underline"
              href={schema.landingUrl}
              target="_blank"
              rel="noreferrer"
            >
              View official CRA form
            </a>
          )}
        </div>
      </div>
    )
  }

  if (schema.sections.every((section) => section.fields.length === 0)) {
    return (
      <div className="overflow-hidden rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-text">{formCode} — {title}</p>
        <p className="mt-1 text-xs text-amber-800">
          The worksheet schema for this form is not available yet. Refresh the page or contact support if this persists.
        </p>
      </div>
    )
  }

  const resolvedValue = (fieldCode: string, fieldType: string, compute?: string | null) => {
    if (fieldType === 'computed' || compute) {
      return resolveComputedFormFieldValue(formCode, fieldCode, draftValues)
    }
    return draftValues[fieldCode]
  }

  const handleFieldChange = (fieldCode: string, nextValue: string | number | undefined) => {
    setDraftValues((prev) => {
      const next = { ...prev }
      if (nextValue == null || nextValue === '') delete next[fieldCode]
      else next[fieldCode] = nextValue
      return next
    })
    onChange(fieldCode, nextValue)
  }

  return (
    <div className="space-y-4">
      {schema.sections.map((section) => (
        <div key={section.id} className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <TaxWorksheetSectionHeader title={section.title} description={section.description} />
          <div className="divide-y divide-border/80">
            {section.fields.map((field, index) => {
              const isComputed = field.type === 'computed' || Boolean(field.compute)
              const value = resolvedValue(field.code, field.type, field.compute)
              return (
                <TaxWorksheetRow
                  key={field.code}
                  label={field.label}
                  lineRef={field.lineRef || field.code}
                  helpText={isComputed ? 'Calculated from the entries above.' : undefined}
                  striped={index % 2 === 1}
                >
                  {isComputed ? (
                    <div className="rounded-md border border-border bg-slate-50 px-3 py-2 text-right text-sm font-medium tabular-nums text-text">
                      {formatCurrency(typeof value === 'number' ? value : Number(value || 0))}
                    </div>
                  ) : field.type === 'text' ? (
                    <TaxWorksheetTextInput
                      value={String(draftValues[field.code] || '')}
                      onChange={(next) => handleFieldChange(field.code, next)}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <TaxWorksheetCurrencyInput
                      value={typeof value === 'number' ? value : Number(value || 0) || undefined}
                      onChange={(nextValue) => handleFieldChange(field.code, nextValue)}
                    />
                  )}
                </TaxWorksheetRow>
              )
            })}
          </div>
        </div>
      ))}

      {totals && (totals.netIncome != null || totals.totalClaim != null || totals.totalDeduction != null) && (
        <div className="overflow-hidden rounded-lg border border-border bg-background/40">
          <TaxWorksheetGroupHeader title="Worksheet summary" />
          <div className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-3">
            {totals.grossIncome != null && totals.grossIncome !== 0 && (
              <div>
                <p className="text-xs text-text-light">Gross income / gains</p>
                <p className="font-medium tabular-nums">{formatCurrency(totals.grossIncome)}</p>
              </div>
            )}
            {totals.totalExpenses != null && totals.totalExpenses !== 0 && (
              <div>
                <p className="text-xs text-text-light">Losses / expenses</p>
                <p className="font-medium tabular-nums">{formatCurrency(totals.totalExpenses)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-text-light">
                {formCode === 'T778' ? 'Deduction claim' : formCode === 'SCHEDULE 9' || formCode === 'SCHEDULE 11' || formCode === 'ON479' ? 'Credit claim' : formCode === 'SCHEDULE 7' ? 'Deduction claimed' : 'Net amount'}
              </p>
              <p className="font-semibold tabular-nums text-primary-dark">
                {formatCurrency(totals.netIncome ?? totals.totalClaim ?? totals.totalDeduction)}
              </p>
            </div>
          </div>
          <p className="border-t border-border px-4 py-2 text-xs text-text-light">
            Entering data for <span className="font-medium text-text">{returnRole === 'spouse' ? 'Spouse' : 'Taxpayer'}</span>.
            Saved amounts flow to the mapped T1 line when you save income.
          </p>
        </div>
      )}
    </div>
  )
}
