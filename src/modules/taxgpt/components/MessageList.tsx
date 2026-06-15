import { FC } from 'react'
import { TAXGPT_STARTER_PROMPTS } from '../starterPrompts'
import type { ChatMessage } from '../types'
import StructuredAssistantMessage from './StructuredAssistantMessage'

type MessageListProps = {
  messages: ChatMessage[]
  sessionId?: string | null
  onCopy?: (text: string) => void
  onSelectPrompt?: (prompt: string) => void
  promptsDisabled?: boolean
}

function formatRelativeTime (date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}

const MessageList: FC<MessageListProps> = ({
  messages,
  sessionId = null,
  onCopy,
  onSelectPrompt,
  promptsDisabled = false
}) => {
  if (messages.length === 0) {
    return (
      <div className="py-4">
        <p className="text-sm font-semibold text-primary-dark">Popular questions Canadians ask</p>
        <p className="mt-1 text-sm text-text-light">
          Select a starter prompt to begin, or type your own question below.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {TAXGPT_STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onSelectPrompt?.(prompt)}
              disabled={promptsDisabled || !onSelectPrompt}
              className="rounded-md border border-border bg-background px-3 py-2.5 text-left text-sm text-text transition-colors hover:border-primary/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-3xl rounded-lg shadow-sm ${
              message.role === 'user'
                ? 'bg-primary text-white'
                : 'bg-white border border-border'
            }`}
          >
            <div className="px-5 py-4 group">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className={`text-xs ${message.role === 'user' ? 'text-white/80' : 'text-text-light'}`}>
                  {formatRelativeTime(message.createdAt)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (onCopy) onCopy(message.content)
                    else void navigator.clipboard.writeText(message.content)
                  }}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md ${
                    message.role === 'user'
                      ? 'text-white/80 hover:text-white hover:bg-white/10'
                      : 'text-text-light hover:text-text hover:bg-background'
                  }`}
                  title="Copy message"
                >
                  Copy
                </button>
              </div>
              {message.role === 'assistant' && message.structuredResponse ? (
                <StructuredAssistantMessage
                  structured={message.structuredResponse}
                  feedbackSuggestion={message.feedbackSuggestion}
                  sessionId={sessionId}
                />
              ) : (
                <div className={`whitespace-pre-wrap leading-relaxed ${
                  message.role === 'user' ? 'text-white' : 'text-text'
                }`}
                >
                  {message.content}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MessageList
