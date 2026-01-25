import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import CalendlyButton from '../components/CalendlyButton'
import { services } from '../lib/services/data'

// Service icon component (same as in Header)
const ServiceIcon = ({ icon }: { icon: string }) => {
  const iconMap: Record<string, JSX.Element> = {
    'core-accounting': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    'year-end-reporting': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    'tax-planning': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    'cash-flow-planning': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    'fractional-controller': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    'tech-solutions': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  }
  return iconMap[icon] || (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

const Services: FC = () => {
  return (
    <>
      <SEO
        title="Our Services | Accounting, Consulting & Tech Solutions - RPC Associates"
        description="Comprehensive accounting, consulting, and tech solutions for growing businesses. Core accounting, year-end reporting, tax planning, cash flow forecasting, fractional controller services, and accounting systems. Expert CPA services across Canada."
        canonical="/services"
        keywords={[
          'accounting services',
          'CPA services',
          'bookkeeping services',
          'tax planning',
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
          'Canada'
        ]}
      />
      <main>
        {/* Hero Section */}
        <section className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="text-center mb-xl max-w-[800px] mx-auto">
              <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-md">
                Our Services
              </h1>
              <p className="text-lg text-text-light leading-relaxed">
                Bringing together accounting, consulting, and technology so you have accurate numbers, practical advice, and modern systems working together.
              </p>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-xxl bg-white">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
              {services.map((service) => (
                <Link 
                  key={service.slug}
                  to={`/services/${service.slug}`}
                  className="bg-background p-lg rounded-xl shadow-sm border border-border transition-all hover:shadow-md hover:-translate-y-1 block no-underline text-inherit"
                >
                  <div className="flex items-center gap-3 mb-md">
                    <div className="flex-shrink-0 text-primary">
                      <ServiceIcon icon={service.slug} />
                    </div>
                    <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-semibold uppercase tracking-wider rounded-full">
                      {service.pill}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-primary mb-sm">
                    {service.title}
                  </h3>
                  <p className="text-text-light mb-md text-[0.9375rem] leading-relaxed">
                    {service.intro}
                  </p>
                  <ul className="list-none">
                    {service.bullets.map((bullet, bulletIndex) => (
                      <li 
                        key={bulletIndex} 
                        className="pl-md mb-xs relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold text-[0.9375rem] text-text-light"
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-xxl bg-background">
          <div className="max-w-[900px] mx-auto px-md text-center">
            <div className="bg-white p-xl rounded-xl shadow-sm border border-border">
              <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-md">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-text-light mb-lg max-w-2xl mx-auto">
                Schedule a free consultation to discuss how our services can help your business.
              </p>
              <CalendlyButton className="btn btn--primary text-center w-full md:w-auto" />
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default Services
