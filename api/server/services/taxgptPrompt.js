const SOURCE_ONLY_SYSTEM_PROMPT = `You are a helpful Canadian tax assistant. You provide information based on official CRA (Canada Revenue Agency) sources.

CRITICAL RULES:
1. Always cite your sources using numbered references [1], [2], etc.
2. Never fabricate citations - if you don't have sufficient information, say so clearly
3. Base your answers ONLY on the provided source material
4. If asked about topics not in the sources, politely decline and suggest consulting a tax professional
5. Include a disclaimer that this is informational only, not legal or tax advice

Citation format: [1] Source Title - Section Heading (Page X if available)`

const DEGRADED_SYSTEM_PROMPT = `You are a helpful Canadian tax assistant. The curated CRA knowledge base is not available for this question.

CRITICAL RULES:
1. Be clear that your answer is general guidance, not grounded in retrieved official source text.
2. Never fabricate citations or legal references.
3. Recommend consulting a qualified tax professional for case-specific advice.
4. Include a disclaimer that this is informational only, not legal or tax advice.
5. Focus on Canadian federal and provincial tax context when relevant.`

export function buildTaxgptSystemPrompt (mode) {
  return mode === 'rag' ? SOURCE_ONLY_SYSTEM_PROMPT : DEGRADED_SYSTEM_PROMPT
}

export function buildTaxgptUserPrompt (message, chunks) {
  const sourcesText = chunks
    .map((chunk, index) => {
      const heading = chunk.citation.sectionHeading ? ` - ${chunk.citation.sectionHeading}` : ''
      const page = chunk.citation.pageNumber ? ` (Page ${chunk.citation.pageNumber})` : ''
      return `[${index + 1}] ${chunk.citation.sourceTitle}${heading}${page}\n${chunk.content}`
    })
    .join('\n\n')

  return `User Question: ${message}

Relevant Sources:
${sourcesText}

Please answer the user's question based on the sources above. Include numbered citations [1], [2], etc. for each claim.`
}

export function extractTaxgptCitations (response, chunks) {
  const citationPattern = /\[(\d+)\]/g
  const citationIndices = new Set()

  for (const match of String(response || '').matchAll(citationPattern)) {
    const citationIndex = parseInt(match[1], 10)
    if (citationIndex >= 1 && citationIndex <= chunks.length) {
      citationIndices.add(citationIndex)
    }
  }

  return Array.from(citationIndices)
    .sort((a, b) => a - b)
    .map((citationIndex) => ({
      ...chunks[citationIndex - 1].citation,
      citationIndex,
      excerpt: String(chunks[citationIndex - 1].content || '').replace(/\s+/g, ' ').trim().slice(0, 900)
    }))
}

export function buildTaxgptSources (chunks) {
  const sourcesMap = new Map()
  for (const chunk of chunks) {
    const url = chunk.citation.sourceUrl
    if (!url || sourcesMap.has(url)) continue
    sourcesMap.set(url, {
      id: chunk.citation.chunkId,
      title: chunk.citation.sourceTitle,
      url
    })
  }
  return Array.from(sourcesMap.values())
}
