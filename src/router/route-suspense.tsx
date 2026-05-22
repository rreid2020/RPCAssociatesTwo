import { Component, FC, ReactNode, Suspense } from 'react'

interface ChunkErrorBoundaryProps {
  children: ReactNode
}

interface ChunkErrorBoundaryState {
  hasError: boolean
}

const CHUNK_RECOVERY_FLAG_KEY = 'portal:asset-recovery:attempted'

class ChunkErrorBoundary extends Component<ChunkErrorBoundaryProps, ChunkErrorBoundaryState> {
  constructor (props: ChunkErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError (): ChunkErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch (error: unknown) {
    const message = String((error as { message?: string })?.message || error || '').toLowerCase()
    const shouldRecover = message.includes('failed to fetch dynamically imported module') ||
      message.includes('chunkloaderror') ||
      message.includes('loading chunk')
    if (shouldRecover && typeof window !== 'undefined') {
      const alreadyTried = window.sessionStorage.getItem(CHUNK_RECOVERY_FLAG_KEY) === '1'
      if (alreadyTried) return
      window.sessionStorage.setItem(CHUNK_RECOVERY_FLAG_KEY, '1')
      const nextUrl = new URL(window.location.href)
      nextUrl.searchParams.set('asset_recover', String(Date.now()))
      window.location.replace(nextUrl.toString())
      return
    }
    console.error(error)
  }

  render () {
    if (this.state.hasError) {
      return <div className="min-h-[20vh] py-12 text-center text-sm text-text-light">Refreshing updated assets...</div>
    }
    return this.props.children
  }
}

interface RouteSuspenseProps {
  children: ReactNode
}

const RouteSuspense: FC<RouteSuspenseProps> = ({ children }) => (
  <ChunkErrorBoundary>
    <Suspense fallback={<div className="min-h-[20vh] py-12 text-center text-sm text-text-light">Loading...</div>}>
      {children}
    </Suspense>
  </ChunkErrorBoundary>
)

export default RouteSuspense

