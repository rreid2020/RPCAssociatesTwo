import { FC } from 'react'
import SEO from '../components/SEO'

const Articles: FC = () => {
  return (
    <>
      <SEO
        title="Articles"
        description="Insights, tips, and updates on accounting, consulting, and technology from RPC Associates. Stay informed with expert articles and industry news."
        canonical="/articles"
      />
      <main>
      <section className="section">
        <div className="container">
          <div className="section__header">
            <h1 className="section__title">Articles</h1>
            <p className="section__subtitle">
              Insights, tips, and updates on accounting, consulting, and technology.
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
            <p>Articles content coming soon.</p>
          </div>
        </div>
      </section>
    </main>
    </>
  )
}

export default Articles

