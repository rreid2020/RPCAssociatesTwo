import { FC } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEO from '../components/SEO'
import CalendlyButton from '../components/CalendlyButton'
import { getServiceBySlug } from '../lib/services/data'

const ServiceDetail: FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const service = slug ? getServiceBySlug(slug) : undefined

  if (!service) {
    return (
      <>
        <SEO title="Service Not Found" canonical="/services" />
        <main className="svc-landing">
          <section className="closing" id="closing">
            <div className="wrap">
              <h2>Service not found</h2>
              <p className="lede">The requested service page could not be found.</p>
              <div className="cta-row">
                <Link to="/services" className="btn btn-solid">
                  View all services
                </Link>
                <Link to="/" className="btn btn-outline">
                  Back to home
                </Link>
              </div>
            </div>
          </section>
        </main>
      </>
    )
  }

  const keywords = [
    service.pill.toLowerCase(),
    service.title.toLowerCase(),
    'accounting services',
    'consulting services',
    'CPA services',
    'Ottawa accountant',
    'Ottawa accounting',
    'Ontario accountant',
    'Canadian accounting',
    'business advisory',
    'financial services',
    'Canada',
  ]

  return (
    <>
      <SEO
        title={`${service.title} | Ottawa Accounting Services - Axiom`}
        description={service.metaDescription}
        canonical={`/services/${service.slug}`}
        keywords={keywords}
        ogType="website"
        schemaService={{
          name: service.title,
          description: service.metaDescription,
          provider: 'Axiom',
          areaServed: ['CA', 'CA-ON', 'Ottawa'],
          serviceType: service.title,
        }}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Services', path: '/services' },
          { name: service.title, path: `/services/${service.slug}` },
        ]}
      />

      <main className="svc-landing">
        <section className="hero" id="hero">
          <div className="wrap">
            <p className="eyebrow">{service.pill}</p>
            <h1>{service.title}</h1>
            <p className="lede">{service.intro}</p>
            <div className="cta-row">
              <CalendlyButton text="Book a 30-minute call" className="btn btn-primary" />
              <Link to="/services" className="btn btn-ghost">
                View all services
              </Link>
            </div>
            <p className="strip">
              {service.bullets.slice(0, 3).map((bullet, index) => (
                <span key={bullet}>
                  {index > 0 ? <> &nbsp;&middot;&nbsp; </> : null}
                  <b>{bullet}</b>
                </span>
              ))}
            </p>
          </div>
        </section>

        <section className="alt" id="included">
          <div className="wrap">
            <p className="eyebrow">What&apos;s included</p>
            <h2>How this engagement is structured</h2>
            <p className="intro">
              Clear scope, practical deliverables, and work that is useful beyond the engagement
              itself.
            </p>
            <div className="offer">
              <div className="offer-main">
                <h3>At a glance</h3>
                <ul className="checklist">
                  {service.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
              <div className="offer-side">
                <div className="k">{service.pill}</div>
                <div className="price">Talk first</div>
                <p>
                  A 30-minute call is enough to confirm fit, scope, and next steps — without a
                  proposal that moves later.
                </p>
                <CalendlyButton text="Book a 30-minute call" className="btn btn-primary btn-sm" />
              </div>
            </div>
          </div>
        </section>

        <section id="details">
          <div className="wrap">
            <p className="eyebrow">In more detail</p>
            <h2>What the work covers</h2>
            <div className="detail-grid">
              {service.details.map((detail) => (
                <article key={detail.title}>
                  <h3>{detail.title}</h3>
                  <p>{detail.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="closing" id="closing">
          <div className="wrap">
            <h2>Ready to talk about {service.title.toLowerCase()}?</h2>
            <p className="lede">
              Schedule a free consultation to discuss how this service can support your business.
            </p>
            <div className="cta-row">
              <CalendlyButton text="Book a free consultation" className="btn btn-solid" />
              <Link to="/services" className="btn btn-outline">
                View all services
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default ServiceDetail
