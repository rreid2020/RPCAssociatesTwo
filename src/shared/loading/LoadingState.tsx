import { FC } from 'react'

interface LoadingStateProps {
  label?: string
}

const LoadingState: FC<LoadingStateProps> = ({ label = 'Loading...' }) => (
  <p className="text-sm text-text-light">{label}</p>
)

export default LoadingState

