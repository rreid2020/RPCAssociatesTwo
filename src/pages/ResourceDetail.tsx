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
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-12">
              <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-semibold uppercase tracking-wider rounded-full mb-4">
                {resource.categoryLabel}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-4">
                {resource.title}
              </h1>
              {resource.fileSize && (
                <p className="text-sm text-text-light">
                  File size: {resource.fileSize}
                </p>
              )}
            </div>
            
            {/* Main Content Grid - Mobile First */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-12 items-start">
              {/* Left Column - Content */}
              <div className="order-2 lg:order-1">
                {/* Main Description */}
                <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm border border-gray-200 mb-6">
                  <div className="prose prose-lg max-w-none">
                    <div className="text-base sm:text-lg text-text-light leading-relaxed whitespace-pre-line">
                      {resource.longDescription}
                    </div>
                  </div>
                </div>

                {/* Benefits Section */}
                {resource.benefits && resource.benefits.length > 0 && (
                  <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm border border-gray-200 mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">
                      What You'll Get
                    </h2>
                    <ul className="space-y-3 sm:space-y-4">
                      {resource.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="w-5 h-5 sm:w-6 sm:h-6 text-primary mr-3 mt-0.5 flex-shrink-0"
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
                          <span className="text-sm sm:text-base text-text-light leading-relaxed">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Features Section */}
                {resource.features && resource.features.length > 0 && (
                  <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">
                      What's Included
                    </h2>
                    <ul className="space-y-3 sm:space-y-4">
                      {resource.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="w-5 h-5 sm:w-6 sm:h-6 text-primary mr-3 mt-0.5 flex-shrink-0"
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
                          <span className="text-sm sm:text-base text-text-light leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right Column - Form or Download */}
              <div className="order-1 lg:order-2 lg:sticky lg:top-8">
                {resource.requiresLeadCapture && !hasAccess ? (
                  <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm border border-gray-200">
                    <LeadCaptureForm
                      resourceName={resource.title}
                      onSuccess={handleFormSuccess}
                    />
                  </div>
                ) : resource.requiresLeadCapture && hasAccess ? (
                  <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm border border-gray-200 text-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4">
                      Ready to Download
                    </h2>
                    <p className="text-sm sm:text-base text-text-light mb-6">
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
                      className="w-full px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      Download Now
                    </button>
                  </div>
                ) : resource.category === 'calculator' ? (
                  <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm border border-gray-200 text-center">
                    <Link 
                      to={resource.slug === 'canadian-personal-income-tax-calculator' 
                        ? '/resources/canadian-personal-income-tax-calculator'
                        : resource.slug === 'cash-flow-calculator'
                        ? '/resources/cash-flow-calculator'
                        : `/resources/${resource.slug}`} 
                      className="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      Use Calculator
                    </Link>
                  </div>
                ) : resource.downloadUrl ? (
                  <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm border border-gray-200 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        if (resource.downloadUrl && resource.fileName) {
                          downloadFile(resource.downloadUrl, resource.fileName)
                        }
                      }}
                      className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      Download Now
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

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
