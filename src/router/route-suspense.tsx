import { FC, ReactNode, Suspense } from 'react'

interface RouteSuspenseProps {
  children: ReactNode
}

const RouteSuspense: FC<RouteSuspenseProps> = ({ children }) => (
  <Suspense fallback={<div className="min-h-[20vh] py-12 text-center text-sm text-text-light">Loading...</div>}>
    {children}
  </Suspense>
)

export default RouteSuspense

