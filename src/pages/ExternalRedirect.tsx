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
    <main className="svc-landing">
      <section className="closing">
        <div className="wrap">
          <h2>Opening tool…</h2>
          <p className="lede">Opening the ARO Recalculation tool in a new window.</p>
          {popupBlocked ? (
            <p className="intro">
              Your browser blocked the new window. Use the link below to continue.
            </p>
          ) : null}
          <div className="cta-row">
            <a href={to} target="_blank" rel="noopener noreferrer" className="btn btn-solid">
              {label}
            </a>
            <Link to="/resources/category/online-calculators" className="btn btn-outline">
              Back to calculators
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ExternalRedirect
