import { FC, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../../components/SEO'
import ClientPortalShell from '../../../components/ClientPortalShell'
import { taxFetch } from '../../../lib/taxIntelligenceApi'
import { getTaxBasePath } from './path'

type TaxReturnPayload = {
  taxReturn: {
    id: string
    tax_year: number
    taxpayer_name: string
    status: string
  }
  incomeEntries: Array<{ id: string; category: string; description: string | null; amount: number }>
  deductions: Array<{ id: string; category: string; description: string | null; amount: number; is_credit: boolean }>
  calculation?: {
    taxable_income: number
    total_payable: number
    refund_or_balance: number
  }
}

const steps = ['Setup', 'Income', 'Deductions', 'Review', 'Optimization', 'Risk'] as const
type Step = typeof steps[number]

const ReturnBuilder: FC = () => {
  const { id = '' } = useParams()
  const { getToken } = useAuth()
  const location = useLocation()
  const basePath = useMemo(() => getTaxBasePath(location.pathname), [location.pathname])
  const [activeStep, setActiveStep] = useState<Step>('Setup')
  const [data, setData] = useState<TaxReturnPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [incomeRows, setIncomeRows] = useState<Array<{ category: string; description: string; amount: number }>>([])
  const [deductionRows, setDeductionRows] = useState<Array<{ category: string; description: string; amount: number; isCredit: boolean }>>([])
  const [documents, setDocuments] = useState<Array<{ id: string; file_name: string }>>([])
  const [selectedDocumentId, setSelectedDocumentId] = useState('')

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [returnData, docs] = await Promise.all([
        taxFetch<TaxReturnPayload>(`/tax-returns/${id}`, getToken),
        taxFetch<{ documents: Array<{ id: string; file_name: string }> }>('/documents/for-tax', getToken)
      ])
      setData(returnData)
      setIncomeRows((returnData.incomeEntries || []).map((r) => ({
        category: r.category,
        description: r.description || '',
        amount: Number(r.amount || 0)
      })))
      setDeductionRows((returnData.deductions || []).map((r) => ({
        category: r.category,
        description: r.description || '',
        amount: Number(r.amount || 0),
        isCredit: Boolean(r.is_credit)
      })))
      setDocuments(docs.documents || [])
      setErr(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load return builder')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const addIncomeRow = () => setIncomeRows((prev) => [...prev, { category: 'employment_income', description: '', amount: 0 }])
  const addDeductionRow = () => setDeductionRows((prev) => [...prev, { category: 'rrsp', description: '', amount: 0, isCredit: false }])

  const saveIncome = async () => {
    setSaving(true)
    try {
      await taxFetch(`/tax-returns/${id}/income`, getToken, {
        method: 'PUT',
        body: JSON.stringify({
          entries: incomeRows.map((r) => ({
            category: r.category,
            description: r.description,
            amount: Number(r.amount || 0),
            sourceType: 'manual',
            isManual: true
          }))
        })
      })
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save income')
    } finally {
      setSaving(false)
    }
  }

  const saveDeductions = async () => {
    setSaving(true)
    try {
      await taxFetch(`/tax-returns/${id}/deductions`, getToken, {
        method: 'PUT',
        body: JSON.stringify({
          entries: deductionRows.map((r) => ({
            category: r.category,
            description: r.description,
            amount: Number(r.amount || 0),
            isCredit: r.isCredit
          }))
        })
      })
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save deductions')
    } finally {
      setSaving(false)
    }
  }

  const importFromDocument = async () => {
    if (!selectedDocumentId) return
    setSaving(true)
    try {
      await taxFetch('/documents/extract', getToken, {
        method: 'POST',
        body: JSON.stringify({
          documentId: selectedDocumentId,
          taxReturnId: id
        })
      })
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not import from document')
    } finally {
      setSaving(false)
    }
  }

  const runCalculation = async () => {
    setSaving(true)
    try {
      await taxFetch(`/tax-returns/${id}/calculate`, getToken, { method: 'POST' })
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not calculate return')
    } finally {
      setSaving(false)
    }
  }

  const runAudit = async () => {
    setSaving(true)
    try {
      await taxFetch('/audit/run', getToken, {
        method: 'POST',
        body: JSON.stringify({ taxReturnId: id })
      })
      await load()
      setActiveStep('Risk')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not run audit')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <SEO
        title="Return Builder | Tax Intelligence | Client Portal"
        description="Build and review T1 return data."
        canonical="/app/tax-intelligence/returns"
      />
      <ClientPortalShell>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-primary-dark">Return Builder</h1>
              <p className="text-sm text-text-light">
                {data?.taxReturn?.taxpayer_name || 'Loading taxpayer'} · {data?.taxReturn?.tax_year || ''}
              </p>
            </div>
            <Link to={`${basePath}/returns`} className="text-sm text-accent font-medium hover:underline">Back to returns</Link>
          </div>

          <div className="bg-white p-3 rounded-lg border border-border shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {steps.map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setActiveStep(step)}
                  className={`px-2 py-2 text-xs rounded-md border ${
                    activeStep === step ? 'bg-primary-dark text-white border-primary-dark' : 'bg-background text-text border-border'
                  }`}
                >
                  {step}
                </button>
              ))}
            </div>
          </div>

          {err && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{err}</p>}
          {loading && <p className="text-sm text-text-light">Loading return data…</p>}

          {!loading && activeStep === 'Setup' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm">
              <h2 className="text-lg font-semibold text-primary-dark mb-2">Setup</h2>
              <p className="text-sm text-text-light">
                Return status: <strong className="text-text">{data?.taxReturn.status}</strong>. Continue to Income and Deductions to populate line items.
              </p>
            </section>
          )}

          {!loading && activeStep === 'Income' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-3">
              <h2 className="text-lg font-semibold text-primary-dark">Income</h2>
              <div className="flex flex-col md:flex-row gap-2">
                <select
                  className="border border-border rounded-md px-3 py-2 text-sm flex-1"
                  value={selectedDocumentId}
                  onChange={(e) => setSelectedDocumentId(e.target.value)}
                >
                  <option value="">Import from Documents…</option>
                  {documents.map((d) => <option key={d.id} value={d.id}>{d.file_name}</option>)}
                </select>
                <button type="button" className="btn btn--secondary text-sm px-3 py-2" onClick={() => { void importFromDocument() }} disabled={saving || !selectedDocumentId}>
                  Import selected document
                </button>
              </div>
              <div className="space-y-2">
                {incomeRows.map((row, idx) => (
                  <div key={`income-${idx}`} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input className="border border-border rounded-md px-3 py-2 text-sm" value={row.category} onChange={(e) => {
                      const next = [...incomeRows]; next[idx].category = e.target.value; setIncomeRows(next)
                    }} />
                    <input className="border border-border rounded-md px-3 py-2 text-sm" value={row.description} onChange={(e) => {
                      const next = [...incomeRows]; next[idx].description = e.target.value; setIncomeRows(next)
                    }} />
                    <input type="number" className="border border-border rounded-md px-3 py-2 text-sm" value={row.amount} onChange={(e) => {
                      const next = [...incomeRows]; next[idx].amount = Number(e.target.value); setIncomeRows(next)
                    }} />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn--secondary text-sm px-3 py-2" onClick={addIncomeRow}>Add row</button>
                <button type="button" className="btn btn--primary text-sm px-3 py-2" onClick={() => { void saveIncome() }} disabled={saving}>Save income</button>
              </div>
            </section>
          )}

          {!loading && activeStep === 'Deductions' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-3">
              <h2 className="text-lg font-semibold text-primary-dark">Deductions</h2>
              <div className="space-y-2">
                {deductionRows.map((row, idx) => (
                  <div key={`deduction-${idx}`} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input className="border border-border rounded-md px-3 py-2 text-sm" value={row.category} onChange={(e) => {
                      const next = [...deductionRows]; next[idx].category = e.target.value; setDeductionRows(next)
                    }} />
                    <input className="border border-border rounded-md px-3 py-2 text-sm" value={row.description} onChange={(e) => {
                      const next = [...deductionRows]; next[idx].description = e.target.value; setDeductionRows(next)
                    }} />
                    <input type="number" className="border border-border rounded-md px-3 py-2 text-sm" value={row.amount} onChange={(e) => {
                      const next = [...deductionRows]; next[idx].amount = Number(e.target.value); setDeductionRows(next)
                    }} />
                    <label className="text-sm text-text-light inline-flex items-center gap-2 px-2">
                      <input type="checkbox" checked={row.isCredit} onChange={(e) => {
                        const next = [...deductionRows]; next[idx].isCredit = e.target.checked; setDeductionRows(next)
                      }} />
                      Credit
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn--secondary text-sm px-3 py-2" onClick={addDeductionRow}>Add row</button>
                <button type="button" className="btn btn--primary text-sm px-3 py-2" onClick={() => { void saveDeductions() }} disabled={saving}>Save deductions</button>
              </div>
            </section>
          )}

          {!loading && activeStep === 'Review' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm">
              <h2 className="text-lg font-semibold text-primary-dark mb-2">Review</h2>
              <button type="button" className="btn btn--primary text-sm px-3 py-2" onClick={() => { void runCalculation() }} disabled={saving}>
                Run deterministic calculation
              </button>
              {data?.calculation && (
                <div className="mt-3 text-sm text-text space-y-1">
                  <p>Taxable income: ${Number(data.calculation.taxable_income || 0).toFixed(2)}</p>
                  <p>Total payable: ${Number(data.calculation.total_payable || 0).toFixed(2)}</p>
                  <p>Refund / balance: ${Number(data.calculation.refund_or_balance || 0).toFixed(2)}</p>
                </div>
              )}
            </section>
          )}

          {!loading && activeStep === 'Optimization' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-2">
              <h2 className="text-lg font-semibold text-primary-dark">Optimization</h2>
              <p className="text-sm text-text-light">Create scenarios in the dedicated Scenarios page.</p>
              <Link className="text-sm text-accent font-medium hover:underline" to={`${basePath}/scenarios`}>Open scenarios</Link>
            </section>
          )}

          {!loading && activeStep === 'Risk' && (
            <section className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-2">
              <h2 className="text-lg font-semibold text-primary-dark">Risk</h2>
              <button type="button" className="btn btn--secondary text-sm px-3 py-2" onClick={() => { void runAudit() }} disabled={saving}>
                Run audit risk checks
              </button>
              <Link className="text-sm text-accent font-medium hover:underline block" to={`${basePath}/risk`}>Open Audit & Risk panel</Link>
            </section>
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default ReturnBuilder
