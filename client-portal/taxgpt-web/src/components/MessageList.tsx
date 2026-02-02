import { useState } from 'react';
import type { ChatMessage } from '../types';

interface MessageListProps {
  messages: ChatMessage[];
  onCopy?: (text: string) => void;
}

// Helper function to format markdown-like content
function formatContent(content: string) {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let currentParagraph: string[] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ');
      if (text.trim()) {
        elements.push(
          <p key={`p-${elements.length}`} className="mb-3 leading-relaxed text-[#333333]">
            {formatInlineText(text)}
          </p>
        );
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="mb-3 ml-4 list-disc space-y-1 text-[#333333]">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-[#333333] leading-relaxed">
              {formatInlineText(item.trim())}
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    
    // Handle list items
    if (trimmed.match(/^[-*•]\s+/)) {
      flushParagraph();
      listItems.push(trimmed.replace(/^[-*•]\s+/, ''));
      inList = true;
      return;
    }
    
    // Handle numbered lists
    if (trimmed.match(/^\d+\.\s+/)) {
      flushParagraph();
      listItems.push(trimmed.replace(/^\d+\.\s+/, ''));
      inList = true;
      return;
    }
    
    // Handle headings
    if (trimmed.startsWith('### ')) {
      flushList();
      flushParagraph();
      elements.push(
        <h3 key={`h3-${elements.length}`} className="text-lg font-semibold mb-2 mt-4 text-[#333333]">
          {trimmed.replace(/^###\s+/, '')}
        </h3>
      );
      return;
    }
    
    if (trimmed.startsWith('## ')) {
      flushList();
      flushParagraph();
      elements.push(
        <h2 key={`h2-${elements.length}`} className="text-xl font-semibold mb-3 mt-5 text-[#333333]">
          {trimmed.replace(/^##\s+/, '')}
        </h2>
      );
      return;
    }
    
    if (trimmed.startsWith('# ')) {
      flushList();
      flushParagraph();
      elements.push(
        <h1 key={`h1-${elements.length}`} className="text-2xl font-bold mb-3 mt-6 text-[#333333]">
          {trimmed.replace(/^#\s+/, '')}
        </h1>
      );
      return;
    }
    
    // Handle empty lines
    if (trimmed === '') {
      if (inList) {
        flushList();
      } else {
        flushParagraph();
      }
      return;
    }
    
    // Regular paragraph text
    if (inList) {
      flushList();
    }
    currentParagraph.push(trimmed);
  });
  
  flushList();
  flushParagraph();
  
  return elements.length > 0 ? elements : [<p key="empty" className="text-[#666666] italic">No content</p>];
}

// Helper function to format inline text (bold, italic, links)
function formatInlineText(text: string): (string | JSX.Element)[] {
  // For now, just return the text as-is
  // We can enhance this later with markdown parsing if needed
  return [text];
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

export default function MessageList({ messages, onCopy }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="max-w-md rounded-md border border-[#e0e0e0] bg-[#ffffff] p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[#183956] text-white">
            <span className="text-lg">✨</span>
          </div>
          <p className="mt-4 text-lg font-semibold text-[#333333]">Welcome to TaxGPT</p>
          <p className="mt-2 text-sm text-[#666666]">
            Ask anything about Canadian tax law, regulations, and CRA guidance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} transition-opacity duration-300`}
        >
          <div
            className={`max-w-3xl rounded-md shadow-sm ${
              message.role === 'user'
                ? 'bg-[#183956] text-white'
                : 'bg-[#ffffff] border border-[#e0e0e0]'
            }`}
          >
            {/* User messages */}
            {message.role === 'user' && (
              <div className="px-5 py-3 group">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <span className="text-xs text-slate-200">{formatRelativeTime(message.createdAt)}</span>
                  <button
                    onClick={() => {
                      if (onCopy) {
                        onCopy(message.content);
                      } else {
                        navigator.clipboard.writeText(message.content);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-200 hover:text-white hover:bg-slate-700 rounded-md"
                    title="Copy message"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <div className="text-white leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            )}
            
            {/* Assistant messages */}
            {message.role === 'assistant' && (
                <div className="px-6 py-4 group">
                <div className="flex items-start justify-between gap-4 mb-2">
                    <span className="text-xs text-[#666666]">{formatRelativeTime(message.createdAt)}</span>
                  <button
                    onClick={() => {
                      if (onCopy) {
                        onCopy(message.content);
                      } else {
                        navigator.clipboard.writeText(message.content);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-[#666666] hover:text-[#333333] hover:bg-[#f9f7f6] rounded-md"
                    title="Copy message"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <div className="prose prose-sm max-w-none prose-slate">
                  {formatContent(message.content)}
                </div>
                
                {/* Agentic Reasoning (if available) */}
                {message.reasoning && message.reasoning.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#e0e0e0]">
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-medium text-[#666666] hover:text-[#333333] flex items-center gap-2">
                        <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Agent Reasoning Steps
                      </summary>
                      <div className="mt-2 space-y-2 pl-6">
                        {message.reasoning.map((step, idx) => (
                          <div key={idx} className="text-xs text-[#666666] bg-[#f9f7f6] p-2 rounded-md">
                            <span className="font-semibold text-[#333333]">Step {idx + 1}:</span> {step}
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}

                {/* Agent Actions (if available) */}
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#e0e0e0]">
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-medium text-[#666666] hover:text-[#333333] flex items-center gap-2">
                        <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Actions Taken ({message.actions.length})
                      </summary>
                      <div className="mt-2 space-y-2 pl-6">
                        {message.actions.map((action, idx) => (
                          <div key={idx} className="text-xs text-[#666666] bg-[#f9f7f6] p-2 rounded-md flex items-start gap-2">
                            <span className="font-semibold text-[#333333]">{action.type}:</span>
                            <span>{action.description}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}

                {/* Enhanced Citations */}
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-[#e0e0e0]">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4 text-[#666666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <h4 className="text-sm font-semibold text-[#333333]">Sources</h4>
                    </div>
                    <div className="space-y-2">
                      {message.citations.map((cit, idx) => (
                        <a
                          key={cit.id || idx}
                          href={cit.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 p-3 rounded-md bg-[#f9f7f6] hover:bg-[#f3eee9] transition-colors group"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-md bg-[#183956] text-white flex items-center justify-center text-xs font-semibold group-hover:bg-[#1f4d73] transition-colors">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#333333] group-hover:text-[#183956] transition-colors">
                              {cit.sourceTitle}
                            </p>
                            {cit.sectionHeading && (
                              <p className="text-xs text-[#666666] mt-0.5">{cit.sectionHeading}</p>
                            )}
                            <p className="text-xs text-[#666666] mt-1 truncate">{cit.sourceUrl}</p>
                          </div>
                          <svg className="w-4 h-4 text-[#666666] group-hover:text-[#183956] transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

