import { FC, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import ClientPortalShell from '../../../components/ClientPortalShell'
import SEO from '../../../components/SEO'
import { CountTable } from '../components/OpsSummaryCards'
import { getOpsFormRegistryStats, type OpsFormRegistryStats } from '../services'

const FormRegistryOpsPage: FC = () => {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [registry, setRegistry] = useState<OpsFormRegistryStats | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const next = await getOpsFormRegistryStats(getToken)
        if (!cancelled) setRegistry(next)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load form registry stats')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [getToken])

  return (
    <>
      <SEO title="Forms Registry Ops | Platform Ops" description="CRA forms catalog registry statistics." canonical="/portal/ops/forms-registry" />
      <ClientPortalShell>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl font-bold text-primary-dark">Forms Registry</h1>
            <Link to="/portal/ops" className="text-sm text-accent font-medium hover:underline">Back to ops home</Link>
          </div>
          {loading && <p className="text-sm text-text-light">Loading form registry stats...</p>}
          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}
          {registry?.tableMissing && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
              `taxgpt.form_registry` is not provisioned yet. Run `npm run taxgpt:discover-forms` from `client-portal/taxgpt-api`.
            </p>
          )}
          {registry && !registry.tableMissing && (
            <>
              <section className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="border border-border rounded-md p-3"><strong>Total forms</strong><p>{registry.totals.total}</p></div>
                <div className="border border-border rounded-md p-3"><strong>Active</strong><p>{registry.totals.active}</p></div>
                <div className="border border-border rounded-md p-3"><strong>Archived</strong><p>{registry.totals.archived}</p></div>
              </section>
              <CountTable title="By form family" rows={registry.byFamily} />
              <section className="rounded-lg border border-border bg-white p-4 shadow-sm">
                <h3 className="text-base font-semibold text-primary-dark mb-3">Recently cataloged</h3>
                <div className="overflow-x-auto border border-border rounded-md">
                  <table className="min-w-full text-sm">
                    <thead className="bg-background/70">
                      <tr>
                        <th className="text-left px-3 py-2">Form</th>
                        <th className="text-left px-3 py-2">Title</th>
                        <th className="text-left px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registry.recent.map((row) => (
                        <tr key={row.formNumber} className="border-t border-border">
                          <td className="px-3 py-2 font-medium">{row.formNumber}</td>
                          <td className="px-3 py-2">{row.title}</td>
                          <td className="px-3 py-2">{row.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default FormRegistryOpsPage
