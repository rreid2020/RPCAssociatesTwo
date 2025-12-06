import { FC } from 'react'

const Hero: FC = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="hero">
      <div className="container">
        <div className="hero__container">
          <div className="hero__content">
            <div className="hero__eyebrow">Accounting · Consulting · Tech Solutions</div>
            <h1 className="hero__title">Financial clarity and modern systems for growing businesses.</h1>
            <p className="hero__subtitle">
              RPC Associates helps entrepreneurs and organizations gain control of their numbers, strengthen internal controls, and implement practical tech solutions—so they can focus on running and growing the business.
            </p>
            <div className="hero__buttons">
              <button 
                className="btn btn--primary"
                onClick={() => scrollToSection('contact')}
              >
                Schedule a Free Consultation
              </button>
              <button 
                className="btn btn--secondary"
                onClick={() => scrollToSection('services')}
              >
                View Services
              </button>
            </div>
          </div>
          <div className="hero__card">
            <h3 className="hero__card-title">A great accountant is a strategic partner.</h3>
            <p className="hero__card-text">
              It is not just about bookkeeping and tax filings. The right accountant gives you real-time visibility into your business, proactive guidance, and stronger systems.
            </p>
            <ul className="hero__card-list">
              <li className="hero__card-item">Better decisions backed by accurate numbers</li>
              <li className="hero__card-item">More time to focus on operations and growth</li>
              <li className="hero__card-item">Improved compliance and reduced risk</li>
              <li className="hero__card-item">Stronger cash flow and long-term planning</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero

