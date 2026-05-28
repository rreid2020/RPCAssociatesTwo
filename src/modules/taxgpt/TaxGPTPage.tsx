import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTaxgptConversation,
  deleteTaxgptConversation,
  getTaxgptUsage,
  listTaxgptConversations,
  listTaxgptMessages,
  renameTaxgptConversation,
  streamTaxgptChat,
  submitTaxgptFeedback,
  type TaxgptFeedbackType,
  type TaxgptCitation,
  type TaxgptMessage
} from '../../lib/taxgptApi'
import ChatWindow from './components/ChatWindow'
import CitationPanel from './components/CitationPanel'
import ConversationSidebar from './components/ConversationSidebar'
import UsageIndicator from './components/UsageIndicator'
import { toLocalMessage, type LocalMessage } from './types'

function createTransientMessage (conversationId: string, role: 'user' | 'assistant', content: string): LocalMessage {
  return {
    id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    message_content: content,
    conversation_id: conversationId,
    created_at: new Date().toISOString(),
    citations: [],
    model_used: null,
    input_tokens: null,
    output_tokens: null,
    total_tokens: null,
    risk_level: null
  }
}

export default function TaxGPTPage () {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [composerText, setComposerText] = useState('')
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const [optimisticMessages, setOptimisticMessages] = useState<LocalMessage[]>([])
  const [activeCitations, setActiveCitations] = useState<TaxgptCitation[]>([])
  const [mobileCitationOpen, setMobileCitationOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)

  const conversationsQuery = useQuery({
    queryKey: ['taxgpt', 'conversations'],
    queryFn: async () => await listTaxgptConversations(getToken)
  })

  const usageQuery = useQuery({
    queryKey: ['taxgpt', 'usage'],
    queryFn: async () => await getTaxgptUsage(getToken)
  })

  useEffect(() => {
    if (!activeConversationId && conversationsQuery.data && conversationsQuery.data.length > 0) {
      setActiveConversationId(conversationsQuery.data[0].id)
    }
  }, [activeConversationId, conversationsQuery.data])

  const messagesQuery = useQuery({
    queryKey: ['taxgpt', 'messages', activeConversationId],
    queryFn: async () => await listTaxgptMessages(getToken, activeConversationId || ''),
    enabled: Boolean(activeConversationId)
  })

  const baseMessages = useMemo(() => (messagesQuery.data || []).map((message) => toLocalMessage(message)), [messagesQuery.data])

  const streamMessage = useMemo(() => {
    if (!streamingMessageId || !activeConversationId) return null
    return {
      id: streamingMessageId,
      role: 'assistant' as const,
      message_content: streamingContent,
      conversation_id: activeConversationId,
      created_at: new Date().toISOString(),
      citations: activeCitations,
      model_used: null,
      input_tokens: null,
      output_tokens: null,
      total_tokens: null,
      risk_level: null
    }
  }, [activeCitations, activeConversationId, streamingContent, streamingMessageId])

  const messages = useMemo(() => {
    const merged = [...baseMessages, ...optimisticMessages]
    if (streamMessage) merged.push(streamMessage)
    return merged
  }, [baseMessages, optimisticMessages, streamMessage])

  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => await createTaxgptConversation(getToken, { title }),
    onSuccess: (conversation) => {
      setActiveConversationId(conversation.id)
      setSidebarOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['taxgpt', 'conversations'] })
    }
  })

  const renameConversationMutation = useMutation({
    mutationFn: async ({ conversationId, title }: { conversationId: string; title: string }) =>
      await renameTaxgptConversation(getToken, conversationId, title),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['taxgpt', 'conversations'] })
    }
  })

  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => await deleteTaxgptConversation(getToken, conversationId),
    onSuccess: (_, deletedId) => {
      if (activeConversationId === deletedId) {
        setActiveConversationId(null)
        setActiveCitations([])
        setOptimisticMessages([])
      }
      void queryClient.invalidateQueries({ queryKey: ['taxgpt', 'conversations'] })
      void queryClient.invalidateQueries({ queryKey: ['taxgpt', 'messages'] })
    }
  })

  const feedbackMutation = useMutation({
    mutationFn: async ({ messageId, feedbackType }: { messageId: string; feedbackType: TaxgptFeedbackType }) =>
      await submitTaxgptFeedback(getToken, { messageId, feedbackType })
  })

  const canSubmit = !usageQuery.data?.limited

  async function sendPrompt ({
    message,
    regenerateMessageId = null
  }: {
    message: string
    regenerateMessageId?: string | null
  }) {
    const nextMessage = message.trim()
    if (!nextMessage && !regenerateMessageId) return
    if (!canSubmit) return

    setChatError(null)
    let conversationId = activeConversationId
    if (!conversationId) {
      const created = await createConversationMutation.mutateAsync(nextMessage.slice(0, 80) || 'New TaxGPT Chat')
      conversationId = created.id
      setActiveConversationId(created.id)
    }
    if (!conversationId) return

    setComposerText('')
    setSidebarOpen(false)
    const userMessage = createTransientMessage(conversationId, 'user', nextMessage)
    const assistantMessageId = `stream-${Date.now()}`
    setOptimisticMessages((prev) => [...prev, userMessage])
    setStreamingMessageId(assistantMessageId)
    setStreamingContent('')
    setActiveCitations([])

    try {
      await streamTaxgptChat(
        getToken,
        { conversationId, message: nextMessage, regenerateMessageId },
        {
          onMeta: (payload) => {
            if (payload.conversationId !== activeConversationId) {
              setActiveConversationId(payload.conversationId)
            }
          },
          onDelta: (delta) => {
            setStreamingContent((prev) => `${prev}${delta}`)
          },
          onDone: (payload) => {
            setActiveCitations(payload.citations || [])
            void queryClient.invalidateQueries({ queryKey: ['taxgpt', 'conversations'] })
            void queryClient.invalidateQueries({ queryKey: ['taxgpt', 'messages', payload.conversationId] })
            void queryClient.invalidateQueries({ queryKey: ['taxgpt', 'usage'] })
          }
        }
      )
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unable to complete chat request'
      setChatError(messageText)
    } finally {
      setOptimisticMessages([])
      setStreamingMessageId(null)
      setStreamingContent('')
    }
  }

  async function handleRegenerate (assistantMessageId: string) {
    const sourceMessages: TaxgptMessage[] = messagesQuery.data || []
    const assistantIndex = sourceMessages.findIndex((message) => message.id === assistantMessageId)
    if (assistantIndex <= 0) return
    const previousUserMessage = [...sourceMessages.slice(0, assistantIndex)].reverse().find((message) => message.role === 'user')
    if (!previousUserMessage) return
    await sendPrompt({
      message: previousUserMessage.message_content,
      regenerateMessageId: previousUserMessage.id
    })
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-primary-dark">TaxGPT</h1>
        <p className="text-sm text-text-light">
          Free Tier Canadian tax research assistant grounded in authoritative sources with citations on every response.
        </p>
      </header>

      <UsageIndicator usage={usageQuery.data || null} />

      <div className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)_22rem]">
        <div className="hidden xl:block">
          <ConversationSidebar
            conversations={conversationsQuery.data || []}
            activeConversationId={activeConversationId}
            loading={conversationsQuery.isLoading}
            onSelect={(conversationId) => {
              setActiveConversationId(conversationId)
              setActiveCitations([])
            }}
            onNewChat={() => {
              setActiveConversationId(null)
              setActiveCitations([])
              setComposerText('')
            }}
            onDelete={(conversationId) => {
              deleteConversationMutation.mutate(conversationId)
            }}
            onRename={(conversationId, title) => {
              renameConversationMutation.mutate({ conversationId, title })
            }}
          />
        </div>

        <div className="xl:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-md border border-border bg-white px-3 py-2 text-sm text-primary-dark"
          >
            Open Conversations
          </button>
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 xl:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-full max-w-sm bg-white shadow-xl">
              <ConversationSidebar
                conversations={conversationsQuery.data || []}
                activeConversationId={activeConversationId}
                loading={conversationsQuery.isLoading}
                onSelect={(conversationId) => {
                  setActiveConversationId(conversationId)
                  setSidebarOpen(false)
                }}
                onNewChat={() => {
                  setActiveConversationId(null)
                  setSidebarOpen(false)
                  setComposerText('')
                }}
                onDelete={(conversationId) => {
                  deleteConversationMutation.mutate(conversationId)
                }}
                onRename={(conversationId, title) => {
                  renameConversationMutation.mutate({ conversationId, title })
                }}
              />
            </div>
          </div>
        )}

        <ChatWindow
          messages={messages}
          composerText={composerText}
          submitting={Boolean(streamingMessageId)}
          onComposerChange={setComposerText}
          onSend={(text) => {
            void sendPrompt({ message: text })
          }}
          onStarterPrompt={(prompt) => {
            setComposerText(prompt)
            void sendPrompt({ message: prompt })
          }}
          onCopyMessage={(text) => {
            void navigator.clipboard.writeText(text)
          }}
          onRegenerate={(assistantMessageId) => {
            void handleRegenerate(assistantMessageId)
          }}
          onSelectCitations={(messageId) => {
            const selected = messages.find((message) => message.id === messageId)
            setActiveCitations(selected?.citations || [])
            setMobileCitationOpen(true)
          }}
          onFeedback={async (messageId, feedbackType) => {
            await feedbackMutation.mutateAsync({ messageId, feedbackType })
          }}
          onOpenMobileCitations={() => setMobileCitationOpen(true)}
          errorMessage={chatError}
          limitReached={Boolean(usageQuery.data?.limited)}
        />

        <CitationPanel citations={activeCitations} open={mobileCitationOpen} onClose={() => setMobileCitationOpen(false)} />
      </div>
    </div>
  )
}
