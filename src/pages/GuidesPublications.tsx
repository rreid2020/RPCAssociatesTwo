import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

const GuidesPublications: FC = () => {
  return (
    <>
      <SEO
        title="Guides and Other Publications - RPC Associates"
        description="Explore upcoming guides, checklists, and publications from RPC Associates for business owners and decision makers."
        canonical="/resources/guides-publications"
        keywords={['business guides', 'publications', 'checklists', 'Ottawa', 'Canada']}
      />
      <main>
        <section className="py-xxl bg-background">
          <div className="max-w-[900px] mx-auto px-md text-center">
            <span className="inline-block px-4 py-2 bg-primary text-white text-sm font-semibold uppercase tracking-wider rounded-full mb-md">
              Guides and Other Publications
            </span>
            <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-md">
              Guides and Other Publications
            </h1>
            <p className="text-lg text-text-light leading-relaxed">
              We are preparing guides, checklists, and other publications to support planning, reporting,
              and compliance for owner-managed businesses.
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

export default GuidesPublications
