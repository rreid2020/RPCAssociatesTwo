import { FC } from 'react'
import type { SlipSchema } from '../../../lib/taxIntelligenceApi'
import {
  TaxWorksheetCurrencyInput,
  TaxWorksheetGroupHeader,
  TaxWorksheetNumberInput,
  TaxWorksheetProvinceSelect,
  TaxWorksheetRow,
  TaxWorksheetSectionHeader,
  TaxWorksheetTextInput
} from './TaxWorksheet'

export type SlipRow = {
  slipCode: string
  payerName: string
  taxYear: number
  taxpayerRole: 'self' | 'spouse'
  boxes: Record<string, number>
  manualSlipId?: string
}

export type SlipBoxFieldDef = {
  code: string
  label: string
  type: 'currency' | 'number'
  lineRef?: string
  helpText?: string
}

export function buildDefaultBoxes (_schema?: SlipSchema): Record<string, number> {
  return {}
}

function isOtherInformationBox (label: string): boolean {
  return /\(other information\)/i.test(label)
}

function isProvinceEmploymentBox (slipCode: string, box: SlipBoxFieldDef): boolean {
  return slipCode.toUpperCase() === 'T4' && box.code === '10' && /province/i.test(box.label)
}

function boxHelpText (box: SlipBoxFieldDef): string {
  if (box.helpText) return box.helpText
  if (box.lineRef) return `Maps to T1 line ${box.lineRef}.`
  return `Enter the amount shown in box ${box.code} on your slip.`
}

function splitWorksheetBoxes (boxFields: SlipBoxFieldDef[]) {
  const primary: SlipBoxFieldDef[] = []
  const otherInformation: SlipBoxFieldDef[] = []
  for (const box of boxFields) {
    if (isOtherInformationBox(box.label)) otherInformation.push(box)
    else primary.push(box)
  }
  return { primary, otherInformation }
}

export function slipBoxEntriesForRow (row: SlipRow, schema?: SlipSchema): SlipBoxFieldDef[] {
  const fromSchema = (schema?.boxes || []).map((box) => ({
    code: box.code,
    label: box.label,
    type: box.type,
    lineRef: box.targets?.[0]?.lineRef,
    helpText: box.targets?.[0]?.description
  }))
  const extraCodes = Object.keys(row.boxes).filter((code) => !fromSchema.some((box) => box.code === code))
  return [
    ...fromSchema,
    ...extraCodes.map((code) => ({ code, label: `Box ${code}`, type: 'currency' as const }))
  ]
}

const SlipWorksheetBoxRow: FC<{
  slipCode: string
  box: SlipBoxFieldDef
  value: number | undefined
  striped: boolean
  onChange: (value: number | undefined) => void
}> = ({ slipCode, box, value, striped, onChange }) => {
  if (isProvinceEmploymentBox(slipCode, box)) {
    return (
      <TaxWorksheetRow
        label={box.label}
        boxCode={box.code}
        helpText="Select the province of employment shown in box 10 on your T4."
        striped={striped}
      >
        <TaxWorksheetProvinceSelect value={value} onChange={onChange} />
      </TaxWorksheetRow>
    )
  }

  return (
    <TaxWorksheetRow
      label={box.label}
      boxCode={box.code}
      lineRef={box.lineRef}
      helpText={boxHelpText(box)}
      striped={striped}
    >
      {box.type === 'currency' ? (
        <TaxWorksheetCurrencyInput value={value} onChange={onChange} />
      ) : (
        <TaxWorksheetNumberInput value={value} onChange={onChange} />
      )}
    </TaxWorksheetRow>
  )
}

export const SlipBoxFieldList: FC<{
  slipCode: string
  boxes: Record<string, number>
  boxFields: SlipBoxFieldDef[]
  onBoxChange: (boxCode: string, value: number | undefined) => void
}> = ({ slipCode, boxes, boxFields, onBoxChange }) => {
  const { primary, otherInformation } = splitWorksheetBoxes(boxFields)

  const renderRows = (fields: SlipBoxFieldDef[], startIndex: number) => fields.map((box, offset) => (
    <SlipWorksheetBoxRow
      key={`${slipCode}-${box.code}`}
      slipCode={slipCode}
      box={box}
      value={boxes[box.code]}
      striped={(startIndex + offset) % 2 === 1}
      onChange={(nextValue) => onBoxChange(box.code, nextValue)}
    />
  ))

  return (
    <div className="divide-y divide-border/80">
      {renderRows(primary, 0)}
      {otherInformation.length > 0 && (
        <>
          <TaxWorksheetGroupHeader title="Other information" />
          {renderRows(otherInformation, primary.length)}
        </>
      )}
    </div>
  )
}

