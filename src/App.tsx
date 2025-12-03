import { FC } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Services from './components/Services'
import Why from './components/Why'
import About from './components/About'
import Remote from './components/Remote'
import Contact from './components/Contact'
import Footer from './components/Footer'

const App: FC = () => {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <Why />
        <About />
        <Remote />
        <Contact />
      </main>
      <Footer />
    </>
  )
}

export default App

