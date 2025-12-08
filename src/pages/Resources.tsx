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
      <section className="section">
        <div className="container">
          <div className="section__header">
            <h1 className="section__title">Resources</h1>
            <p className="section__subtitle">
              Helpful resources, tools, and guides for your business.
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
            <p>Resources content coming soon.</p>
          </div>
        </div>
      </section>
    </main>
    </>
  )
}

export default Resources

