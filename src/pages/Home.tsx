import { FC } from 'react'
import Hero from '../components/Hero'
import Services from '../components/Services'
import Why from '../components/Why'
import About from '../components/About'
import Remote from '../components/Remote'
import Contact from '../components/Contact'

const Home: FC = () => {
  return (
    <main>
      <Hero />
      <Services />
      <Why />
      <About />
      <Remote />
      <Contact />
    </main>
  )
}

export default Home

