import { FC, useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { getResourceBySlug } from '../lib/resources/resources'
import LeadCaptureForm from '../components/LeadCaptureForm'
import { hasAccessedResource, markResourceAsAccessed } from '../lib/utils/leadCapture'
import { downloadFile } from '../lib/utils/download'
import CalendlyButton from '../components/CalendlyButton'
import FormattedText from '../components/FormattedText'

/**
 * Helper function to find all major headings (marked with **) in content
 */
const findHeadings = (content: string): Array<{ index: number; text: string }> => {
  const headings: Array<{ index: number; text: string }> = []
  const regex = /\*\*([^*]+)\*\*/g
  let match
  
  while ((match = regex.exec(content)) !== null) {
    // Check if it's a standalone heading (not inline bold)
    const beforeMatch = content.substring(Math.max(0, match.index - 2), match.index)
    const afterMatch = content.substring(match.index + match[0].length, match.index + match[0].length + 2)
    
    // If it's on its own line or followed by a newline, it's likely a heading
    if (beforeMatch === '\n\n' || beforeMatch === '\n' || match.index === 0 || afterMatch === '\n\n' || afterMatch === '\n') {
      headings.push({
        index: match.index,
        text: match[1]
      })
    }
  }
  
  return headings
}

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
        {/* Main Content Section - Form Left, Content Right */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-start">
              {/* Left Column - Form Card (Dark Style) */}
              <div className="order-2 lg:order-1">
                {resource.requiresLeadCapture && !hasAccess ? (
                  <div className="relative bg-gradient-to-br from-primary/90 to-primary rounded-2xl shadow-2xl p-8 sm:p-10 lg:p-12 overflow-hidden">
                    {/* Background overlay pattern */}
                    <div className="absolute inset-0 bg-primary/10 opacity-20"></div>
                    <div className="relative z-10">
                      <div className="mb-6">
                        <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-semibold uppercase tracking-wider rounded-full mb-4">
                          {resource.categoryLabel}
                        </span>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                          {resource.title}
                        </h1>
                        {resource.fileSize && (
                          <p className="text-sm text-white/80">
                            File size: {resource.fileSize}
                          </p>
                        )}
                      </div>
                      <LeadCaptureForm
                        resourceName={resource.title}
                        onSuccess={handleFormSuccess}
                      />
                    </div>
                  </div>
                ) : resource.requiresLeadCapture && hasAccess ? (
                  <div className="relative bg-gradient-to-br from-primary/90 to-primary rounded-2xl shadow-2xl p-8 sm:p-10 lg:p-12 overflow-hidden text-center">
                    <div className="absolute inset-0 bg-primary/10 opacity-20"></div>
                    <div className="relative z-10">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                        Ready to Download
                      </h2>
                      <p className="text-base text-white/90 mb-8">
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
                        className="w-full px-6 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors shadow-lg"
                      >
                        Download Now
                      </button>
                    </div>
                  </div>
                ) : resource.category === 'calculator' ? (
                  <div className="relative bg-gradient-to-br from-primary/90 to-primary rounded-2xl shadow-2xl p-8 sm:p-10 lg:p-12 overflow-hidden text-center">
                    <div className="absolute inset-0 bg-primary/10 opacity-20"></div>
                    <div className="relative z-10">
                      <Link 
                        to={resource.slug === 'canadian-personal-income-tax-calculator' 
                          ? '/resources/canadian-personal-income-tax-calculator'
                          : resource.slug === 'cash-flow-calculator'
                          ? '/resources/cash-flow-calculator'
                          : `/resources/${resource.slug}`} 
                        className="inline-block px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors shadow-lg"
                      >
                        Use Calculator
                      </Link>
                    </div>
                  </div>
                ) : resource.downloadUrl ? (
                  <div className="relative bg-gradient-to-br from-primary/90 to-primary rounded-2xl shadow-2xl p-8 sm:p-10 lg:p-12 overflow-hidden text-center">
                    <div className="absolute inset-0 bg-primary/10 opacity-20"></div>
                    <div className="relative z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          if (resource.downloadUrl && resource.fileName) {
                            downloadFile(resource.downloadUrl, resource.fileName)
                          }
                        }}
                        className="px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors shadow-lg"
                      >
                        Download Now
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Right Column - Summarized Content */}
              <div className="order-1 lg:order-2">
                <div className="space-y-8">
                  {/* Category Label */}
                  <div>
                    <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                      {resource.categoryLabel}
                    </span>
                  </div>
                  
                  {/* Main Heading */}
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                    {resource.title}
                  </h1>
                  
                  {/* Short Description */}
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {resource.shortDescription}
                  </p>
                  
                  {/* Key Points Summary */}
                  {(() => {
                    // Extract key points from longDescription - get first paragraph and first few bullet points
                    const description = resource.longDescription
                    const firstParagraphEnd = description.indexOf('\n\n')
                    const firstParagraph = firstParagraphEnd > 0 
                      ? description.substring(0, firstParagraphEnd).trim()
                      : description.substring(0, 300).trim() + '...'
                    
                    // Get bullet points if available
                    const bulletMatch = description.match(/•\s+([^\n]+)/g)
                    const bullets = bulletMatch ? bulletMatch.slice(0, 4).map(b => b.replace(/^•\s+/, '')) : []
                    
                    return (
                      <div className="space-y-6">
                        <p className="text-base text-gray-700 leading-relaxed">
                          {firstParagraph}
                        </p>
                        
                        {bullets.length > 0 && (
                          <ul className="space-y-3">
                            {bullets.map((bullet, index) => (
                              <li key={index} className="flex items-start">
                                <svg className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-base text-gray-700">{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )
                  })()}
                  
                  {/* Benefits Section */}
                  {resource.benefits && resource.benefits.length > 0 && (
                    <div className="pt-6 border-t border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        What You'll Get
                      </h2>
                      <ul className="space-y-3">
                        {resource.benefits.slice(0, 4).map((benefit, index) => (
                          <li key={index} className="flex items-start">
                            <svg className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-base text-gray-700">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* File Size if available */}
                  {resource.fileSize && (
                    <div className="pt-6 border-t border-gray-200">
                      <p className="text-sm text-gray-500">
                        File size: {resource.fileSize}
                      </p>
                    </div>
                  )}
                </div>
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
