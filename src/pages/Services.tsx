import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import CalendlyButton from '../components/CalendlyButton'
import { services } from '../lib/services/data'

const Services: FC = () => {
  return (
    <>
      <SEO
        title="Our Services | Accounting, Consulting & Tech Solutions - Axiom"
        description="Year-end reporting, cash flow forecasting, fractional controller services, accounting systems, and ICFM/ICFR for growing businesses. Expert CPA services across Canada."
        canonical="/services"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Services', path: '/services' },
        ]}
        keywords={[
          'accounting services',
          'CPA services',
          'bookkeeping services',
          'cash flow planning',
          'fractional controller',
          'accounting systems',
          'tech solutions',
          'Ottawa accountant',
          'Ottawa accounting',
          'Ontario accountant',
          'Canadian accounting',
          'business advisory',
          'financial services',
          'Canada',
        ]}
      />

      <main className="svc-landing">
        <section className="hero" id="hero">
          <div className="wrap">
            <p className="eyebrow">Services</p>
            <h1>Accounting, consulting, and technology that work together.</h1>
            <p className="lede">
              Accurate numbers, practical advice, and modern systems — so you can run and grow the
              business without guessing what the financials mean.
            </p>
            <div className="cta-row">
              <CalendlyButton text="Book a 30-minute call" className="btn btn-primary" />
              <a className="btn btn-ghost" href="#catalog">
                Browse services
              </a>
            </div>
            <p className="strip">
              <b>Published fees where we can</b>
              {' '}
              &nbsp;&middot;&nbsp;
              {' '}
              <b>Clear scope in writing</b>
              {' '}
              &nbsp;&middot;&nbsp;
              {' '}
              <b>Ottawa-based, Canada-wide</b>
            </p>
          </div>
        </section>

        <section className="alt" id="catalog">
          <div className="wrap">
            <p className="eyebrow">What we offer</p>
            <h2>Choose the engagement that fits</h2>
            <p className="intro">
              Each service page sets out scope, approach, and how to start. We would rather move you
              to the right fit than sell you the wrong one.
            </p>
            <div className="service-grid">
              {services.map((service) => (
                <Link key={service.slug} to={`/services/${service.slug}`} className="service-card">
                  <div className="name">{service.pill}</div>
                  <h3>{service.title}</h3>
                  <p className="intro">{service.intro}</p>
                  <ul>
                    {service.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="closing" id="closing">
          <div className="wrap">
            <h2>Not sure which service you need?</h2>
            <p className="lede">
              A 30-minute call is enough to establish fit. If another firm or another Axiom service
              is the better starting point, we&apos;ll say so.
            </p>
            <div className="cta-row">
              <CalendlyButton text="Book a 30-minute call" className="btn btn-solid" />
              <Link to="/contact" className="btn btn-outline">
                Contact us
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default Services
