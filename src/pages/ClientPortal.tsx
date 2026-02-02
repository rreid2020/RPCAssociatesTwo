import { FC } from 'react'
import SEO from '../components/SEO'

const ClientPortal: FC = () => {
  return (
    <>
      <SEO
        title="Client Portal"
        description="Explore the RPC Associates Client Portal: dashboard insights, TaxGPT research, secure file repository, working papers, and integrations."
        canonical="/client-portal"
      />
      <main className="py-xxl min-h-[60vh]">
        <div className="max-w-[1100px] mx-auto px-md">
          <div className="bg-background p-xl rounded-xl shadow-md">
            <div className="text-center">
              <h1 className="text-4xl lg:text-5xl font-bold text-primary-dark mb-sm">
                Client Portal
              </h1>
              <p className="text-xl lg:text-2xl text-text-light font-semibold mb-md">
                One secure workspace for everything we do together.
              </p>
              <p className="text-base lg:text-lg text-text max-w-[720px] mx-auto">
                Centralize communication, documents, and tax intelligence in a single portal built
                for fast, secure client collaboration.
              </p>
            </div>

            <section className="mt-xl">
              <h2 className="text-2xl font-semibold text-primary-dark mb-md">Portal Modules</h2>
              <div className="grid gap-md md:grid-cols-2">
                <div className="rounded-lg border border-border bg-white p-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-primary-dark mb-xs">Dashboard</h3>
                  <p className="text-sm text-text-light">
                    At-a-glance client status, open items, and upcoming milestones.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-white p-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-primary-dark mb-xs">TaxGPT</h3>
                  <p className="text-sm text-text-light">
                    Tax research and guidance with citations and document intelligence.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-white p-lg shadow-sm">
                  <div className="flex items-center gap-sm">
                    <h3 className="text-lg font-semibold text-primary-dark">File Repository</h3>
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                      Placeholder
                    </span>
                  </div>
                  <p className="mt-xs text-sm text-text-light">
                    Secure uploads, organized folders, and quick sharing with your RPC team.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-white p-lg shadow-sm">
                  <div className="flex items-center gap-sm">
                    <h3 className="text-lg font-semibold text-primary-dark">Working Papers</h3>
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                      Placeholder
                    </span>
                  </div>
                  <p className="mt-xs text-sm text-text-light">
                    Centralized workpapers, checklists, and collaboration notes.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-white p-lg shadow-sm md:col-span-2">
                  <div className="flex items-center gap-sm">
                    <h3 className="text-lg font-semibold text-primary-dark">Integrations</h3>
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                      Placeholder
                    </span>
                  </div>
                  <p className="mt-xs text-sm text-text-light">
                    Connect external accounting apps to streamline data sync and reporting.
                  </p>
                </div>
              </div>
            </section>

            <div className="mt-xl flex gap-md justify-center flex-wrap">
              <a href="mailto:roger.reid@rpcassociates.co" className="btn btn--primary">
                Request Access
              </a>
              <a href="tel:6138840208" className="btn btn--secondary">
                Call: 613-884-0208
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default ClientPortal




