import Stripe from 'stripe'

const DEFAULT_AMOUNTS_CENTS = [1000, 2500, 5000, 10000]
const MIN_AMOUNT_CENTS = 500
const MAX_AMOUNT_CENTS = 1_000_000

let stripeClient = null

function getStripeSecretKey () {
  return String(process.env.STRIPE_SECRET_KEY || '').trim()
}

function getStripeClient () {
  if (stripeClient) return stripeClient
  const secretKey = getStripeSecretKey()
  if (!secretKey) {
    throw new Error('Donations are not configured. Set STRIPE_SECRET_KEY on the API server.')
  }
  stripeClient = new Stripe(secretKey)
  return stripeClient
}

function parseDonationAmounts () {
  const raw = String(process.env.TAXGPT_DONATION_AMOUNTS_CENTS || '').trim()
  if (!raw) return DEFAULT_AMOUNTS_CENTS
  const amounts = raw
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value >= MIN_AMOUNT_CENTS && value <= MAX_AMOUNT_CENTS)
  return amounts.length > 0 ? amounts : DEFAULT_AMOUNTS_CENTS
}

export function getTaxgptDonationPaymentLinkUrl () {
  return String(process.env.TAXGPT_DONATION_URL || '').trim() || null
}

export function getTaxgptDonationConfig () {
  const paymentLinkUrl = getTaxgptDonationPaymentLinkUrl()
  const stripeConfigured = Boolean(getStripeSecretKey())
  return {
    configured: Boolean(paymentLinkUrl || stripeConfigured),
    paymentLinkUrl,
    stripeCheckoutEnabled: stripeConfigured,
    amountsCents: parseDonationAmounts(),
    currency: 'cad'
  }
}

export async function createTaxgptDonationCheckout ({
  amountCents,
  clerkUserId,
  successUrl,
  cancelUrl,
  customerEmail = null
}) {
  const amounts = parseDonationAmounts()
  const amount = Number(amountCents)
  if (!Number.isInteger(amount) || !amounts.includes(amount)) {
    throw new Error('Invalid donation amount')
  }
  if (!successUrl || !cancelUrl) {
    throw new Error('successUrl and cancelUrl are required')
  }

  const stripe = getStripeClient()
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [{
      price_data: {
        currency: 'cad',
        unit_amount: amount,
        product_data: {
          name: 'Support TaxGPT Development',
          description: 'One-time voluntary donation to support TaxGPT development and CRA corpus expansion.'
        }
      },
      quantity: 1
    }],
    customer_email: customerEmail || undefined,
    metadata: {
      purpose: 'taxgpt_development_donation',
      clerkUserId: clerkUserId ? String(clerkUserId) : ''
    }
  })

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL')
  }

  return {
    checkoutUrl: session.url,
    checkoutSessionId: session.id
  }
}
