import { FC, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

const Card: FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg border border-border shadow-sm ${className}`.trim()}>
    {children}
  </div>
)

export default Card

