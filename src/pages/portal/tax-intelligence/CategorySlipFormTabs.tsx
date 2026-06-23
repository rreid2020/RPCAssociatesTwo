import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { FormWorksheetSchema, FormWorksheetValuesState, SlipSchema } from '../../../lib/taxIntelligenceApi'
import {
  sectionSlipEntries,
  type InterviewArtifactSection
} from './interviewArtifactSections'
import { HorizontalScrollTabBar } from './HorizontalScrollTabBar'
import { ScheduleFormWorksheet } from './ScheduleFormWorksheet'
import { SlipWorksheetForm, slipBoxEntriesForRow, type SlipRow } from './slipEntryUi'

type RowRef = { row: SlipRow; idx: number }

export const CategorySlipFormTabs: FC<{
  section: InterviewArtifactSection
  roleSlipRows: RowRef[]
  slipSchemasByCode: Record<string, SlipSchema>
  formSchemasByCode: Record<string, FormWorksheetSchema>
  loadingFormWorksheets: boolean
  formWorksheetValues: FormWorksheetValuesState
  returnRole: 'self' | 'spouse'
  filteredSlipSchemas: SlipSchema[]
  saving: boolean
  setManualSlipRows: React.Dispatch<React.SetStateAction<SlipRow[]>>
  onFormWorksheetChange: (formCode: string, fieldCode: string, value: string | number | undefined) => void
  onAddSlip: (slipCode: string) => void
  onEnsureSlipRow: (slipCode: string) => void
  onRemoveSlip: (target: { idx: number; manualSlipId?: string }) => void
  onUpdateSlipRowCode: (idx: number, slipCode: string) => void
  onAddCustomBox: (idx: number) => void
}> = ({
  section,
  roleSlipRows,
  slipSchemasByCode,
  formSchemasByCode,
  loadingFormWorksheets,
  formWorksheetValues,
  returnRole,
  filteredSlipSchemas,
  saving,
  setManualSlipRows,
  onFormWorksheetChange,
  onAddSlip,
  onEnsureSlipRow,
  onRemoveSlip,
  onUpdateSlipRowCode,
  onAddCustomBox
}) => {
  const formEntries = useMemo(() => {
    const entries = sectionSlipEntries(section)
    return entries.map((entry) => {
      const schema = slipSchemasByCode[entry.slipCode.toUpperCase()]
      const isForm = entry.entryKind === 'form'
      return {
        ...entry,
        tabTitle: entry.slipCode,
        tabMeta: isForm ? 'Schedule' : (schema?.name || entry.label)
      }
    })
  }, [section, slipSchemasByCode])

  const topicsWithoutArtifacts = useMemo(
    () => section.items.filter((item) => item.slipCodes.length === 0 && item.formCodes.length === 0),
    [section]
  )

  const [activeFormCode, setActiveFormCode] = useState<string | null>(formEntries[0]?.slipCode || null)
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null)
  const prevInstanceCountRef = useRef(0)

  useEffect(() => {
    if (!formEntries.length) {
      setActiveFormCode(null)
      setActiveInstanceId(null)
      return
    }
    if (!activeFormCode || !formEntries.some((entry) => entry.slipCode === activeFormCode)) {
      setActiveFormCode(formEntries[0].slipCode)
    }
  }, [formEntries, activeFormCode])

  const instancesForActiveForm = useMemo(() => {
    if (!activeFormCode) return []
    return roleSlipRows.filter(({ row }) => row.slipCode.toUpperCase() === activeFormCode.toUpperCase())
  }, [roleSlipRows, activeFormCode])

  const activeEntry = formEntries.find((entry) => entry.slipCode === activeFormCode)
  const activeEntryIsSlip = activeEntry?.entryKind === 'slip'
  const activeInstance = activeEntryIsSlip
    ? (instancesForActiveForm.find(({ row }) => row.manualSlipId === activeInstanceId)
      || instancesForActiveForm[0])
    : undefined

  const ensureActiveSlipRow = useCallback(() => {
    if (!activeFormCode || !activeEntryIsSlip) return
    onEnsureSlipRow(activeFormCode)
  }, [activeFormCode, activeEntryIsSlip, onEnsureSlipRow])

  useLayoutEffect(() => {
    ensureActiveSlipRow()
  }, [ensureActiveSlipRow])

  useEffect(() => {
    if (instancesForActiveForm.length > prevInstanceCountRef.current) {
      const last = instancesForActiveForm[instancesForActiveForm.length - 1]
      setActiveInstanceId(last.row.manualSlipId || null)
    }
    prevInstanceCountRef.current = instancesForActiveForm.length
  }, [instancesForActiveForm])

  useEffect(() => {
    if (instancesForActiveForm.length === 0) {
      setActiveInstanceId(null)
      return
    }
    const stillExists = instancesForActiveForm.some(({ row }) => row.manualSlipId === activeInstanceId)
    if (!activeInstanceId || !stillExists) {
      setActiveInstanceId(instancesForActiveForm[0].row.manualSlipId || null)
    }
  }, [instancesForActiveForm, activeInstanceId])

  const handleFormChange = useCallback((slipCode: string) => {
    setActiveFormCode(slipCode)
    const entry = formEntries.find((candidate) => candidate.slipCode === slipCode)
    if (entry?.entryKind === 'slip') {
      onEnsureSlipRow(slipCode)
    }
  }, [formEntries, onEnsureSlipRow])

  const activeFormValues = useMemo(() => {
    if (!activeFormCode) return {}
    const bucket = formWorksheetValues[activeFormCode.toUpperCase()]
    return bucket?.[returnRole] || {}
  }, [formWorksheetValues, activeFormCode, returnRole])

  const handleFormWorksheetFieldChange = useCallback((fieldCode: string, value: string | number | undefined) => {
    if (!activeFormCode) return
    onFormWorksheetChange(activeFormCode, fieldCode, value)
  }, [activeFormCode, onFormWorksheetChange])

  const handleAddInstance = useCallback(() => {
    if (!activeFormCode || !activeEntryIsSlip) return
    onAddSlip(activeFormCode)
  }, [activeFormCode, activeEntryIsSlip, onAddSlip])

  if (formEntries.length === 0 && topicsWithoutArtifacts.length === 0) {
    return (
      <p className="text-xs text-text-light border border-dashed border-border rounded-md p-3">
        No income slips are required for this category based on your interview selections.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {formEntries.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-background/30 shadow-sm">
          <HorizontalScrollTabBar
            tabs={formEntries.map((entry) => {
              if (entry.entryKind === 'form') {
                return {
                  id: entry.slipCode,
                  title: entry.tabTitle,
                  meta: entry.tabMeta
                }
              }
              const count = roleSlipRows.filter(({ row }) => row.slipCode.toUpperCase() === entry.slipCode.toUpperCase()).length
              return {
                id: entry.slipCode,
                title: entry.tabTitle,
                meta: count > 0 ? `${count} slip${count === 1 ? '' : 's'}` : entry.tabMeta
              }
            })}
            activeId={activeFormCode}
            onChange={handleFormChange}
            ariaLabel={`${section.title} slip forms`}
          />

          <div className="space-y-3 p-4">
            {activeEntry && (
              <p className="text-xs text-text-light">{activeEntry.description}</p>
            )}

            {activeEntry?.entryKind === 'form' && activeEntry && (
              <ScheduleFormWorksheet
                entry={activeEntry}
                schema={formSchemasByCode[activeEntry.slipCode.toUpperCase()] || null}
                returnRole={returnRole}
                values={activeFormValues}
                loading={loadingFormWorksheets}
                onChange={handleFormWorksheetFieldChange}
              />
            )}

            {activeEntryIsSlip && instancesForActiveForm.length > 1 && (
              <HorizontalScrollTabBar
                tabs={instancesForActiveForm.map(({ row }, index) => ({
                  id: row.manualSlipId || `instance-${index}`,
                  title: row.payerName?.trim() || `Slip ${index + 1}`,
                  meta: row.taxYear ? String(row.taxYear) : undefined
                }))}
                activeId={activeInstance?.row.manualSlipId || instancesForActiveForm[0]?.row.manualSlipId || null}
                onChange={setActiveInstanceId}
                ariaLabel={`${activeFormCode || 'Slip'} instances`}
              />
            )}

            {activeEntryIsSlip && activeInstance && activeFormCode && (() => {
              const def = slipSchemasByCode[activeFormCode.toUpperCase()]
              if (!def) {
                return (
                  <div className="border border-amber-200 rounded-md p-3 bg-amber-50">
                    <p className="text-sm font-medium text-text">{activeFormCode}</p>
                    <p className="text-xs text-amber-800 mt-1">Slip schema not loaded yet. Refresh the page or add this slip from the catalog below.</p>
                  </div>
                )
              }
              const { row, idx } = activeInstance
              return (
                <SlipWorksheetForm
                  schema={def}
                  row={row}
                  boxFields={slipBoxEntriesForRow(row, def)}
                  filteredSlipSchemas={filteredSlipSchemas}
                  saving={saving}
                  showDelete={instancesForActiveForm.length > 1}
                  lockSlipType
                  onPayerNameChange={(value) => {
                    setManualSlipRows((prev) => {
                      const next = [...prev]
                      next[idx] = { ...next[idx], payerName: value }
                      return next
                    })
                  }}
                  onTaxYearChange={(value) => {
                    setManualSlipRows((prev) => {
                      const next = [...prev]
                      next[idx] = { ...next[idx], taxYear: value }
                      return next
                    })
                  }}
                  onSlipCodeChange={(slipCode) => onUpdateSlipRowCode(idx, slipCode)}
                  onBoxChange={(boxCode, nextValue) => {
                    setManualSlipRows((prev) => {
                      const next = [...prev]
                      const boxes = { ...next[idx].boxes }
                      if (nextValue == null) delete boxes[boxCode]
                      else boxes[boxCode] = nextValue
                      next[idx] = { ...next[idx], boxes }
                      return next
                    })
                  }}
                  onRemove={() => { void onRemoveSlip({ idx, manualSlipId: row.manualSlipId }) }}
                  onAddCustomBox={() => onAddCustomBox(idx)}
                />
              )
            })()}

            {activeEntryIsSlip && activeFormCode && (
              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
                <button
                  type="button"
                  className="btn btn--secondary text-sm px-3 py-2"
                  onClick={handleAddInstance}
                  disabled={saving}
                >
                  Add another {activeFormCode}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {topicsWithoutArtifacts.map((item) => (
        <div key={item.topicId} className="rounded-lg border border-border bg-background/40 p-3">
          <p className="text-sm font-medium text-text">{item.label}</p>
          <p className="mt-0.5 text-xs text-text-light">{item.description}</p>
          <p className="mt-1 text-xs text-text-light">Enter amounts in the other income section below (line 13000).</p>
        </div>
      ))}
    </div>
  )
}
