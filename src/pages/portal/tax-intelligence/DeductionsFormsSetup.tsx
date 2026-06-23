import { FC, useEffect, useMemo, useState } from 'react'
import type { ReturnInterviewTopicsResponse } from '../../../lib/taxIntelligenceApi'
import { buildInterviewArtifactSections, type InterviewArtifactSection } from './interviewArtifactSections'
import { resolveDeductionKeyForTopic } from './interviewTopicNavigation'
import { TabbedArtifactLayout } from './TabbedArtifactLayout'
import {
  TaxWorksheetCurrencyInput,
  TaxWorksheetRow,
  TaxWorksheetSectionHeader
} from './TaxWorksheet'

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

  const renderField = (field: T1DeductionField, striped: boolean) => (
    <TaxWorksheetRow
      key={field.key}
      label={field.label}
      lineRef={field.lineRef}
      helpText={field.isCredit ? 'Non-refundable credit amount for this line.' : 'Deduction amount for this line.'}
      striped={striped}
    >
      <div data-deduction-key={field.key}>
        <TaxWorksheetCurrencyInput
          value={Number(deductionFormValues[field.key]?.[returnRole] || 0) || undefined}
          onChange={(nextValue) => {
            setDeductionFormValues((prev) => ({
              ...prev,
              [field.key]: {
                self: Number(prev[field.key]?.self || 0),
                spouse: Number(prev[field.key]?.spouse || 0),
                [returnRole]: Number(nextValue || 0)
              }
            }))
          }}
        />
      </div>
    </TaxWorksheetRow>
  )

  const renderWorksheet = (title: string, description: string, fields: readonly T1DeductionField[]) => (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <TaxWorksheetSectionHeader title={title} description={description} />
      <div className="divide-y divide-border/80">
        {fields.map((field, index) => renderField(field, index % 2 === 1))}
      </div>
    </div>
  )

  const renderSectionFields = (section: InterviewArtifactSection) => {
    const keys = deductionKeysForSection(section)
    const fields = deductionFields.filter((field) => keys.has(field.key))
    const unmappedItems = section.items.filter((item) => !resolveDeductionKeyForTopic(item.topicId, item.formCodes))

    return (
      <>
        {fields.length > 0 ? (
          renderWorksheet(
            'T1 deduction and credit inputs',
            'Enter amounts for the deduction and credit lines selected in interview setup.',
            fields
          )
        ) : (
          <p className="text-xs text-text-light">No T1 line inputs are mapped for this category yet.</p>
        )}
        {unmappedItems.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border bg-background/40">
            <TaxWorksheetSectionHeader
              title="Related schedules and forms"
              description="These interview topics reference schedules or forms that are not entered on a single T1 line in this screen."
            />
            <ul className="divide-y divide-border px-4 py-2">
              {unmappedItems.map((item) => (
                <li key={item.topicId} className="py-2 text-xs text-text-light">
                  <span className="font-medium text-text">{item.label}</span>
                  {item.formCodes.length > 0 && (
                    <span className="ml-1">({item.formCodes.join(', ')})</span>
                  )}
                  <span className="mt-0.5 block">{item.description}</span>
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
          {(activeSection) => renderSectionFields(activeSection)}
        </TabbedArtifactLayout>
      ) : (
        renderWorksheet(
          'T1 deduction and credit inputs',
          'Complete interview setup to organize deductions by category, or enter common lines below.',
          deductionFields
        )
      )}

      {sections.length > 0 && otherFields.length > 0 && (
        renderWorksheet(
          'Other deduction and credit lines',
          'Common lines not tied to your selected interview topics.',
          otherFields
        )
      )}
    </div>
  )
}
