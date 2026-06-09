import { Component, ReactNode, Suspense } from 'react'
import PageLoadingSkeleton from './PageLoadingSkeleton'

type LazyPanelBoundaryProps = {
  children: ReactNode
  fallback?: ReactNode
}

type LazyPanelBoundaryState = {
  hasError: boolean
  resetKey: number
}

export class LazyPanelBoundary extends Component<LazyPanelBoundaryProps, LazyPanelBoundaryState> {
  state: LazyPanelBoundaryState = { hasError: false, resetKey: 0 }

  static getDerivedStateFromError (): Partial<LazyPanelBoundaryState> {
    return { hasError: true }
  }

  private handleRetry = () => {
    this.setState((state) => ({
      hasError: false,
      resetKey: state.resetKey + 1
    }))
  }

  render () {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <p>This section failed to load. The connection may have timed out.</p>
          <button
            type="button"
            className="mt-2 font-medium text-primary-dark underline"
            onClick={this.handleRetry}
          >
            Retry
          </button>
        </div>
      )
    }

    return (
      <Suspense fallback={this.props.fallback ?? <PageLoadingSkeleton variant="table" />}>
        <div key={this.state.resetKey}>{this.props.children}</div>
      </Suspense>
    )
  }
}
