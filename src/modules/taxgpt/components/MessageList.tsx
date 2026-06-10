import { FC } from 'react'
import { TAXGPT_STARTER_PROMPTS } from '../starterPrompts'
import type { ChatMessage } from '../types'

type MessageListProps = {
  messages: ChatMessage[]
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
  onCopy,
  onSelectPrompt,
  promptsDisabled = false
}) => {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[320px]">
        <div className="w-full max-w-3xl rounded-lg border border-border bg-white p-6 shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary text-white text-lg">
              ✨
            </div>
            <p className="mt-4 text-lg font-semibold text-primary-dark">Welcome to TaxGPT</p>
            <p className="mt-2 text-sm text-text-light">
              Ask about Canadian tax law, CRA guidance, and common compliance questions.
            </p>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <p className="text-sm font-semibold text-primary-dark text-center">
              Popular questions Canadians ask
            </p>
            <p className="mt-1 text-xs text-text-light text-center">
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
              <div className={`whitespace-pre-wrap leading-relaxed ${
                message.role === 'user' ? 'text-white' : 'text-text'
              }`}
              >
                {message.content}
              </div>
              {message.citations && message.citations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <p className="text-sm font-semibold text-primary-dark">Sources</p>
                  {message.citations.map((citation, index) => (
                    <a
                      key={citation.id || `${message.id}-cit-${index}`}
                      href={citation.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-primary hover:underline"
                    >
                      {citation.sourceTitle}
                    </a>
                  ))}
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
