import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import CalendlyButton from '../components/CalendlyButton'
import { icfmIcfrProcessTemplates } from '../lib/resources/icfmIcfrTemplates'

const howWeHelp = [
  {
    title: 'Risk & control matrix design',
    description:
      'We work with your team to identify key financial statement risks by process (revenue, procurement, payroll, close, fixed assets, IT) and map them to the controls that mitigate them, including control owner, type, frequency, and the assertions each control addresses.'
  },
  {
    title: 'Process documentation & narratives',
    description:
      'Clear, auditor-ready process narratives that describe how each financial process actually works end to end, so control gaps and segregation-of-duties issues are visible before they become findings.'
  },
  {
    title: 'Control testing & walkthroughs',
    description:
      'Independent testing of control design and operating effectiveness, with defensible sample sizes, documented procedures, and clear conclusions your auditors can rely on.'
  },
  {
    title: 'Deficiency identification & remediation',
    description:
      'When testing turns up gaps, we help you rate severity (control deficiency, significant deficiency, or material weakness), identify root cause, and build a remediation plan that gets tracked to closure — not just logged and forgotten.'
  },
  {
    title: 'SOX 404 readiness',
    description:
      "For companies approaching an IPO or already public, we help scope the ICFR program, build the control framework, and prepare management's assessment of internal control effectiveness."
  },
  {
    title: 'Ongoing monitoring',
    description:
      'Controls decay when no one is watching. We help build the quarterly and annual review cadence that keeps your control environment current as your business changes.'
  }
]

const industries = [
  {
    title: 'Financial services',
    description:
      'Credit approval and underwriting, allowance for credit losses (CECL), fair value measurement of investments, deposit operations, wire transfer controls, and regulatory capital/liquidity reporting.'
  },
  {
    title: 'Manufacturing',
    description:
      'Standard costing and variance analysis, excess & obsolete inventory reserves, physical inventory counts, capital project controls, and warranty reserves.'
  },
  {
    title: 'SaaS & technology',
    description:
      'ASC 606 revenue recognition, deferred revenue, capitalized software development costs, commission capitalization (ASC 340-40), and stock-based compensation.'
  },
  {
    title: 'Any growing business',
    description:
      'A cross-industry framework covering Order-to-Cash, Procure-to-Pay, Payroll, Financial Close & Reporting, Fixed Assets, Treasury & Cash Management, and IT General Controls.'
  }
]

const approachSteps = [
  {
    step: 1,
    title: 'Assess',
    description:
      'We review your current processes, systems, and existing documentation to understand where controls exist today and where the gaps are.'
  },
  {
    step: 2,
    title: 'Design',
    description:
      'We build (or refine) your risk & control matrix and process narratives, scaled to your size and risk profile — not a generic checklist.'
  },
  {
    step: 3,
    title: 'Test',
    description:
      'We perform walkthroughs and operating-effectiveness testing, documenting results the way an external auditor expects to see them.'
  },
  {
    step: 4,
    title: 'Remediate',
    description:
      'We help you fix what testing finds, track remediation to closure, and retest to confirm the fix worked.'
  },
  {
    step: 5,
    title: 'Sustain',
    description:
      'We help build the internal cadence — reconciliation reviews, access recertifications, quarterly testing — that keeps controls operating after we hand things back to your team.'
  }
]

const keywords = [
  'ICFM',
  'ICFR',
  'internal controls',
  'internal control over financial reporting',
  'SOX 404',
  'COSO',
  'risk and control matrix',
  'control testing',
  'deficiency remediation',
  'Ottawa accountant',
  'Canada internal controls',
  'financial reporting controls'
]

