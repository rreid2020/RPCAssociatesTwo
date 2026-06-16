import { FC, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import ClientPortalShell from '../../../components/ClientPortalShell'
import SEO from '../../../components/SEO'
import { getOpsExternalLinks, type OpsExternalLink } from '../services'

const ExternalLinksPage: FC = () => {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [links, setLinks] = useState<OpsExternalLink[]>([])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const next = await getOpsExternalLinks(getToken)
        if (!cancelled) setLinks(next)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load external links')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [getToken])

  return (
    <>
      <SEO title="External Admin Links | Platform Ops" description="Quick access to Stripe, Clerk, OpenAI, and infrastructure consoles." canonical="/portal/ops/links" />
      <ClientPortalShell>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl font-bold text-primary-dark">External Admin Links</h1>
            <Link to="/portal/ops" className="text-sm text-accent font-medium hover:underline">Back to ops home</Link>
          </div>
          <p className="text-sm text-text-light">Opens vendor admin consoles in a new tab. Configure URLs via ops environment variables when needed.</p>
          {loading && <p className="text-sm text-text-light">Loading links...</p>}
          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-border bg-white p-4 shadow-sm hover:border-accent transition-colors"
              >
                <p className="text-xs uppercase tracking-wide text-text-light">{link.category}</p>
                <p className="mt-1 text-lg font-semibold text-primary-dark">{link.label}</p>
                <p className="mt-2 text-sm text-text-light">{link.description}</p>
              </a>
            ))}
          </div>
        </div>
      </ClientPortalShell>
    </>
  )
}

export default ExternalLinksPage
