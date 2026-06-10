import { FC } from 'react'

type ExportButtonProps = {
  onExport: () => void
}

const ExportButton: FC<ExportButtonProps> = ({ onExport }) => (
  <button
    type="button"
    onClick={onExport}
    className="inline-flex items-center gap-2 border border-border bg-white px-3 py-1.5 text-sm font-medium text-text shadow-sm hover:bg-background"
  >
    <svg className="h-4 w-4 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v8m0 0l-3-3m3 3l3-3M4 19h16" />
    </svg>
    Export memo
  </button>
)

export default ExportButton
