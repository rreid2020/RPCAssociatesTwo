import { FC, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../../components/SEO'
import ClientPortalShell from '../../../components/ClientPortalShell'
import { taxFetch, type TaxReturnSummary } from '../../../lib/taxIntelligenceApi'

const Scenarios: FC = () => {
  const { getToken } = useAuth()
  const [returns, setReturns] = useState<TaxReturnSummary[]>([])
  const [selectedReturnId, setSelectedReturnId] = useState('')
  const [scenarios, setScenarios] = useState<Array<{ id: string; name: string; comparison_json: Record<string, unknown> }>>([])
  const [scenarioName, setScenarioName] = useState('RRSP Contribution Scenario')
  const [rrspOverride, setRrspOverride] = useState(5000)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const data = await taxFetch<{ returns: TaxReturnSummary[] }>('/tax-returns', getToken)
        setReturns(data.returns || [])
        if (data.returns?.[0]?.id) setSelectedReturnId(data.returns[0].id)
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Could not load returns')
      }
    }
    void run()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadScenarios = async (taxReturnId: string) => {
    if (!taxReturnId) return
    try {
      const data = await taxFetch<{ scenarios: Array<{ id: string; name: string; comparison_json: Record<string, unknown> }> }>(
        `/scenarios?taxReturnId=${taxReturnId}`,
        getToken
      )
      setScenarios(data.scenarios || [])
      setErr(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load scenarios')
    }
  }

  useEffect(() => {
    if (selectedReturnId) void loadScenarios(selectedReturnId)
  }, [selectedReturnId]) // eslint-disable-line react-hooks/exhaustive-deps

  const createScenario = async () => {
    if (!selectedReturnId) return
    try {
      await taxFetch('/scenarios', getToken, {
        method: 'POST',
        body: JSON.stringify({
          taxReturnId: selectedReturnId,
          name: scenarioName,
          scenarioType: 'rrsp',
          inputOverrides: {
            deductions: {
              rrsp: rrspOverride
            }
          }
        })
      })
      await loadScenarios(selectedReturnId)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create scenario')
    }
  }

  return (
    <>
      <SEO title="Scenarios | Tax Intelligence" description="Compare tax scenarios and optimization cases." canonical="/app/tax-intelligence/scenarios" />
      <ClientPortalShell>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-primary-dark">Scenarios</h1>
          <p className="text-sm text-text-light">Clone returns, apply overrides, compare impacts.</p>
          {err && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{err}</p>}

          <section className="bg-white p-4 border border-border rounded-lg shadow-sm space-y-3">
            <h2 className="text-lg font-semibold text-primary-dark">Create scenario</h2>
            <select className="border border-border rounded-md px-3 py-2 text-sm w-full" value={selectedReturnId} onChange={(e) => setSelectedReturnId(e.target.value)}>
              <option value="">Select return</option>
              {returns.map((r) => <option key={r.id} value={r.id}>{r.taxpayer_name} · {r.tax_year}</option>)}
            </select>
            <input className="border border-border rounded-md px-3 py-2 text-sm w-full" value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} />
            <input type="number" className="border border-border rounded-md px-3 py-2 text-sm w-full" value={rrspOverride} onChange={(e) => setRrspOverride(Number(e.target.value))} />
            <button type="button" className="btn btn--primary text-sm px-3 py-2" onClick={() => { void createScenario() }}>Create scenario</button>
          </section>

          <section className="bg-white p-4 border border-border rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-primary-dark mb-2">Saved scenarios</h2>
            <ul className="divide-y divide-border">
              {scenarios.map((s) => (
                <li key={s.id} className="py-2">
                  <p className="font-medium text-text">{s.name}</p>
                  <pre className="text-xs bg-background border border-border rounded p-2 overflow-x-auto mt-1">
                    {JSON.stringify(s.comparison_json || {}, null, 2)}
                  </pre>
                </li>
              ))}
              {scenarios.length === 0 && <li className="py-2 text-sm text-text-light">No scenarios created yet.</li>}
            </ul>
          </section>
        </div>
      </ClientPortalShell>
    </>
  )
}

export default Scenarios
