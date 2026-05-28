import { useEffect, useRef } from 'react'
import type { LocalMessage } from '../types'
import type { TaxgptFeedbackType } from '../../../lib/taxgptApi'
import MessageBubble from './MessageBubble'
import StarterPrompts from './StarterPrompts'
import TypingIndicator from './TypingIndicator'

type ChatWindowProps = {
  messages: LocalMessage[]
  composerText: string
  submitting: boolean
  onComposerChange: (value: string) => void
  onSend: (value: string) => void
  onStarterPrompt: (value: string) => void
  onCopyMessage: (value: string) => void
  onRegenerate: (assistantMessageId: string) => void
  onSelectCitations: (messageId: string) => void
  onFeedback: (messageId: string, feedbackType: TaxgptFeedbackType) => Promise<void>
  onOpenMobileCitations: () => void
  errorMessage?: string | null
  limitReached?: boolean
}

export default function ChatWindow ({
  messages,
  composerText,
  submitting,
  onComposerChange,
  onSend,
  onStarterPrompt,
  onCopyMessage,
  onRegenerate,
  onSelectCitations,
  onFeedback,
  onOpenMobileCitations,
  errorMessage = null,
  limitReached = false
}: ChatWindowProps) {
  const listRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, submitting])

  return (
    <section className="flex min-h-[70vh] flex-col rounded-lg border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-primary-dark">TaxGPT Research Chat</h2>
          <p className="text-xs text-text-light">Retrieval-grounded Canadian tax research with source citations.</p>
        </div>
        <button
          type="button"
          onClick={onOpenMobileCitations}
          className="xl:hidden rounded-md border border-border px-3 py-1 text-xs text-text-light hover:text-primary-dark"
        >
          Citations
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-background p-4">
              <h3 className="text-lg font-semibold text-primary-dark">Welcome to Free TaxGPT</h3>
              <p className="mt-1 text-sm text-text-light">
                Ask Canadian tax research questions. Responses are grounded in retrieved authoritative sources and include citations.
              </p>
            </div>
            <StarterPrompts onSelect={onStarterPrompt} />
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onCopy={onCopyMessage}
              onRegenerate={onRegenerate}
              onSelectCitations={onSelectCitations}
              onFeedback={onFeedback}
            />
          ))
        )}
        {submitting && <TypingIndicator />}
      </div>

      <div className="border-t border-border px-4 py-3">
        {errorMessage && (
          <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        {limitReached && (
          <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Daily free-tier prompt limit reached. Upgrade availability is coming soon.
          </div>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSend(composerText)
          }}
          className="space-y-2"
        >
          <label htmlFor="taxgpt-composer" className="sr-only">Ask TaxGPT a question</label>
          <textarea
            ref={textareaRef}
            id="taxgpt-composer"
            value={composerText}
            onChange={(event) => onComposerChange(event.target.value)}
            rows={3}
            disabled={submitting}
            placeholder="Ask a Canadian tax question..."
            className="w-full resize-none rounded-md border border-border px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-light">TaxGPT is educational and not legal or tax advice.</p>
            <button
              type="submit"
              disabled={submitting || composerText.trim().length === 0}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Responding...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
