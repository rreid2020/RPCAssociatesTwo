import { FC, ReactNode } from 'react'
import type { TaxgptSourceReference } from '../../../domains/taxgpt'

type CitedTextProps = {
  text: string
  sourceReferences?: TaxgptSourceReference[]
  className?: string
}

function buildReferenceMap (sourceReferences: TaxgptSourceReference[] = []) {
  const map = new Map<number, TaxgptSourceReference>()
  for (const reference of sourceReferences) {
    map.set(reference.citationIndex, reference)
  }
  return map
}

function referenceAnchorId (citationIndex: number) {
  return `taxgpt-ref-${citationIndex}`
}

const CitedText: FC<CitedTextProps> = ({ text, sourceReferences = [], className = '' }) => {
  const referenceMap = buildReferenceMap(sourceReferences)
  const parts = text.split(/(\[\d+\])/g)
  const nodes: ReactNode[] = []

  parts.forEach((part, index) => {
    if (!part) return
    const match = part.match(/^\[(\d+)\]$/)
    if (!match) {
      nodes.push(<span key={`text-${index}`}>{part}</span>)
      return
    }

    const citationIndex = Number(match[1])
    const reference = referenceMap.get(citationIndex)
    if (!reference) {
      nodes.push(
        <span
          key={`cite-missing-${index}`}
          className="font-medium text-text-light"
          title="This source reference was not included in the retrieved set for this answer"
        >
          [{citationIndex}]
        </span>
      )
      return
    }

    nodes.push(
      <a
        key={`cite-${index}`}
        href={`#${referenceAnchorId(citationIndex)}`}
        className="font-medium text-primary hover:underline"
        title={reference.sourceTitle}
      >
        [{citationIndex}]
      </a>
    )
  })

  return <span className={className}>{nodes}</span>
}

export default CitedText
