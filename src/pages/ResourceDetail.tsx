import { FC, useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { getResourceBySlug } from '../lib/resources/resources'
import LeadCaptureForm from '../components/LeadCaptureForm'
import { hasAccessedResource, markResourceAsAccessed } from '../lib/utils/leadCapture'
import { downloadFile } from '../lib/utils/download'
import CalendlyButton from '../components/CalendlyButton'

const ResourceDetail: FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const resource = slug ? getResourceBySlug(slug) : null

  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    if (resource && resource.requiresLeadCapture && resource.downloadUrl) {
      setHasAccess(hasAccessedResource(resource.title))
    } else {
      setHasAccess(true) // Calculators don't require lead capture
    }
  }, [resource])

  const handleFormSuccess = () => {
    if (resource) {
      markResourceAsAccessed(resource.title)
      setHasAccess(true)
      if (resource.downloadUrl && resource.fileName) {
        downloadFile(resource.downloadUrl, resource.fileName)
      }
    }
  }

  if (!resource) {
    return (
      <>
        <SEO
          title="Resource Not Found - RPC Associates"
          description="The requested resource could not be found."
          canonical="/resources"
        />
        <main className="py-xxl min-h-[60vh]">
          <div className="max-w-[1200px] mx-auto px-md text-center">
            <h1 className="text-4xl font-bold text-primary mb-md">Resource Not Found</h1>
            <p className="text-lg text-text-light mb-lg">
              The resource you're looking for doesn't exist.
            </p>
            <Link to="/resources" className="btn btn--primary">
              View All Resources
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <SEO
        title={`${resource.title} - RPC Associates`}
        description={resource.metaDescription}
        canonical={`/resources/${resource.slug}`}
        keywords={resource.keywords}
      />
      <main>
        {/* Hero Section */}
        <section className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl items-center">
              <div>
                <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-semibold uppercase tracking-wider rounded-full mb-md">
                  {resource.categoryLabel}
                </span>
                <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-md">
                  {resource.title}
                </h1>
                <p className="text-lg text-text-light leading-relaxed mb-lg">
                  {resource.longDescription}
                </p>
                {resource.fileSize && (
                  <p className="text-sm text-text-light mb-lg">
                    File size: {resource.fileSize}
                  </p>
                )}
                {resource.requiresLeadCapture && !hasAccess ? (
                  <p className="text-text-light mb-lg">
                    Enter your information below to access this free resource.
                  </p>
                ) : resource.downloadUrl ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      if (resource.downloadUrl && resource.fileName) {
                        downloadFile(resource.downloadUrl, resource.fileName)
                      }
                    }}
                    className="btn btn--primary"
                  >
                    {resource.category === 'calculator' ? 'Use Calculator' : 'Download Now'}
                  </button>
                ) : (
                  <Link to={resource.slug} className="btn btn--primary">
                    Use Calculator
                  </Link>
                )}
              </div>
              <div className="bg-white p-xl rounded-xl shadow-sm border border-border">
                {resource.requiresLeadCapture && !hasAccess ? (
                  <LeadCaptureForm
                    resourceName={resource.title}
                    onSuccess={handleFormSuccess}
                  />
                ) : resource.benefits && resource.benefits.length > 0 ? (
                  <div>
                    <h2 className="text-2xl font-bold text-primary mb-md">
                      What You'll Get
                    </h2>
                    <ul className="space-y-3">
                      {resource.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-text-light">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits/Features Section */}
        {(resource.benefits || resource.features) && (
          <section className="py-xxl bg-white">
            <div className="max-w-[1200px] mx-auto px-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-xxl">
                {resource.benefits && (
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-primary mb-md">
                      Benefits
                    </h2>
                    <ul className="space-y-3">
                      {resource.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-text-light">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {resource.features && (
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-primary mb-md">
                      Features
                    </h2>
                    <ul className="space-y-3">
                      {resource.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-text-light">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="bg-white p-xl rounded-xl shadow-sm border border-border text-center">
              <h2 className="text-2xl lg:text-3xl font-bold text-primary mb-md">
                Need Help with Your Finances?
              </h2>
              <p className="text-lg text-text-light mb-lg max-w-2xl mx-auto">
                Our team of experienced accountants and consultants can help you make the most of these resources and provide personalized guidance for your situation.
              </p>
              <CalendlyButton className="btn btn--primary" />
            </div>
          </div>
        </section>

        {/* Back to Resources */}
        <section className="py-lg bg-white">
          <div className="max-w-[1200px] mx-auto px-md">
            <Link
              to="/resources"
              className="inline-block text-primary no-underline text-[0.9375rem] transition-all hover:underline"
            >
              ← Back to Resources
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}

export default ResourceDetail
