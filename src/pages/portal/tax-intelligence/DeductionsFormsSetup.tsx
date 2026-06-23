import { FC, useEffect, useMemo, useState } from 'react'
import type { ReturnInterviewTopicsResponse } from '../../../lib/taxIntelligenceApi'
import { buildInterviewArtifactSections, type InterviewArtifactSection } from './interviewArtifactSections'
import { resolveDeductionKeyForTopic } from './interviewTopicNavigation'
import { TabbedArtifactLayout } from './TabbedArtifactLayout'

export type T1DeductionField = {
  key: string
  label: string
  lineRef: string
  category: string
  isCredit: boolean
}

export type DeductionFormValues = Record<string, { self: number; spouse: number }>

export type DeductionsFormsSetupProps = {
  returnRole: 'self' | 'spouse'
  interviewSetup: ReturnInterviewTopicsResponse | null
  deductionFields: readonly T1DeductionField[]
  deductionFormValues: DeductionFormValues
  setDeductionFormValues: React.Dispatch<React.SetStateAction<DeductionFormValues>>
}

function deductionKeysForSection (section: InterviewArtifactSection): Set<string> {
  const keys = new Set<string>()
  for (const item of section.items) {
    const key = resolveDeductionKeyForTopic(item.topicId, item.formCodes)
    if (key) keys.add(key)
  }
  return keys
}

export const DeductionsFormsSetup: FC<DeductionsFormsSetupProps> = ({
  returnRole,
  interviewSetup,
  deductionFields,
  deductionFormValues,
  setDeductionFormValues
}) => {
  const sections = useMemo(
    () => buildInterviewArtifactSections(interviewSetup, ['Deductions']),
    [interviewSetup]
  )
  const [activeSectionId, setActiveSectionId] = useState<string | null>(sections[0]?.id || null)

  useEffect(() => {
    if (!sections.length) {
      setActiveSectionId(null)
      return
    }
    if (!activeSectionId || !sections.some((section) => section.id === activeSectionId)) {
      setActiveSectionId(sections[0].id)
    }
  }, [sections, activeSectionId])

  const allMappedKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const section of sections) {
      for (const key of deductionKeysForSection(section)) keys.add(key)
    }
    return keys
  }, [sections])

  const renderField = (field: T1DeductionField) => (
    <label
      key={field.key}
      data-deduction-key={field.key}
      className="text-xs text-text-light border border-border rounded-md p-2 bg-white"
    >
      <span className="font-medium text-text block">Line {field.lineRef} - {field.label}</span>
      <span className="block text-[11px] mt-0.5">{field.isCredit ? 'Non-refundable credit input' : 'Net income deduction input'}</span>
      <input
        type="number"
        className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
        value={Number(deductionFormValues[field.key]?.[returnRole] || 0)}
        onChange={(e) => {
          const n = Number(e.target.value)
          setDeductionFormValues((prev) => ({
            ...prev,
            [field.key]: {
              self: Number(prev[field.key]?.self || 0),
              spouse: Number(prev[field.key]?.spouse || 0),
              [returnRole]: Number.isFinite(n) ? n : 0
            }
          }))
        }}
      />
    </label>
  )

  const renderSectionFields = (section: InterviewArtifactSection) => {
    const keys = deductionKeysForSection(section)
    const fields = deductionFields.filter((field) => keys.has(field.key))
    const unmappedItems = section.items.filter((item) => !resolveDeductionKeyForTopic(item.topicId, item.formCodes))

    return (
      <>
        {fields.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {fields.map(renderField)}
          </div>
        ) : (
          <p className="text-xs text-text-light">No T1 line inputs are mapped for this category yet.</p>
        )}
        {unmappedItems.length > 0 && (
          <div className="border border-border rounded-md p-3 bg-background/40 space-y-2">
            <h4 className="text-xs font-semibold text-primary-dark">Related schedules and forms</h4>
            <ul className="space-y-1">
              {unmappedItems.map((item) => (
                <li key={item.topicId} className="text-xs text-text-light">
                  <span className="font-medium text-text">{item.label}</span>
                  {item.formCodes.length > 0 && (
                    <span className="ml-1">({item.formCodes.join(', ')})</span>
                  )}
                  <span className="block mt-0.5">{item.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    )
  }

  const otherFields = deductionFields.filter((field) => !allMappedKeys.has(field.key))

  return (
    <div id="rb-deductions" className="space-y-4">
      {sections.length > 0 ? (
        <TabbedArtifactLayout
          sections={sections}
          activeSectionId={activeSectionId}
          onSectionChange={setActiveSectionId}
          sectionMeta={(section) => {
            const keys = deductionKeysForSection(section)
            return keys.size > 0 ? `${keys.size} line input(s)` : `${section.items.length} topic(s)`
          }}
        >
          {(activeSection) => (
            <div>
              <h3 className="text-sm font-semibold text-primary-dark mb-2">T1 deduction and credit inputs</h3>
              {renderSectionFields(activeSection)}
            </div>
          )}
        </TabbedArtifactLayout>
      ) : (
        <div className="border border-border rounded-md p-3 bg-background/50 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-primary-dark">T1 deduction and credit inputs</h3>
            <p className="text-xs text-text-light mt-1">Complete interview setup to organize deductions by category, or enter all lines below.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {deductionFields.map(renderField)}
          </div>
        </div>
      )}

      {sections.length > 0 && otherFields.length > 0 && (
        <div className="border border-border rounded-md p-3 bg-background/50 space-y-2">
          <h3 className="text-sm font-semibold text-primary-dark">Other deduction and credit lines</h3>
          <p className="text-xs text-text-light">Common lines not tied to your selected interview topics.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {otherFields.map(renderField)}
          </div>
        </div>
      )}
    </div>
  )
}
