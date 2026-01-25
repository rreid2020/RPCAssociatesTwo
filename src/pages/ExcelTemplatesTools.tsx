import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

const ExcelTemplatesTools: FC = () => {
  return (
    <>
      <SEO
        title="Excel Templates and Tools - RPC Associates"
        description="Discover upcoming Excel templates and tools from RPC Associates designed to streamline reporting and cash flow tracking."
        canonical="/resources/excel-templates-tools"
        keywords={['excel templates', 'financial tools', 'cash flow template', 'Ottawa', 'Canada']}
      />
      <main>
        <section className="py-xxl bg-background">
          <div className="max-w-[900px] mx-auto px-md text-center">
            <span className="inline-block px-4 py-2 bg-primary text-white text-sm font-semibold uppercase tracking-wider rounded-full mb-md">
              Excel Templates and Tools
            </span>
            <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-md">
              Excel Templates and Tools
            </h1>
            <p className="text-lg text-text-light leading-relaxed">
              We are building a library of practical Excel templates and tools to help you track cash flow,
              improve reporting, and support better financial decisions.
            </p>
          </div>
        </section>

        <section className="py-lg bg-white">
          <div className="max-w-[900px] mx-auto px-md">
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

export default ExcelTemplatesTools
