import { FC } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  title: string
  description: string
}

const UpgradePromptCard: FC<Props> = ({ title, description }) => {
  return (
    <section className="rounded-lg border border-accent/30 bg-accent/10 p-4">
      <h3 className="text-lg font-semibold text-primary-dark">{title}</h3>
      <p className="text-sm text-text-light mt-1">{description}</p>
      <Link to="/portal/billing/subscription" className="mt-3 inline-flex btn btn--primary">
        Compare Plans
      </Link>
    </section>
  )
}

export default UpgradePromptCard
