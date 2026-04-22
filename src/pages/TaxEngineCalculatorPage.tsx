import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import CalendlyButton from '../components/CalendlyButton'
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
      <main className="min-h-[60vh] bg-background py-xxl">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <section className="mb-8 text-center sm:mb-10">
            <h1 className="mb-4 text-2xl font-bold text-primary sm:text-3xl lg:text-4xl">
              CCPC Salary & Dividend Planner
            </h1>
            <p className="mx-auto max-w-3xl text-base leading-relaxed text-text-light sm:text-lg">
              Assumes no income outside your corporation. The search minimizes total tax (corporate plus personal) over
              salary, dividends, and retention. For planning only—not tax advice.
            </p>
          </section>

          <div className="rounded-xl border border-border bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <TaxEngineCalculator />
          </div>

          <section className="mt-10 sm:mt-12">
            <div className="rounded-xl border border-border bg-white p-6 text-center shadow-sm sm:p-8 lg:p-10">
              <h2 className="mb-4 text-2xl font-bold text-primary sm:text-3xl">Need integrated tax planning?</h2>
              <p className="mx-auto mb-6 max-w-2xl text-base text-text-light sm:text-lg">
                Our team helps owner-managers with compensation, corporate structure, and compliance.
              </p>
              <CalendlyButton className="btn btn--primary" />
            </div>
          </section>

          <section className="mt-8">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm sm:text-base">
              <Link
                to="/resources/category/online-calculators"
                className="inline-flex items-center text-primary underline transition-colors hover:text-primary-dark"
              >
                ← Online Calculators
              </Link>
              <span className="text-text-light" aria-hidden>
                ·
              </span>
              <Link
                to="/resources"
                className="inline-flex items-center text-primary underline transition-colors hover:text-primary-dark"
              >
                View All Resources
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default TaxEngineCalculatorPage
