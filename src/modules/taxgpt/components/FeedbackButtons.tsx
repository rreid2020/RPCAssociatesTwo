import { useState } from 'react'
import type { TaxgptFeedbackType } from '../../../lib/taxgptApi'

type FeedbackButtonsProps = {
  onSubmit: (feedbackType: TaxgptFeedbackType) => Promise<void>
}

const FEEDBACK_OPTIONS: Array<{ id: TaxgptFeedbackType; label: string }> = [
  { id: 'thumbs_up', label: 'Helpful' },
  { id: 'thumbs_down', label: 'Not Helpful' },
  { id: 'incorrect', label: 'Incorrect' },
  { id: 'outdated', label: 'Outdated' }
]

export default function FeedbackButtons ({ onSubmit }: FeedbackButtonsProps) {
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<TaxgptFeedbackType | null>(null)

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {FEEDBACK_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true)
            try {
              await onSubmit(option.id)
              setSelected(option.id)
            } finally {
              setSaving(false)
            }
          }}
          className={`rounded-full border px-2.5 py-1 text-xs ${
            selected === option.id
              ? 'border-primary bg-primary/10 text-primary-dark'
              : 'border-border text-text-light hover:text-primary-dark'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
