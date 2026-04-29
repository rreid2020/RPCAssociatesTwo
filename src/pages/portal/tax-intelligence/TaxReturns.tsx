import { FC, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../../components/SEO'
import ClientPortalShell from '../../../components/ClientPortalShell'
import { taxFetch, type TaxReturnSummary } from '../../../lib/taxIntelligenceApi'
import { getTaxBasePath } from './path'

const TaxReturns: FC = () => {
  const { getToken } = useAuth()
  const location = useLocation()
  const basePath = useMemo(() => getTaxBasePath(location.pathname), [location.pathname])
  const [returns, setReturns] = useState<TaxReturnSummary[]>([])
  const [taxpayerName, setTaxpayerName] = useState('')
  const [taxYear, setTaxYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await taxFetch<{ returns: TaxReturnSummary[] }>('/tax-returns', getToken)
      setReturns(data.returns || [])
      setErr(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load tax returns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onCreate = async () => {
    if (!taxpayerName.trim()) {
      setErr('Taxpayer name is required.')
      return
    }
    setSaving(true)
    setErr(null)
    try {
      await taxFetch('/tax-returns', getToken, {
        method: 'POST',
        body: JSON.stringify({
          taxpayerName: taxpayerName.trim(),
          taxYear
        })
      })
      setTaxpayerName('')
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create tax return')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (returnId: string, taxpayer: string, year: number) => {
    const confirmed = window.confirm(`Delete ${taxpayer} ${year} return?\n\nThis will permanently remove the return and all related tax data.`)
    if (!confirmed) return
    setDeletingId(returnId)
    setErr(null)
    try {
      await taxFetch(`/tax-returns/${returnId}`, getToken, { method: 'DELETE' })
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete tax return')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <SEO
        title="Tax Returns | Tax Intelligence | Client Portal"
        description="Manage T1 tax returns in the Tax Intelligence module."
        canonical="/app/tax-intelligence/returns"
      />
      <ClientPortalShell>
        <div className="space-y-6">
          <header>
            <h1 className="text-3xl font-bold text-primary-dark">Tax Returns</h1>
            <p className="text-sm text-text-light mt-1">
              Create and manage Canadian T1 return workspaces.
            </p>
          </header>

          <section className="bg-white p-4 rounded-lg border border-border shadow-sm">
            <h2 className="text-lg font-semibold text-primary-dark mb-3">Create return</h2>
            <div className="flex flex-col md:flex-row gap-2">
              <input
                className="border border-border rounded-md px-3 py-2 text-sm flex-1"
                placeholder="Taxpayer full name"
                value={taxpayerName}
                onChange={(e) => setTaxpayerName(e.target.value)}
                disabled={saving}
              />
              <input
                className="border border-border rounded-md px-3 py-2 text-sm w-full md:w-40"
                type="number"
                min={2000}
                max={2100}
                value={taxYear}
                onChange={(e) => setTaxYear(Number(e.target.value))}
                disabled={saving}
              />
              <button
                type="button"
                className="btn btn--primary text-sm px-4 py-2"
                disabled={saving}
                onClick={() => { void onCreate() }}
              >
                {saving ? 'Creating…' : 'Create return'}
              </button>
            </div>
            {err && (
              <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{err}</p>
            )}
          </section>

          <section className="bg-white p-4 rounded-lg border border-border shadow-sm">
            <h2 className="text-lg font-semibold text-primary-dark mb-3">Existing returns</h2>
            {loading && <p className="text-sm text-text-light">Loading…</p>}
            {!loading && returns.length === 0 && (
              <p className="text-sm text-text-light">No returns yet. Create your first return above.</p>
            )}
            {!loading && returns.length > 0 && (
              <ul className="divide-y divide-border">
                {returns.map((r) => (
                  <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-text">{r.taxpayer_name}</p>
                      <p className="text-xs text-text-light">
                        {r.tax_year} · {r.status} · updated {new Date(r.updated_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50"
                        disabled={deletingId === r.id}
                        onClick={() => { void onDelete(r.id, r.taxpayer_name, r.tax_year) }}
                      >
                        {deletingId === r.id ? 'Deleting…' : 'Delete'}
                      </button>
                      <Link
                        to={`${basePath}/returns/${r.id}`}
                        className="text-sm font-medium text-accent hover:underline"
                      >
                        Open builder
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </ClientPortalShell>
    </>
  )
}

export default TaxReturns
