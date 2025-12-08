import { FC } from 'react'
import SEO from '../components/SEO'
import Hero from '../components/Hero'
import Services from '../components/Services'
import Why from '../components/Why'
import About from '../components/About'
import Remote from '../components/Remote'
import Contact from '../components/Contact'

const Home: FC = () => {
  return (
    <>
      <SEO
        title="RPC Associates | Accounting, Consulting & Tech Solutions"
        description="RPC Associates provides professional accounting, consulting, and tech solutions for growing businesses. Expert CPA services, tax preparation, financial advisory, and modern technology solutions across Canada."
        keywords="accounting services, CPA, CMA, CGAP, tax preparation, business consulting, tech solutions, financial advisory, Canada accounting"
        canonical="/"
      />
      <main>
        <Hero />
        <Services />
        <Why />
        <About />
        <Remote />
        <Contact />
      </main>
    </>
  )
}

export default Home

