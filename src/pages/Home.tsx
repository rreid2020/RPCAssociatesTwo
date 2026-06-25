import { FC } from 'react'
import SEO from '../components/SEO'
import Hero from '../components/Hero'
import Services from '../components/Services'
import PortalPlatform from '../components/PortalPlatform'
import Why from '../components/Why'
import About from '../components/About'
import Remote from '../components/Remote'
import { portalPlatformSeo } from '../lib/portal/modules'

const homeKeywords = [
  'accounting services',
  'CPA',
  'CMA',
  'CGAP',
  'tax preparation',
  'business consulting',
  'tech solutions',
  'financial advisory',
  'Canada accounting',
  'Canadian Income Tax',
  'Ottawa accountant',
  'Ottawa accounting',
  'Ottawa tax services',
  'Ontario accountant',
  'accounting services Ottawa',
  ...portalPlatformSeo.keywords
]

const Home: FC = () => {
  return (
    <>
      <SEO
        title="Axiom | Accounting, Consulting & Client Portal for Canadian Businesses"
        description="Axiom provides accounting, consulting, and technology for growing Canadian businesses. Access Dashboard, TaxGPT, Tax Return Builder, File Repository, Working Papers, and Integrations in our secure client portal."
        keywords={homeKeywords}
        canonical="/"
      />
      <main>
        <Hero />
        <PortalPlatform />
        <Services />
        <Why />
        <About />
        <Remote />
      </main>
    </>
  )
}

export default Home

