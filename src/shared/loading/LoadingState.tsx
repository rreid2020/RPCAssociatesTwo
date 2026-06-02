import { FC } from 'react'
import PageLoadingSkeleton from './PageLoadingSkeleton'

interface LoadingStateProps {
  label?: string
  variant?: 'default' | 'table' | 'cards'
}

const LoadingState: FC<LoadingStateProps> = ({ label, variant = 'default' }) => (
  <div className="space-y-3" aria-busy="true">
    {label ? <p className="text-sm text-text-light">{label}</p> : null}
    <PageLoadingSkeleton variant={variant} />
  </div>
)

export default LoadingState

