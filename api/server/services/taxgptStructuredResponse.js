import {
  emptyBucketMessage,
  resolveSourceBucket,
  sourceBucketLabel,
  TAXGPT_SOURCE_BUCKETS
} from './taxgptSourceBuckets.js'
import { extractTaxgptCitations } from './taxgptPrompt.js'

const STRUCTURED_RESPONSE_SCHEMA = `{
  "directAnswer": "2-3 sentence direct answer to the user question",
  "sourceAnalysis": {
    "cra": [{ "citationIndex": 1, "summary": "One sentence on how this CRA source supports the answer" }],
    "legislation": [{ "citationIndex": 2, "summary": "One sentence on how this legislative source supports the answer" }],
    "caseLaw": [{ "citationIndex": 3, "summary": "One sentence on how this case supports the answer" }]
  },
  "complianceRisk": "Risks of non-compliance with CRA rules if applicable (penalties, reassessment, denied claims). Empty string if none identified.",
  "keyPoints": ["Bullet with supporting detail and [1] style citations"],
  "whatThisMeansForYou": "Practical plain-language implications for the user. Not legal advice.",
  "considerations": ["Caveats, provincial differences, timing, or when professional advice is needed"],
  "suggestedNextSteps": ["Concrete next actions or follow-up questions"],
  "confidence": "high | medium | low"
}`

const RAG_STRUCTURED_SYSTEM_PROMPT = `You are a helpful Canadian tax research assistant. Answer using ONLY the provided source material.

Return a single JSON object matching this schema (no markdown fences):
${STRUCTURED_RESPONSE_SCHEMA}

RULES:
1. Use numbered citations [1], [2], etc. that map to the provided source list indices.
2. Populate sourceAnalysis.cra, sourceAnalysis.legislation, and sourceAnalysis.caseLaw separately.
3. Only include a bucket entry when that source type was actually provided in the source list.
4. If no legislation or case law sources were provided, return empty arrays for those buckets.
5. Never fabricate citations, statutes, or cases.
6. complianceRisk must describe CRA non-compliance risks when relevant (e.g. denied deductions, reassessment, penalties, interest). Use an empty string when no meaningful compliance risk applies.
7. whatThisMeansForYou must be practical and user-focused, not legal advice.
8. confidence: high = strong source support; medium = partial; low = limited or conflicting support.
9. If sources are insufficient, say so in directAnswer and keep confidence low.`

const DEGRADED_STRUCTURED_SYSTEM_PROMPT = `You are a helpful Canadian tax assistant. The curated knowledge base is not available for this question.

Return a single JSON object matching this schema (no markdown fences):
${STRUCTURED_RESPONSE_SCHEMA}

RULES:
1. sourceAnalysis.cra, sourceAnalysis.legislation, and sourceAnalysis.caseLaw must all be empty arrays.
2. Never fabricate citations, statutes, or cases.
3. Be explicit in directAnswer that this is general guidance only.
4. confidence must be "low".
5. complianceRisk should note general risks of relying on general guidance without professional review, or use an empty string if not applicable.
6. whatThisMeansForYou must recommend consulting a qualified tax professional for case-specific advice.`

/**
 * @param {string} mode
 */
export function buildTaxgptStructuredSystemPrompt (mode) {
  return mode === 'rag' ? RAG_STRUCTURED_SYSTEM_PROMPT : DEGRADED_STRUCTURED_SYSTEM_PROMPT
}

/**
 * @param {string} message
 * @param {Array<{ content: string, citation: Record<string, unknown>, sourceBucket?: string }>} chunks
 */
