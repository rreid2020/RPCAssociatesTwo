import { FC, useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { getResourceBySlug } from '../lib/resources/resources'
import LeadCaptureForm from '../components/LeadCaptureForm'
import { hasAccessedResource, markResourceAsAccessed } from '../lib/utils/leadCapture'
import { downloadFile } from '../lib/utils/download'
import CalendlyButton from '../components/CalendlyButton'
import FormattedText from '../components/FormattedText'

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
        {/* Full-Width Title Section */}
        <section className="w-full bg-gradient-to-br from-primary/10 via-background to-primary/5 py-8 sm:py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="inline-block px-4 py-2 bg-primary text-white text-xs sm:text-sm font-semibold uppercase tracking-wider rounded-full mb-4 sm:mb-6">
                {resource.categoryLabel}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-primary mb-4 sm:mb-6">
                {resource.title}
              </h1>
              {resource.fileSize && (
                <p className="text-sm sm:text-base text-text-light">
                  File size: {resource.fileSize}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Full-Width Intro Sections - 3 Columns */}
        <section className="py-8 sm:py-12 lg:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {(() => {
              // Split content into three sections
              const splitPoint = resource.longDescription.indexOf('**The Three Core Sections of a Cash Flow Statement**')
              const introContent = splitPoint > 0 
                ? resource.longDescription.substring(0, splitPoint).trim()
                : resource.longDescription
              
              // Split into three sections
              const whyCashFlowIndex = introContent.indexOf('**Why Cash Flow Matters**')
              const whatTemplateIndex = introContent.indexOf('**What This Template Is Designed to Do**')
              
              const introSection = whyCashFlowIndex > 0 
                ? introContent.substring(0, whyCashFlowIndex).trim()
                : introContent
              
              const whyCashFlowSection = whyCashFlowIndex > 0 && whatTemplateIndex > 0
                ? introContent.substring(whyCashFlowIndex, whatTemplateIndex).trim()
                : whyCashFlowIndex > 0
                ? introContent.substring(whyCashFlowIndex).trim()
                : ''
              
              const whatTemplateSection = whatTemplateIndex > 0
                ? introContent.substring(whatTemplateIndex).trim()
                : ''
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                  {/* Column 1 - Intro */}
                  <div>
                    <FormattedText 
                      text={introSection}
                      className="max-w-none"
                    />
                  </div>
                  
                  {/* Column 2 - Why Cash Flow Matters */}
                  {whyCashFlowSection && (
                    <div>
                      <FormattedText 
                        text={whyCashFlowSection}
                        className="max-w-none"
                      />
                    </div>
                  )}
                  
                  {/* Column 3 - What This Template Is Designed to Do */}
                  {whatTemplateSection && (
                    <div>
                      <FormattedText 
                        text={whatTemplateSection}
                        className="max-w-none"
                      />
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </section>

        {/* Main Content Section - Form Left, Content Right */}
        <section className="py-8 sm:py-12 lg:py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-12 xl:gap-16 items-start">
              {/* Left Column - Form or Download */}
              <div className="order-1 lg:sticky lg:top-8 lg:self-start">
                {resource.requiresLeadCapture && !hasAccess ? (
                  <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-lg border border-gray-200">
                    <LeadCaptureForm
                      resourceName={resource.title}
                      onSuccess={handleFormSuccess}
                    />
                  </div>
                ) : resource.requiresLeadCapture && hasAccess ? (
                  <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-lg border border-gray-200 text-center">
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
                  <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-lg border border-gray-200 text-center">
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
                  <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-lg border border-gray-200 text-center">
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

              {/* Right Column - Remaining Content (Starting with The Three Core Sections) */}
              <div className="order-2">
                {(() => {
                  // Get content starting from "The Three Core Sections"
                  const splitPoint = resource.longDescription.indexOf('**The Three Core Sections of a Cash Flow Statement**')
                  const remainingContent = splitPoint > 0 
                    ? resource.longDescription.substring(splitPoint).trim()
                    : ''
                  
                  return remainingContent ? (
                    <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm border border-gray-200">
                      <FormattedText 
                        text={remainingContent}
                        className="max-w-none"
                      />
                    </div>
                  ) : null
                })()}
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
