import { FC, ReactNode, useEffect } from 'react'
import { logMessage } from '../lib/logging'

interface ObservabilityProviderProps {
  children: ReactNode
}

const ObservabilityProvider: FC<ObservabilityProviderProps> = ({ children }) => {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      logMessage('error', event.message || 'window_error', {
        source: event.filename,
        line: event.lineno,
        column: event.colno
      })
    }
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      logMessage('error', 'unhandled_rejection', {
        reason: String(event.reason || 'unknown')
      })
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return <>{children}</>
}

export default ObservabilityProvider

