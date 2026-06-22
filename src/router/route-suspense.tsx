import { FC, ReactNode, Suspense } from 'react'
import PageLoadingSkeleton from '../shared/loading/PageLoadingSkeleton'

interface RouteSuspenseProps {
  children: ReactNode
  fullScreen?: boolean
}

const RouteSuspense: FC<RouteSuspenseProps> = ({ children, fullScreen = true }) => (
  <Suspense
    fallback={
      <div className={fullScreen ? 'min-h-screen flex items-center justify-center bg-background px-6' : 'min-h-[20vh] py-12 px-4 max-w-3xl mx-auto'}>
        <div className={fullScreen ? 'w-full max-w-md' : 'w-full'}>
          <PageLoadingSkeleton variant="default" />
        </div>
      </div>
    }
  >
    {children}
  </Suspense>
)

export default RouteSuspense

