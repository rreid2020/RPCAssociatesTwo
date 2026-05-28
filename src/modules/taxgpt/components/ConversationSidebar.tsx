import { useMemo, useState } from 'react'
import type { TaxgptConversation } from '../../../lib/taxgptApi'

type ConversationSidebarProps = {
  conversations: TaxgptConversation[]
  activeConversationId: string | null
  loading?: boolean
  onSelect: (conversationId: string) => void
  onNewChat: () => void
  onDelete: (conversationId: string) => void
  onRename: (conversationId: string, title: string) => void
}

function formatTimestamp (value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

export default function ConversationSidebar ({
  conversations,
  activeConversationId,
  loading = false,
  onSelect,
  onNewChat,
  onDelete,
  onRename
}: ConversationSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')

  const sortedConversations = useMemo(
    () => [...conversations].sort((a, b) => Date.parse(b.last_message_at) - Date.parse(a.last_message_at)),
    [conversations]
  )

  return (
    <aside className="h-full border-r border-border bg-white">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-primary-dark">Conversations</h2>
        <button
          type="button"
          onClick={onNewChat}
          className="rounded-md border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white"
        >
          New Chat
        </button>
      </div>
      <div className="h-[calc(100%-58px)] overflow-y-auto px-2 py-2">
        {loading ? (
          <p className="px-2 py-4 text-sm text-text-light">Loading conversations...</p>
        ) : sortedConversations.length === 0 ? (
          <p className="px-2 py-4 text-sm text-text-light">No chats yet. Start with a new question.</p>
        ) : (
          sortedConversations.map((conversation) => {
            const active = conversation.id === activeConversationId
            const isEditing = editingId === conversation.id
            return (
              <div key={conversation.id} className={`mb-2 rounded-md border ${active ? 'border-primary bg-primary/5' : 'border-border bg-white'}`}>
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className="w-full px-3 py-2 text-left"
                >
                  {isEditing ? (
                    <input
                      className="w-full rounded border border-border px-2 py-1 text-sm"
                      value={draftTitle}
                      autoFocus
                      onChange={(event) => setDraftTitle(event.target.value)}
                      onBlur={() => {
                        setEditingId(null)
                        const nextTitle = draftTitle.trim()
                        if (nextTitle) onRename(conversation.id, nextTitle)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          setEditingId(null)
                          const nextTitle = draftTitle.trim()
                          if (nextTitle) onRename(conversation.id, nextTitle)
                        }
                        if (event.key === 'Escape') {
                          setEditingId(null)
                        }
                      }}
                    />
                  ) : (
                    <p className="line-clamp-2 text-sm font-medium text-primary-dark">{conversation.title || 'New TaxGPT Chat'}</p>
                  )}
                  <p className="mt-1 text-xs text-text-light">{formatTimestamp(conversation.last_message_at || conversation.updated_at)}</p>
                </button>
                <div className="flex items-center justify-end gap-2 px-3 pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(conversation.id)
                      setDraftTitle(conversation.title || '')
                    }}
                    className="text-xs text-text-light hover:text-primary-dark"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(conversation.id)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
