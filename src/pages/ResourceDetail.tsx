import { FC, useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { getResourceBySlug } from '../lib/resources/resources'
import LeadCaptureForm from '../components/LeadCaptureForm'
import { hasAccessedResource, markResourceAsAccessed } from '../lib/utils/leadCapture'
import { downloadFile } from '../lib/utils/download'
import CalendlyButton from '../components/CalendlyButton'
import FormattedText from '../components/FormattedText'
import MarketingPageHero from '../components/MarketingPageHero'
import ExternalRedirect from './ExternalRedirect'

const ResourceDetail: FC = () => {
  const { slug: slugParam } = useParams<{ slug: string }>()
  const location = useLocation()

  const slug = slugParam || location.pathname.replace('/resources/', '')
  const resource = slug ? getResourceBySlug(slug) : null

  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    if (resource && resource.requiresLeadCapture && (resource.downloadUrl || resource.downloads?.length)) {
      setHasAccess(hasAccessedResource(resource.title))
    } else {
      setHasAccess(true)
    }
  }, [resource])

  const handleFormSuccess = () => {
    if (resource) {
      markResourceAsAccessed(resource.title)
      setHasAccess(true)
      if (!resource.downloads?.length && resource.downloadUrl && resource.fileName) {
        downloadFile(resource.downloadUrl, resource.fileName)
      }
    }
  }

  if (!resource) {
    return (
      <>
        <SEO
          title="Resource Not Found - Axiom"
          description="The requested resource could not be found."
          canonical="/resources"
        />
        <main className="svc-landing">
          <section className="closing">
            <div className="wrap">
              <h2>Resource not found</h2>
              <p className="lede">The resource you&apos;re looking for doesn&apos;t exist.</p>
              <div className="cta-row">
                <Link to="/resources" className="btn btn-solid">
                  View all resources
                </Link>
              </div>
            </div>
          </section>
        </main>
      </>
    )
  }

  if (resource.externalUrl) {
    return <ExternalRedirect to={resource.externalUrl} />
  }

  const description = resource.longDescription
  const introEnd = description.indexOf('Inside the guide')
  const intro = introEnd > 0
    ? description.substring(0, introEnd).trim()
    : description.split('\n\n')[0].trim()
  const bulletMatch = description.match(/•\s+([^\n]+)/g)
  const bullets = bulletMatch ? bulletMatch.map((b) => b.replace(/^•\s+/, '').trim()) : []
  const closingStart = description.indexOf('Each ratio')
  const copyrightStart = description.indexOf('**Copyright & Attribution**')
  const closing = closingStart > 0 && copyrightStart > closingStart
    ? description.substring(closingStart, copyrightStart).trim()
    : closingStart > 0
      ? description.substring(closingStart).trim()
      : ''
  const copyright = copyrightStart > 0
    ? description.substring(copyrightStart).trim()
    : ''

  const calculatorHref = resource.category === 'calculator'
    ? resource.slug === 'canadian-personal-income-tax-calculator'
      ? '/resources/canadian-personal-income-tax-calculator'
      : resource.slug === 'cash-flow-calculator'
        ? '/resources/cash-flow-calculator'
        : `/resources/${resource.slug}`
    : null

  return (
    <>
      <SEO
        title={`${resource.title} - Axiom`}
        description={resource.metaDescription}
        canonical={`/resources/${resource.slug}`}
        keywords={resource.keywords}
      />
      <main>
        <MarketingPageHero
          eyebrow={resource.categoryLabel}
          title={resource.title}
          lede={resource.shortDescription}
          primary={
            resource.requiresLeadCapture && !hasAccess ? (
              <a href="#access" className="btn btn-primary">
                Get access
              </a>
            ) : calculatorHref ? (
              <Link to={calculatorHref} className="btn btn-primary">
                Use calculator
              </Link>
            ) : resource.downloadUrl ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={(e) => {
                  e.preventDefault()
                  if (resource.downloadUrl && resource.fileName) {
                    downloadFile(resource.downloadUrl, resource.fileName)
                  }
                }}
              >
                Download now
              </button>
            ) : (
              <Link to="/resources" className="btn btn-primary">
                All resources
              </Link>
            )
          }
          secondary={(
            <CalendlyButton text="Book a 30-minute call" className="btn btn-ghost" />
          )}
          strip={[
            resource.categoryLabel,
            ...(resource.fileSize ? [`File size: ${resource.fileSize}`] : []),
          ]}
        />

        <div className="svc-landing">
          <section className="alt" id="access">
            <div className="wrap">
              <div className="detail-grid">
                <article>
                  {resource.requiresLeadCapture && !hasAccess ? (
                    <>
                      <p className="eyebrow">{resource.categoryLabel}</p>
                      <h3>Get free access</h3>
                      <p>Enter your details to unlock this resource.</p>
                      <LeadCaptureForm
                        resourceName={resource.title}
                        onSuccess={handleFormSuccess}
                      />
                    </>
                  ) : resource.requiresLeadCapture && hasAccess ? (
                    <>
                      <p className="eyebrow">Ready</p>
                      <h3>Ready to download</h3>
                      {resource.downloads && resource.downloads.length > 0 ? (
                        <>
                          <p>You have access to this pack. Download the files you need:</p>
                          <div className="cta-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            {resource.downloads.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                className="btn btn-solid"
                                onClick={(e) => {
                                  e.preventDefault()
                                  downloadFile(item.downloadUrl, item.fileName)
                                }}
                              >
                                Download {item.label}
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <p>You have access to this resource.</p>
                          <div className="cta-row">
                            <button
                              type="button"
                              className="btn btn-solid"
                              onClick={(e) => {
                                e.preventDefault()
                                if (resource.downloadUrl && resource.fileName) {
                                  downloadFile(resource.downloadUrl, resource.fileName)
                                }
                              }}
                            >
                              Download now
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  ) : calculatorHref ? (
                    <>
                      <p className="eyebrow">Calculator</p>
                      <h3>Open the tool</h3>
                      <p>Run the calculator with your own numbers.</p>
                      <div className="cta-row">
                        <Link to={calculatorHref} className="btn btn-solid">
                          Use calculator
                        </Link>
                      </div>
                    </>
                  ) : resource.downloadUrl ? (
                    <>
                      <p className="eyebrow">Download</p>
                      <h3>Get the file</h3>
                      <p>Download this resource to your device.</p>
                      <div className="cta-row">
                        <button
                          type="button"
                          className="btn btn-solid"
                          onClick={(e) => {
                            e.preventDefault()
                            if (resource.downloadUrl && resource.fileName) {
                              downloadFile(resource.downloadUrl, resource.fileName)
                            }
                          }}
                        >
                          Download now
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="eyebrow">{resource.categoryLabel}</p>
                      <h3>{resource.title}</h3>
                      <p>{resource.shortDescription}</p>
                    </>
                  )}
                </article>

                <article>
                  <p className="eyebrow">About this resource</p>
                  <h2>{resource.title}</h2>
                  <p className="intro">{intro}</p>

                  {bullets.length > 0 ? (
                    <>
                      <h3>Inside the guide, you&apos;ll learn:</h3>
                      <ul className="checklist">
                        {bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}

                  {closing
                    ? closing.split('\n\n').map((paragraph) => (
                      paragraph.trim() ? (
                        <p key={paragraph.slice(0, 24)} className="intro">{paragraph.trim()}</p>
                      ) : null
                    ))
                    : null}

                  {resource.benefits && resource.benefits.length > 0 ? (
                    <>
                      <h3>What you&apos;ll get</h3>
                      <ul className="checklist">
                        {resource.benefits.slice(0, 4).map((benefit) => (
                          <li key={benefit}>{benefit}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}

                  {copyright ? (
                    <FormattedText text={copyright} className="max-w-none mt-lg" />
                  ) : null}
                </article>
              </div>
            </div>
          </section>

          <section className="closing" id="closing">
            <div className="wrap">
              <h2>Need help with your finances?</h2>
              <p className="lede">
                Our team can help you make the most of these resources and provide personalized
                guidance for your situation.
              </p>
              <div className="cta-row">
                <CalendlyButton text="Book a 30-minute call" className="btn btn-solid" />
                <Link to="/resources" className="btn btn-outline">
                  Back to resources
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default ResourceDetail
