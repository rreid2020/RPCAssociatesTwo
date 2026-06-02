import { FC, ReactNode, Suspense } from 'react'
import PageLoadingSkeleton from '../shared/loading/PageLoadingSkeleton'

interface RouteSuspenseProps {
  children: ReactNode
}

const RouteSuspense: FC<RouteSuspenseProps> = ({ children }) => (
  <Suspense
    fallback={
      <div className="min-h-[20vh] py-12 px-4 max-w-3xl mx-auto">
        <PageLoadingSkeleton variant="default" />
      </div>
    }
  >
    {children}
  </Suspense>
)

export default RouteSuspense

