import { FC, useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'
import { useFeatureAccess } from '../../lib/subscriptions/hooks'
import UpgradePrompt from '../../components/UpgradePrompt'
import { portalFetch } from '../../lib/portalApi'

type Row = { id: string; provider: string; status: string; created_at: string }

const Integrations: FC = () => {
  const hasAccess = useFeatureAccess('integrations')
  const { getToken } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!hasAccess) return
    setErr(null)
    setLoading(true)
    try {
      const { connections } = await portalFetch<{ connections: Row[]; availableProviders: { id: string; name: string; status: string }[] }>(
        '/v1/integrations',
        getToken
      )
      setRows(connections)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [getToken, hasAccess])

  useEffect(() => {
    void load()
  }, [load])

  const requestConn = async (provider: string) => {
    setErr(null)
    setNote(null)
    setSubmitting(true)
    try {
      const j = await portalFetch<{ ok: boolean; note: string }>('/v1/integrations/request', getToken, {
        method: 'POST',
        body: JSON.stringify({ provider, message: 'Request connection from client portal' })
      })
      setNote(j.note)
      void load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <SEO
        title="Integrations | Client Portal"
        description="Connect your accounting apps and streamline data flow in the Axiom Client Portal."
        canonical="/portal/integrations"
      />
      <ClientPortalShell>
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-3xl font-bold text-primary-dark">Integrations</h1>
            {!hasAccess && (
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                Premium
              </span>
            )}
          </div>

          {!hasAccess ? (
            <UpgradePrompt feature="Integrations" />
          ) : (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
                <p className="text-text mb-4">
                  Direct OAuth to accounting and banking systems is a larger project. Today you can{' '}
                  <strong>request a connection</strong> and our team will follow up. Your requests are recorded under your account.
                </p>
                {err && <p className="text-sm text-red-700 mb-2" role="alert">{err}</p>}
                {note && <p className="text-sm text-accent font-medium mb-2">{note}</p>}
                {loading && <p className="text-text-light">Loading&hellip;</p>}

                {!loading && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {['quickbooks', 'xero', 'bank'].map((id) => (
                      <div key={id} className="border border-border rounded-lg p-4 text-center">
                        <p className="font-medium text-text capitalize mb-2">
                          {id === 'bank' ? 'Bank feed' : id === 'quickbooks' ? 'QuickBooks' : 'Xero'}
                        </p>
                        <button
                          type="button"
                          className="btn btn--primary text-sm py-2 px-4 w-full"
                          disabled={submitting}
                          onClick={() => { void requestConn(id) }}
                        >
                          {submitting ? 'Submitting…' : 'Request to connect'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {rows.length > 0 && (
                <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
                  <h2 className="text-lg font-semibold text-primary-dark mb-2">Your requests</h2>
                  <ul className="text-sm text-text space-y-2">
                    {rows.map((r) => (
                      <li key={r.id}>
                        {r.provider} — <span className="text-text-light">{r.status}</span> — {new Date(r.created_at).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default Integrations
