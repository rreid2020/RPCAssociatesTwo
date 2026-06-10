import { FC, useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { fetchTaxgptCorpus, sendTaxgptChatMessage } from '../../../domains/taxgpt'
import type { TaxgptCorpusStats } from '../../../domains/taxgpt'
import type { ChatMessage, RiskLevel } from '../types'
import CorpusBanner from './CorpusBanner'
import DisclaimerBanner from './DisclaimerBanner'
import ExportButton from './ExportButton'
import LoadingIndicator from './LoadingIndicator'
import MessageInput from './MessageInput'
import MessageList from './MessageList'
import RiskBanner from './RiskBanner'
import SourcesDrawer from './SourcesDrawer'

const ChatInterface: FC = () => {
  const { getToken } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sources, setSources] = useState<Array<{ id: string; title: string; url: string }>>([])
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('low')
  const [showSources, setShowSources] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [agenticMode, setAgenticMode] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [corpus, setCorpus] = useState<TaxgptCorpusStats | null>(null)
  const [retrievalNotice, setRetrievalNotice] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const handleScroll = () => setShowScrollTop(container.scrollTop > 300)
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  useEffect(() => {
    let mounted = true
    const loadCorpus = async () => {
      try {
        const stats = await fetchTaxgptCorpus(getToken)
        if (mounted) setCorpus(stats)
      } catch {
        if (mounted) setCorpus(null)
      }
    }
    void loadCorpus()
    return () => {
      mounted = false
    }
  }, [getToken])

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text).then(
      () => setNotice('Copied to clipboard.'),
      () => setError('Failed to copy message.')
    )
  }

  const handleSend = async (message: string) => {
    setError(null)
    setNotice(null)
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        createdAt: new Date()
      }
    ])
    setSending(true)
    try {
      const data = await sendTaxgptChatMessage(getToken, {
        sessionId,
        message,
        agentic: agenticMode
      })
      setSessionId(data.sessionId)
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          citations: data.citations,
          createdAt: new Date(),
          reasoning: data.reasoning,
          actions: data.actions
        }
      ])
      setSources(data.sources || [])
      setRiskLevel(data.riskLevel || 'low')
      setRetrievalNotice(data.retrievalNotice || null)
      if (data.corpus) {
        setCorpus((prev) => prev
          ? {
              ...prev,
              ingestedSourceCount: data.corpus.ingestedSourceCount,
              embeddingCount: data.corpus.embeddingCount,
              retrievalReady: data.corpus.retrievalReady
            }
          : {
              sourceCount: 0,
              pendingSourceCount: 0,
              chunkCount: 0,
              ingestedSourceCount: data.corpus.ingestedSourceCount,
              embeddingCount: data.corpus.embeddingCount,
              retrievalReady: data.corpus.retrievalReady
            })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleNewChat = () => {
    if (sending) return
    setMessages([])
    setSessionId(null)
    setSources([])
    setRiskLevel('low')
    setShowSources(false)
    setError(null)
    setNotice(null)
    setRetrievalNotice(null)
    messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleExport = () => {
    if (messages.length === 0) {
      setError('No messages to export.')
      return
    }
    const markdown = messages
      .map((message) => {
        if (message.role === 'user') return `## User\n\n${message.content}\n`
        let content = `## Assistant\n\n${message.content}\n`
        if (message.citations?.length) {
          content += '\n### Sources\n\n'
          message.citations.forEach((citation, index) => {
            content += `${index + 1}. ${citation.sourceTitle} - ${citation.sourceUrl}\n`
          })
        }
        return content
      })
      .join('\n---\n\n')

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `taxgpt-memo-${new Date().toISOString().split('T')[0]}.md`
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice('Conversation exported.')
  }

  return (
    <div className="flex flex-col min-h-[70vh]">
      {corpus && <CorpusBanner corpus={corpus} />}
      {error && <p className="text-sm text-red-700 mb-3">{error}</p>}
      {notice && <p className="text-sm text-emerald-800 mb-3">{notice}</p>}
      {retrievalNotice && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-3">
          {retrievalNotice}
        </p>
      )}
      {riskLevel === 'high' && <RiskBanner />}

      <div className="flex flex-1 min-h-0 border border-border rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="flex-1 flex flex-col min-h-0">
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto relative">
            <div className="mx-auto max-w-4xl px-6 py-6">
              <MessageList
                messages={messages}
                onCopy={handleCopy}
                onSelectPrompt={(prompt) => { void handleSend(prompt) }}
                promptsDisabled={sending}
              />
              {sending && (
                <div className="mt-4">
                  <LoadingIndicator />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {showScrollTop && (
              <button
                type="button"
                onClick={() => messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-28 right-6 p-3 bg-primary text-white rounded-md shadow-lg hover:opacity-90 transition-colors z-10"
                title="Scroll to top"
              >
                ↑
              </button>
            )}
          </div>

          <div className="border-t border-border bg-background">
            <div className="max-w-4xl mx-auto px-6 py-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSources((value) => !value)}
                    className="btn btn--secondary text-sm py-1.5 px-3"
                  >
                    {showSources ? 'Hide sources' : 'Show sources'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgenticMode((value) => !value)}
                    className={`btn text-sm py-1.5 px-3 ${
                      agenticMode ? 'btn--primary' : 'btn--secondary'
                    }`}
                    title="Agentic mode enables multi-step reasoning when available"
                  >
                    {agenticMode ? 'Agentic mode' : 'Standard mode'}
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleNewChat}
                    disabled={sending || (messages.length === 0 && !sessionId)}
                    className="inline-flex items-center gap-2 border border-border bg-white px-3 py-1.5 text-sm font-medium text-text shadow-sm hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                    title="Start a new chat"
                  >
                    <svg className="h-4 w-4 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v6h6M20 20v-6h-6M20 9A8 8 0 006.34 6.34M4 15a8 8 0 0013.66 2.66"
                      />
                    </svg>
                    New chat
                  </button>
                  <ExportButton onExport={handleExport} />
                </div>
              </div>
              <MessageInput onSend={(message) => { void handleSend(message) }} disabled={sending} />
            </div>
          </div>
        </div>
        {showSources && <SourcesDrawer sources={sources} onClose={() => setShowSources(false)} />}
      </div>

      <DisclaimerBanner />
    </div>
  )
}

export default ChatInterface
