import { FC } from 'react'
import SEO from '../components/SEO'
import Hero from '../components/Hero'
import Services from '../components/Services'
import PortalPlatform from '../components/PortalPlatform'
import Why from '../components/Why'
import About from '../components/About'
import Remote from '../components/Remote'

const Home: FC = () => {
  return (
    <>
      <SEO
        title="Axiom | Accounting, Consulting & Tech Solutions"
        description="Axiom provides professional accounting, consulting, and tech solutions for growing businesses. Access TaxGPT, Tax Return Builder, and Accounting Operations in the secure client portal."
        keywords="accounting services, CPA, CMA, CGAP, tax preparation, business consulting, tech solutions, financial advisory, Canada accounting, Canadian Income Tax, Ottawa accountant, Ottawa accounting, Ottawa tax services, Ontario accountant, accounting services Ottawa"
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

