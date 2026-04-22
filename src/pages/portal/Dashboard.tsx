import { FC, useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'
import { portalFetch, PortalDashboard } from '../../lib/portalApi'

const Dashboard: FC = () => {
  const { getToken } = useAuth()
  const [data, setData] = useState<PortalDashboard | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoadError(null)
    setLoading(true)
    try {
      const d = await portalFetch<PortalDashboard>('/v1/dashboard', getToken)
      setData(d)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void load()
  }, [load])

  const onToggleItem = async (id: string, next: 'open' | 'done') => {
    setTogglingId(id)
    try {
      await portalFetch('/v1/open-items/' + id, getToken, {
        method: 'PATCH',
        body: JSON.stringify({ status: next })
      })
      void load()
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <>
      <SEO
        title="Dashboard | Client Portal"
        description="View your account status, open items, and upcoming milestones in the RPC Associates Client Portal."
        canonical="/portal/dashboard"
      />
      <ClientPortalShell>
        <div>
          <h1 className="text-3xl font-bold text-primary-dark mb-2">Dashboard</h1>
          <p className="text-sm text-text-light mb-6">Live view of your open items, deadlines, and recent activity.</p>

          {loadError && (
            <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm" role="alert">
              {loadError}
            </div>
          )}

          {loading && (
            <p className="text-text-light">Loading&hellip;</p>
          )}

          {!loading && data && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
                  <h3 className="text-sm font-medium text-text-light mb-2">Open Items</h3>
                  <p className="text-3xl font-bold text-primary-dark">{data.counts.openItems}</p>
                  <p className="text-sm text-text-light mt-2">Items requiring your attention</p>
                </div>

                <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
                  <h3 className="text-sm font-medium text-text-light mb-2">Upcoming Deadlines</h3>
                  <p className="text-3xl font-bold text-primary-dark">{data.counts.upcomingDeadlines}</p>
                  <p className="text-sm text-text-light mt-2">Due in the next 90 days</p>
                </div>

                <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
                  <h3 className="text-sm font-medium text-text-light mb-2">Checklists (Working Papers)</h3>
                  <p className="text-3xl font-bold text-primary-dark">{data.counts.activeProjects}</p>
                  <p className="text-sm text-text-light mt-2">Checklists in progress</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
                  <h2 className="text-lg font-semibold text-primary-dark mb-4">Open items</h2>
                  {data.openItems.length === 0 ? (
                    <p className="text-text-light text-sm">You have no open items right now.</p>
                  ) : (
                    <ul className="space-y-3">
                      {data.openItems.map((o) => (
                        <li key={o.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 border-b border-border/60 pb-3 last:border-0">
                          <div>
                            <p className="font-medium text-text">{o.title}</p>
                            {o.description && <p className="text-sm text-text-light mt-0.5">{o.description}</p>}
                            <p className="text-xs text-text-light mt-1">
                              Updated {new Date(o.updated_at).toLocaleString()}
                              {o.due_at && ` — Due ${new Date(o.due_at).toLocaleDateString()}`}
                            </p>
                          </div>
                          {o.status === 'open' ? (
                            <button
                              type="button"
                              className="text-sm font-medium text-accent hover:underline shrink-0"
                              disabled={togglingId === o.id}
                              onClick={() => { void onToggleItem(o.id, 'done') }}
                            >
                              {togglingId === o.id ? 'Saving…' : 'Mark done'}
                            </button>
                          ) : (
                            <span className="text-sm text-text-light">Done</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
                  <h2 className="text-lg font-semibold text-primary-dark mb-4">Upcoming deadlines</h2>
                  {data.deadlines.length === 0 ? (
                    <p className="text-text-light text-sm">No upcoming deadlines in this window.</p>
                  ) : (
                    <ul className="space-y-2">
                      {data.deadlines.map((d) => (
                        <li key={d.id} className="flex justify-between gap-2 text-sm">
                          <span className="text-text font-medium">{d.title}</span>
                          <span className="text-text-light whitespace-nowrap">
                            {new Date(d.due_at).toLocaleDateString()}
                            {d.category && ` · ${d.category}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
                <h2 className="text-xl font-semibold text-primary-dark mb-4">Recent activity</h2>
                {data.recentActivity.length === 0 ? (
                  <p className="text-text-light">No recent activity to display.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.recentActivity.map((a) => (
                      <li key={a.id} className="border-l-4 border-accent pl-4">
                        <p className="font-medium text-text">{a.title}</p>
                        {a.body && <p className="text-sm text-text-light mt-0.5">{a.body}</p>}
                        <p className="text-xs text-text-light mt-1">{new Date(a.created_at).toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default Dashboard
