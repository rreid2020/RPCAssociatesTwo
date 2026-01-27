import { FC, useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { getResourceBySlug } from '../lib/resources/resources'
import LeadCaptureForm from '../components/LeadCaptureForm'
import { hasAccessedResource, markResourceAsAccessed } from '../lib/utils/leadCapture'
import { downloadFile } from '../lib/utils/download'
import CalendlyButton from '../components/CalendlyButton'

const ResourceDetail: FC = () => {
  const { slug: slugParam } = useParams<{ slug: string }>()
  const location = useLocation()
  
  // Extract slug from URL pathname if not in params (for specific routes)
  const slug = slugParam || location.pathname.replace('/resources/', '')
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
            <div className="text-center mb-xl max-w-[800px] mx-auto">
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
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl items-start">
              {/* Left Column - Summary and Benefits */}
              <div>
                {resource.benefits && resource.benefits.length > 0 && (
                  <div className="bg-white p-xl rounded-xl shadow-sm border border-border mb-lg">
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
                )}
                
                {resource.features && resource.features.length > 0 && (
                  <div className="bg-white p-xl rounded-xl shadow-sm border border-border">
                    <h2 className="text-2xl font-bold text-primary mb-md">
                      What's Included
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

              {/* Right Column - Form or Download */}
              <div>
                {resource.requiresLeadCapture && !hasAccess ? (
                  <div className="bg-white p-xl rounded-xl shadow-sm border border-border">
                    <LeadCaptureForm
                      resourceName={resource.title}
                      onSuccess={handleFormSuccess}
                    />
                  </div>
                ) : resource.requiresLeadCapture && hasAccess ? (
                  <div className="bg-white p-xl rounded-xl shadow-sm border border-border text-center">
                    <h2 className="text-2xl font-bold text-primary mb-md">
                      Ready to Download
                    </h2>
                    <p className="text-text-light mb-lg">
                      You have access to this resource. Click the button below to download.
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        if (resource.downloadUrl && resource.fileName) {
                          downloadFile(resource.downloadUrl, resource.fileName)
                        }
                      }}
                      className="btn btn--primary w-full"
                    >
                      Download Now
                    </button>
                  </div>
                ) : resource.category === 'calculator' ? (
                  <div className="bg-white p-xl rounded-xl shadow-sm border border-border text-center">
                    <Link 
                      to={resource.slug === 'canadian-personal-income-tax-calculator' 
                        ? '/resources/canadian-personal-income-tax-calculator'
                        : resource.slug === 'cash-flow-calculator'
                        ? '/resources/cash-flow-calculator'
                        : `/resources/${resource.slug}`} 
                      className="btn btn--primary inline-block"
                    >
                      Use Calculator
                    </Link>
                  </div>
                ) : resource.downloadUrl ? (
                  <div className="bg-white p-xl rounded-xl shadow-sm border border-border text-center">
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
                      Download Now
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits/Features Section (if not already shown above) */}
        {resource.features && resource.features.length > 0 && resource.benefits && resource.benefits.length > 0 && (
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
