import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import CalendlyButton from '../components/CalendlyButton'
import DonationOptimizer from '@/features/donation-optimizer/components/DonationOptimizer'

const DonationOptimizerPage: FC = () => {
  return (
    <>
      <SEO
        title="Donation Credit Optimizer | Charitable & Political Credits - RPC Associates"
        description="Estimate Canadian charitable and federal political donation credits for any province or territory. Compare allocation strategies, marginal tax rates, ranked scenarios, and potential credit improvement versus a simple single-return claim."
        canonical="/resources/donation-credit-optimizer"
        keywords={[
          'donation tax credit',
          'charitable donation credit Canada',
          'political contribution credit',
          'Ontario charitable credit',
          'tax credit optimizer',
          'RPC Associates',
        ]}
      />
      <main className="min-h-[60vh] bg-background py-xxl">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <section className="mb-8 text-center sm:mb-10">
            <h1 className="mb-4 text-2xl font-bold text-primary sm:text-3xl lg:text-4xl">Donation Credit Optimizer</h1>
            <p className="mx-auto max-w-3xl text-base leading-relaxed text-text-light sm:text-lg">
              Interactive tool for federal and provincial or territorial charitable credits, federal political credits,
              marginal tax-rate context, and multi-scenario comparison. Results are illustrative—use for planning only
              and confirm with your T1, provincial return, or a qualified advisor.
            </p>
          </section>

          <div className="rounded-xl border border-border bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <DonationOptimizer />
          </div>

          <section className="mt-10 sm:mt-12">
            <div className="rounded-xl border border-border bg-white p-6 text-center shadow-sm sm:p-8 lg:p-10">
              <h2 className="mb-4 text-2xl font-bold text-primary sm:text-3xl">Need personalized tax planning?</h2>
              <p className="mx-auto mb-6 max-w-2xl text-base text-text-light sm:text-lg">
                Our team can help you integrate donations, credits, and your full return.
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
              <Link to="/resources" className="inline-flex items-center text-primary underline transition-colors hover:text-primary-dark">
                View All Resources
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default DonationOptimizerPage
