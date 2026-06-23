import { FC, ReactNode } from 'react'
import type { InterviewArtifactSection } from './interviewArtifactSections'
import { HorizontalScrollTabBar } from './HorizontalScrollTabBar'

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
    <div className="overflow-hidden rounded-md border border-border bg-white shadow-sm">
      <HorizontalScrollTabBar
        tabs={sections.map((section) => ({
          id: section.id,
          title: section.title,
          icon: section.icon,
          meta: sectionMeta?.(section) || `${section.items.length} item(s)`
        }))}
        activeId={activeSection?.id || null}
        onChange={onSectionChange}
        ariaLabel="Artifact sections"
      />

      {activeSection && (
        <section key={activeSection.id} role="tabpanel" className="w-full min-w-0">
          <div className="border-b border-border bg-background/40 px-4 py-3">
            <p className="text-sm text-text">{activeSection.summary}</p>
          </div>
          <div className="space-y-4 p-4">
            {children(activeSection)}
          </div>
        </section>
      )}
    </div>
  )
}
