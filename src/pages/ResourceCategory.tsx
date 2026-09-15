import { FC } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEO from '../components/SEO'
import ResourceCard from '../components/ResourceCard'
import MarketingPageHero from '../components/MarketingPageHero'
import { getResourceCategoryBySlug } from '../lib/resources/data'
import { getResourcesByCategory, ResourceDetail } from '../lib/resources/resources'
import CalendlyButton from '../components/CalendlyButton'

const ResourceCategory: FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const category = slug ? getResourceCategoryBySlug(slug) : null

  if (!category) {
    return (
      <>
        <SEO
          title="Resource Not Found - Axiom"
          description="The requested resource category could not be found."
          canonical="/resources"
        />
        <main className="svc-landing">
          <section className="closing">
            <div className="wrap">
              <h2>Resource not found</h2>
              <p className="lede">The resource category you&apos;re looking for doesn&apos;t exist.</p>
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

  const getCategoryType = (categorySlug: string): 'calculator' | 'excel-template' | 'publication' | null => {
    switch (categorySlug) {
      case 'online-calculators':
        return 'calculator'
      case 'excel-templates':
        return 'excel-template'
      case 'publications':
        return 'publication'
      default:
        return null
    }
  }

  const categoryType = getCategoryType(category.slug)
  const resources = categoryType ? getResourcesByCategory(categoryType) : []
  const orderedResources = categoryType === 'calculator'
    ? [
      'canadian-personal-income-tax-calculator',
      'cash-flow-calculator',
      'cash-flow-statement-direct-method',
      'donation-credit-optimizer',
      'ccpc-salary-dividend-calculator',
      'aro-recalculation',
    ]
      .map((slugValue) => resources.find((resource) => resource.slug === slugValue))
      .filter((resource): resource is ResourceDetail => Boolean(resource))
      .concat(resources.filter((resource) => ![
        'canadian-personal-income-tax-calculator',
        'cash-flow-calculator',
        'cash-flow-statement-direct-method',
        'donation-credit-optimizer',
        'ccpc-salary-dividend-calculator',
        'aro-recalculation',
      ].includes(resource.slug)))
    : resources

  return (
    <>
      <SEO
        title={`${category.title} - Axiom`}
        description={category.metaDescription}
        canonical={`/resources/category/${category.slug}`}
        keywords={[category.slug, 'resources', 'tools', 'Ottawa', 'Canada']}
      />
      <main>
        <MarketingPageHero
          eyebrow="Resources"
          title={category.title}
          lede={category.description}
          primary={(
            <Link to="/resources" className="btn btn-primary">
              All resources
            </Link>
          )}
          secondary={(
            <CalendlyButton text="Book a 30-minute call" className="btn btn-ghost" />
          )}
          strip={['Free tools', 'CPA-built', 'Ottawa / Canada']}
        />

        <div className="svc-landing">
          <section className="alt" id="catalog">
            <div className="wrap">
              {orderedResources.length > 0 ? (
                <>
                  <p className="eyebrow">In this category</p>
                  <h2>Browse {category.title.toLowerCase()}</h2>
                  <div className="service-grid">
                    {orderedResources.map((resource: ResourceDetail) => (
                      <ResourceCard key={resource.slug} resource={resource} />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h2>Coming soon</h2>
                  <p className="intro">More {category.title.toLowerCase()} are on the way.</p>
                  <div className="cta-row">
                    <Link to="/resources" className="btn btn-solid">
                      View all resources
                    </Link>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="closing" id="closing">
            <div className="wrap">
              <h2>Need help applying these tools?</h2>
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

export default ResourceCategory
