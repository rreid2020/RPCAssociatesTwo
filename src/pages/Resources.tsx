import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { getResourcesByCategory, ResourceDetail } from '../lib/resources/resources'

const Resources: FC = () => {
  const calculators = getResourcesByCategory('calculator')
  const excelTemplates = getResourcesByCategory('excel-template')
  const publications = getResourcesByCategory('publication')

  const renderResourceCard = (resource: ResourceDetail, index: number) => {
    return (
      <Link
        key={index}
        to={`/resources/${resource.slug}`}
        className="bg-white p-lg rounded-xl shadow-sm border border-border transition-all hover:shadow-md hover:-translate-y-1 block no-underline text-inherit"
      >
        <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-semibold uppercase tracking-wider rounded-full mb-md">
          {resource.categoryLabel}
        </span>
        <h3 className="text-xl font-semibold text-primary mb-sm">
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
    )
  }

  return (
    <>
      <SEO
        title="Resources - RPC Associates"
        description="Helpful resources, tools, and guides for your business from RPC Associates. Access calculators, templates, and expert insights."
        canonical="/resources"
        keywords={['resources', 'tax calculator', 'tools', 'guides', 'Ottawa', 'Canada']}
      />
      <main>
        <section className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="text-center mb-xl max-w-[800px] mx-auto">
              <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-md">Resources</h1>
              <p className="text-lg text-text-light leading-relaxed">
                Helpful resources, tools, and guides to support your business and personal financial planning. Access calculators, templates, and expert insights to make informed decisions.
              </p>
            </div>
            
            {/* Online Calculator and Tools Section */}
            <div className="mb-xxl">
              <h2 className="text-2xl lg:text-3xl font-bold text-primary mb-lg">
                Online Calculator and Tools
              </h2>
              {calculators.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                  {calculators.map((resource: ResourceDetail, index: number) => renderResourceCard(resource, index))}
                </div>
              ) : (
                <p className="text-text-light">More calculators and tools coming soon.</p>
              )}
            </div>

            {/* Excel Templates Section */}
            <div className="mb-xxl">
              <h2 className="text-2xl lg:text-3xl font-bold text-primary mb-lg">
                Excel Templates
              </h2>
              {excelTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                  {excelTemplates.map((resource: ResourceDetail, index: number) => renderResourceCard(resource, index))}
                </div>
              ) : (
                <p className="text-text-light">More Excel templates coming soon.</p>
              )}
            </div>

            {/* Publications Section */}
            <div className="mb-xxl">
              <h2 className="text-2xl lg:text-3xl font-bold text-primary mb-lg">
                Publications
              </h2>
              {publications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                  {publications.map((resource: ResourceDetail, index: number) => renderResourceCard(resource, index))}
                </div>
              ) : (
                <p className="text-text-light">Guides and resources coming soon.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default Resources
