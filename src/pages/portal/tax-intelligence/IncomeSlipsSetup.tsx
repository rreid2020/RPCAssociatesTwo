import { FC, useEffect, useMemo, useState } from 'react'
import type { ReturnInterviewTopicsResponse, SlipSchema } from '../../../lib/taxIntelligenceApi'
import {
  buildInterviewArtifactSections,
  countSectionSlipsAdded,
  sectionSlipCodes,
  type InterviewArtifactSection
} from './interviewArtifactSections'
import { TabbedArtifactLayout } from './TabbedArtifactLayout'
import { CategorySlipFormTabs } from './CategorySlipFormTabs'
import { SlipWorksheetForm, slipBoxEntriesForRow, type SlipRow } from './slipEntryUi'

export type IncomeSlipsSetupProps = {
  taxpayerName: string
  returnRole: 'self' | 'spouse'
  returnId?: string
  interviewSetup: ReturnInterviewTopicsResponse | null
  manualSlipRows: SlipRow[]
  setManualSlipRows: React.Dispatch<React.SetStateAction<SlipRow[]>>
  slipSchemas: SlipSchema[]
  slipSchemasByCode: Record<string, SlipSchema>
  filteredSlipSchemas: SlipSchema[]
  completeSlipSchemas: SlipSchema[]
  catalogOnlySlipSchemas: SlipSchema[]
  loadingSlipSchemas: boolean
  slipSearch: string
  setSlipSearch: (value: string) => void
  newSlipCode: string
  setNewSlipCode: (value: string) => void
  saving: boolean
  onAddSlip: (slipCode: string) => void
  onEnsureSlipRow: (slipCode: string) => void
  onRemoveSlip: (target: { idx: number; manualSlipId?: string }) => void
  onUpdateSlipRowCode: (idx: number, slipCode: string) => void
  onAddCustomBox: (idx: number) => void
  documents: Array<{ id: string; file_name: string }>
  selectedDocumentId: string
  setSelectedDocumentId: (value: string) => void
  onImportFromDocument: () => void
  extractionPreview: React.ReactNode
}

