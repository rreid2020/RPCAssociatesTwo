import { FC } from 'react'
import type { TaxgptLanguage } from '../../../domains/taxgpt'

type LanguageSelectorProps = {
  value: TaxgptLanguage
  onChange: (language: TaxgptLanguage) => void
  disabled?: boolean
}

const LanguageSelector: FC<LanguageSelectorProps> = ({ value, onChange, disabled = false }) => (
  <div className="flex items-center gap-2">
    <label htmlFor="taxgpt-language" className="text-sm font-medium text-text">
      Source language
    </label>
    <select
      id="taxgpt-language"
      value={value}
      onChange={(event) => onChange(event.target.value === 'fr' ? 'fr' : 'en')}
      disabled={disabled}
      className="rounded-md border border-border bg-white px-3 py-1.5 text-sm text-text shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Preferred CRA source language"
    >
      <option value="en">English</option>
      <option value="fr">French</option>
    </select>
  </div>
)

export default LanguageSelector
