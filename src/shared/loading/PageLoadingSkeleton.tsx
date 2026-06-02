import { FC } from 'react'

type PageLoadingSkeletonProps = {
  variant?: 'default' | 'table' | 'cards'
}

const PageLoadingSkeleton: FC<PageLoadingSkeletonProps> = ({ variant = 'default' }) => {
  if (variant === 'table') {
    return (
      <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading content">
        <div className="flex flex-wrap gap-2">
          <div className="h-9 w-28 rounded-md bg-border/70" />
          <div className="h-9 w-24 rounded-md bg-border/70" />
          <div className="h-9 w-32 rounded-md bg-border/70" />
        </div>
        <div className="h-10 w-full max-w-md rounded-md bg-border/60" />
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="h-10 bg-border/50" />
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-11 border-t border-border/60 bg-white even:bg-background/40" />
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse" aria-busy="true" aria-label="Loading content">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 rounded-lg border border-border bg-border/30" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3 animate-pulse" aria-busy="true" aria-label="Loading content">
      <div className="h-4 w-2/3 max-w-sm rounded bg-border/70" />
      <div className="h-4 w-full max-w-lg rounded bg-border/50" />
      <div className="h-4 w-5/6 max-w-md rounded bg-border/40" />
    </div>
  )
}

export default PageLoadingSkeleton
