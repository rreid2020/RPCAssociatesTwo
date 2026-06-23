import { FC, useCallback, useEffect, useRef, useState } from 'react'

export type HorizontalScrollTab = {
  id: string
  title: string
  meta?: string
  icon?: string
  badge?: string
}

export const HorizontalScrollTabBar: FC<{
  tabs: HorizontalScrollTab[]
  activeId: string | null
  onChange: (id: string) => void
  ariaLabel: string
}> = ({ tabs, activeId, onChange, ariaLabel }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollState, { passive: true })
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      observer.disconnect()
    }
  }, [tabs, updateScrollState])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !activeId) return
    const activeTab = el.querySelector<HTMLElement>(`[data-tab-id="${activeId}"]`)
    activeTab?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' })
    updateScrollState()
  }, [activeId, tabs, updateScrollState])

  const scrollBy = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = Math.max(180, Math.floor(el.clientWidth * 0.65))
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <div className="flex items-stretch border-b border-border bg-background/50">
      <button
        type="button"
        className={`shrink-0 px-2 text-lg text-text-light transition-opacity ${
          canScrollLeft ? 'hover:text-text' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Scroll tabs left"
        onClick={() => scrollBy('left')}
        tabIndex={canScrollLeft ? 0 : -1}
      >
        ‹
      </button>

      <div
        ref={scrollRef}
        className="flex min-w-0 flex-1 gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => {
          const isActive = activeId === tab.id
          const meta = tab.meta || tab.badge
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              data-tab-id={tab.id}
              aria-selected={isActive}
              className={`shrink-0 rounded-md px-3 py-2 text-left transition-colors ${
                isActive
                  ? 'bg-primary-dark text-white shadow-sm'
                  : 'border border-border bg-white text-text hover:bg-background'
              }`}
              onClick={() => onChange(tab.id)}
            >
              <span className="flex items-center gap-2">
                {tab.icon && <span className="text-base leading-none" aria-hidden>{tab.icon}</span>}
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-snug whitespace-nowrap">{tab.title}</span>
                  {meta && (
                    <span className={`mt-0.5 block text-[11px] leading-tight whitespace-nowrap ${
                      isActive ? 'text-white/80' : 'text-text-light'
                    }`}
                    >
                      {meta}
                    </span>
                  )}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        className={`shrink-0 px-2 text-lg text-text-light transition-opacity ${
          canScrollRight ? 'hover:text-text' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Scroll tabs right"
        onClick={() => scrollBy('right')}
        tabIndex={canScrollRight ? 0 : -1}
      >
        ›
      </button>
    </div>
  )
}
