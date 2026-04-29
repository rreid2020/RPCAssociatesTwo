import { FC, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../../components/SEO'
import ClientPortalShell from '../../../components/ClientPortalShell'
import { taxFetch, type TaxReturnSummary } from '../../../lib/taxIntelligenceApi'

const AuditRisk: FC = () => {
  const { getToken } = useAuth()
  const [returns, setReturns] = useState<TaxReturnSummary[]>([])
  const [selectedReturnId, setSelectedReturnId] = useState('')
  const [flags, setFlags] = useState<Array<{ id: string; severity: string; title: string; detail: string | null }>>([])
  const [err, setErr] = useState<string | null>(null)

  const loadReturns = async () => {
    const data = await taxFetch<{ returns: TaxReturnSummary[] }>('/tax-returns', getToken)
    setReturns(data.returns || [])
    if (!selectedReturnId && data.returns?.[0]?.id) setSelectedReturnId(data.returns[0].id)
  }

  const loadFlags = async (taxReturnId?: string) => {
    const id = taxReturnId || selectedReturnId
    if (!id) return
    const data = await taxFetch<{ flags: Array<{ id: string; severity: string; title: string; detail: string | null }> }>(
      `/audit/flags?taxReturnId=${id}`,
      getToken
    )
    setFlags(data.flags || [])
  }

  useEffect(() => {
    const run = async () => {
      try {
        await loadReturns()
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Could not load returns')
      }
    }
    void run()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedReturnId) return
    void loadFlags(selectedReturnId)
  }, [selectedReturnId]) // eslint-disable-line react-hooks/exhaustive-deps

  const runAudit = async () => {
    if (!selectedReturnId) return
    try {
      await taxFetch('/audit/run', getToken, {
        method: 'POST',
        body: JSON.stringify({ taxReturnId: selectedReturnId })
      })
      await loadFlags(selectedReturnId)
      setErr(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not run audit')
    }
  }

  return (
    <>
      <SEO title="Audit & Risk | Tax Intelligence" description="Rule-based audit risk assessments." canonical="/app/tax-intelligence/risk" />
      <ClientPortalShell>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-primary-dark">Audit &amp; Risk</h1>
          <p className="text-sm text-text-light">Rule-based checks for high-risk return patterns.</p>
          {err && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{err}</p>}

          <section className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-2">
            <select className="border border-border rounded-md px-3 py-2 text-sm w-full md:w-96" value={selectedReturnId} onChange={(e) => setSelectedReturnId(e.target.value)}>
              <option value="">Select return</option>
              {returns.map((r) => <option key={r.id} value={r.id}>{r.taxpayer_name} · {r.tax_year}</option>)}
            </select>
            <button type="button" className="btn btn--primary text-sm px-3 py-2" onClick={() => { void runAudit() }} disabled={!selectedReturnId}>
              Run audit engine
            </button>
          </section>

          <section className="bg-white p-4 rounded-lg border border-border shadow-sm">
            <h2 className="text-lg font-semibold text-primary-dark mb-2">Flags</h2>
            <ul className="space-y-2">
              {flags.map((f) => (
                <li key={f.id} className="border border-border rounded-md p-3">
                  <p className="text-xs font-semibold text-accent">{f.severity}</p>
                  <p className="font-medium text-text">{f.title}</p>
                  {f.detail && <p className="text-sm text-text-light mt-1">{f.detail}</p>}
                </li>
              ))}
              {flags.length === 0 && <li className="text-sm text-text-light">No flags yet.</li>}
            </ul>
          </section>
        </div>
      </ClientPortalShell>
    </>
  )
}

export default AuditRisk
