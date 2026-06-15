import { FC, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../components/SEO'
import AxiomWordmark from '../../components/AxiomWordmark'
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '../../lib/subscriptions/types'
import { formatSubscriptionPrice } from '../../lib/subscriptions/utils'
import { isDevFreeAccessMode, SUBSCRIPTION_PLAN_BENEFITS } from '../../lib/subscriptions/planBenefits'

const PLAN_ORDER: SubscriptionPlan[] = ['FREE', 'TAX_INTELLIGENCE', 'PROFESSIONAL', 'ENTERPRISE']

const SelectPlan: FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isSignedIn } = useAuth()
  const selectedPlanFromQuery = searchParams.get('selectedPlan')
  const devFreeAccess = isDevFreeAccessMode()

  useEffect(() => {
    if (isSignedIn) {
      navigate('/portal/dashboard', { replace: true })
    }
  }, [isSignedIn, navigate])

  const onChoosePlan = (planId: SubscriptionPlan) => {
    if (devFreeAccess && planId !== 'FREE') return

    const onboardingPath = `/portal/subscription?onboarding=1&selectedPlan=${encodeURIComponent(planId)}`
    if (isSignedIn) {
      navigate('/portal/dashboard')
      return
    }
    navigate(`/portal/sign-up?mode=create&plan=${encodeURIComponent(planId)}&next=${encodeURIComponent(onboardingPath)}`)
  }

  return (
    <>
      <SEO
        title="Select a Plan | Client Portal"
        description="Choose a client portal plan, then continue through account setup and company, firm, or individual onboarding."
        canonical="/portal/select-plan"
      />
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-10 text-center">
            <AxiomWordmark size="lg" centered blendOnBackground className="mb-4" />
            <h1 className="text-3xl font-bold text-primary-dark mb-2">Select a Plan</h1>
            <p className="mx-auto max-w-3xl text-text-light">
              Create an account as an <strong className="text-primary-dark">individual</strong>,{' '}
              <strong className="text-primary-dark">business</strong>, or{' '}
              <strong className="text-primary-dark">accounting firm</strong>, then complete onboarding.
              Compare plans below and start with the option that fits your workspace.
            </p>
          </div>

          {devFreeAccess && (
            <div className="mb-8 rounded-lg border border-emerald-300 bg-emerald-50 px-5 py-4 text-center">
              <p className="text-sm font-semibold text-emerald-900">
                Full portal access is currently free while we are in development.
              </p>
              <p className="mt-1 text-sm text-emerald-800">
                Choose <strong>Free</strong> to sign up now. Paid plans are shown for reference and will be enabled at public launch.
              </p>
            </div>
          )}

          {selectedPlanFromQuery && (
            <div className="mb-6 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
              Selected plan from previous step: <strong>{selectedPlanFromQuery}</strong>. Confirm below to continue.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLAN_ORDER.map((planId) => {
              const plan = SUBSCRIPTION_PLANS[planId]
              const benefits = SUBSCRIPTION_PLAN_BENEFITS[planId]
              const isFreePlan = planId === 'FREE'
              const isDisabled = devFreeAccess && !isFreePlan

              return (
                <div key={plan.id} className="bg-white p-6 rounded-lg border border-border shadow-sm flex flex-col">
                  <h2 className="text-xl font-semibold text-primary-dark">{plan.name}</h2>
                  <p className="mt-2 text-sm text-text-light min-h-[48px]">{plan.description}</p>
                  <p className="mt-4 text-2xl font-bold text-primary-dark">{formatSubscriptionPrice(plan.monthlyPrice)}</p>
                  <p className="mt-1 text-xs text-text-light">per month</p>

                  <ul className="mt-5 flex-1 space-y-2 text-sm text-text">
                    {benefits.map((benefit) => (
                      <li key={benefit} className="flex gap-2">
                        <span className="mt-0.5 text-emerald-600" aria-hidden>✓</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className={`mt-6 btn w-full ${isDisabled ? 'btn--secondary opacity-60 cursor-not-allowed' : 'btn--primary'}`}
                    onClick={() => { onChoosePlan(plan.id) }}
                    disabled={isDisabled}
                    aria-disabled={isDisabled}
                    title={isDisabled ? 'Paid plans are not selectable during development. Use Free to sign up.' : undefined}
                  >
                    {isDisabled ? 'Coming soon' : `Choose ${plan.name}`}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mt-8 text-center text-sm text-text-light">
            Already have an account?{' '}
            <Link to={`/portal/sign-in?next=${encodeURIComponent('/portal/select-plan')}`} className="text-primary-dark font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default SelectPlan
