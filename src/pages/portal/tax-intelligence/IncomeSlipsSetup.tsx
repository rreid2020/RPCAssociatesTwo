import { FC, useEffect, useMemo, useState } from 'react'
import type { ReturnInterviewTopicsResponse, SlipSchema } from '../../../lib/taxIntelligenceApi'
import {
  buildInterviewArtifactSections,
  countSectionSlipsAdded,
  pickTopicSlipCode,
  sectionSlipCodes,
  type InterviewArtifactItem,
  type InterviewArtifactSection
} from './interviewArtifactSections'
import { TabbedArtifactLayout } from './TabbedArtifactLayout'
import { SlipBoxFieldGrid, slipBoxEntriesForRow, type SlipRow } from './slipEntryUi'

export type IncomeSlipsSetupProps = {
  taxpayerName: string
  returnRole: 'self' | 'spouse'
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
  onAddSuggestedSlip: (slipCode: string) => void
  onRemoveSlip: (target: { idx: number; manualSlipId?: string }) => void
  onUpdateSlipRowCode: (idx: number, slipCode: string) => void
  onAddCustomBox: (idx: number) => void
  documents: Array<{ id: string; file_name: string }>
  selectedDocumentId: string
  setSelectedDocumentId: (value: string) => void
  onImportFromDocument: () => void
  extractionPreview: React.ReactNode
}

const ArtifactTopicRow: FC<{
  item: InterviewArtifactItem
  slipRows: SlipRow[]
  saving: boolean
  onAddSlip: (slipCode: string) => void
}> = ({ item, slipRows, saving, onAddSlip }) => {
  const slipCodes = item.slipCodes.map((code) => String(code || '').trim().toUpperCase()).filter(Boolean)
  const primary = pickTopicSlipCode(item)

  if (slipCodes.length === 0) {
    return (
      <li className="flex items-start gap-2 border border-border rounded-md p-2 bg-white">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text">{item.label}</p>
          <p className="text-xs text-text-light mt-0.5">{item.description}</p>
          <p className="text-xs text-text-light mt-1">Use the other income rows below for line 13000 amounts.</p>
        </div>
      </li>
    )
  }

  if (primary && slipCodes.length <= 2) {
    const added = slipRows.some((row) => row.slipCode.toUpperCase() === primary)
    return (
      <li className="flex items-start gap-2 border border-border rounded-md p-2 bg-white">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text">{item.label}</p>
          <p className="text-xs text-text-light mt-0.5">{item.description}</p>
        </div>
        <button
          type="button"
          className={`shrink-0 text-xs px-2 py-1 rounded border ${
            added ? 'border-green-600 bg-green-50 text-green-800' : 'border-primary-dark/30 bg-primary-dark/5 text-primary-dark hover:bg-primary-dark/10'
          }`}
          disabled={added || saving}
          onClick={() => onAddSlip(primary)}
          title={added ? `${primary} added` : `Add ${primary}`}
        >
          {added ? `${primary} ✓` : `+ ${primary}`}
        </button>
      </li>
    )
  }

  return (
    <li className="border border-border rounded-md p-2 bg-white space-y-2">
      <div>
        <p className="text-sm font-medium text-text">{item.label}</p>
        <p className="text-xs text-text-light mt-0.5">{item.description}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {slipCodes.map((code) => {
          const added = slipRows.some((row) => row.slipCode.toUpperCase() === code)
          return (
            <button
              key={`${item.topicId}-${code}`}
              type="button"
              className={`text-xs px-2 py-1 rounded border ${
                added ? 'border-green-600 bg-green-50 text-green-800' : 'border-border bg-background hover:bg-white'
              }`}
              disabled={added || saving}
              onClick={() => onAddSlip(code)}
            >
              {added ? `${code} ✓` : `+ ${code}`}
            </button>
          )
        })}
      </div>
    </li>
  )
}

