import { FC, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../../components/SEO'
import ClientPortalShell from '../../../components/ClientPortalShell'
import { taxFetch, type TaxReturnSummary } from '../../../lib/taxIntelligenceApi'
import { getTaxBasePath } from './path'

type ReturnDetailPayload = {
  taxReturn: {
    id: string
    taxpayer_name: string
    tax_year: number
    status: string
  }
  incomeEntries: Array<{
    category: string
    amount: number
    metadata?: Record<string, unknown>
  }>
  deductions: Array<{
    category: string
    amount: number
    is_credit: boolean
    metadata?: Record<string, unknown>
  }>
  calculation?: {
    net_income?: number
    taxable_income?: number
    total_payable?: number
    taxes_withheld?: number
    refund_or_balance?: number
    assumptions?: {
      comparative?: {
        self?: {
          netIncome?: number
          taxableIncome?: number
          estimatedTaxBeforeCredits?: number
        }
        spouse?: {
          netIncome?: number
          taxableIncome?: number
          estimatedTaxBeforeCredits?: number
        }
      }
      optimization?: {
        pensionSplit?: {
          splitSourceRole?: string
          recommendedSplit?: number
          estimatedTaxSavingsBeforeCredits?: number
        } | null
      }
    }
  }
}

type LineTotal = {
  lineRef: string
  label: string
  amount: number
}

const INCOME_CATEGORY_TO_LINE: Record<string, { lineRef: string; label: string }> = {
  employment_income: { lineRef: '10100', label: 'Employment income' },
  pension_income: { lineRef: '11500', label: 'Other pensions and superannuation' },
  uccb_income: { lineRef: '11700', label: 'Universal child care benefit' },
  ei_benefits: { lineRef: '11900', label: 'Employment insurance and other benefits' },
  eligible_dividends: { lineRef: '12000', label: 'Taxable amount of eligible dividends' },
  dividend_income: { lineRef: '12010', label: 'Other than eligible dividends' },
  interest_income: { lineRef: '12100', label: 'Interest and other investment income' },
  rrsp_income: { lineRef: '12900', label: 'RRSP income' },
  rrif_income: { lineRef: '11500', label: 'RRIF income (pension line)' },
  social_assistance: { lineRef: '14500', label: 'Social assistance payments' },
  workers_compensation: { lineRef: '14400', label: "Workers' compensation benefits" },
  capital_gains: { lineRef: '12700', label: 'Taxable capital gains' }
}

const DEDUCTION_CATEGORY_TO_LINE: Record<string, { lineRef: string; label: string }> = {
  rrsp: { lineRef: '20800', label: 'RRSP deduction' },
  fhsa_deduction: { lineRef: '20805', label: 'FHSA deduction' },
  union_dues: { lineRef: '21200', label: 'Annual union/professional dues' },
  uccb_repayment: { lineRef: '21300', label: 'UCCB repayment' },
  child_care_expenses: { lineRef: '21400', label: 'Child care expenses' },
  moving_expenses: { lineRef: '21900', label: 'Moving expenses' },
  cpp2_contributions: { lineRef: '22215', label: 'CPP enhanced contributions deduction' },
  tuition_amount: { lineRef: '32300', label: 'Tuition amount' },
  medical_expenses: { lineRef: '33099', label: 'Medical expenses' },
  donations: { lineRef: '34900', label: 'Donations and gifts' }
}

function round2 (n: number): number {
  return Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100
}

const FormsSchedules: FC = () => {
  const { getToken } = useAuth()
  const location = useLocation()
  const basePath = useMemo(() => getTaxBasePath(location.pathname), [location.pathname])
  const [returns, setReturns] = useState<TaxReturnSummary[]>([])
  const [selectedReturnId, setSelectedReturnId] = useState('')
  const [detail, setDetail] = useState<ReturnDetailPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const loadReturns = async () => {
    setLoading(true)
    try {
      const data = await taxFetch<{ returns: TaxReturnSummary[] }>('/tax-returns', getToken)
      const rows = data.returns || []
      setReturns(rows)
      if (!selectedReturnId && rows[0]?.id) setSelectedReturnId(rows[0].id)
      setErr(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load returns')
    } finally {
      setLoading(false)
    }
  }

  const loadDetail = async (returnId: string) => {
    if (!returnId) {
      setDetail(null)
      return
    }
    setLoadingDetail(true)
    try {
      const data = await taxFetch<ReturnDetailPayload>(`/tax-returns/${returnId}`, getToken)
      setDetail(data)
      setErr(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load return detail')
    } finally {
      setLoadingDetail(false)
    }
  }

  useEffect(() => {
    void loadReturns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void loadDetail(selectedReturnId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReturnId])

  const incomeLineTotals = useMemo<LineTotal[]>(() => {
    const map = new Map<string, LineTotal>()
    for (const row of detail?.incomeEntries || []) {
      const meta = (row.metadata || {}) as Record<string, unknown>
      const lineRef = String(meta.lineRef || INCOME_CATEGORY_TO_LINE[row.category]?.lineRef || '')
      if (!lineRef) continue
      const fallbackLabel = INCOME_CATEGORY_TO_LINE[row.category]?.label || row.category
      const label = String(meta.lineLabel || fallbackLabel)
      const key = `${lineRef}:${label}`
      const prev = map.get(key)
      map.set(key, {
        lineRef,
        label,
        amount: round2((prev?.amount || 0) + Number(row.amount || 0))
      })
    }
    return Array.from(map.values()).sort((a, b) => Number(a.lineRef) - Number(b.lineRef))
  }, [detail?.incomeEntries])

  const deductionLineTotals = useMemo<LineTotal[]>(() => {
    const map = new Map<string, LineTotal>()
    for (const row of detail?.deductions || []) {
      const meta = (row.metadata || {}) as Record<string, unknown>
      const lineRef = String(meta.lineRef || DEDUCTION_CATEGORY_TO_LINE[row.category]?.lineRef || '')
      if (!lineRef) continue
      const fallbackLabel = DEDUCTION_CATEGORY_TO_LINE[row.category]?.label || row.category
      const label = String(meta.lineLabel || fallbackLabel)
      const key = `${lineRef}:${label}`
      const prev = map.get(key)
      map.set(key, {
        lineRef,
        label,
        amount: round2((prev?.amount || 0) + Number(row.amount || 0))
      })
    }
    return Array.from(map.values()).sort((a, b) => Number(a.lineRef) - Number(b.lineRef))
  }, [detail?.deductions])

  const t1Summary = useMemo(() => {
    const calc = detail?.calculation || {}
    const totalIncome = round2((detail?.incomeEntries || []).reduce((sum, r) => {
      const meta = (r.metadata || {}) as Record<string, unknown>
      const isWithheld = Boolean(meta.asWithholding) || r.category === 'tax_withheld'
      if (isWithheld) return sum
      return sum + Number(r.amount || 0)
    }, 0))
    const totalDeductions = round2((detail?.deductions || [])
      .filter((d) => !d.is_credit)
      .reduce((sum, d) => sum + Number(d.amount || 0), 0))
    const line23600 = Number(calc.net_income ?? totalIncome - totalDeductions)
    const line26000 = Number(calc.taxable_income ?? line23600)
    const line43500 = Number(calc.total_payable ?? 0)
    const line43700 = Number(calc.taxes_withheld ?? 0)
    const line484Or485 = Number(calc.refund_or_balance ?? 0)
    return {
      line15000: totalIncome,
      line23600: round2(line23600),
      line26000: round2(line26000),
      line43500: round2(line43500),
      line43700: round2(line43700),
      line484Or485: round2(Math.abs(line484Or485)),
      isRefund: line484Or485 >= 0
    }
  }, [detail])

  return (
    <>
      <SEO title="Forms & Schedules | Tax Intelligence" description="Structured forms and schedules workspace." canonical="/app/tax-intelligence/forms-schedules" />
      <ClientPortalShell>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-primary-dark">Forms &amp; Schedules</h1>
          <p className="text-sm text-text-light">T1 General-style line summary for the selected return, based on deterministic Tax Intelligence calculations.</p>

          {err && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{err}</p>}

          <section className="bg-white p-4 border border-border rounded-lg shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-primary-dark">Select return</h2>
                <p className="text-xs text-text-light">Choose a return to view T1 summary and line-level totals.</p>
              </div>
              {detail?.taxReturn?.id && (
                <Link to={`${basePath}/returns/${detail.taxReturn.id}`} className="text-sm text-accent font-medium hover:underline">
                  Open Return Builder
                </Link>
              )}
            </div>
            <select
              className="border border-border rounded-md px-3 py-2 text-sm w-full"
              value={selectedReturnId}
              onChange={(e) => setSelectedReturnId(e.target.value)}
              disabled={loading || returns.length === 0}
            >
              {returns.length === 0 && <option value="">No returns found</option>}
              {returns.map((r) => (
                <option key={r.id} value={r.id}>{r.taxpayer_name} - {r.tax_year} ({r.status})</option>
              ))}
            </select>
          </section>

          {loadingDetail && <p className="text-sm text-text-light">Loading T1 summary…</p>}

          {!loadingDetail && detail && (
            <>
              <section className="bg-white p-4 border border-border rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold text-primary-dark mb-3">
                  T1 General Summary - {detail.taxReturn.taxpayer_name} ({detail.taxReturn.tax_year})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                  <div className="border border-border rounded-md p-3"><strong>Line 15000</strong><p className="text-text-light">Total income</p><p className="font-semibold">${t1Summary.line15000.toFixed(2)}</p></div>
                  <div className="border border-border rounded-md p-3"><strong>Line 23600</strong><p className="text-text-light">Net income</p><p className="font-semibold">${t1Summary.line23600.toFixed(2)}</p></div>
                  <div className="border border-border rounded-md p-3"><strong>Line 26000</strong><p className="text-text-light">Taxable income</p><p className="font-semibold">${t1Summary.line26000.toFixed(2)}</p></div>
                  <div className="border border-border rounded-md p-3"><strong>Line 43500</strong><p className="text-text-light">Total payable</p><p className="font-semibold">${t1Summary.line43500.toFixed(2)}</p></div>
                  <div className="border border-border rounded-md p-3"><strong>Line 43700</strong><p className="text-text-light">Total tax deducted</p><p className="font-semibold">${t1Summary.line43700.toFixed(2)}</p></div>
                  <div className="border border-border rounded-md p-3">
                    <strong>{t1Summary.isRefund ? 'Line 48400' : 'Line 48500'}</strong>
                    <p className="text-text-light">{t1Summary.isRefund ? 'Refund' : 'Balance owing'}</p>
                    <p className="font-semibold">${t1Summary.line484Or485.toFixed(2)}</p>
                  </div>
                </div>
              </section>

              {detail.calculation?.assumptions?.comparative && (
                <section className="bg-white p-4 border border-border rounded-lg shadow-sm">
                  <h3 className="text-base font-semibold text-primary-dark mb-2">Comparative summary (taxpayer vs spouse)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="border border-border rounded-md p-3">
                      <p className="font-semibold">Taxpayer</p>
                      <p className="text-text-light">Net income: ${Number(detail.calculation.assumptions.comparative.self?.netIncome || 0).toFixed(2)}</p>
                      <p className="text-text-light">Taxable income: ${Number(detail.calculation.assumptions.comparative.self?.taxableIncome || 0).toFixed(2)}</p>
                      <p className="text-text-light">Est. tax (before credits): ${Number(detail.calculation.assumptions.comparative.self?.estimatedTaxBeforeCredits || 0).toFixed(2)}</p>
                    </div>
                    <div className="border border-border rounded-md p-3">
                      <p className="font-semibold">Spouse</p>
                      <p className="text-text-light">Net income: ${Number(detail.calculation.assumptions.comparative.spouse?.netIncome || 0).toFixed(2)}</p>
                      <p className="text-text-light">Taxable income: ${Number(detail.calculation.assumptions.comparative.spouse?.taxableIncome || 0).toFixed(2)}</p>
                      <p className="text-text-light">Est. tax (before credits): ${Number(detail.calculation.assumptions.comparative.spouse?.estimatedTaxBeforeCredits || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </section>
              )}

              {detail.calculation?.assumptions?.optimization?.pensionSplit && (
                <section className="bg-white p-4 border border-border rounded-lg shadow-sm">
                  <h3 className="text-base font-semibold text-primary-dark mb-2">Optimization scenario: pension splitting</h3>
                  <p className="text-sm text-text-light">
                    Recommended split from {String(detail.calculation.assumptions.optimization.pensionSplit.splitSourceRole || 'taxpayer')}:
                    {' '}${Number(detail.calculation.assumptions.optimization.pensionSplit.recommendedSplit || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-text-light">
                    Estimated tax savings (before credits): ${Number(detail.calculation.assumptions.optimization.pensionSplit.estimatedTaxSavingsBeforeCredits || 0).toFixed(2)}
                  </p>
                </section>
              )}

              <section className="bg-white p-4 border border-border rounded-lg shadow-sm">
                <h3 className="text-base font-semibold text-primary-dark mb-2">Step 2 - Total income line details</h3>
                {incomeLineTotals.length === 0 ? (
                  <p className="text-sm text-text-light">No line-mapped income entries yet.</p>
                ) : (
                  <div className="overflow-x-auto border border-border rounded-md">
                    <table className="min-w-full text-sm">
                      <thead className="bg-background/70">
                        <tr>
                          <th className="text-left px-3 py-2">Line</th>
                          <th className="text-left px-3 py-2">Description</th>
                          <th className="text-right px-3 py-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incomeLineTotals.map((row) => (
                          <tr key={`${row.lineRef}-${row.label}`} className="border-t border-border">
                            <td className="px-3 py-2">{row.lineRef}</td>
                            <td className="px-3 py-2">{row.label}</td>
                            <td className="px-3 py-2 text-right">${row.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="bg-white p-4 border border-border rounded-lg shadow-sm">
                <h3 className="text-base font-semibold text-primary-dark mb-2">Deductions and credit input lines</h3>
                {deductionLineTotals.length === 0 ? (
                  <p className="text-sm text-text-light">No line-mapped deductions or credits yet.</p>
                ) : (
                  <div className="overflow-x-auto border border-border rounded-md">
                    <table className="min-w-full text-sm">
                      <thead className="bg-background/70">
                        <tr>
                          <th className="text-left px-3 py-2">Line</th>
                          <th className="text-left px-3 py-2">Description</th>
                          <th className="text-right px-3 py-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deductionLineTotals.map((row) => (
                          <tr key={`${row.lineRef}-${row.label}`} className="border-t border-border">
                            <td className="px-3 py-2">{row.lineRef}</td>
                            <td className="px-3 py-2">{row.label}</td>
                            <td className="px-3 py-2 text-right">${row.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default FormsSchedules
