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
        <main>
          <section className="py-xxl bg-background">
            <div className="max-w-[1200px] mx-auto px-md text-center">
              <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-md">
                Service Not Found
              </h1>
              <p className="text-lg text-text-light mb-lg">
                The requested service page could not be found.
              </p>
              <Link to="/" className="btn btn--primary">
                Back to Home
              </Link>
            </div>
          </section>
        </main>
      </>
    )
  }

  // Build comprehensive keywords for SEO
  const keywords = [
    service.pill.toLowerCase(),
    service.title.toLowerCase(),
    'accounting services',
    'consulting services',
    'CPA services',
    'Ottawa accountant',
    'Ottawa accounting',
    'Ottawa consulting',
    'Ontario accountant',
    'Canadian accounting',
    'business advisory',
    'financial services',
    'Canada'
  ]

  return (
    <>
      <SEO 
        title={`${service.title} | Ottawa Accounting Services - RPC Associates`}
        description={service.metaDescription}
        canonical={`/services/${service.slug}`}
        keywords={keywords}
        ogType="website"
        schemaService={{
          name: service.title,
          description: service.metaDescription,
          provider: 'RPC Associates',
          areaServed: ['CA', 'CA-ON', 'Ottawa'],
          serviceType: service.title
        }}
      />
      <main>
        {/* Hero Section */}
        <section className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="text-center mb-xl max-w-[800px] mx-auto">
              <span className="inline-block px-4 py-2 bg-primary text-white text-sm font-semibold uppercase tracking-wider rounded-full mb-md">
                {service.pill}
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-md">
                {service.title}
              </h1>
              <p className="text-lg text-text-light leading-relaxed">
                {service.intro}
              </p>
            </div>
          </div>
        </section>

        {/* Service Details Section */}
        <section className="py-xxl bg-white">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
              {service.details.map((detail, index) => (
                <div 
                  key={index}
                  className="bg-background p-lg rounded-xl border border-border hover:shadow-md transition-all"
                >
                  <h3 className="text-xl font-semibold text-primary mb-sm">
                    {detail.title}
                  </h3>
                  <p className="text-text-light leading-relaxed">
                    {detail.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Overview Section */}
        <section className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="bg-white p-xl rounded-xl shadow-sm border border-border">
              <h2 className="text-2xl font-bold text-primary mb-md text-center">
                What's Included
              </h2>
              <ul className="max-w-2xl mx-auto list-none">
                {service.bullets.map((bullet, index) => (
                  <li 
                    key={index} 
                    className="pl-md mb-sm relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold text-[0.9375rem] text-text-light"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md text-center">
            <div className="bg-white p-xl rounded-xl shadow-sm border border-border">
              <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-md">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-text-light mb-lg max-w-2xl mx-auto">
                Schedule a free consultation to discuss how {service.title.toLowerCase()} can help your business.
              </p>
              <div className="flex justify-center gap-md flex-wrap">
                <CalendlyButton 
                  text="Book a Free Consultation"
                  className="btn btn--primary"
                />
                <Link 
                  to="/"
                  className="btn btn--secondary"
                >
                  Learn More About Our Services
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default ServiceDetail
