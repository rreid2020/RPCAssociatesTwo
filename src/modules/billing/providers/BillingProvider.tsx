import { createContext, FC, ReactNode, useContext, useMemo } from 'react'
import { BILLING_PLANS } from '../../../services/billing/plans'

type BillingContextValue = {
  plans: typeof BILLING_PLANS
}

const BillingContext = createContext<BillingContextValue | null>(null)

export const BillingProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const value = useMemo<BillingContextValue>(() => ({ plans: BILLING_PLANS }), [])
  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>
}

export function useBillingContext (): BillingContextValue {
  const context = useContext(BillingContext)
  if (!context) {
    throw new Error('useBillingContext must be used within BillingProvider')
  }
  return context
}
