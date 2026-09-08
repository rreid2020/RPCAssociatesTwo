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
    <section className="py-xxl bg-gradient-to-b from-background-band to-background border-b border-border">
      <div className="max-w-[1120px] mx-auto px-md">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl items-center">
          <div className="max-w-[600px]">
            <div className="pill mb-md">Accounting · Consulting · Tech Solutions</div>
            <h1 className="text-4xl lg:text-5xl mb-md">
              Financial clarity and modern systems for growing businesses.
            </h1>
            <p className="text-lg text-text-body mb-lg">
              Axiom helps entrepreneurs and organizations gain control of their numbers, strengthen internal controls, and implement practical tech solutions—so they can focus on running and growing the business.
            </p>
            <div className="flex gap-md mb-lg flex-wrap">
              <CalendlyButton text="Schedule a Free Consultation" />
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => scrollToSection('client-portal')}
              >
                Client portal
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => scrollToSection('services')}
              >
                View Services
              </button>
            </div>
          </div>
          <div className="bg-white p-xl rounded border border-border shadow-sm">
            <h2 className="text-2xl mb-md">A great accountant is a strategic partner.</h2>
            <p className="mb-md text-text-body">
              It is not just about bookkeeping and tax filings. The right accountant gives you real-time visibility into your business, proactive guidance, and stronger systems.
            </p>
            <ul className="list-none m-0 p-0">
              {[
                'Better decisions backed by accurate numbers',
                'More time to focus on operations and growth',
                'Improved compliance and reduced risk',
                'Stronger cash flow and long-term planning',
              ].map((item) => (
                <li
                  key={item}
                  className="pl-md mb-sm relative before:content-['✓'] before:absolute before:left-0 before:text-accent before:font-bold text-text-body"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
