import { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SEO from '../components/SEO'
import MarketingPageHero from '../components/MarketingPageHero'

const NotFound: FC = () => {
  const { pathname } = useLocation()
  return (
    <>
      <SEO
        title="Page Not Found"
        description="The page you were looking for could not be found on axiomft.ca."
        canonical={pathname}
        noIndex
      />
      <main className="bg-white text-text-body">
        <MarketingPageHero
          eyebrow="404"
          title="Page not found"
          lede="The page you were looking for has moved or no longer exists."
          primary={(
            <Link to="/" className="btn btn-primary">
              Go to the homepage
            </Link>
          )}
          secondary={(
            <Link to="/sitemap" className="btn btn-ghost">
              Browse the site map
            </Link>
          )}
        />
      </main>
    </>
  )
}

export default NotFound
