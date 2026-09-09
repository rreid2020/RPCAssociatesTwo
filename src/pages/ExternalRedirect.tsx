import { FC, useEffect } from 'react'

const ExternalRedirect: FC<{ to: string }> = ({ to }) => {
  useEffect(() => {
    window.location.replace(to)
  }, [to])

  return (
    <main className="py-xxl min-h-[40vh] text-center">
      <p className="text-lg text-text-light mb-md">Opening the ARO Recalculation tool…</p>
      <a href={to} className="text-primary hover:underline">
        Continue to the calculator
      </a>
    </main>
  )
}

export default ExternalRedirect
