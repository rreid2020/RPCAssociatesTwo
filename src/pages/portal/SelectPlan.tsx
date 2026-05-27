import { FC } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../components/SEO'
import AxiomWordmark from '../../components/AxiomWordmark'
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '../../lib/subscriptions/types'
import { formatSubscriptionPrice } from '../../lib/subscriptions/utils'

const SelectPlan: FC = () => {
  const navigate = useNavigate()
  const { isSignedIn } = useAuth()

  const planEntries = Object.values(SUBSCRIPTION_PLANS)

  const onChoosePlan = (planId: SubscriptionPlan) => {
    const onboardingPath = `/portal/subscription?onboarding=1&selectedPlan=${encodeURIComponent(planId)}`
    if (isSignedIn) {
      navigate(onboardingPath)
      return
    }
    navigate(`/portal/sign-up?plan=${encodeURIComponent(planId)}&next=${encodeURIComponent(onboardingPath)}`)
  }

  return (
    <>
      <SEO
        title="Select a Plan | Client Portal"
        description="Choose a client portal plan, then continue through account setup and company/firm onboarding."
        canonical="/portal/select-plan"
      />
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-10 text-center">
            <AxiomWordmark size="lg" centered blendOnBackground className="mb-4" />
            <h1 className="text-3xl font-bold text-primary-dark mb-2">Select a Plan</h1>
            <p className="text-text-light">
              Choose your plan first, then create your account and continue to company/firm setup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {planEntries.map((plan) => (
              <div key={plan.id} className="bg-white p-6 rounded-lg border border-border shadow-sm flex flex-col">
                <h2 className="text-xl font-semibold text-primary-dark">{plan.name}</h2>
                <p className="mt-2 text-sm text-text-light min-h-[48px]">{plan.description}</p>
                <p className="mt-4 text-2xl font-bold text-primary-dark">{formatSubscriptionPrice(plan.monthlyPrice)}</p>
                <p className="mt-1 text-xs text-text-light">per month</p>
                <button
                  type="button"
                  className="mt-6 btn btn--primary w-full"
                  onClick={() => { onChoosePlan(plan.id) }}
                >
                  Choose {plan.name}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center text-sm text-text-light">
            Already have an account?{' '}
            <Link to="/portal/sign-in" className="text-primary-dark font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default SelectPlan
