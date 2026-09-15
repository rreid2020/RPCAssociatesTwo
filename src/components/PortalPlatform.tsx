import { FC } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { portalModuleStatusLabel, portalModules } from '../lib/portal/modules'
import { siteUrl } from '../lib/brand'

const PortalPlatform: FC = () => {
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Axiom Client Portal Modules',
    description:
      'Secure client portal capabilities including dashboard, TaxGPT, tax return builder, file repository, working papers, and integrations.',
    itemListElement: portalModules.map((module, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: module.title,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: module.intro,
        url: `${siteUrl.replace(/\/$/, '')}/client-portal#${module.id}`,
      },
    })),
  }

  return (
    <div className="svc-landing">
      <section
        id="client-portal"
        className="alt"
        style={{ borderTop: '1px solid var(--rule)' }}
        aria-labelledby="client-portal-heading"
      >
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
        </Helmet>
        <div className="wrap">
          <p className="eyebrow">Client Portal</p>
          <h2 id="client-portal-heading">
            One secure platform for tax, returns, and accounting operations
          </h2>
          <p className="intro">
            Axiom&apos;s client portal brings Dashboard, TaxGPT, Tax Return Builder, File Repository,
            Working Papers, and Integrations into a single signed-in workspace — built for secure
            collaboration with your accountant.
          </p>
          <div className="detail-grid">
            {portalModules.map((module) => (
              <article key={module.id}>
                <h3>
                  <Link to={`/client-portal#${module.id}`}>{module.title}</Link>
                </h3>
                <p>{module.intro}</p>
                <p className="section-note" style={{ marginTop: 12 }}>
                  {portalModuleStatusLabel[module.status]}
                </p>
              </article>
            ))}
          </div>
          <div className="cta-row" style={{ marginTop: 36 }}>
            <Link to="/portal/sign-in" className="btn btn-solid">
              Open the portal
            </Link>
            <Link to="/client-portal" className="btn btn-outline">
              Learn more
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PortalPlatform