export const IncomeSlipsSetup: FC<IncomeSlipsSetupProps> = ({
  taxpayerName,
  returnRole,
  returnId,
  interviewSetup,
  manualSlipRows,
  setManualSlipRows,
  slipSchemas,
  slipSchemasByCode,
  filteredSlipSchemas,
  completeSlipSchemas,
  catalogOnlySlipSchemas,
  loadingSlipSchemas,
  slipSearch,
  setSlipSearch,
  newSlipCode,
  setNewSlipCode,
  saving,
  onAddSlip,
  onEnsureSlipRow,
  onRemoveSlip,
  onUpdateSlipRowCode,
  onAddCustomBox,
  documents,
  selectedDocumentId,
  setSelectedDocumentId,
  onImportFromDocument,
  extractionPreview
}) => {
  const sections = useMemo(
    () => buildInterviewArtifactSections(interviewSetup, ['Income']),
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

  const roleSlipRows = useMemo(
    () => manualSlipRows
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) => row.taxpayerRole === returnRole),
    [manualSlipRows, returnRole]
  )

  const addedSlipCodes = useMemo(() => {
    const codes = new Set<string>()
    for (const { row } of roleSlipRows) {
      codes.add(row.slipCode.toUpperCase())
    }
    return codes
  }, [roleSlipRows])

  const renderFallbackSlips = () => {
    if (roleSlipRows.length === 0) {
      return (
        <p className="text-xs text-text-light border border-dashed border-border rounded-md p-3">
          No slip rows yet. Add slips from interview topics or the catalog below.
        </p>
      )
    }
    return roleSlipRows.map(({ row, idx }) => {
      const def = slipSchemasByCode[row.slipCode.toUpperCase()]
      if (!def) return null
      return (
        <SlipWorksheetForm
          key={row.manualSlipId || `slip-${idx}`}
          schema={def}
          row={row}
          boxFields={slipBoxEntriesForRow(row, def)}
          filteredSlipSchemas={filteredSlipSchemas}
          saving={saving}
          showDelete
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
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary-dark">Income &amp; CRA slips</h2>
        <p className="text-xs text-text-light mt-1">
          Entering income for <span className="font-semibold text-text">{taxpayerName}</span>.
          Choose a category, then complete each slip form you selected in interview setup.
        </p>
      </div>

      {sections.length > 0 ? (
        <div id="rb-income-slips">
          <TabbedArtifactLayout
            sections={sections}
            activeSectionId={activeSectionId}
            onSectionChange={setActiveSectionId}
            sectionMeta={(section) => {
              const total = sectionSlipCodes(section).size
              const added = countSectionSlipsAdded(section, addedSlipCodes)
              return total > 0 ? `${added}/${total} form or slip type(s)` : `${section.items.length} topic(s)`
            }}
          >
            {(activeSection: InterviewArtifactSection) => (
              <CategorySlipFormTabs
                key={activeSection.id}
                section={activeSection}
                returnId={returnId}
                roleSlipRows={roleSlipRows}
                slipSchemasByCode={slipSchemasByCode}
                filteredSlipSchemas={filteredSlipSchemas}
                saving={saving}
                setManualSlipRows={setManualSlipRows}
                onAddSlip={onAddSlip}
                onEnsureSlipRow={onEnsureSlipRow}
                onRemoveSlip={onRemoveSlip}
                onUpdateSlipRowCode={onUpdateSlipRowCode}
                onAddCustomBox={onAddCustomBox}
              />
            )}
          </TabbedArtifactLayout>
        </div>
      ) : (
        <div id="rb-income-slips" className="border border-border rounded-md p-3 bg-background/50 space-y-3">
          <p className="text-sm text-text-light">
            Complete interview setup to see organized slip categories, or add slips manually below.
          </p>
          {renderFallbackSlips()}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-2">
        <select
          className="border border-border rounded-md px-3 py-2 text-sm flex-1"
          value={selectedDocumentId}
          onChange={(e) => setSelectedDocumentId(e.target.value)}
        >
          <option value="">Import from Documents…</option>
          {documents.map((d) => <option key={d.id} value={d.id}>{d.file_name}</option>)}
        </select>
        <button
          type="button"
          className="btn btn--secondary text-sm px-3 py-2"
          onClick={onImportFromDocument}
          disabled={saving || !selectedDocumentId}
        >
          {saving && selectedDocumentId ? 'Extracting…' : 'Extract from document'}
        </button>
      </div>

      {extractionPreview}

      <div className="border border-border rounded-md p-3 bg-background/50 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-primary-dark">Add another slip</h3>
          <p className="text-xs text-text-light mt-1">
            Search the full CRA slip catalog for slips not listed in your interview topics.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <input
            className="border border-border rounded-md px-3 py-2 text-sm flex-1"
            placeholder="Search slips by code or name"
            value={slipSearch}
            onChange={(e) => setSlipSearch(e.target.value)}
          />
          <select
            className="border border-border rounded-md px-3 py-2 text-sm flex-1"
            value={newSlipCode}
            onChange={(e) => setNewSlipCode(e.target.value)}
            disabled={loadingSlipSchemas || filteredSlipSchemas.length === 0}
          >
            {completeSlipSchemas.length > 0 && (
              <optgroup label="Ready — predefined boxes">
                {completeSlipSchemas.map((def) => (
                  <option key={def.code} value={def.code}>
                    {def.code} - {def.name}
                  </option>
                ))}
              </optgroup>
            )}
            {catalogOnlySlipSchemas.length > 0 && (
              <optgroup label="Catalog only — add boxes manually">
                {catalogOnlySlipSchemas.map((def) => (
                  <option key={def.code} value={def.code}>
                    {def.code} - {def.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <button
            type="button"
            className="btn btn--secondary text-sm px-3 py-2"
            onClick={() => onAddSlip(newSlipCode)}
            disabled={loadingSlipSchemas || !newSlipCode}
          >
            Add slip
          </button>
        </div>
        {loadingSlipSchemas && (
          <p className="text-xs text-text-light">Loading CRA slip catalog…</p>
        )}
        {!loadingSlipSchemas && slipSchemas.length === 0 && (
          <p className="text-xs text-amber-700">No slip schemas are available yet. Try refreshing the page.</p>
        )}
      </div>
    </div>
  )
}
