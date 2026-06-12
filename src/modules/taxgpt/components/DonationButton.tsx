import { FC, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import {
  createTaxgptDonationCheckout,
  fetchTaxgptDonationConfig,
  type TaxgptDonationConfig
} from '../../../domains/taxgpt'

function formatCadAmount (amountCents: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amountCents / 100)
}

const DonationButton: FC = () => {
  const { getToken } = useAuth()
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<TaxgptDonationConfig | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || config) return
    let mounted = true
    const load = async () => {
      setLoadingConfig(true)
      setError(null)
      try {
        const next = await fetchTaxgptDonationConfig(getToken)
        if (mounted) setConfig(next)
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Could not load donation options.')
        }
      } finally {
        if (mounted) setLoadingConfig(false)
      }
    }
    void load()
    return () => {
      mounted = false
    }
  }, [open, config, getToken])

  const handleOpen = () => {
    setError(null)
    setOpen(true)
  }

  const handleClose = () => {
    if (submitting) return
    setOpen(false)
  }

  const handlePaymentLink = () => {
    if (!config?.paymentLinkUrl) return
    window.open(config.paymentLinkUrl, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  const handleCheckout = async (amountCents: number) => {
    setSubmitting(true)
    setError(null)
    try {
      const origin = window.location.origin
      const checkout = await createTaxgptDonationCheckout(getToken, {
        amountCents,
        successUrl: `${origin}/portal/taxgpt?donation=success`,
        cancelUrl: `${origin}/portal/taxgpt?donation=cancelled`
      })
      window.location.href = checkout.checkoutUrl
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start donation checkout.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 border border-border bg-white px-3 py-1.5 text-sm font-medium text-text shadow-sm hover:bg-background"
      >
        Donations
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close donation dialog"
            onClick={handleClose}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="taxgpt-donation-title"
            className="relative w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="taxgpt-donation-title" className="text-lg font-semibold text-primary-dark">
                  Support TaxGPT
                </h2>
                <p className="mt-2 text-sm text-text-light">
                  Voluntary donations help fund TaxGPT development, CRA corpus expansion, and ongoing improvements.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="text-text-light hover:text-text disabled:opacity-50"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {loadingConfig && (
              <p className="mt-4 text-sm text-text-light">Loading donation options…</p>
            )}

            {!loadingConfig && config && !config.configured && (
              <p className="mt-4 text-sm text-amber-800">
                Donations are not configured yet. Contact the platform operator to enable Stripe support.
              </p>
            )}

            {!loadingConfig && config?.configured && (
              <div className="mt-5 space-y-3">
                {config.stripeCheckoutEnabled && (
                  <div className="grid grid-cols-2 gap-2">
                    {(config.amountsCents ?? []).map((amountCents) => (
                      <button
                        key={amountCents}
                        type="button"
                        onClick={() => { void handleCheckout(amountCents) }}
                        disabled={submitting}
                        className="rounded-md border border-border bg-background px-3 py-2.5 text-sm font-medium text-text hover:border-primary/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {formatCadAmount(amountCents)}
                      </button>
                    ))}
                  </div>
                )}

                {config.paymentLinkUrl && (
                  <button
                    type="button"
                    onClick={handlePaymentLink}
                    disabled={submitting}
                    className="btn btn--primary w-full text-sm py-2 disabled:opacity-50"
                  >
                    {config.stripeCheckoutEnabled ? 'Other amount via secure checkout' : 'Continue to secure checkout'}
                  </button>
                )}

                <p className="text-xs text-text-light">
                  Payments are processed securely by Stripe. Donations are voluntary and not tax-deductible unless otherwise stated by the recipient organization.
                </p>
              </div>
            )}

            {error && (
              <p className="mt-4 text-sm text-red-700">{error}</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default DonationButton
