import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import SourcesDrawer from './SourcesDrawer';
import RiskBanner from './RiskBanner';
import ExportButton from './ExportButton';
import LoadingIndicator from './LoadingIndicator';
import { ToastContainer } from './Toast';
import { useToast } from '../hooks/useToast';
import type { ChatMessage, Citation, RiskLevel } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ChatResponse {
  response: string;
  citations: Citation[];
  sources: Array<{ id: string; title: string; url: string }>;
  riskLevel: RiskLevel;
  sessionId: string;
  reasoning?: string[];
  actions?: Array<{ type: string; description: string }>;
}

interface ChatInterfaceProps {
  userId: string;
}

export default function ChatInterface({ userId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sources, setSources] = useState<Array<{ id: string; title: string; url: string }>>([]);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('low');
  const [showSources, setShowSources] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [agenticMode, setAgenticMode] = useState(true); // Enable agentic mode by default
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => showSuccess('Copied to clipboard!'),
      () => showError('Failed to copy')
    );
  };

  // Check scroll position for scroll-to-top button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 300);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const [pendingMessage, setPendingMessage] = useState<string>('');

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await axios.post<ChatResponse>(
        `${API_URL}/api/chat`,
        {
          sessionId,
          message,
          agentic: agenticMode,
        },
        {
          withCredentials: true,
        }
      );
      return { ...response.data, userMessage: message };
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          citations: data.citations,
          createdAt: new Date(),
          reasoning: data.reasoning,
          actions: data.actions,
        },
      ]);
      setSources(data.sources);
      setRiskLevel(data.riskLevel);
    },
    onError: (error) => {
      showError(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
    },
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatMutation.isPending]);

  const handleSend = (message: string) => {
    setPendingMessage(message);
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        createdAt: new Date(),
      },
    ]);
    chatMutation.mutate(message);
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      showSuccess(`File "${file.name}" uploaded successfully!`);
      console.log('Document uploaded:', response.data.docId);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to upload file. Please try again.');
      console.error('Upload failed:', error);
    }
  };

  const handleExport = () => {
    if (messages.length === 0) {
      showError('No messages to export');
      return;
    }

    const markdown = messages
      .map((msg) => {
        if (msg.role === 'user') {
          return `## User\n\n${msg.content}\n\n`;
        } else {
          let content = `## Assistant\n\n${msg.content}\n\n`;
          if (msg.citations && msg.citations.length > 0) {
            content += '### Sources\n\n';
            msg.citations.forEach((cit, idx) => {
              content += `${idx + 1}. ${cit.sourceTitle} - ${cit.sourceUrl}\n`;
            });
          }
          return content;
        }
      })
      .join('\n---\n\n');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rpctaxgpt-memo-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Conversation exported successfully!');
  };

  return (
    <div className="flex h-full">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="flex-1 flex flex-col rounded-md border border-[#e0e0e0] bg-[#ffffff] shadow-sm overflow-hidden">
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto relative">
          <div className="mx-auto max-w-4xl px-6 py-6">
            <MessageList messages={messages} onCopy={handleCopy} />
            {chatMutation.isPending && (
              <div className="mt-4">
                <LoadingIndicator />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Scroll to Top Button */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-28 right-6 p-3 bg-[#183956] text-white rounded-md shadow-lg hover:bg-[#1f4d73] transition-colors z-10"
              title="Scroll to top"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          )}
        </div>
        <div className="border-t border-[#e0e0e0] bg-[#f9f7f6]">
          <div className="max-w-4xl mx-auto px-6 py-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowSources(!showSources)}
                  className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {showSources ? 'Hide' : 'Show'} Sources
                </button>
                <button
                  onClick={() => setAgenticMode(!agenticMode)}
                  className={`inline-flex items-center gap-2 border px-3 py-1.5 text-sm font-medium shadow-sm ${
                    agenticMode
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  title="Agentic mode enables multi-step reasoning and tool use"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0L5.343 6.343z" />
                  </svg>
                  {agenticMode ? 'Agentic' : 'Standard'} Mode
                </button>
              </div>
              <div className="flex items-center gap-2">
                <ExportButton onExport={handleExport} />
              </div>
            </div>
            <MessageInput
              onSend={handleSend}
              onUpload={handleUpload}
              disabled={chatMutation.isPending}
            />
          </div>
        </div>
      </div>
      {showSources && <SourcesDrawer sources={sources} onClose={() => setShowSources(false)} />}
      {riskLevel === 'high' && <RiskBanner />}
    </div>
  );
}

