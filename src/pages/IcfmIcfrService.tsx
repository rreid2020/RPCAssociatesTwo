import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import CalendlyButton from '../components/CalendlyButton'
import { icfmIcfrProcessTemplates } from '../lib/resources/icfmIcfrTemplates'

const howWeHelp = [
  {
    title: 'Risk & control matrix design',
    description:
      'We work with your team to identify key financial statement risks by process (revenue, procurement, payroll, close, fixed assets, IT) and map them to the controls that mitigate them, including control owner, type, frequency, and the assertions each control addresses.',
  },
  {
    title: 'Process documentation & narratives',
    description:
      'Clear, auditor-ready process narratives that describe how each financial process actually works end to end, so control gaps and segregation-of-duties issues are visible before they become findings.',
  },
  {
    title: 'Control testing & walkthroughs',
    description:
      'Independent testing of control design and operating effectiveness, with defensible sample sizes, documented procedures, and clear conclusions your auditors can rely on.',
  },
  {
    title: 'Deficiency identification & remediation',
    description:
      'When testing turns up gaps, we help you rate severity (control deficiency, significant deficiency, or material weakness), identify root cause, and build a remediation plan that gets tracked to closure — not just logged and forgotten.',
  },
  {
    title: 'SOX 404 readiness',
    description:
      "For companies approaching an IPO or already public, we help scope the ICFR program, build the control framework, and prepare management's assessment of internal control effectiveness.",
  },
  {
    title: 'Ongoing monitoring',
    description:
      'Controls decay when no one is watching. We help build the quarterly and annual review cadence that keeps your control environment current as your business changes.',
  },
] as const

const industries = [
  {
    title: 'Financial services',
    description:
      'Credit approval and underwriting, allowance for credit losses (CECL), fair value measurement of investments, deposit operations, wire transfer controls, and regulatory capital/liquidity reporting.',
  },
  {
    title: 'Manufacturing',
    description:
      'Standard costing and variance analysis, excess & obsolete inventory reserves, physical inventory counts, capital project controls, and warranty reserves.',
  },
  {
    title: 'SaaS & technology',
    description:
      'ASC 606 revenue recognition, deferred revenue, capitalized software development costs, commission capitalization (ASC 340-40), and stock-based compensation.',
  },
  {
    title: 'Any growing business',
    description:
      'A cross-industry framework covering Order-to-Cash, Procure-to-Pay, Payroll, Financial Close & Reporting, Fixed Assets, Treasury & Cash Management, and IT General Controls.',
  },
] as const

