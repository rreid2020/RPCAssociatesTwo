import { FC } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEO from '../components/SEO'
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
          title="Resource Not Found - RPC Associates"
          description="The requested resource category could not be found."
          canonical="/resources"
        />
        <main className="py-xxl min-h-[60vh]">
          <div className="max-w-[1200px] mx-auto px-md text-center">
            <h1 className="text-4xl font-bold text-primary-dark mb-md">Resource Not Found</h1>
            <p className="text-lg text-text-light mb-lg">
              The resource category you're looking for doesn't exist.
            </p>
            <Link to="/resources" className="btn btn--primary">
              View All Resources
            </Link>
          </div>
        </main>
      </>
    )
  }

  // Map category slugs to resource categories
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
      ]
        .map((slugValue) => resources.find((resource) => resource.slug === slugValue))
        .filter((resource): resource is ResourceDetail => Boolean(resource))
        .concat(resources.filter((resource) => ![
          'canadian-personal-income-tax-calculator',
          'cash-flow-calculator',
          'cash-flow-statement-direct-method',
        ].includes(resource.slug)))
    : resources

  return (
    <>
      <SEO
        title={`${category.title} - RPC Associates`}
        description={category.metaDescription}
        canonical={`/resources/category/${category.slug}`}
        keywords={[category.slug, 'resources', 'tools', 'Ottawa', 'Canada']}
      />
      <main>
        <section className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="text-center mb-xl max-w-[800px] mx-auto">
              <h1 className="text-3xl lg:text-4xl font-bold text-primary-dark mb-md">{category.title}</h1>
              <p className="text-lg text-text-light leading-relaxed">
                {category.description}
              </p>
            </div>

            {orderedResources.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg mb-xxl">
                  {orderedResources.map((resource: ResourceDetail, index: number) => (
                    <Link
                      key={index}
                      to={`/resources/${resource.slug}`}
                      className="bg-white p-lg rounded-xl shadow-sm border border-border transition-all hover:shadow-md hover:-translate-y-1 block no-underline text-inherit"
                    >
                      <span className="inline-block px-3 py-1 bg-accent text-white text-xs font-semibold uppercase tracking-wider rounded-full mb-md">
                        {resource.categoryLabel}
                      </span>
                      <h3 className="text-xl font-semibold text-primary-dark mb-sm">
                        {resource.title}
                      </h3>
                      <p className="text-text-light text-[0.9375rem] leading-relaxed mb-sm">
                        {resource.shortDescription}
                      </p>
                      {resource.fileSize && (
                        <p className="text-sm text-text-light m-0">
                          File size: {resource.fileSize}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
                <div className="text-center mb-xxl">
                  <Link to="/resources" className="text-primary hover:text-primary-dark underline">
                    View All Resources
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-xl mb-xxl">
                <p className="text-lg text-text-light mb-lg">
                  More {category.title.toLowerCase()} coming soon.
                </p>
                <Link to="/resources" className="text-primary hover:text-primary-dark underline">
                  View All Resources
                </Link>
              </div>
            )}

            {/* CTA Section */}
            <section className="py-xxl bg-background">
              <div className="max-w-[900px] mx-auto px-md text-center">
                <div className="bg-white p-xl rounded-xl shadow-sm border border-border">
                  <h2 className="text-3xl lg:text-4xl font-bold text-primary-dark mb-md">
                    Need Help with Your Finances?
                  </h2>
                  <p className="text-lg text-text-light mb-lg max-w-2xl mx-auto">
                    Our team of experienced accountants and consultants can help you make the most of these resources and provide personalized guidance for your situation.
                  </p>
                  <CalendlyButton className="btn btn--primary text-center w-full md:w-auto" />
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>
    </>
  )
}

export default ResourceCategory