export const IncomeSlipsSetup: FC<IncomeSlipsSetupProps> = ({
  taxpayerName,
  returnRole,
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
  onAddSuggestedSlip,
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

  const renderSlipCards = (section: InterviewArtifactSection | null) => {
    const codes = section ? sectionSlipCodes(section) : null
    const rows = roleSlipRows.filter(({ row }) => {
      if (!codes) return true
      return codes.has(row.slipCode.toUpperCase())
    })

    if (rows.length === 0) {
      return (
        <p className="text-xs text-text-light border border-dashed border-border rounded-md p-3">
          {section
            ? 'No slips added for this category yet. Use the topic buttons above or add from the catalog below.'
            : 'No slip rows yet. Add slips from interview topics or the catalog below.'}
        </p>
      )
    }

    return rows.map(({ row, idx }) => {
      const def = slipSchemasByCode[row.slipCode.toUpperCase()]
      if (!def) return null
      const boxFields = slipBoxEntriesForRow(row, def)
      return (
        <div key={`slip-${row.manualSlipId || idx}`} className="border border-border rounded-md p-3 bg-white space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              className="border border-border rounded-md px-3 py-2 text-sm"
              placeholder={def.payerLabel}
              value={row.payerName}
              onChange={(e) => {
                setManualSlipRows((prev) => {
                  const next = [...prev]
                  next[idx] = { ...next[idx], payerName: e.target.value }
                  return next
                })
              }}
            />
            <input
              type="number"
              className="border border-border rounded-md px-3 py-2 text-sm"
              placeholder="Tax year"
              value={row.taxYear}
              onChange={(e) => {
                setManualSlipRows((prev) => {
                  const next = [...prev]
                  next[idx] = { ...next[idx], taxYear: Number(e.target.value) }
                  return next
                })
              }}
            />
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <label className="text-xs text-text-light flex-1">
              Slip type
              <select
                className="mt-1 border border-border rounded-md px-3 py-2 text-sm w-full"
                value={row.slipCode}
                onChange={(e) => onUpdateSlipRowCode(idx, e.target.value)}
              >
                {filteredSlipSchemas.map((schema) => (
                  <option key={schema.code} value={schema.code}>
                    {schema.code} - {schema.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn btn--secondary text-sm px-3 py-2 md:self-end"
              onClick={() => { void onRemoveSlip({ idx, manualSlipId: row.manualSlipId }) }}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Delete slip'}
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-text-light font-medium">{def.code} - {def.name}</p>
            {def.schemaStatus === 'complete' && (
              <span className="text-xs text-green-700">Predefined boxes</span>
            )}
            {def.schemaStatus === 'catalog_only' && (
              <button type="button" className="text-xs text-primary-dark underline" onClick={() => onAddCustomBox(idx)}>
                Add box
              </button>
            )}
          </div>
          {def.schemaStatus === 'catalog_only' && boxFields.length === 0 && (
            <p className="text-xs text-amber-700">This slip is in the catalog but does not have predefined boxes yet. Use Add box to enter values from your slip.</p>
          )}
          <SlipBoxFieldGrid
            keyPrefix={`${row.slipCode}-${idx}`}
            boxes={row.boxes}
            boxFields={boxFields}
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
          />
        </div>
      )
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary-dark">Income &amp; CRA slips</h2>
        <p className="text-xs text-text-light mt-1">
          Entering income for <span className="font-semibold text-text">{taxpayerName}</span>.
          Slips and forms are organized by the topics you selected in interview setup.
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
              return total > 0 ? `${added}/${total} slip type(s)` : `${section.items.length} topic(s)`
            }}
          >
            {(activeSection) => (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-primary-dark">Required for this category</h3>
                  <p className="text-xs text-text-light mt-0.5">Add slips for each topic selected in interview setup.</p>
                  <ul className="mt-2 space-y-2">
                    {activeSection.items.map((item) => (
                      <ArtifactTopicRow
                        key={item.topicId}
                        item={item}
                        slipRows={roleSlipRows.map(({ row }) => row)}
                        saving={saving}
                        onAddSlip={onAddSuggestedSlip}
                      />
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-primary-dark">Slip entry</h3>
                  {renderSlipCards(activeSection)}
                </div>
              </>
            )}
          </TabbedArtifactLayout>
        </div>
      ) : (
        <div id="rb-income-slips" className="border border-border rounded-md p-3 bg-background/50 space-y-3">
          <p className="text-sm text-text-light">
            Complete interview setup to see organized slip categories, or add slips manually below.
          </p>
          {renderSlipCards(null)}
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
