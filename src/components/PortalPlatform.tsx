import { FC } from 'react'
import { Link } from 'react-router-dom'

type PlatformModule = {
  id: string
  eyebrow: string
  title: string
  description: string
  highlights: string[]
  icon: FC<{ className?: string }>
  badge?: string
}

const SparklesIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l2.5 5 5.5 2.5-5.5 2.5L12 18l-2.5-5-5.5-2.5 5.5-2.5L12 3z" />
  </svg>
)

const ReturnBuilderIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const AccountingIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const MODULES: PlatformModule[] = [
  {
    id: 'taxgpt',
    eyebrow: 'Tax Intelligence',
    title: 'TaxGPT',
    badge: 'Active',
    description:
      'AI-powered Canadian tax research with citations from CRA publications, legislation, and official guidance—so you get accurate answers in plain language.',
    highlights: [
      'Tax research chat with source citations',
      'Document intelligence and form guidance',
      'Deduction discovery and audit risk insights'
    ],
    icon: SparklesIcon
  },
  {
    id: 'tax-return-builder',
    eyebrow: 'Tax Return Builder',
    title: 'Personal T1 return workspace',
    description:
      'Prepare personal income tax returns end to end: interview-driven setup, slip and schedule worksheets, optimization, scenarios, and audit readiness.',
    highlights: [
      'Tax returns and CRA slip entry',
      'Document processing and optimization',
      'Scenarios, audit & risk, forms & schedules'
    ],
    icon: ReturnBuilderIcon
  },
  {
    id: 'accounting-operations',
    eyebrow: 'Accounting Operations',
    title: 'Engagements and firm operations',
    description:
      'Run engagements, working papers, approvals, and integrations from one workspace—with business profile, roles, and permissions built in.',
    highlights: [
      'Engagements and approval-ready workflows',
      'Business/firm profile and entity management',
      'Roles, permissions, and accounting integrations'
    ],
    icon: AccountingIcon
  }
]

const PortalCta: FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex flex-wrap items-center gap-3 ${className}`}>
    <Link to="/portal/sign-in" className="btn btn--primary">
      Sign in to portal
    </Link>
    <Link to="/portal/select-plan" className="btn btn--secondary">
      Create an account
    </Link>
  </div>
)

const PortalPlatform: FC = () => {
  return (
    <section id="client-portal" className="py-xxl bg-background">
      <div className="max-w-[1200px] mx-auto px-md">
        <div className="text-center mb-xl max-w-[800px] mx-auto">
          <div className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-md">
            Client Portal
          </div>
          <h2 className="mb-md text-primary-dark">One secure platform for tax, returns, and accounting operations</h2>
          <p className="text-lg text-text-light mb-lg">
            Axiom&apos;s client portal brings TaxGPT, Tax Return Builder, and Accounting Operations into a single signed-in workspace—built for secure collaboration with your accountant.
          </p>
          <PortalCta className="justify-center" />
        </div>

        <div className="space-y-xl">
          {MODULES.map((module, index) => {
            const Icon = module.icon
            const reversed = index % 2 === 1
            return (
              <article
                key={module.id}
                id={module.id}
                className="grid grid-cols-1 lg:grid-cols-2 gap-lg lg:gap-xxl items-center"
              >
                <div className={reversed ? 'lg:order-2' : undefined}>
                  <div className="inline-flex items-center gap-2 mb-md">
                    <Icon className="w-7 h-7 text-accent" />
                    <span className="text-sm font-semibold text-accent uppercase tracking-wider">{module.eyebrow}</span>
                    {module.badge && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                        {module.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold mb-md text-primary-dark">{module.title}</h3>
                  <p className="text-text-light mb-md">{module.description}</p>
                  <ul className="list-none mb-lg">
                    {module.highlights.map((item) => (
                      <li
                        key={item}
                        className="pl-md mb-sm relative before:content-['✓'] before:absolute before:left-0 before:text-accent before:font-bold text-[0.9375rem] text-text-light"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                  <PortalCta />
                </div>
                <div className={`bg-white p-lg lg:p-xl rounded-xl shadow-md ${reversed ? 'lg:order-1' : undefined}`}>
                  <p className="text-sm font-semibold uppercase tracking-wide text-text-light mb-md">Included in the portal</p>
                  <div className="space-y-sm">
                    {module.highlights.map((item) => (
                      <div key={item} className="border-l-4 border-accent pl-md py-1">
                        <p className="text-sm text-text">{item}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-md text-xs text-text-light">
                    <Link to="/portal/sign-in" className="text-accent font-semibold hover:underline">Sign in</Link>
                    {' or '}
                    <Link to="/portal/select-plan" className="text-accent font-semibold hover:underline">create an account</Link>
                    {' to access '}
                    {module.eyebrow}.
                  </p>
                </div>
              </article>
            )
          })}
        </div>

        <div className="mt-xl text-center">
          <p className="text-text-light mb-md">
            Want a full tour of the portal modules?
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/client-portal" className="btn btn--secondary">
              Explore the client portal
            </Link>
            <Link to="/portal/sign-in" className="btn btn--primary">
              Sign in now
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PortalPlatform
