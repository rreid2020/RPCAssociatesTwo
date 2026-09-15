import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import CalendlyButton from '../components/CalendlyButton'
import MarketingPageHero from '../components/MarketingPageHero'
import DonationOptimizer from '@/features/donation-optimizer/components/DonationOptimizer'

const DonationOptimizerPage: FC = () => {
  return (
    <>
      <SEO
        title="Donation Credit Optimizer | Charitable & Political Credits - Axiom"
        description="Compare tax credits for the same contribution amount to charitable causes versus federal political contributions. See which yields higher credits and view marginal tax rates by province."
        canonical="/resources/donation-credit-optimizer"
        keywords={[
          'donation tax credit',
          'charitable donation credit Canada',
          'political contribution credit',
          'Ontario charitable credit',
          'tax credit optimizer',
          'Axiom',
        ]}
      />
      <main>
        <MarketingPageHero
          eyebrow="Calculator"
          title="Donation Credit Optimizer"
          lede="Compare the same dollar amount as charitable donations versus federal political contributions: which option produces higher non-refundable tax credits in this model. Illustrative only."
          primary={(
            <a href="#tool" className="btn btn-primary">
              Open the optimizer
            </a>
          )}
          secondary={(
            <Link to="/resources/category/online-calculators" className="btn btn-ghost">
              All calculators
            </Link>
          )}
          strip={['Charitable vs political', 'Provincial context', 'Illustrative only']}
        />

        <div className="svc-landing">
          <section className="alt" id="tool">
            <div className="wrap">
              <DonationOptimizer />
            </div>
          </section>

          <section className="closing" id="closing">
            <div className="wrap">
              <h2>Need personalized tax planning?</h2>
              <p className="lede">
                Our team can help you integrate donations, credits, and your full return.
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

export default DonationOptimizerPage