const IcfmIcfrService: FC = () => {
  return (
    <>
      <SEO
        title="ICFM/ICFR Advisory Services | Axiom Financial & Technology"
        description="Internal control design, testing, and remediation for growing businesses — from first risk & control matrix to SOX 404 readiness. Ottawa-based, Canada-wide."
        canonical="/services/icfm-icfr"
        keywords={keywords}
        ogType="website"
        schemaService={{
          name: 'Internal Controls over Financial Management & Reporting (ICFM/ICFR)',
          description:
            'Internal control design, testing, and remediation for growing businesses — from first risk & control matrix to SOX 404 readiness.',
          provider: 'Axiom',
          areaServed: ['CA', 'CA-ON', 'Ottawa'],
          serviceType: 'ICFM/ICFR Advisory'
        }}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Services', path: '/services' },
          { name: 'ICFM/ICFR', path: '/services/icfm-icfr' },
        ]}
      />
      <main>
        <section className="py-xxl bg-gradient-to-b from-background-band to-background border-b border-border">
          <div className="max-w-[1120px] mx-auto px-md">
            <div className="text-center mb-xl max-w-[800px] mx-auto">
              <span className="pill mb-md">
                Internal Controls
              </span>
              <h1 className="text-3xl lg:text-4xl font-semibold text-primary mb-md">
                Internal Controls over Financial Management &amp; Reporting (ICFM/ICFR)
              </h1>
              <p className="text-lg text-text-body leading-relaxed">
                Strong internal controls aren&apos;t just an audit requirement — they&apos;re what let you trust your own
                numbers. Axiom helps growing companies design, document, test, and remediate the controls that protect
                financial reporting, whether you&apos;re building your first control environment, preparing for a
                transaction, or maintaining SOX 404 compliance as a public issuer.
              </p>
            </div>
          </div>
        </section>

        <section className="py-xxl bg-white">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="max-w-[800px] mx-auto">
              <h2 className="text-3xl lg:text-4xl font-semibold text-primary mb-md">Why ICFM/ICFR matters</h2>
              <div className="space-y-md text-text-light leading-relaxed text-lg">
                <p>
                  As a business grows, the informal checks that worked at five employees stop working at fifty. Lenders
                  start asking about controls before extending credit. Investors and acquirers factor control quality
                  into valuation and deal terms. Auditors flag gaps as deficiencies — or worse, material weaknesses —
                  that erode confidence in your financial statements. And if you&apos;re on the path to becoming a
                  public company, Section 404 of the Sarbanes-Oxley Act makes formal ICFR documentation and testing a
                  legal requirement, not a nice-to-have.
                </p>
                <p>
                  Getting ahead of this is far cheaper than reacting to it. A well-designed control environment, built
                  around the COSO 2013 Internal Control – Integrated Framework, catches errors and fraud before they
                  reach the financial statements — and gives management, lenders, and investors a documented reason to
                  trust the numbers.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="text-center mb-xl max-w-[800px] mx-auto">
              <h2 className="text-3xl lg:text-4xl font-semibold text-primary mb-md">How we help</h2>
              <p className="text-lg text-text-body">
                Practical ICFM/ICFR support scaled to your size and risk profile — not a generic checklist.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
              {howWeHelp.map((item) => (
                <div
                  key={item.title}
                  className="bg-white p-lg rounded-lg border border-border hover:shadow-md transition-all"
                >
                  <h3 className="text-xl font-semibold text-primary mb-sm">{item.title}</h3>
                  <p className="text-text-light leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-xxl bg-white">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="text-center mb-xl max-w-[800px] mx-auto">
              <h2 className="text-3xl lg:text-4xl font-semibold text-primary mb-md">Built for your industry</h2>
              <p className="text-lg text-text-body">
                Financial statement risk doesn&apos;t look the same in every sector, so we tailor the control framework
                to how your business actually operates.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              {industries.map((industry) => (
                <div key={industry.title} className="bg-background p-lg rounded-lg border border-border">
                  <h3 className="text-xl font-semibold text-primary mb-sm">{industry.title}</h3>
                  <p className="text-text-light leading-relaxed">{industry.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="text-center mb-xl max-w-[800px] mx-auto">
              <h2 className="text-3xl lg:text-4xl font-semibold text-primary mb-md">Our approach</h2>
            </div>
            <ol className="max-w-[800px] mx-auto space-y-lg list-none">
              {approachSteps.map((item) => (
                <li key={item.step} className="flex gap-md items-start">
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-accent text-white font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-primary mb-xs">{item.title}</h3>
                    <p className="text-text-light leading-relaxed">{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-xxl bg-white">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="bg-background p-xl rounded-lg border border-border text-center max-w-[800px] mx-auto">
              <h2 className="text-3xl lg:text-4xl font-semibold text-primary mb-md">
                Free resource: ICFM/ICFR starter templates
              </h2>
              <p className="text-lg text-text-body mb-lg leading-relaxed">
                To help you see what a working risk &amp; control matrix actually looks like, we&apos;ve built Excel
                starter templates for seven core financial management and financial reporting business processes.
                Each template includes a risk &amp; control matrix, a control testing tracker, a deficiency &amp;
                remediation log, and a process narrative template, pre-populated with realistic example controls.
              </p>
              <ul className="list-none text-left max-w-[560px] mx-auto mb-lg space-y-sm">
                {icfmIcfrProcessTemplates.map((template) => (
                  <li
                    key={template.id}
                    className="pl-md relative before:content-['•'] before:absolute before:left-0 before:text-accent before:font-bold text-text"
                  >
                    {template.label}
                  </li>
                ))}
              </ul>
              <Link to="/resources/icfm-icfr-templates" className="btn btn--primary">
                Download your free ICFM/ICFR templates →
              </Link>
              <p className="text-sm text-text-light mt-md">
                Enter your name and email to unlock all seven process templates.
              </p>
            </div>
          </div>
        </section>

        <section className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md text-center">
            <div className="bg-white p-xl rounded-lg shadow-sm border border-border">
              <h2 className="text-3xl lg:text-4xl font-semibold text-primary mb-md">
                Let&apos;s talk about your control environment
              </h2>
              <p className="text-lg text-text-body mb-lg max-w-2xl mx-auto leading-relaxed">
                Whether you&apos;re building your first control framework, preparing for an audit, or getting ready to
                go public, Axiom can help you get there without the overhead of a Big Four engagement. Book a call or
                contact us to discuss where your business stands today.
              </p>
              <div className="flex justify-center gap-md flex-wrap">
                <CalendlyButton text="Book a call" className="btn btn--primary" />
                <Link to="/contact" className="btn btn--secondary">
                  Contact us
                </Link>
                <Link to="/services" className="btn btn--secondary">
                  View All Services
                </Link>
              </div>
              <p className="text-sm text-text-light mt-lg max-w-2xl mx-auto">
                Axiom Financial &amp; Technology — accounting, advisory, automation, and intelligence for growing
                businesses. Ottawa, Ontario, serving clients across Canada.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default IcfmIcfrService
