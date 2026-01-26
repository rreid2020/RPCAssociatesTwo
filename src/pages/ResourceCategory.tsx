import { FC } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { getResourceCategoryBySlug } from '../lib/resources/data'
import CalendlyButton from '../components/CalendlyButton'
import { SPACES_FILES } from '../lib/config/spaces'
import { downloadFile } from '../lib/utils/download'

interface CategoryResource {
  title: string
  description: string
  link: string
  category?: string
  isDownload?: boolean
  fileSize?: string
}

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
            <h1 className="text-4xl font-bold text-primary mb-md">Resource Not Found</h1>
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

  // Define resources for each category
  const getResourcesForCategory = (categorySlug: string): CategoryResource[] => {
    switch (categorySlug) {
      case 'online-calculators':
        return [
          {
            title: 'Canadian Personal Income Tax Calculator',
            description: 'Calculate your estimated Canadian income tax for 2025. Get a detailed breakdown including federal and provincial taxes, credits, and deductions.',
            link: '/resources/canadian-personal-income-tax-calculator',
            category: 'Calculator'
          }
        ]
      case 'excel-templates':
        return [
          {
            title: 'Cash Flow Statement Template',
            description: 'Track cash inflows and outflows with this comprehensive Excel template. Monitor liquidity, plan for major expenditures, and make informed financial decisions.',
            link: '/resources/cash-flow-statement-template',
            category: 'Excel Template'
          }
        ]
      case 'publications':
        return [
          {
            title: 'CFI Financial Ratios Guide',
            description: 'Comprehensive guide covering key financial ratios, their calculations, and how to interpret them for business analysis and decision-making.',
            link: SPACES_FILES.financialRatiosGuide,
            category: 'Guide',
            isDownload: true,
            fileSize: '44.6 MB'
          }
        ]
      default:
        return []
    }
  }

  const resources = getResourcesForCategory(category.slug)

  return (
    <>
      <SEO
        title={`${category.title} - RPC Associates`}
        description={category.metaDescription}
        canonical={`/resources/${category.slug}`}
        keywords={[category.slug, 'resources', 'tools', 'Ottawa', 'Canada']}
      />
      <main>
        <section className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="text-center mb-xl max-w-[800px] mx-auto">
              <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-md">{category.title}</h1>
              <p className="text-lg text-text-light leading-relaxed">
                {category.description}
              </p>
            </div>

            {resources.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg mb-xxl">
                  {resources.map((resource, index) => {
                    const isExternalDownload = resource.isDownload && resource.link.startsWith('http')
                    const cardContent = (
                      <>
                        {resource.category && (
                          <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-semibold uppercase tracking-wider rounded-full mb-md">
                            {resource.category}
                          </span>
                        )}
                        <h3 className="text-xl font-semibold text-primary mb-sm">
                          {resource.title}
                        </h3>
                        <p className="text-text-light text-[0.9375rem] leading-relaxed mb-sm">
                          {resource.description}
                        </p>
                        {resource.fileSize && (
                          <p className="text-sm text-text-light m-0">
                            File size: {resource.fileSize}
                          </p>
                        )}
                      </>
                    )
                    
                    return isExternalDownload ? (
                      <button
                        key={index}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          const filename = resource.link.split('/').pop() || resource.title
                          downloadFile(resource.link, filename)
                        }}
                        className="bg-white p-lg rounded-xl shadow-sm border border-border transition-all hover:shadow-md hover:-translate-y-1 block w-full text-left no-underline text-inherit cursor-pointer"
                      >
                        {cardContent}
                      </button>
                    ) : (
                      <Link
                        key={index}
                        to={resource.link}
                        className="bg-white p-lg rounded-xl shadow-sm border border-border transition-all hover:shadow-md hover:-translate-y-1 block no-underline text-inherit"
                      >
                        {cardContent}
                      </Link>
                    )
                  })}
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
                  <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-md">
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
