import { FC, FormEvent, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import ClientPortalShell from '../../../components/ClientPortalShell'
import SEO from '../../../components/SEO'
import { CountTable } from '../components/OpsSummaryCards'
import {
  getOpsPortalUserStats,
  listOpsPortalUsers,
  type OpsPortalUserListItem,
  type OpsPortalUserStats
} from '../services'

function formatDate (value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

const UsersOpsPage: FC = () => {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<OpsPortalUserStats | null>(null)
  const [items, setItems] = useState<OpsPortalUserListItem[]>([])
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsResult, listResult] = await Promise.all([
        getOpsPortalUserStats(getToken),
        listOpsPortalUsers(getToken, { q: query || undefined, limit: 50 })
      ])
      setStats(statsResult)
      setItems(listResult.items)
      setTotal(listResult.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load portal users')
    } finally {
      setLoading(false)
    }
  }, [getToken, query])

  useEffect(() => {
    void load()
  }, [load])

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    setQuery(searchInput.trim())
  }

  return (
    <>
      <SEO
        title="Portal Users | Platform Ops"
        description="View users signed up on the client portal."
        canonical="/portal/ops/users"
      />
      <ClientPortalShell>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-primary-dark">Portal Users</h1>
              <p className="text-sm text-text-light mt-1">
                Portal sign-ups from taxgpt.users and active workspace memberships.
              </p>
            </div>
            <Link to="/portal/ops" className="text-sm text-accent font-medium hover:underline">Back to ops home</Link>
          </div>

          {stats && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="border border-border rounded-md p-3"><strong>Total users</strong><p>{stats.totals.total}</p></div>
              <div className="border border-border rounded-md p-3"><strong>With workspace</strong><p>{stats.totals.withWorkspace}</p></div>
              <div className="border border-border rounded-md p-3"><strong>In users table</strong><p>{stats.totals.withUsersRecord}</p></div>
            </section>
          )}

          {stats && stats.byUserType.length > 0 && (
            <CountTable title="By user type" rows={stats.byUserType} />
          )}

          <form onSubmit={handleSearch} className="flex flex-wrap gap-2 items-end">
            <label className="text-sm grow min-w-[260px]">
              <span className="block mb-1 text-text-light">Search</span>
              <input
                className="w-full border border-border rounded-md px-3 py-2"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Clerk user ID"
              />
            </label>
            <button type="submit" className="px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:opacity-90">
              Search
            </button>
            {query && (
              <button
                type="button"
                className="px-4 py-2 rounded-md border border-border bg-white text-sm"
                onClick={() => {
                  setSearchInput('')
                  setQuery('')
                }}
              >
                Clear
              </button>
            )}
          </form>

          {loading && <p className="text-sm text-text-light">Loading portal users...</p>}
          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}

          {!loading && !error && (
            <section className="rounded-lg border border-border bg-white shadow-sm overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-background text-left text-text-light">
                  <tr>
                    <th className="px-4 py-3 font-medium">Clerk ID</th>
                    <th className="px-4 py-3 font-medium">Users row</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Workspaces</th>
                    <th className="px-4 py-3 font-medium">Signed up</th>
                    <th className="px-4 py-3 font-medium">Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-text-light">
                        {query ? 'No users matched your search.' : 'No portal users found yet.'}
                      </td>
                    </tr>
                  ) : (
                    items.map((user) => (
                      <tr key={user.clerkUserId} className="border-t border-border align-top">
                        <td className="px-4 py-3 font-mono text-xs text-text" title={user.clerkUserId}>
                          {user.clerkUserId}
                        </td>
                        <td className="px-4 py-3">{user.hasUsersRecord ? 'Yes' : 'No'}</td>
                        <td className="px-4 py-3">
                          {user.userType || '—'}
                          {user.employeeCount ? <div className="text-xs text-text-light">{user.employeeCount} employees</div> : null}
                        </td>
                        <td className="px-4 py-3">
                          <div>{user.workspaceCount}</div>
                          {user.workspaceNames.length > 0 && (
                            <div className="text-xs text-text-light mt-1 max-w-[220px] truncate" title={user.workspaceNames.join(', ')}>
                              {user.workspaceNames.join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(user.signedUpAt)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(user.lastActiveAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {total > items.length && (
                <p className="px-4 py-3 text-xs text-text-light border-t border-border">
                  Showing {items.length} of {total} users
                </p>
              )}
            </section>
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default UsersOpsPage
