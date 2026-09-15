import { FC } from 'react'
import CalendlyButton from './CalendlyButton'

const Hero: FC = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="svc-landing">
      <section className="hero" id="hero" style={{ borderTop: 0 }}>
        <div className="wrap">
          <p className="eyebrow">Accounting · Advisory · Systems</p>
          <h1>Ottawa accounting, advisory, and systems for growing Canadian businesses.</h1>
          <p className="lede">
            Axiom is a CPA-led Ottawa firm. We help entrepreneurs and organizations gain control of
            their numbers, strengthen internal controls, and implement practical tech solutions —
            so they can focus on running and growing the business.
          </p>
          <div className="cta-row">
            <CalendlyButton text="Schedule a Free Consultation" className="btn btn-primary" />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => scrollToSection('services')}
            >
              View services
            </button>
          </div>
          <p className="strip">
            <b>Published fees</b>
            {' '}
            &nbsp;&middot;&nbsp;
            {' '}
            <b>Committed delivery dates</b>
            {' '}
            &nbsp;&middot;&nbsp;
            {' '}
            <b>Working papers you keep</b>
          </p>
        </div>
      </section>
    </div>
  )
}

export default Hero
