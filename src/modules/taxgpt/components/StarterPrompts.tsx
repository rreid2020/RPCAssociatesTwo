const STARTER_PROMPTS = [
  'Can I deduct home office expenses in Canada?',
  'How does the RRSP deduction work?',
  'What is the small business deduction?',
  'How are dividends taxed in Ontario?',
  'Can I claim vehicle expenses?',
  'What are taxable benefits?',
  'What is the GST/HST filing threshold?',
  'How are capital gains taxed in Canada?'
]

type StarterPromptsProps = {
  onSelect: (prompt: string) => void
}

export default function StarterPrompts ({ onSelect }: StarterPromptsProps) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <h3 className="text-sm font-semibold text-primary-dark">Suggested Prompts</h3>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelect(prompt)}
            className="rounded-md border border-border px-3 py-2 text-left text-sm text-text hover:border-primary hover:text-primary-dark"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
