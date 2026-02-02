import { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  onUpload?: (file: File) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, onUpload, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
        id="pdf-upload"
      />
      <div>
        <label htmlFor="message" className="sr-only">
          Message
        </label>
        <textarea
          id="message"
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Ask a question about Canadian taxes..."
          rows={1}
          className="w-full rounded-md border border-[#e0e0e0] bg-[#ffffff] px-4 py-3 text-sm text-[#333333] shadow-sm focus:border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#e0e0e0] resize-none disabled:bg-[#f9f7f6] disabled:cursor-not-allowed"
          disabled={disabled}
          style={{ minHeight: '48px', maxHeight: '320px' }}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e0e0e0] pt-3">
        <div className="flex items-center gap-2 text-xs text-[#666666]">
          <label
            htmlFor="pdf-upload"
            className="inline-flex items-center gap-2 text-[#666666] hover:text-[#333333] cursor-pointer"
            title="Upload PDF document"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Upload PDF
          </label>
          <span>Press Enter to send, Shift + Enter for a new line.</span>
        </div>
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="inline-flex items-center gap-2 rounded-md bg-[#183956] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1f4d73] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disabled ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <span>Send</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

