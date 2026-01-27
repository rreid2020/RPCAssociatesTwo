import { FC } from 'react'

interface FormattedTextProps {
  text: string
  className?: string
}

/**
 * Simple formatter for markdown-style text
 * Converts **text** to bold, handles bullet points, and formats headings
 */
const FormattedText: FC<FormattedTextProps> = ({ text, className = '' }) => {
  // Split by line breaks and process line by line
  const lines = text.split(/\n/).filter(line => line.trim())
  const elements: JSX.Element[] = []
  let currentParagraph: string[] = []
  let currentList: string[] = []
  let key = 0
  
  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const paragraphText = currentParagraph.join(' ').trim()
      if (paragraphText) {
        elements.push(
          <p key={key++} className="text-base sm:text-lg text-text-light leading-relaxed mb-4">
            {formatInlineText(paragraphText)}
          </p>
        )
      }
      currentParagraph = []
    }
  }
  
  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={key++} className="list-none space-y-2 mb-4 ml-0">
          {currentList.map((item, itemIndex) => {
            const cleanItem = item.replace(/^[•\-\*]\s*/, '').trim()
            return (
              <li key={itemIndex} className="flex items-start">
                <span className="text-primary mr-3 mt-1 flex-shrink-0">•</span>
                <span className="text-base sm:text-lg text-text-light leading-relaxed flex-1">
                  {formatInlineText(cleanItem)}
                </span>
              </li>
            )
          })}
        </ul>
      )
      currentList = []
    }
  }
  
  lines.forEach((line) => {
    const trimmed = line.trim()
    
    // Check if it's a heading (starts and ends with **)
    if (trimmed.match(/^\*\*.*\*\*$/)) {
      flushParagraph()
      flushList()
      const headingText = trimmed.replace(/\*\*/g, '')
      elements.push(
        <h3 key={key++} className="text-xl sm:text-2xl font-bold text-primary mt-6 mb-4 first:mt-0">
          {headingText}
        </h3>
      )
      return
    }
    
    // Check if it's a subheading (starts with ** and has text after on same line)
    if (trimmed.match(/^\*\*.*\*\*\s/)) {
      flushParagraph()
      flushList()
      const match = trimmed.match(/^\*\*(.*?)\*\*\s+(.*)/)
      if (match) {
        const [, headingText, rest] = match
        elements.push(
          <div key={key++} className="mb-4">
            <h4 className="text-lg sm:text-xl font-bold text-primary mb-2">
              {headingText}
            </h4>
            {rest && (
              <p className="text-base sm:text-lg text-text-light leading-relaxed">
                {formatInlineText(rest)}
              </p>
            )}
          </div>
        )
      }
      return
    }
    
    // Check if it's a bullet point
    if (trimmed.match(/^[•\-\*]\s/)) {
      flushParagraph()
      currentList.push(trimmed)
      return
    }
    
    // Check if it's a numbered subheading like "1) Operating Activities"
    if (trimmed.match(/^\d+\)\s+\*\*/)) {
      flushParagraph()
      flushList()
      const match = trimmed.match(/^(\d+\))\s+\*\*(.*?)\*\*(.*)/)
      if (match) {
        const [, number, headingText, rest] = match
        elements.push(
          <div key={key++} className="mb-4">
            <h4 className="text-lg sm:text-xl font-bold text-primary mb-2">
              {number} {headingText}
            </h4>
            {rest && rest.trim() && (
              <p className="text-base sm:text-lg text-text-light leading-relaxed">
                {formatInlineText(rest.trim())}
              </p>
            )}
          </div>
        )
      }
      return
    }
    
    // Regular text line
    if (trimmed) {
      flushList()
      currentParagraph.push(trimmed)
    } else {
      // Empty line - flush current paragraph
      flushParagraph()
    }
  })
  
  // Flush any remaining content
  flushParagraph()
  flushList()
  
  return (
    <div className={className}>
      {elements}
    </div>
  )
}

/**
 * Format inline text - converts **text** to bold
 */
function formatInlineText(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = []
  const regex = /\*\*(.*?)\*\*/g
  let lastIndex = 0
  let match
  let key = 0
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }
    
    // Add bold text
    parts.push(
      <strong key={key++} className="font-semibold text-text">
        {match[1]}
      </strong>
    )
    
    lastIndex = regex.lastIndex
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }
  
  return parts.length > 0 ? parts : [text]
}

export default FormattedText
