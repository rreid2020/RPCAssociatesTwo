import { FC } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { portalModuleStatusLabel, portalModules } from '../lib/portal/modules'
import { siteUrl } from '../lib/brand'

const statusBadgeClass: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  active: 'bg-green-100 text-green-800',
  development: 'bg-amber-100 text-amber-900'
}

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
        url: `${siteUrl.replace(/\/$/, '')}/client-portal#${module.id}`
      }
    }))
  }

  return (
    <section id="client-portal" className="py-xxl bg-background" aria-labelledby="client-portal-heading">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
      </Helmet>
      <div className="max-w-[1200px] mx-auto px-md">
        <div className="text-center mb-xl max-w-[800px] mx-auto">
          <div className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-md">
            Client Portal
          </div>
          <h2 id="client-portal-heading" className="mb-md text-primary-dark">
            One secure platform for tax, returns, and accounting operations
          </h2>
          <p className="text-lg text-text-light">
            Axiom&apos;s client portal brings Dashboard, TaxGPT, Tax Return Builder, File Repository, Working
            Papers, and Integrations into a single signed-in workspace—built for secure collaboration with your
            accountant.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {portalModules.map((module) => (
            <Link
              key={module.id}
              to={`/client-portal#${module.id}`}
              id={module.id}
              className="bg-white p-lg rounded-xl shadow-sm transition-all hover:shadow-md hover:-translate-y-1 block no-underline text-inherit"
            >
              <div className="flex flex-wrap items-center gap-2 mb-md">
                <span className="inline-block px-3 py-1 bg-accent text-white text-xs font-semibold uppercase tracking-wider rounded-full">
                  {module.pill}
                </span>
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${statusBadgeClass[module.status]}`}
                >
                  {portalModuleStatusLabel[module.status]}
                </span>
              </div>
              <h3 className="text-xl mb-sm text-primary">{module.title}</h3>
              <p className="text-text-light mb-md text-[0.9375rem]">{module.intro}</p>
              <ul className="list-none">
                {module.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="pl-md mb-xs relative before:content-['•'] before:absolute before:left-0 before:text-accent before:font-bold text-[0.9375rem]"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>

        <div className="mt-xl text-center max-w-[640px] mx-auto">
          <p className="text-text-light mb-md">
            Ready to get started? Sign in to your workspace or create an account to explore every client portal
            module.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/portal/sign-in" className="btn btn--primary">
              Sign in to portal
            </Link>
            <Link to="/portal/select-plan" className="btn btn--secondary">
              Create an account
            </Link>
          </div>
          <p className="mt-md text-sm text-text-light">
            <Link to="/client-portal" className="text-accent font-semibold hover:underline">
              Learn more about the client portal
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default PortalPlatform
