import { FC, useEffect, useState } from 'react'
import type { SlipSchema } from '../../../lib/taxIntelligenceApi'

export type SlipRow = {
  slipCode: string
  payerName: string
  taxYear: number
  taxpayerRole: 'self' | 'spouse'
  boxes: Record<string, number>
  manualSlipId?: string
}

export function buildDefaultBoxes (_schema?: SlipSchema): Record<string, number> {
  return {}
}

function formatSlipBoxDisplay (value: number | undefined): string {
  if (value == null || !Number.isFinite(value) || value === 0) return ''
  return String(value)
}

function parseSlipBoxInput (raw: string, boxType: 'currency' | 'number'): number | undefined {
  const trimmed = raw.trim().replace(/,/g, '')
  if (!trimmed) return undefined
  if (boxType === 'number') {
    const digits = trimmed.replace(/\D/g, '')
    if (!digits) return undefined
    const parsed = Number(digits)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

type SlipBoxFieldDef = { code: string; label: string; type: 'currency' | 'number' }

const SlipBoxAmountInput: FC<{
  boxType: 'currency' | 'number'
  value: number | undefined
  onChange: (value: number | undefined) => void
}> = ({ boxType, value, onChange }) => {
  const [draft, setDraft] = useState(() => formatSlipBoxDisplay(value))

  useEffect(() => {
    setDraft(formatSlipBoxDisplay(value))
  }, [value])

  const commitDraft = (raw: string) => {
    onChange(parseSlipBoxInput(raw, boxType))
  }

  return (
    <input
      type="text"
      inputMode={boxType === 'currency' ? 'decimal' : 'numeric'}
      autoComplete="off"
      className="block w-full rounded-md border border-border px-3 py-2 text-right text-sm tabular-nums"
      placeholder={boxType === 'currency' ? '0.00' : '0'}
      value={draft}
      onChange={(e) => {
        const raw = e.target.value
        if (raw === '') {
          setDraft('')
          onChange(undefined)
          return
        }
        if (boxType === 'number' && !/^\d*$/.test(raw)) return
        if (boxType === 'currency' && !/^\d*\.?\d{0,2}$/.test(raw)) return
        setDraft(raw)
        if (!(boxType === 'currency' && raw.endsWith('.'))) {
          commitDraft(raw)
        }
      }}
      onBlur={() => {
        commitDraft(draft)
        setDraft(formatSlipBoxDisplay(parseSlipBoxInput(draft, boxType)))
      }}
    />
  )
}

export const SlipBoxFieldGrid: FC<{
  boxes: Record<string, number>
  boxFields: SlipBoxFieldDef[]
  keyPrefix: string
  onBoxChange: (boxCode: string, value: number | undefined) => void
}> = ({ boxes, boxFields, keyPrefix, onBoxChange }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-4">
    {boxFields.map((box) => (
      <div key={`${keyPrefix}-${box.code}`} className="flex min-w-0 flex-col gap-1.5">
        <span className="block min-h-[2.75rem] text-xs leading-snug text-text-light">
          <span className="font-medium text-text">Box {box.code}</span> {box.label}
        </span>
        <SlipBoxAmountInput
          boxType={box.type}
          value={boxes[box.code]}
          onChange={(nextValue) => onBoxChange(box.code, nextValue)}
        />
      </div>
    ))}
  </div>
)

export function slipBoxEntriesForRow (row: SlipRow, schema?: SlipSchema): SlipBoxFieldDef[] {
  const fromSchema = (schema?.boxes || []).map((box) => ({
    code: box.code,
    label: box.label,
    type: box.type
  }))
  const extraCodes = Object.keys(row.boxes).filter((code) => !fromSchema.some((box) => box.code === code))
  return [
    ...fromSchema,
    ...extraCodes.map((code) => ({ code, label: `Box ${code}`, type: 'currency' as const }))
  ]
}

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
