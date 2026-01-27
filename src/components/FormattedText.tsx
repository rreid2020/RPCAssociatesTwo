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
  // Split by double line breaks to get paragraphs
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
  
  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => {
        const trimmed = paragraph.trim()
        
        // Check if it's a heading (starts with ** and ends with **)
        if (trimmed.match(/^\*\*.*\*\*$/)) {
          const headingText = trimmed.replace(/\*\*/g, '')
          return (
            <h3 key={index} className="text-xl sm:text-2xl font-bold text-primary mt-6 mb-3 first:mt-0">
              {headingText}
            </h3>
          )
        }
        
        // Check if it's a subheading (starts with ** and has text after)
        if (trimmed.match(/^\*\*.*\*\*[^*]/)) {
          const match = trimmed.match(/^\*\*(.*?)\*\*(.*)/)
          if (match) {
            const [, headingText, rest] = match
            return (
              <div key={index} className="mb-4">
                <h4 className="text-lg sm:text-xl font-bold text-primary mb-2">
                  {headingText}
                </h4>
                <p className="text-base sm:text-lg text-text-light leading-relaxed">
                  {formatInlineText(rest)}
                </p>
              </div>
            )
          }
        }
        
        // Regular paragraph - check for bullet points
        if (trimmed.startsWith('•') || trimmed.match(/^[•\-\*]\s/)) {
          const items = trimmed.split(/\n/).filter(item => item.trim())
          return (
            <ul key={index} className="list-none space-y-2 mb-4">
              {items.map((item, itemIndex) => {
                const cleanItem = item.replace(/^[•\-\*]\s*/, '').trim()
                return (
                  <li key={itemIndex} className="flex items-start">
                    <span className="text-primary mr-2 mt-1">•</span>
                    <span className="text-base sm:text-lg text-text-light leading-relaxed flex-1">
                      {formatInlineText(cleanItem)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )
        }
        
        // Regular paragraph
        return (
          <p key={index} className="text-base sm:text-lg text-text-light leading-relaxed mb-4">
            {formatInlineText(trimmed)}
          </p>
        )
      })}
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
