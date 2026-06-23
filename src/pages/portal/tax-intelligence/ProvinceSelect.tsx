import { FC } from 'react'
import { CANADIAN_PROVINCE_OPTIONS } from './dependentModel'

type ProvinceSelectProps = {
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  allowEmpty?: boolean
  emptyLabel?: string
}

const ProvinceSelect: FC<ProvinceSelectProps> = ({
  value,
  onChange,
  className = 'border border-border rounded-md px-3 py-2 text-sm',
  disabled = false,
  allowEmpty = false,
  emptyLabel = 'Select…'
}) => (
  <select
    className={className}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
  >
    {allowEmpty && <option value="">{emptyLabel}</option>}
    {CANADIAN_PROVINCE_OPTIONS.map((option) => (
      <option key={option.value} value={option.value}>{option.label}</option>
    ))}
  </select>
)

export default ProvinceSelect
