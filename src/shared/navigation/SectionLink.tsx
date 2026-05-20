import { FC } from 'react'
import { Link } from 'react-router-dom'

interface SectionLinkProps {
  to: string
  label: string
}

const SectionLink: FC<SectionLinkProps> = ({ to, label }) => (
  <Link to={to} className="text-sm font-medium text-primary-dark hover:underline">
    {label}
  </Link>
)

export default SectionLink