const approachSteps = [
  {
    title: 'Assess',
    description:
      'We review your current processes, systems, and existing documentation to understand where controls exist today and where the gaps are.',
  },
  {
    title: 'Design',
    description:
      'We build (or refine) your risk & control matrix and process narratives, scaled to your size and risk profile — not a generic checklist.',
  },
  {
    title: 'Test',
    description:
      'We perform walkthroughs and operating-effectiveness testing, documenting results the way an external auditor expects to see them.',
  },
  {
    title: 'Remediate',
    description:
      'We help you fix what testing finds, track remediation to closure, and retest to confirm the fix worked.',
  },
  {
    title: 'Sustain',
    description:
      'We help build the internal cadence — reconciliation reviews, access recertifications, quarterly testing — that keeps controls operating after we hand things back to your team.',
  },
] as const

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
  'financial reporting controls',
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
          serviceType: 'ICFM/ICFR Advisory',
        }}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Services', path: '/services' },
          { name: 'ICFM/ICFR', path: '/services/icfm-icfr' },
        ]}
      />

      <main className="svc-landing">
        <section className="hero" id="hero">
          <div className="wrap">
            <p className="eyebrow">Internal Controls</p>
            <h1>Internal controls you can trust — and auditors can rely on.</h1>
            <p className="lede">
              Strong controls aren&apos;t just an audit requirement. They&apos;re what let you trust
              your own numbers. We help growing companies design, document, test, and remediate
              ICFM/ICFR — from a first control environment through SOX 404 readiness.
            </p>
            <div className="cta-row">
              <CalendlyButton text="Book a 30-minute call" className="btn btn-primary" />
              <Link to="/resources/icfm-icfr-templates" className="btn btn-ghost">
                Get free starter templates
              </Link>
            </div>
            <p className="strip">
              <b>COSO-aligned</b>
              {' '}
              &nbsp;&middot;&nbsp;
              {' '}
              <b>Auditor-ready documentation</b>
              {' '}
              &nbsp;&middot;&nbsp;
              {' '}
              <b>Scaled to your size</b>
            </p>
          </div>
        </section>

        <section id="why">
          <div className="wrap">
            <p className="eyebrow">Why it matters</p>
            <h2>Informal checks stop working as you grow.</h2>
            <p className="intro">
              As a business grows, the informal checks that worked at five employees stop working at
              fifty. Lenders ask about controls before extending credit. Investors and acquirers
              factor control quality into valuation. Auditors flag gaps as deficiencies — or material
              weaknesses — that erode confidence in your financial statements. And if you&apos;re on
              the path to becoming public, SOX 404 makes formal ICFR a legal requirement.
            </p>
            <div className="panel panel-accent">
              <h3>Getting ahead is cheaper than reacting</h3>
              <p>
                A well-designed control environment, built around the COSO 2013 Internal Control –
                Integrated Framework, catches errors and fraud before they reach the statements — and
                gives management, lenders, and investors a documented reason to trust the numbers.
              </p>
            </div>
          </div>
        </section>

        <section className="alt" id="help">
          <div className="wrap">
            <p className="eyebrow">How we help</p>
            <h2>Practical ICFM/ICFR support — not a generic checklist</h2>
            <div className="detail-grid">
              {howWeHelp.map((item) => (
                <article key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="industry">
          <div className="wrap">
            <p className="eyebrow">Built for your industry</p>
            <h2>Risk doesn&apos;t look the same in every sector</h2>
            <p className="intro">
              We tailor the control framework to how your business actually operates.
            </p>
            <div className="detail-grid">
              {industries.map((industry) => (
                <article key={industry.title}>
                  <h3>{industry.title}</h3>
                  <p>{industry.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="alt" id="process">
          <div className="wrap">
            <p className="eyebrow">Our approach</p>
            <h2>Five steps, from assess to sustain</h2>
            <ol className="steps">
              {approachSteps.map((item) => (
                <li key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="templates">
          <div className="wrap">
            <p className="eyebrow">Free resource</p>
            <h2>ICFM/ICFR starter templates</h2>
            <p className="intro">
              Excel starter templates for seven core financial management and reporting processes —
              each with a risk &amp; control matrix, testing tracker, deficiency log, and process
              narrative template.
            </p>
            <div className="offer">
              <div className="offer-main">
                <h3>Included process templates</h3>
                <ul className="checklist">
                  {icfmIcfrProcessTemplates.map((template) => (
                    <li key={template.id}>{template.label}</li>
                  ))}
                </ul>
              </div>
              <div className="offer-side">
                <div className="k">Free download</div>
                <div className="price">7 templates</div>
                <p>Enter your name and email to unlock all seven process templates.</p>
                <Link to="/resources/icfm-icfr-templates" className="btn btn-primary btn-sm">
                  Download templates
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="closing" id="closing">
          <div className="wrap">
            <h2>Let&apos;s talk about your control environment</h2>
            <p className="lede">
              Whether you&apos;re building a first framework, preparing for an audit, or getting
              ready to go public — without Big Four overhead.
            </p>
            <div className="cta-row">
              <CalendlyButton text="Book a call" className="btn btn-solid" />
              <Link to="/contact" className="btn btn-outline">
                Contact us
              </Link>
            </div>
            <p className="section-note" style={{ marginTop: 28, marginInline: 'auto' }}>
              Axiom Financial &amp; Technology — Ottawa, Ontario, serving clients across Canada.
            </p>
          </div>
        </section>
      </main>
    </>
  )
}

export default IcfmIcfrService
