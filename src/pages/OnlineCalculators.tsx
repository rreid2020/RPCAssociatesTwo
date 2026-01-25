import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

const OnlineCalculators: FC = () => {
  return (
    <>
      <SEO
        title="Online Calculators - RPC Associates"
        description="Explore RPC Associates online calculators for tax and financial planning. Start with our Canadian personal income tax calculator."
        canonical="/resources/online-calculators"
        keywords={['online calculators', 'tax calculator', 'financial planning tools', 'Ottawa', 'Canada']}
      />
      <main>
        <section className="py-xxl bg-background">
          <div className="max-w-[1100px] mx-auto px-md">
            <div className="text-center mb-xl max-w-[800px] mx-auto">
              <span className="inline-block px-4 py-2 bg-primary text-white text-sm font-semibold uppercase tracking-wider rounded-full mb-md">
                Online Calculators
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-md">
                Online Calculators
              </h1>
              <p className="text-lg text-text-light leading-relaxed">
                Use our online calculators to estimate taxes and support smarter financial planning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <Link
                to="/resources/canadian-personal-income-tax-calculator"
                className="bg-white p-lg rounded-xl shadow-sm border border-border transition-all hover:shadow-md hover:-translate-y-1 block no-underline text-inherit"
              >
                <h2 className="text-xl font-semibold text-primary mb-sm">
                  Canadian Personal Income Tax Calculator
                </h2>
                <p className="text-text-light text-[0.9375rem] leading-relaxed">
                  Estimate your 2025 Canadian income tax with detailed federal and provincial breakdowns.
                </p>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-lg bg-white">
          <div className="max-w-[900px] mx-auto px-md">
            <Link
              to="/resources"
              className="inline-block text-primary no-underline text-[0.9375rem] transition-all hover:underline"
            >
              ← Back to Resources
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}

export default OnlineCalculators
