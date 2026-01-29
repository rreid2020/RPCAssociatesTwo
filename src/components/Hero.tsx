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
    <section className="py-xxl bg-background">
      <div className="max-w-[1200px] mx-auto px-md">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl items-center">
          <div className="max-w-[600px]">
            <div className="inline-block text-sm font-semibold text-primary-dark uppercase tracking-wider mb-md">Accounting · Consulting · Tech Solutions</div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-md">Financial clarity and modern systems for growing businesses.</h1>
            <p className="text-lg text-text-light mb-lg">
              RPC Associates helps entrepreneurs and organizations gain control of their numbers, strengthen internal controls, and implement practical tech solutions—so they can focus on running and growing the business.
            </p>
            <div className="flex gap-md mb-lg flex-wrap">
              <CalendlyButton text="Schedule a Free Consultation" />
              <button 
                className="btn btn--secondary"
                onClick={() => scrollToSection('services')}
              >
                View Services
              </button>
            </div>
          </div>
          <div className="bg-white p-xl rounded-xl shadow-md">
            <h3 className="text-2xl mb-md">A great accountant is a strategic partner.</h3>
            <p className="mb-md">
              It is not just about bookkeeping and tax filings. The right accountant gives you real-time visibility into your business, proactive guidance, and stronger systems.
            </p>
            <ul className="list-none">
              <li className="pl-md mb-sm relative before:content-['✓'] before:absolute before:left-0 before:text-primary-dark before:font-bold">Better decisions backed by accurate numbers</li>
              <li className="pl-md mb-sm relative before:content-['✓'] before:absolute before:left-0 before:text-primary-dark before:font-bold">More time to focus on operations and growth</li>
              <li className="pl-md mb-sm relative before:content-['✓'] before:absolute before:left-0 before:text-primary-dark before:font-bold">Improved compliance and reduced risk</li>
              <li className="pl-md mb-sm relative before:content-['✓'] before:absolute before:left-0 before:text-primary-dark before:font-bold">Stronger cash flow and long-term planning</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero

