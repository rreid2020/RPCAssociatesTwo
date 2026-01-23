import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

interface Resource {
  title: string
  description: string
  link: string
  category?: string
}

const Resources: FC = () => {
  const resources: Resource[] = [
    {
      title: 'Canadian Personal Income Tax Calculator',
      description: 'Calculate your estimated Canadian income tax for 2025. Get a detailed breakdown including federal and provincial taxes, credits, and deductions.',
      link: '/resources/canadian-personal-income-tax-calculator',
      category: 'Calculator'
    }
  ]

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
            
            {resources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                {resources.map((resource, index) => (
                  <Link
                    key={index}
                    to={resource.link}
                    className="bg-white p-lg rounded-xl shadow-sm border border-border transition-all hover:shadow-md hover:-translate-y-1 block no-underline text-inherit"
                  >
                    {resource.category && (
                      <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-semibold uppercase tracking-wider rounded-full mb-md">
                        {resource.category}
                      </span>
                    )}
                    <h3 className="text-xl font-semibold text-primary mb-sm">
                      {resource.title}
                    </h3>
                    <p className="text-text-light text-[0.9375rem] leading-relaxed">
                      {resource.description}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-xl">
                <p className="text-text-light">Resources content coming soon.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}

export default Resources

