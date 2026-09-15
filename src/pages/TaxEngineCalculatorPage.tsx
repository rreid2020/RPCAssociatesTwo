import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import CalendlyButton from '../components/CalendlyButton'
import MarketingPageHero from '../components/MarketingPageHero'
import TaxEngineCalculator from '../components/TaxEngineCalculator'

const TaxEngineCalculatorPage: FC = () => {
  return (
    <>
      <SEO
        title="CCPC Salary & Dividend Planner | Canadian Tax Engine - Axiom"
        description="For owner-managers with only CCPC income: minimize combined corporate and personal tax across salary, dividends, and retained earnings (2025 parameters)."
        canonical="/resources/ccpc-salary-dividend-calculator"
        keywords={[
          'CCPC',
          'salary vs dividend',
          'Canadian tax',
          'small business',
          'dividend tax credit',
          'Axiom',
        ]}
      />
      <main>
        <MarketingPageHero
          eyebrow="Calculator"
          title="CCPC Salary & Dividend Planner"
          lede="Assumes no income outside your corporation. The search minimizes total tax (corporate plus personal) over salary, dividends, and retention. For planning only—not tax advice."
          primary={(
            <a href="#tool" className="btn btn-primary">
              Open the planner
            </a>
          )}
          secondary={(
            <Link to="/resources/category/online-calculators" className="btn btn-ghost">
              All calculators
            </Link>
          )}
          strip={['CCPC owner-managers', '2025 parameters', 'Planning only']}
        />

        <div className="svc-landing">
          <section className="alt" id="tool">
            <div className="wrap">
              <TaxEngineCalculator />
            </div>
          </section>

          <section className="closing" id="closing">
            <div className="wrap">
              <h2>Need integrated tax planning?</h2>
              <p className="lede">
                Our team helps owner-managers with compensation, corporate structure, and compliance.
              </p>
              <div className="cta-row">
                <CalendlyButton text="Book a 30-minute call" className="btn btn-solid" />
                <Link to="/resources/category/online-calculators" className="btn btn-outline">
                  Back to calculators
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default TaxEngineCalculatorPage
