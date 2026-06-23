import { FC, ReactNode } from 'react'
import type { InterviewArtifactSection } from './interviewArtifactSections'

export const TabbedArtifactLayout: FC<{
  sections: InterviewArtifactSection[]
  activeSectionId: string | null
  onSectionChange: (sectionId: string) => void
  sectionMeta?: (section: InterviewArtifactSection) => string
  children: (activeSection: InterviewArtifactSection) => ReactNode
}> = ({ sections, activeSectionId, onSectionChange, sectionMeta, children }) => {
  const activeSection = sections.find((section) => section.id === activeSectionId) || sections[0] || null

  if (sections.length === 0) {
    return (
      <p className="text-sm text-text-light border border-border rounded-md p-4 bg-background/40">
        No items were selected in interview setup for this step. Go back to Interview setup to choose topics, or add slips manually below.
      </p>
    )
  }

  return (
    <div className="border border-border rounded-md overflow-hidden bg-white shadow-sm">
      <div
        className="flex gap-1 overflow-x-auto border-b border-border bg-background/60 p-2 md:hidden"
        role="tablist"
        aria-label="Artifact sections"
      >
        {sections.map((section) => {
          const isActive = activeSection?.id === section.id
          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`shrink-0 rounded-md px-3 py-2 text-left text-xs transition-colors ${
                isActive
                  ? 'bg-primary-dark text-white'
                  : 'border border-border bg-white text-text hover:bg-background'
              }`}
              onClick={() => onSectionChange(section.id)}
            >
              <span className="mr-1" aria-hidden>{section.icon}</span>
              <span className="font-medium">{section.title}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col md:flex-row md:items-stretch">
        <nav
          className="hidden md:flex md:w-56 lg:w-64 shrink-0 flex-col border-b md:border-b-0 md:border-r border-border bg-background/30"
          role="tablist"
          aria-label="Artifact sections"
        >
          {sections.map((section) => {
            const isActive = activeSection?.id === section.id
            const meta = sectionMeta?.(section) || `${section.items.length} item(s)`
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`flex items-start gap-2 border-b border-border/70 px-3 py-3 text-left text-sm transition-colors last:border-b-0 ${
                  isActive
                    ? 'bg-primary-dark text-white'
                    : 'text-text hover:bg-white'
                }`}
                onClick={() => onSectionChange(section.id)}
              >
                <span className="text-lg leading-none mt-0.5 shrink-0" aria-hidden>{section.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-snug">{section.title}</span>
                  <span className={`mt-0.5 block text-[11px] leading-tight ${isActive ? 'text-white/80' : 'text-text-light'}`}>
                    {meta}
                  </span>
                </span>
              </button>
            )
          })}
        </nav>

        {activeSection && (
          <section
            key={activeSection.id}
            role="tabpanel"
            className="flex-1 min-w-0"
          >
            <div className="px-3 py-3 border-b border-border bg-background/40">
              <p className="text-sm text-text">{activeSection.summary}</p>
            </div>
            <div className="p-3 space-y-4">
              {children(activeSection)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
