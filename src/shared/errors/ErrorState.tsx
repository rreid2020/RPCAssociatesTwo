import { FC } from 'react'

interface ErrorStateProps {
  message: string
}

const ErrorState: FC<ErrorStateProps> = ({ message }) => (
  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
    {message}
  </div>
)

export default ErrorState

