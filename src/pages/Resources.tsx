import { FC } from 'react'
import SEO from '../components/SEO'
import ResourceCard from '../components/ResourceCard'
import { getResourcesByCategory } from '../lib/resources/resources'

const Resources: FC = () => {
  const calculators = getResourcesByCategory('calculator')
  const excelTemplates = getResourcesByCategory('excel-template')
  const publications = getResourcesByCategory('publication')

  return (
    <>
      <SEO
        title="Free Accounting Calculators, Templates & Guides"
        description="Free Canadian tax calculators, cash-flow tools, Excel templates, and ARO resources from Axiom in Ottawa."
        canonical="/resources"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Resources', path: '/resources' },
        ]}
        keywords={['resources', 'tax calculator', 'tools', 'guides', 'Ottawa', 'Canada']}
      />
      <main>
        <section className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="text-center mb-xl max-w-[800px] mx-auto">
              <h1 className="text-3xl lg:text-4xl font-semibold text-primary mb-md">Resources</h1>
              <p className="text-lg text-text-body leading-relaxed">
                Helpful resources, tools, and guides to support your business and personal financial planning. Access calculators, templates, and expert insights to make informed decisions.
              </p>
            </div>
            
            {/* Online Calculator and Tools Section */}
            <div className="mb-xxl">
              <h2 className="text-2xl lg:text-3xl font-semibold text-primary mb-lg">
                Online Calculator and Tools
              </h2>
              {calculators.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                  {calculators.map((resource) => (
                    <ResourceCard key={resource.slug} resource={resource} />
                  ))}
                </div>
              ) : (
                <p className="text-text-light">More calculators and tools coming soon.</p>
              )}
            </div>

            {/* Excel Templates Section */}
            <div className="mb-xxl">
              <h2 className="text-2xl lg:text-3xl font-semibold text-primary mb-lg">
                Excel Templates
              </h2>
              {excelTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                  {excelTemplates.map((resource) => (
                    <ResourceCard key={resource.slug} resource={resource} />
                  ))}
                </div>
              ) : (
                <p className="text-text-light">More Excel templates coming soon.</p>
              )}
            </div>

            {/* Publications Section */}
            <div className="mb-xxl">
              <h2 className="text-2xl lg:text-3xl font-semibold text-primary mb-lg">
                Publications
              </h2>
              {publications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                  {publications.map((resource) => (
                    <ResourceCard key={resource.slug} resource={resource} />
                  ))}
                </div>
              ) : (
                <p className="text-text-light">More publications coming soon.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default Resources
