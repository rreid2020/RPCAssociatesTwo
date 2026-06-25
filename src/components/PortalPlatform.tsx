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
  badgeTone?: 'active' | 'development'
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
    badgeTone: 'active',
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
    badge: 'Under Development',
    badgeTone: 'development',
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

const PortalPlatform: FC = () => {
  return (
    <section id="client-portal" className="py-xxl bg-background">
      <div className="max-w-[1200px] mx-auto px-md">
        <div className="text-center mb-xl max-w-[800px] mx-auto">
          <div className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-md">
            Client Portal
          </div>
          <h2 className="mb-md text-primary-dark">One secure platform for tax, returns, and accounting operations</h2>
          <p className="text-lg text-text-light">
            Axiom&apos;s client portal brings TaxGPT, Tax Return Builder, and Accounting Operations into a single signed-in workspace—built for secure collaboration with your accountant.
          </p>
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
                      <span
                        className={
                          module.badgeTone === 'development'
                            ? 'rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900'
                            : 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800'
                        }
                      >
                        {module.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold mb-md text-primary-dark">{module.title}</h3>
                  <p className="text-text-light">{module.description}</p>
                </div>
                <div className={`bg-white p-lg lg:p-xl rounded-xl shadow-md ${reversed ? 'lg:order-1' : undefined}`}>
                  <ul className="list-none">
                    {module.highlights.map((item) => (
                      <li
                        key={item}
                        className="border-l-4 border-accent pl-md py-2 mb-sm last:mb-0"
                      >
                        <p className="text-sm text-text">{item}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            )
          })}
        </div>

        <div className="mt-xl text-center max-w-[640px] mx-auto">
          <p className="text-text-light mb-md">
            Ready to get started? Sign in to your workspace or create an account to access TaxGPT, Tax Return Builder, and Accounting Operations.
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
