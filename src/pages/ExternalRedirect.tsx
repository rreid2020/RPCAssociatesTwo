import { FC, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Deprecated transitional helper for moved tools.
 * Opens `to` in a new window (bookmarks / deep links cannot use HTTP redirects for that).
 */
const ExternalRedirect: FC<{ to: string; label?: string }> = ({
  to,
  label = 'Continue to the calculator',
}) => {
  const [popupBlocked, setPopupBlocked] = useState(false)

  useEffect(() => {
    const opened = window.open(to, '_blank', 'noopener,noreferrer')
    if (!opened) {
      setPopupBlocked(true)
    }
  }, [to])

  return (
    <main className="min-h-[40vh] bg-background py-xxl text-center">
      <div className="mx-auto max-w-xl px-md">
        <p className="mb-md text-lg text-text-body">Opening the ARO Recalculation tool in a new window…</p>
        {popupBlocked && (
          <p className="mb-md rounded border border-border bg-white px-md py-sm text-sm text-text-body">
            Your browser blocked the new window. Use the link below to continue.
          </p>
        )}
        <a href={to} target="_blank" rel="noopener noreferrer" className="btn btn--primary mb-md inline-flex">
          {label}
        </a>
        <p className="m-0 text-sm text-text-light">
          <Link to="/resources/category/online-calculators" className="text-primary underline underline-offset-2">
            Back to calculators
          </Link>
        </p>
      </div>
    </main>
  )
}

export default ExternalRedirect
