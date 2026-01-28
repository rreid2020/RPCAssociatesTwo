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
              // Find where to split intro from main content (look for common patterns)
              const mainContentStarters = [
                'The Three Core Sections',
                'Core Sections',
                'Key Features',
                'Features',
                'How It Works',
                'Getting Started'
              ]
              
              let introEndIndex = resource.longDescription.length
              for (const starter of mainContentStarters) {
                const index = resource.longDescription.indexOf(`**${starter}`)
                if (index > 0) {
                  introEndIndex = index
                  break
                }
              }
              
              const introContent = resource.longDescription.substring(0, introEndIndex).trim()
              
              // Get first 3 headings from intro content
              const introHeadings = findHeadings(introContent).slice(0, 3)
              
              let section1 = introContent
              let section2 = ''
              let section3 = ''
              
              if (introHeadings.length >= 2) {
                // Split by first 2 headings
                section1 = introContent.substring(0, introHeadings[1].index).trim()
                if (introHeadings.length >= 3) {
                  section2 = introContent.substring(introHeadings[1].index, introHeadings[2].index).trim()
                  section3 = introContent.substring(introHeadings[2].index).trim()
                } else {
                  section2 = introContent.substring(introHeadings[1].index).trim()
                }
              } else if (introHeadings.length === 1) {
                // Split content roughly in half before and after the heading
                const headingIndex = introHeadings[0].index
                section1 = introContent.substring(0, headingIndex).trim()
                section2 = introContent.substring(headingIndex).trim()
              } else {
                // No headings found, split content into 3 roughly equal parts
                const third = Math.floor(introContent.length / 3)
                section1 = introContent.substring(0, third).trim()
                section2 = introContent.substring(third, third * 2).trim()
                section3 = introContent.substring(third * 2).trim()
              }
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                  {section1 && (
                    <div>
                      <FormattedText 
                        text={section1}
                        className="max-w-none"
                      />
                    </div>
                  )}
                  {section2 && (
                    <div>
                      <FormattedText 
                        text={section2}
                        className="max-w-none"
                      />
                    </div>
                  )}
                  {section3 && (
                    <div>
                      <FormattedText 
                        text={section3}
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

              {/* Right Column - Main Content Section */}
              <div className="order-2">
                {(() => {
                  // Find where intro ends and main content begins
                  const mainContentStarters = [
                    'The Three Core Sections',
                    'Core Sections',
                    'Key Features',
                    'Features',
                    'How It Works',
                    'Getting Started'
                  ]
                  
                  let mainContentStart = -1
                  let mainContentEnd = resource.longDescription.length
                  
                  for (const starter of mainContentStarters) {
                    const index = resource.longDescription.indexOf(`**${starter}`)
                    if (index > 0) {
                      mainContentStart = index
                      break
                    }
                  }
                  
                  // Find where bottom sections start
                  const bottomSectionStarters = [
                    'Practical Guidance',
                    'Common Use Cases',
                    'Important Note',
                    'Additional Information',
                    'Next Steps'
                  ]
                  
                  for (const starter of bottomSectionStarters) {
                    const index = resource.longDescription.indexOf(`**${starter}`)
                    if (index > mainContentStart) {
                      mainContentEnd = index
                      break
                    }
                  }
                  
                  const mainContent = mainContentStart > 0
                    ? resource.longDescription.substring(mainContentStart, mainContentEnd).trim()
                    : mainContentStart === -1
                    ? resource.longDescription.trim()
                    : ''
                  
                  return mainContent ? (
                    <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm border border-gray-200">
                      <FormattedText 
                        text={mainContent}
                        className="max-w-none"
                      />
                    </div>
                  ) : null
                })()}
              </div>
            </div>
          </div>
        </section>

        {/* Three Column Section - Bottom Sections */}
        <section className="py-8 sm:py-12 lg:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {(() => {
              // Find where main content ends and bottom sections begin
              const mainContentStarters = [
                'The Three Core Sections',
                'Core Sections',
                'Key Features',
                'Features',
                'How It Works',
                'Getting Started'
              ]
              
              let bottomContentStart = resource.longDescription.length
              
              for (const starter of mainContentStarters) {
                const index = resource.longDescription.indexOf(`**${starter}`)
                if (index > 0) {
                  // Find next section after main content
                  const remainingContent = resource.longDescription.substring(index)
                  const headings = findHeadings(remainingContent)
                  if (headings.length > 1) {
                    // Find the 4th heading (after main content section)
                    const bottomSectionStarters = [
                      'Practical Guidance',
                      'Common Use Cases',
                      'Important Note',
                      'Additional Information',
                      'Next Steps'
                    ]
                    
                    for (const bottomStarter of bottomSectionStarters) {
                      const bottomIndex = resource.longDescription.indexOf(`**${bottomStarter}`, index)
                      if (bottomIndex > index) {
                        bottomContentStart = bottomIndex
                        break
                      }
                    }
                  }
                  break
                }
              }
              
              // If no main content section found, check if there are at least 3 headings total
              if (bottomContentStart === resource.longDescription.length) {
                const allHeadings = findHeadings(resource.longDescription)
                if (allHeadings.length >= 4) {
                  bottomContentStart = allHeadings[3].index
                } else if (allHeadings.length >= 2) {
                  // Use last heading as start
                  bottomContentStart = allHeadings[allHeadings.length - 1].index
                } else {
                  // No bottom sections to show
                  return null
                }
              }
              
              const bottomContent = resource.longDescription.substring(bottomContentStart).trim()
              
              if (!bottomContent) return null
              
              // Split bottom content by headings
              const bottomHeadings = findHeadings(bottomContent)
              
              let section1 = ''
              let section2 = ''
              let section3 = ''
              
              if (bottomHeadings.length >= 3) {
                // Use first 3 sections
                section1 = bottomContent.substring(0, bottomHeadings[1].index).trim()
                section2 = bottomContent.substring(bottomHeadings[1].index, bottomHeadings[2].index).trim()
                section3 = bottomContent.substring(bottomHeadings[2].index).trim()
              } else if (bottomHeadings.length === 2) {
                section1 = bottomContent.substring(0, bottomHeadings[1].index).trim()
                section2 = bottomContent.substring(bottomHeadings[1].index).trim()
              } else if (bottomHeadings.length === 1) {
                section1 = bottomContent
              } else {
                // No headings, split roughly into 3 parts
                const third = Math.floor(bottomContent.length / 3)
                section1 = bottomContent.substring(0, third).trim()
                section2 = bottomContent.substring(third, third * 2).trim()
                section3 = bottomContent.substring(third * 2).trim()
              }
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                  {section1 && (
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200">
                      <FormattedText 
                        text={section1}
                        className="max-w-none"
                      />
                    </div>
                  )}
                  {section2 && (
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200">
                      <FormattedText 
                        text={section2}
                        className="max-w-none"
                      />
                    </div>
                  )}
                  {section3 && (
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200">
                      <FormattedText 
                        text={section3}
                        className="max-w-none"
                      />
                    </div>
                  )}
                </div>
              )
            })()}
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