/** @deprecated Use SlipBoxFieldList for worksheet-style entry. */
export const SlipBoxFieldGrid: FC<{
  boxes: Record<string, number>
  boxFields: SlipBoxFieldDef[]
  keyPrefix: string
  onBoxChange: (boxCode: string, value: number | undefined) => void
}> = ({ boxes, boxFields, keyPrefix, onBoxChange }) => (
  <SlipBoxFieldList
    slipCode={keyPrefix}
    boxes={boxes}
    boxFields={boxFields}
    onBoxChange={onBoxChange}
  />
)

export const SlipWorksheetForm: FC<{
  schema: SlipSchema
  row: SlipRow
  boxFields: SlipBoxFieldDef[]
  filteredSlipSchemas: SlipSchema[]
  saving: boolean
  showDelete: boolean
  lockSlipType?: boolean
  onPayerNameChange: (value: string) => void
  onTaxYearChange: (value: number) => void
  onSlipCodeChange: (slipCode: string) => void
  onBoxChange: (boxCode: string, value: number | undefined) => void
  onRemove?: () => void
  onAddCustomBox?: () => void
}> = ({
  schema,
  row,
  boxFields,
  filteredSlipSchemas,
  saving,
  showDelete,
  lockSlipType = false,
  onPayerNameChange,
  onTaxYearChange,
  onSlipCodeChange,
  onBoxChange,
  onRemove,
  onAddCustomBox
}) => (
  <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
    <TaxWorksheetSectionHeader
      title={`${schema.code} - ${schema.name}`}
      description={`Enter the information exactly as shown on your ${schema.code} slip. Amounts should match the boxes on the slip you received.`}
    />

    <div className="divide-y divide-border/80 border-b border-border/80">
      <TaxWorksheetRow
        label={schema.payerLabel}
        helpText={`Enter the ${schema.payerLabel.toLowerCase()} from your slip.`}
        striped={false}
      >
        <TaxWorksheetTextInput
          value={row.payerName}
          onChange={onPayerNameChange}
          placeholder={schema.payerLabel}
        />
      </TaxWorksheetRow>
      <TaxWorksheetRow
        label="Tax year"
        helpText="Enter the tax year for this slip."
        striped
      >
        <TaxWorksheetNumberInput
          value={row.taxYear}
          onChange={(nextValue) => onTaxYearChange(Number(nextValue || row.taxYear))}
        />
      </TaxWorksheetRow>
    </div>

    {schema.schemaStatus === 'catalog_only' && boxFields.length === 0 ? (
      <div className="space-y-3 px-4 py-4">
        <p className="text-xs text-amber-700">
          This slip is in the catalog but does not have predefined boxes yet. Use Add box to enter values from your slip.
        </p>
        {onAddCustomBox && (
          <button type="button" className="text-xs text-primary-dark underline" onClick={onAddCustomBox}>
            Add box
          </button>
        )}
      </div>
    ) : (
      <SlipBoxFieldList
        slipCode={row.slipCode}
        boxes={row.boxes}
        boxFields={boxFields}
        onBoxChange={onBoxChange}
      />
    )}

    <div className="flex flex-col gap-2 border-t border-border bg-background/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      {!lockSlipType && (
        <label className="min-w-0 flex-1 text-xs text-text-light">
          Slip type
          <select
            className="mt-1 block w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
            value={row.slipCode}
            onChange={(e) => onSlipCodeChange(e.target.value)}
          >
            {filteredSlipSchemas.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code} - {item.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className={`flex items-center gap-3 ${lockSlipType ? 'ml-auto' : ''}`}>
        {schema.schemaStatus === 'catalog_only' && onAddCustomBox && boxFields.length > 0 && (
          <button type="button" className="text-xs text-primary-dark underline" onClick={onAddCustomBox}>
            Add box
          </button>
        )}
        {showDelete && onRemove && (
          <button
            type="button"
            className="btn btn--secondary text-sm px-3 py-2"
            onClick={onRemove}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Delete slip'}
          </button>
        )}
      </div>
    </div>
  </div>
)

export function createManualSlipId (): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID()
  return `slip-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function resolveManualSlipIdFromMeta (
  meta: Record<string, unknown>,
  entryId: string,
  slipType: string
): string {
  if (meta.manualSlipId) return String(meta.manualSlipId)
  const payer = String(meta.payerName || '').trim()
  const year = String(meta.taxYear || '')
  const role = String(meta.taxpayerRole || 'self')
  if (payer || year) {
    return `legacy-${slipType}-${payer}-${year}-${role}`.replace(/\s+/g, '_')
  }
  return `${slipType}-${entryId}`
}
