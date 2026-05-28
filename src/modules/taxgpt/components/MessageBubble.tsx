import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'
import FeedbackButtons from './FeedbackButtons'
import type { LocalMessage } from '../types'
import type { TaxgptFeedbackType } from '../../../lib/taxgptApi'

type MessageBubbleProps = {
  message: LocalMessage
  onCopy: (message: string) => void
  onRegenerate: (assistantMessageId: string) => void
  onSelectCitations: (messageId: string) => void
  onFeedback: (messageId: string, feedbackType: TaxgptFeedbackType) => Promise<void>
}

function formatTime (value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

export default function MessageBubble ({
  message,
  onCopy,
  onRegenerate,
  onSelectCitations,
  onFeedback
}: MessageBubbleProps) {
  const isAssistant = message.role === 'assistant'

  return (
    <article className={`flex w-full ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[90%] rounded-xl border px-4 py-3 shadow-sm ${isAssistant ? 'border-border bg-white' : 'border-primary bg-primary/10'}`}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-light">{isAssistant ? 'TaxGPT' : 'You'}</p>
          <p className="text-xs text-text-light">{formatTime(message.created_at)}</p>
        </div>
        {isAssistant ? (
          <div className="prose prose-sm max-w-none text-text">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {message.message_content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm text-text">{message.message_content}</p>
        )}
        {isAssistant && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-2">
            <button
              type="button"
              onClick={() => onCopy(message.message_content)}
              className="rounded-md border border-border px-2.5 py-1 text-xs text-text-light hover:text-primary-dark"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={() => onRegenerate(message.id)}
              className="rounded-md border border-border px-2.5 py-1 text-xs text-text-light hover:text-primary-dark"
            >
              Regenerate
            </button>
            <button
              type="button"
              onClick={() => onSelectCitations(message.id)}
              className="rounded-md border border-border px-2.5 py-1 text-xs text-text-light hover:text-primary-dark"
            >
              Citations ({message.citations.length})
            </button>
          </div>
        )}
        {isAssistant && (
          <FeedbackButtons onSubmit={async (feedbackType) => await onFeedback(message.id, feedbackType)} />
        )}
      </div>
    </article>
  )
}
