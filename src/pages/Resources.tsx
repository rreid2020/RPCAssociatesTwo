import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { SPACES_FILES } from '../lib/config/spaces'
import { downloadFile } from '../lib/utils/download'

interface Resource {
  title: string
  description: string
  link: string
  category?: string
  isDownload?: boolean
  fileSize?: string
}

const Resources: FC = () => {
  const calculators: Resource[] = [
    {
      title: 'Canadian Personal Income Tax Calculator',
      description: 'Calculate your estimated Canadian income tax for 2025. Get a detailed breakdown including federal and provincial taxes, credits, and deductions.',
      link: '/resources/canadian-personal-income-tax-calculator',
      category: 'Calculator'
    },
    {
      title: 'Cash Flow Calculator',
      description: 'Calculate your business cash flow by tracking operating, investing, and financing activities. Understand your cash position and liquidity.',
      link: '/resources/cash-flow-calculator',
      category: 'Calculator'
    }
  ]

  const excelTemplates: Resource[] = [
    {
      title: 'Cash Flow Statement Template',
      description: 'Track cash inflows and outflows with this comprehensive Excel template. Monitor liquidity, plan for major expenditures, and make informed financial decisions.',
      link: '/resources/cash-flow-statement-template',
      category: 'Excel Template'
    }
  ]

  const guides: Resource[] = [
    {
      title: 'CFI Financial Ratios Guide',
      description: 'Comprehensive guide covering key financial ratios, their calculations, and how to interpret them for business analysis and decision-making.',
      link: SPACES_FILES.financialRatiosGuide,
      category: 'Guide',
      isDownload: true,
      fileSize: '44.6 MB'
    }
  ]

  const renderResourceCard = (resource: Resource, index: number) => {
    return resource.isDownload ? (
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
      </button>
    ) : (
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
                  {calculators.map((resource, index) => renderResourceCard(resource, index))}
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
                  {excelTemplates.map((resource, index) => renderResourceCard(resource, index))}
                </div>
              ) : (
                <p className="text-text-light">More Excel templates coming soon.</p>
              )}
            </div>

            {/* Guides Section */}
            <div className="mb-xxl">
              <h2 className="text-2xl lg:text-3xl font-bold text-primary mb-lg">
                Guides
              </h2>
              {guides.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                  {guides.map((resource, index) => renderResourceCard(resource, index))}
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

