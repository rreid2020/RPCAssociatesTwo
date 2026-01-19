import { FC } from 'react'
import SEO from '../components/SEO'

const Resources: FC = () => {
  return (
    <>
      <SEO
        title="Resources"
        description="Helpful resources, tools, and guides for your business from RPC Associates. Access calculators, templates, and expert insights."
        canonical="/resources"
      />
      <main>
      <section className="py-xxl">
        <div className="max-w-[1200px] mx-auto px-md">
          <div className="text-center mb-xl max-w-[800px] mx-auto">
            <h1 className="mb-md">Resources</h1>
            <p className="text-lg text-text-light">
              Helpful resources, tools, and guides for your business.
            </p>
          </div>
          <div className="text-center py-xl">
            <p>Resources content coming soon.</p>
          </div>
        </div>
      </section>
    </main>
    </>
  )
}

export default Resources

