import { Component, ErrorInfo, ReactNode } from 'react'
import { isStaleChunkError, clearStaleChunkReloadFlag } from '../shared/loading/lazyWithRetry'

type Props = {
  children: ReactNode
}

type State = {
  error: Error | null
}

const CHUNK_RELOAD_KEY = 'axiom:chunk-reload'

function isRecoverableLoadError (error: Error | null): boolean {
  if (!error) return false
  return isStaleChunkError(error)
}

class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError (error: Error): State {
    return { error }
  }

  componentDidCatch (error: Error, info: ErrorInfo) {
    console.error('Route render failed', error, info.componentStack)
  }

  private handleRetry = () => {
    this.setState({ error: null })
    if (typeof window === 'undefined') return
    if (isRecoverableLoadError(this.state.error)) {
      if (window.sessionStorage.getItem(CHUNK_RELOAD_KEY) !== '1') {
        window.sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
        window.location.reload()
        return
      }
      clearStaleChunkReloadFlag()
    }
    window.location.reload()
  }

  render () {
    const { error } = this.state
    if (!error) return this.props.children

    const recoverable = isRecoverableLoadError(error)

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-sm space-y-4">
          <h1 className="text-lg font-semibold text-primary-dark">
            {recoverable ? 'Updating portal assets' : 'Something went wrong'}
          </h1>
          <p className="text-sm text-text-light">
            {recoverable
              ? 'The portal was refreshed before the latest app files finished loading. Reload once to continue.'
              : 'The page could not be rendered. Try reloading the portal.'}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center justify-center rounded-md bg-primary-dark px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Reload portal
          </button>
        </div>
      </div>
    )
  }
}

export default RouteErrorBoundary