export function buildTaxgptStructuredUserPrompt (message, chunks) {
  const sourcesText = chunks
    .map((chunk, index) => {
      const heading = chunk.citation.sectionHeading ? ` - ${chunk.citation.sectionHeading}` : ''
      const page = chunk.citation.pageNumber ? ` (Page ${chunk.citation.pageNumber})` : ''
      const bucket = chunk.sourceBucket || chunk.citation.sourceBucket || 'cra'
      return `[${index + 1}] (${bucket}) ${chunk.citation.sourceTitle}${heading}${page}\n${chunk.content}`
    })
    .join('\n\n')

  return `User Question: ${message}

Retrieved Sources (index, bucket, title, excerpt):
${sourcesText}

Populate sourceAnalysis buckets using the bucket label shown for each source index.`
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isObject (value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * @param {unknown} raw
 * @returns {Array<{ citationIndex: number, summary: string }>}
 */
function normalizeBucketEntries (raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map((entry) => {
      if (!isObject(entry)) return null
      const citationIndex = Number(entry.citationIndex)
      const summary = String(entry.summary || '').trim()
      if (!Number.isFinite(citationIndex) || citationIndex < 1 || !summary) return null
      return { citationIndex, summary }
    })
    .filter(Boolean)
}

/**
 * @param {unknown} raw
 * @param {'high' | 'medium' | 'low'} fallback
 */
function normalizeConfidence (raw, fallback = 'medium') {
  const value = String(raw || '').toLowerCase()
  if (value === 'high' || value === 'medium' || value === 'low') return value
  return fallback
}

/**
 * @param {string} raw
 * @param {Array<{ citation: Record<string, unknown> }>} chunks
 * @param {'rag' | 'degraded'} mode
 */
export function parseTaxgptStructuredResponse (raw, chunks, mode) {
  let parsed = null
  try {
    const cleaned = String(raw || '').trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
    parsed = JSON.parse(cleaned)
  } catch {
    parsed = null
  }

  if (!isObject(parsed)) {
    return buildFallbackStructuredResponse(String(raw || ''), chunks, mode)
  }

  const sourceAnalysisRaw = isObject(parsed.sourceAnalysis) ? parsed.sourceAnalysis : {}
  const sourceAnalysis = {
    cra: normalizeBucketEntries(sourceAnalysisRaw.cra),
    legislation: normalizeBucketEntries(sourceAnalysisRaw.legislation),
    caseLaw: normalizeBucketEntries(sourceAnalysisRaw.caseLaw)
  }

  const structured = {
    directAnswer: String(parsed.directAnswer || '').trim() || 'I could not generate a structured answer.',
    sourceAnalysis,
    complianceRisk: String(parsed.complianceRisk || '').trim(),
    keyPoints: Array.isArray(parsed.keyPoints)
      ? parsed.keyPoints.map((item) => String(item || '').trim()).filter(Boolean)
      : [],
    whatThisMeansForYou: String(parsed.whatThisMeansForYou || '').trim(),
    considerations: Array.isArray(parsed.considerations)
      ? parsed.considerations.map((item) => String(item || '').trim()).filter(Boolean)
      : [],
    suggestedNextSteps: Array.isArray(parsed.suggestedNextSteps)
      ? parsed.suggestedNextSteps.map((item) => String(item || '').trim()).filter(Boolean)
      : [],
    confidence: normalizeConfidence(parsed.confidence, mode === 'degraded' ? 'low' : 'medium')
  }

  const citationText = [
    structured.directAnswer,
    structured.complianceRisk,
    ...structured.keyPoints,
    structured.whatThisMeansForYou,
    ...structured.considerations,
    ...structured.suggestedNextSteps,
    ...sourceAnalysis.cra.map((entry) => entry.summary),
    ...sourceAnalysis.legislation.map((entry) => entry.summary),
    ...sourceAnalysis.caseLaw.map((entry) => entry.summary)
  ].join('\n')

  const citations = mode === 'rag'
    ? extractTaxgptCitations(citationText, chunks)
    : []

  const enrichedCitations = enrichCitationsWithBuckets(citations, chunks)
  const groupedSources = buildGroupedSources(enrichedCitations, sourceAnalysis)

  return {
    structured,
    citations: enrichedCitations,
    groupedSources,
    plainText: renderStructuredPlainText(structured, groupedSources, mode)
  }
}

/**
 * @param {Array<Record<string, unknown>>} citations
 * @param {Array<{ citation: Record<string, unknown>, sourceBucket?: string }>} chunks
 */
function enrichCitationsWithBuckets (citations, chunks) {
  return citations.map((citation) => {
    const chunk = chunks.find((item) => item.citation.chunkId === citation.chunkId)
    const sourceBucket = chunk?.sourceBucket || chunk?.citation?.sourceBucket || 'cra'
    return {
      ...citation,
      sourceBucket
    }
  })
}

/**
 * @param {Array<Record<string, unknown>>} citations
 * @param {Record<string, Array<{ citationIndex: number, summary: string }>>} sourceAnalysis
 */
function buildGroupedSources (citations, sourceAnalysis) {
  const citationByIndex = new Map()
  citations.forEach((citation, index) => {
    citationByIndex.set(index + 1, citation)
  })

  /** @type {Record<string, { bucket: string, label: string, entries: Array<Record<string, unknown>>, emptyMessage: string }>} */
  const grouped = {}

  for (const bucket of TAXGPT_SOURCE_BUCKETS) {
    const key = bucket === 'case_law' ? 'caseLaw' : bucket
    const analysisEntries = sourceAnalysis[key] || []
    const entries = []
    const seen = new Set()

    for (const item of analysisEntries) {
      const citation = citationByIndex.get(item.citationIndex)
      if (!citation) continue
      const dedupeKey = citation.sourceUrl || citation.chunkId
      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)
      entries.push({
        ...citation,
        summary: item.summary
      })
    }

    for (const citation of citations) {
      if (citation.sourceBucket !== bucket) continue
      const dedupeKey = citation.sourceUrl || citation.chunkId
      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)
      entries.push(citation)
    }

    grouped[bucket] = {
      bucket,
      label: sourceBucketLabel(bucket),
      entries,
      emptyMessage: emptyBucketMessage(bucket)
    }
  }

  return grouped
}

