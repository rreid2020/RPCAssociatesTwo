import { FC, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../../components/SEO'
import ClientPortalShell from '../../../components/ClientPortalShell'
import { taxFetch, type TaxReturnSummary } from '../../../lib/taxIntelligenceApi'
import { getTaxBasePath } from './path'

type ReadinessIssueSeverity = 'required' | 'recommended'

function sanitizeSin (value: string): string {
  return String(value || '').replace(/\D/g, '').slice(0, 9)
}

function computeSetupReadiness (r: TaxReturnSummary): { required: number; recommended: number } {
  const issues: Array<{ severity: ReadinessIssueSeverity }> = []
  const profile = r.taxpayer_profile || {}
  const spouse = profile.spouse || {}
  const maritalStatus = String(profile.maritalStatus || 'single')
  const spouseMode = String(profile.spouseReturnMode || 'summary') === 'full' ? 'full' : 'summary'
  const married = maritalStatus === 'married' || maritalStatus === 'common_law'
  const missing = (value: unknown) => !String(value || '').trim()

  if (missing(r.taxpayer_first_name)) issues.push({ severity: 'required' })
  if (missing(r.taxpayer_last_name)) issues.push({ severity: 'required' })
  if (!sanitizeSin(String(r.taxpayer_sin || ''))) issues.push({ severity: 'required' })
  if (missing(r.taxpayer_date_of_birth)) issues.push({ severity: 'required' })
  if (missing(profile.mailingAddressLine1)) issues.push({ severity: 'required' })
  if (missing(profile.mailingCity)) issues.push({ severity: 'required' })
  if (missing(profile.mailingProvinceCode)) issues.push({ severity: 'required' })
  if (missing(profile.mailingPostalCode)) issues.push({ severity: 'required' })
  if (missing(profile.residenceProvinceDec31)) issues.push({ severity: 'required' })

  if (profile.electionsCanadianCitizen == null) issues.push({ severity: 'recommended' })
  if (profile.electionsCanadianCitizen === true && profile.electionsAuthorize == null) issues.push({ severity: 'recommended' })
  if (profile.foreignPropertyOver100k == null) issues.push({ severity: 'recommended' })

  if (married) {
    if (spouseMode === 'full') {
      if (missing(spouse.firstName)) issues.push({ severity: 'required' })
      if (missing(spouse.lastName)) issues.push({ severity: 'required' })
      if (missing(spouse.dateOfBirth)) issues.push({ severity: 'required' })
      if (!sanitizeSin(String(spouse.fullSin || ''))) issues.push({ severity: 'required' })
    } else if (missing(spouse.fullName)) {
      issues.push({ severity: 'required' })
    }
  }

  return {
    required: issues.filter((it) => it.severity === 'required').length,
    recommended: issues.filter((it) => it.severity === 'recommended').length
  }
}

const TaxReturns: FC = () => {
  const { getToken } = useAuth()
  const location = useLocation()
  const basePath = useMemo(() => getTaxBasePath(location.pathname), [location.pathname])
  const [returns, setReturns] = useState<TaxReturnSummary[]>([])
  const [taxpayerName, setTaxpayerName] = useState('')
  const [taxpayerSin, setTaxpayerSin] = useState('')
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
          sin: String(taxpayerSin || '').replace(/\D/g, '').slice(0, 9),
          taxYear
        })
      })
      setTaxpayerName('')
      setTaxpayerSin('')
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
                className="border border-border rounded-md px-3 py-2 text-sm w-full md:w-48"
                placeholder="SIN (9 digits)"
                value={taxpayerSin}
                onChange={(e) => setTaxpayerSin(e.target.value.replace(/\D/g, '').slice(0, 9))}
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
                      {(() => {
                        const readiness = computeSetupReadiness(r)
                        if (readiness.required === 0 && readiness.recommended === 0) {
                          return (
                            <Link
                              to={`${basePath}/returns/${r.id}?step=Setup&setupFocus=all`}
                              className="mt-1 inline-flex items-center text-[11px] text-green-800 border border-green-300 bg-green-50 rounded px-2 py-0.5 hover:bg-green-100"
                            >
                              Setup ready
                            </Link>
                          )
                        }
                        return (
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            {readiness.required > 0 && (
                              <Link
                                to={`${basePath}/returns/${r.id}?step=Setup&setupFocus=required`}
                                className="inline-flex items-center text-[11px] text-amber-900 border border-amber-300 bg-amber-50 rounded px-2 py-0.5 hover:bg-amber-100"
                                title="Open builder setup and show required missing items"
                              >
                                {readiness.required} required
                              </Link>
                            )}
                            {readiness.recommended > 0 && (
                              <Link
                                to={`${basePath}/returns/${r.id}?step=Setup&setupFocus=all`}
                                className="inline-flex items-center text-[11px] text-blue-900 border border-blue-300 bg-blue-50 rounded px-2 py-0.5 hover:bg-blue-100"
                                title="Open builder setup and review all missing items"
                              >
                                {readiness.recommended} review
                              </Link>
                            )}
                          </div>
                        )
                      })()}
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
