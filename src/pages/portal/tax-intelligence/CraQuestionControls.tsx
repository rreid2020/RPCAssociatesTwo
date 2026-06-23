import { FC, ReactNode } from 'react'

export const YesNoToggle: FC<{
  value: boolean
  onChange: (value: boolean) => void
  className?: string
  disabled?: boolean
}> = ({ value, onChange, className = 'mt-1', disabled = false }) => (
  <div className={`inline-flex items-center gap-1 rounded-md border border-border bg-white p-1 ${className}`}>
    <button
      type="button"
      className={`px-2 py-1 text-xs rounded ${value === true ? 'bg-primary-dark text-white' : 'text-text'}`}
      onClick={() => onChange(true)}
      disabled={disabled}
    >
      Yes
    </button>
    <button
      type="button"
      className={`px-2 py-1 text-xs rounded ${value === false ? 'bg-primary-dark text-white' : 'text-text'}`}
      onClick={() => onChange(false)}
      disabled={disabled}
    >
      No
    </button>
  </div>
)

export const CraQuestionRow: FC<{
  label: string
  children: ReactNode
}> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-6 px-3 py-3 border-b border-border/70 last:border-b-0">
    <span className="text-sm text-text flex-1 min-w-0">{label}</span>
    <div className="shrink-0">{children}</div>
  </div>
)

export type YesNo = 'yes' | 'no'

export function yesNoToToggle (value: YesNo | ''): boolean {
  return value === 'yes'
}

export function toggleToYesNo (value: boolean): YesNo {
  return value ? 'yes' : 'no'
}

export const DEFAULT_CRA_YES_NO: YesNo = 'no'
