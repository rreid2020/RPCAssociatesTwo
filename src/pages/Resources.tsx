import { FC } from 'react'
import SEO from '../components/SEO'
import ResourceCard from '../components/ResourceCard'
import CalendlyButton from '../components/CalendlyButton'
import { getResourcesByCategory } from '../lib/resources/resources'

const Resources: FC = () => {
  const calculators = getResourcesByCategory('calculator')
  const excelTemplates = getResourcesByCategory('excel-template')
  const publications = getResourcesByCategory('publication')

  return (
    <>
      <SEO
        title="Free Accounting Calculators, Templates & Guides"
        description="Free Canadian tax calculators, cash-flow tools, Excel templates, and ARO resources from Axiom in Ottawa."
        canonical="/resources"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Resources', path: '/resources' },
        ]}
        keywords={['resources', 'tax calculator', 'tools', 'guides', 'Ottawa', 'Canada']}
      />
      <main className="svc-landing">
        <section className="hero" id="hero">
          <div className="wrap">
            <p className="eyebrow">Resources</p>
            <h1>Calculators, templates, and guides you can use today.</h1>
            <p className="lede">
              Free Canadian tax calculators, cash-flow tools, Excel templates, and ARO resources —
              built for practical decisions, not brochureware.
            </p>
            <div className="cta-row">
              <a className="btn btn-primary" href="#calculators">
                Browse calculators
              </a>
              <a className="btn btn-ghost" href="#templates">
                Excel templates
              </a>
            </div>
            <p className="strip">
              <b>Free to use</b>
              {' '}
              &nbsp;&middot;&nbsp;
              {' '}
              <b>CPA-built</b>
              {' '}
              &nbsp;&middot;&nbsp;
              {' '}
              <b>Ottawa / Canada</b>
            </p>
          </div>
        </section>

        <section className="alt" id="calculators">
          <div className="wrap">
            <p className="eyebrow">Tools</p>
            <h2>Online calculators</h2>
            <p className="intro">Estimate tax, cash flow, and related figures with free interactive tools.</p>
            {calculators.length > 0 ? (
              <div className="service-grid">
                {calculators.map((resource) => (
                  <ResourceCard key={resource.slug} resource={resource} />
                ))}
              </div>
            ) : (
              <p className="intro">More calculators and tools coming soon.</p>
            )}
          </div>
        </section>

        <section id="templates">
          <div className="wrap">
            <p className="eyebrow">Downloads</p>
            <h2>Excel templates</h2>
            <p className="intro">Ready-to-use workbooks for cash flow and financial reporting.</p>
            {excelTemplates.length > 0 ? (
              <div className="service-grid">
                {excelTemplates.map((resource) => (
                  <ResourceCard key={resource.slug} resource={resource} />
                ))}
              </div>
            ) : (
              <p className="intro">More Excel templates coming soon.</p>
            )}
          </div>
        </section>

        <section className="alt" id="publications">
          <div className="wrap">
            <p className="eyebrow">Guides</p>
            <h2>Publications</h2>
            <p className="intro">Practical write-ups and checklists from our practice.</p>
            {publications.length > 0 ? (
              <div className="service-grid">
                {publications.map((resource) => (
                  <ResourceCard key={resource.slug} resource={resource} />
                ))}
              </div>
            ) : (
              <p className="intro">More publications coming soon.</p>
            )}
          </div>
        </section>

        <section className="closing" id="closing">
          <div className="wrap">
            <h2>Need help applying these tools?</h2>
            <p className="lede">
              Book a short call and we&apos;ll help you put the right calculator or template to work.
            </p>
            <div className="cta-row">
              <CalendlyButton text="Book a 30-minute call" className="btn btn-solid" />
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default Resources