/**
 * @param {Record<string, unknown>} structured
 * @param {Record<string, { label: string, entries: Array<Record<string, unknown>>, emptyMessage: string }>} groupedSources
 * @param {'rag' | 'degraded'} mode
 */
function renderStructuredPlainText (structured, groupedSources, mode) {
  const lines = [
    '## Direct answer',
    structured.directAnswer,
    '',
    '## Sources consulted'
  ]

  for (const bucket of TAXGPT_SOURCE_BUCKETS) {
    const group = groupedSources[bucket]
    lines.push(`### ${group.label}`)
    if (group.entries.length === 0) {
      lines.push(group.emptyMessage)
    } else {
      group.entries.forEach((entry, index) => {
        const summary = entry.summary ? ` — ${entry.summary}` : ''
        lines.push(`${index + 1}. ${entry.sourceTitle}${summary}`)
      })
    }
    lines.push('')
  }

  if (structured.complianceRisk) {
    lines.push('## Compliance Risk')
    lines.push(structured.complianceRisk)
    lines.push('')
  }

  const hasPracticalSection = structured.whatThisMeansForYou ||
    structured.keyPoints.length > 0 ||
    structured.considerations.length > 0 ||
    structured.suggestedNextSteps.length > 0

  if (hasPracticalSection) {
    lines.push('## What this means for you')
    if (structured.whatThisMeansForYou) {
      lines.push(structured.whatThisMeansForYou)
      lines.push('')
    }
    if (structured.keyPoints.length > 0) {
      lines.push('### Key points')
      structured.keyPoints.forEach((point) => lines.push(`- ${point}`))
      lines.push('')
    }
    if (structured.considerations.length > 0) {
      lines.push('### Considerations')
      structured.considerations.forEach((item) => lines.push(`- ${item}`))
      lines.push('')
    }
    if (structured.suggestedNextSteps.length > 0) {
      lines.push('### Suggested next steps')
      structured.suggestedNextSteps.forEach((item) => lines.push(`- ${item}`))
      lines.push('')
    }
  }

  lines.push(`Confidence: ${structured.confidence}`)
  if (mode === 'degraded') {
    lines.push('Mode: general guidance (not source-backed)')
  }

  return lines.join('\n').trim()
}

/**
 * @param {string} raw
 * @param {Array<{ citation: Record<string, unknown> }>} chunks
 * @param {'rag' | 'degraded'} mode
 */
function buildFallbackStructuredResponse (raw, chunks, mode) {
  const structured = {
    directAnswer: raw.trim() || 'I apologize, but I could not generate a response.',
    sourceAnalysis: { cra: [], legislation: [], caseLaw: [] },
    complianceRisk: '',
    keyPoints: [],
    whatThisMeansForYou: mode === 'degraded'
      ? 'This answer is general guidance only. Consult a qualified tax professional for advice specific to your situation.'
      : '',
    considerations: [],
    suggestedNextSteps: [],
    confidence: mode === 'degraded' ? 'low' : 'medium'
  }

  const citations = mode === 'rag' ? extractTaxgptCitations(raw, chunks) : []
  const enrichedCitations = enrichCitationsWithBuckets(citations, chunks)
  const groupedSources = buildGroupedSources(enrichedCitations, structured.sourceAnalysis)

  return {
    structured,
    citations: enrichedCitations,
    groupedSources,
    plainText: renderStructuredPlainText(structured, groupedSources, mode)
  }
}

/**
 * @param {Array<Record<string, unknown>>} chunks
 */
export function annotateChunksWithBuckets (chunks) {
  return chunks.map((chunk) => ({
    ...chunk,
    sourceBucket: resolveSourceBucket({
      category: chunk.sourceCategory,
      metadata: chunk.sourceMetadata,
      url: chunk.citation?.sourceUrl,
      title: chunk.citation?.sourceTitle
    }),
    citation: {
      ...chunk.citation,
      sourceBucket: resolveSourceBucket({
        category: chunk.sourceCategory,
        metadata: chunk.sourceMetadata,
        url: chunk.citation?.sourceUrl,
        title: chunk.citation?.sourceTitle
      })
    }
  }))
}
