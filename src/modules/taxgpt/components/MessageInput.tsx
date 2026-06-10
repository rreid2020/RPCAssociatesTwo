import { FC, FormEvent, useEffect, useRef, useState } from 'react'

type MessageInputProps = {
  onSend: (message: string) => void
  disabled?: boolean
}

const MessageInput: FC<MessageInputProps> = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }, [message])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!message.trim() || disabled) return
    onSend(message.trim())
    setMessage('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="taxgpt-message" className="sr-only">Message</label>
      <textarea
        id="taxgpt-message"
        ref={textareaRef}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            handleSubmit(event)
          }
        }}
        placeholder="Ask a question about Canadian taxes…"
        rows={1}
        className="w-full rounded-md border border-border bg-white px-4 py-3 text-sm text-text shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none disabled:bg-background disabled:cursor-not-allowed"
        disabled={disabled}
        style={{ minHeight: '48px', maxHeight: '320px' }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <span className="text-xs text-text-light">Press Enter to send, Shift + Enter for a new line.</span>
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="btn btn--primary text-sm py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disabled ? 'Sending…' : 'Send'}
        </button>
      </div>
    </form>
  )
}

export default MessageInput
