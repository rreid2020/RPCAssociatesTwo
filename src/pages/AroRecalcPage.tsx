import { FC, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import CalendlyButton from '../components/CalendlyButton'

const AroRecalcApp = lazy(() => import('../features/aro-recalc'))

const AroRecalcPage: FC = () => {
  return (
    <>
      <SEO
        title="ARO Recalculation | Asset Retirement Obligation Calculator - Axiom"
        description="Independently recalculate asset retirement obligation (ARO) portfolios from REP04/REP06 extracts and a bond yield curve. Compare recalculated FV/PV to source-system figures with DAYS360/360 math. Runs entirely in your browser."
        canonical="/resources/aro-recalculation"
        keywords={[
          'ARO recalculation',
          'asset retirement obligation',
          'ARO calculator',
          'REP04',
          'REP06',
          'decommissioning liability',
          'present value',
          'bond yield curve',
          'auditor recalculation',
          'Ottawa',
          'Axiom'
        ]}
      />
      <main className="min-h-[60vh] bg-background">
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
          <section className="mb-6 text-center sm:mb-8">
            <h1 className="mb-3 text-2xl font-bold text-primary sm:text-3xl lg:text-4xl">
              ARO Recalculation
            </h1>
            <p className="mx-auto max-w-3xl text-base leading-relaxed text-text-light sm:text-lg">
              Independently recalculate an asset retirement obligation portfolio from source extracts (REP04 cost
              estimates, REP06 settlement dates and reported FV/PV, and a discount curve). Compare results to the
              source system with materiality flags. All processing stays in your browser — nothing is uploaded.
            </p>
          </section>

          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <Suspense
              fallback={
                <div className="flex min-h-[420px] items-center justify-center p-8 text-text-light">
                  Loading ARO recalculation tool…
                </div>
              }
            >
              <AroRecalcApp />
            </Suspense>
          </div>

          <p className="mt-4 text-center text-sm text-text-light">
            Illustrative until your extracts and curve are imported. Confirm material figures with your engagement
            team or auditor.
          </p>

          <section className="mt-10 sm:mt-12">
            <div className="rounded-xl border border-border bg-white p-6 text-center shadow-sm sm:p-8">
              <h2 className="mb-4 text-2xl font-bold text-primary sm:text-3xl">Need help with ARO reporting?</h2>
              <p className="mx-auto mb-6 max-w-2xl text-base text-text-light sm:text-lg">
                Axiom can support ARO measurement, extract review, and variance clearance for growing businesses.
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

export default AroRecalcPage
