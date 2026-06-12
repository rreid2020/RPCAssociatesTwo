import { portalFetch } from '../../lib/portalApi'

export type TaxgptDonationConfig = {
  configured: boolean
  paymentLinkUrl: string | null
  stripeCheckoutEnabled: boolean
  amountsCents: number[]
  currency: 'cad'
}

export type TaxgptDonationCheckoutResponse = {
  checkoutUrl: string
  checkoutSessionId: string
}

export type CreateTaxgptDonationCheckoutPayload = {
  amountCents: number
  successUrl: string
  cancelUrl: string
}

export async function fetchTaxgptDonationConfig (
  getToken: () => Promise<string | null>
): Promise<TaxgptDonationConfig> {
  return portalFetch<TaxgptDonationConfig>('/v1/taxgpt/donations/config', getToken)
}

export async function createTaxgptDonationCheckout (
  getToken: () => Promise<string | null>,
  payload: CreateTaxgptDonationCheckoutPayload
): Promise<TaxgptDonationCheckoutResponse> {
  const data = await portalFetch<{ checkout: TaxgptDonationCheckoutResponse }>(
    '/v1/taxgpt/donations/checkout',
    getToken,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  )
  return data.checkout
}
