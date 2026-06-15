import {
  emptyBucketMessage,
  resolveSourceBucket,
  sourceBucketLabel,
  TAXGPT_SOURCE_BUCKETS
} from './taxgptSourceBuckets.js'
import { extractTaxgptCitations } from './taxgptPrompt.js'
import { isTableOfContentsExcerpt } from './taxgptRetrievalFilters.js'
import { taxgptLanguageLabel } from './taxgptSourceLanguage.js'

const STRUCTURED_RESPONSE_SCHEMA = `{
  "directAnswer": "2-3 sentence direct answer to the user question",
  "sourceAnalysis": {
    "cra": [{ "citationIndex": 1, "highlights": ["Specific fact or rule from the source", "Another key point with dates, thresholds, or obligations"] }],
    "legislation": [{ "citationIndex": 2, "highlights": ["Key legislative point"] }],
    "caseLaw": [{ "citationIndex": 3, "highlights": ["Key judicial principle"] }]
  },
  "complianceRisks": [
    {
      "risk": "Question-specific non-compliance consequence grounded in a retrieved source",
      "citationIndices": [1],
      "basis": "cra | legislation | case_law"
    }
  ],
  "taxTips": ["Practical CRA-focused tip with [1] citation when source-backed"],
  "filingDeadlines": [
    {
      "title": "Return or payment obligation",
      "deadline": "April 30",
      "note": "Short context such as tax year, extension, or who it applies to",
      "citationIndices": [1]
    }
  ],
  "penaltiesAndInterest": [
    {
      "description": "Specific CRA penalty or interest rule with amounts, rates, or calculation basis",
      "citationIndices": [1]
    }
  ],
  "keyPoints": ["Bullet with supporting detail and [1] style citations"],
  "whatThisMeansForYou": "Practical plain-language implications for the user. Not legal advice.",
  "considerations": ["Caveats, provincial differences, timing, or when professional advice is needed"],
  "suggestedNextSteps": ["Concrete next actions or follow-up questions"],
  "confidence": "high | medium | low"
}`

const GENERIC_COMPLIANCE_RISK_PATTERNS = [
  /if\s+.+\s+(are|is)\s+not\s+reported\s+correctly/i,
  /there\s+may\s+be\s+risks\s+of\s+reassessment,\s*penalties,\s*(and\s+)?or\s+denied\s+claims/i,
  /failure\s+to\s+comply\s+may\s+result\s+in\s+penalties/i,
  /may\s+face\s+penalties\s+and\s+interest/i,
  /non-?compliance\s+may\s+lead\s+to\s+penalties/i,
  /could\s+result\s+in\s+reassessment,\s*penalties,\s*and\s+interest/i,
  /risks\s+of\s+reassessment,\s*penalties,\s*or\s+denied\s+claims/i
]

const RAG_STRUCTURED_SYSTEM_PROMPT_BASE = `You are a helpful Canadian tax research assistant. Answer using ONLY the provided source material.

Return a single JSON object matching this schema (no markdown fences):
${STRUCTURED_RESPONSE_SCHEMA}

RULES:
1. Use numbered citations [1], [2], etc. that map to the provided source list indices.
2. Populate sourceAnalysis.cra, sourceAnalysis.legislation, and sourceAnalysis.caseLaw with citationIndex values for sources you relied on in each bucket.
3. For each sourceAnalysis entry, include highlights: an array of 2-4 concise bullet points (1-2 sentences each) with the most relevant facts, rules, deadlines, thresholds, or obligations from that source for THIS question.
4. Highlights must be specific and grounded in the retrieved excerpt. Do not paste raw markdown, table-of-contents text, or long verbatim passages.
5. Only include a bucket entry when that source type was actually provided in the source list.
6. If no legislation or case law sources were provided, return empty arrays for those buckets.
7. Never fabricate citations, statutes, or cases.
8. complianceRisks must be an array. Include items ONLY when retrieved sources describe a concrete non-compliance consequence for THIS question (missed filing, incorrect reporting, denied claim, reassessment, penalties, interest, or similar).
9. Each complianceRisks item must cite at least one retrieved source index in citationIndices and name the specific obligation, form, section, policy, or case principle from that source. Do not use generic boilerplate such as "if not reported correctly there may be penalties."
10. If no source-backed compliance consequence applies to this question, return complianceRisks as an empty array [].
11. When case law sources are retrieved, a compliance risk may reference the judicial principle or outcome described in that case.
12. taxTips must be an array of 2-4 concise, practical CRA-focused tips for THIS question (record-keeping, elections, reporting mechanics, common mistakes). Include [n] citations when supported by retrieved sources. Return [] if no useful tips apply.
13. filingDeadlines must be an array of deadline objects only when retrieved sources mention a filing, payment, or remittance date relevant to THIS question. Each item needs title, deadline (calendar date or rule), optional note, and citationIndices. Return [] if no source-backed deadlines apply.
14. penaltiesAndInterest must be an array describing specific CRA penalty amounts, interest charges, late-filing penalties, or gross-negligence rules from retrieved sources. Each item needs description and citationIndices. Do not use generic boilerplate. Return [] if none apply.
15. whatThisMeansForYou must be practical and user-focused, not legal advice.
16. confidence: high = strong source support; medium = partial; low = limited or conflicting support.
17. If sources are insufficient, say so in directAnswer and keep confidence low.
18. If a "Requested publications" section is provided, treat it as authoritative corpus status. When a named guide is skipped, cancelled, pending, or not indexed, say that explicitly in directAnswer before relying on related sources.`

const DEGRADED_STRUCTURED_SYSTEM_PROMPT = `You are a helpful Canadian tax assistant. The curated knowledge base is not available for this question.

Return a single JSON object matching this schema (no markdown fences):
${STRUCTURED_RESPONSE_SCHEMA}

RULES:
1. sourceAnalysis.cra, sourceAnalysis.legislation, and sourceAnalysis.caseLaw must all be empty arrays.
2. Never fabricate citations, statutes, or cases.
3. Be explicit in directAnswer that this is general guidance only.
4. confidence must be "low".
5. complianceRisks must be an empty array [] because no source-backed compliance analysis is available in degraded mode.
6. taxTips, filingDeadlines, and penaltiesAndInterest must all be empty arrays [] in degraded mode.
7. whatThisMeansForYou must recommend consulting a qualified tax professional for case-specific advice.`

/**
 * @param {'rag' | 'degraded'} mode
 * @param {'en' | 'fr'} language
 */
export function buildTaxgptStructuredSystemPrompt (mode, language = 'en') {
  if (mode !== 'rag') return DEGRADED_STRUCTURED_SYSTEM_PROMPT
  const languageLabel = taxgptLanguageLabel(language)
  return `${RAG_STRUCTURED_SYSTEM_PROMPT_BASE}
15. Write the entire JSON response in ${languageLabel}, including directAnswer, highlights, keyPoints, taxTips, filingDeadlines, penaltiesAndInterest, whatThisMeansForYou, considerations, suggestedNextSteps, and complianceRisks.
16. If a retrieved source excerpt is in another language, translate the substance into ${languageLabel} in your highlights and answer while preserving technical accuracy.`
}

/**
 * @param {string} message
 * @param {Array<{ content: string, citation: Record<string, unknown>, sourceBucket?: string }>} chunks
 * @param {'en' | 'fr'} [language]
 * @param {{ requestedPublicationsContext?: string }} [options]
 */
export function buildTaxgptStructuredUserPrompt (message, chunks, language = 'en', options = {}) {
  const languageLabel = taxgptLanguageLabel(language)
  const requestedContext = String(options.requestedPublicationsContext || '').trim()
  const sourcesText = chunks
    .map((chunk, index) => {
      const heading = chunk.citation.sectionHeading ? ` - ${chunk.citation.sectionHeading}` : ''
      const page = chunk.citation.pageNumber ? ` (Page ${chunk.citation.pageNumber})` : ''
      const bucket = chunk.sourceBucket || chunk.citation.sourceBucket || 'cra'
      return `[${index + 1}] (${bucket}) ${chunk.citation.sourceTitle}${heading}${page}\n${chunk.content}`
    })
    .join('\n\n')

  return `User Question: ${message}

Response language: ${languageLabel}
${requestedContext ? `\n${requestedContext}\n` : ''}
Retrieved Sources (index, bucket, title, excerpt):
${sourcesText}

Populate sourceAnalysis buckets using the bucket label shown for each source index.
For each cited source, write 2-4 highlights with enough detail for context but stay concise.
Populate taxTips, filingDeadlines, and penaltiesAndInterest only when retrieved sources support them for this specific question.
For complianceRisks, include only consequences that are supported by these retrieved excerpts for this specific question. Each item must cite source indices and avoid generic penalty boilerplate.`
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isObject (value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * @param {string} text
 * @param {number} maxLength
 */
function normalizeExcerpt (text, maxLength = 900) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim()
  if (!cleaned || isTableOfContentsExcerpt(cleaned)) return ''
  if (cleaned.length <= maxLength) return cleaned
  return `${cleaned.slice(0, maxLength).trim()}…`
}

/**
 * @param {Array<{ content?: string }>} chunks
 */
function buildChunkExcerptMap (chunks) {
  const map = new Map()
  chunks.forEach((chunk, index) => {
    map.set(index + 1, normalizeExcerpt(chunk.content))
  })
  return map
}

/**
 * @param {unknown} raw
 * @returns {Array<{ citationIndex: number, summary: string, highlights: string[] }>}
 */
function normalizeBucketEntries (raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map((entry) => {
      if (!isObject(entry)) return null
      const citationIndex = Number(entry.citationIndex)
      if (!Number.isFinite(citationIndex) || citationIndex < 1) return null
      const summary = String(entry.summary || '').trim()
      const highlights = Array.isArray(entry.highlights)
        ? entry.highlights.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 4)
        : []
      if (!summary && highlights.length === 0) return null
      return { citationIndex, summary, highlights }
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
 * @param {string} text
 */
function isGenericComplianceRisk (text) {
  const normalized = String(text || '').trim()
  if (!normalized) return true
  if (normalized.length < 48) return true
  return GENERIC_COMPLIANCE_RISK_PATTERNS.some((pattern) => pattern.test(normalized))
}

/**
 * @param {unknown} raw
 */
function normalizeComplianceBasis (raw) {
  const value = String(raw || '').trim().toLowerCase()
  if (value === 'cra' || value === 'legislation' || value === 'case_law') return value
  return null
}

/**
 * @param {unknown} raw
 * @param {'rag' | 'degraded'} mode
 */
function normalizeComplianceRiskEntries (raw, mode) {
  if (!Array.isArray(raw)) return []

  return raw
    .map((entry) => {
      if (!isObject(entry)) return null
      const risk = String(entry.risk || '').trim()
      if (!risk || isGenericComplianceRisk(risk)) return null

      const citationIndices = Array.isArray(entry.citationIndices)
        ? entry.citationIndices
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value >= 1)
        : []

      if (mode === 'rag' && citationIndices.length === 0) return null

      return {
        risk,
        citationIndices,
        basis: normalizeComplianceBasis(entry.basis)
      }
    })
    .filter(Boolean)
}

/**
 * @param {string} legacyRisk
 * @param {'rag' | 'degraded'} mode
 */
function normalizeLegacyComplianceRisk (legacyRisk, mode) {
  const risk = String(legacyRisk || '').trim()
  if (!risk || isGenericComplianceRisk(risk)) return []
  if (mode === 'degraded') return []

  return [{
    risk,
    citationIndices: [],
    basis: null
  }]
}

/**
 * @param {unknown} raw
 */
function normalizeStringList (raw) {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => String(item || '').trim()).filter(Boolean)
}

/**
 * @param {unknown} raw
 * @param {'rag' | 'degraded'} mode
 */
function normalizeFilingDeadlineEntries (raw, mode) {
  if (!Array.isArray(raw)) return []

  return raw
    .map((entry) => {
      if (!isObject(entry)) {
        const text = String(entry || '').trim()
        if (!text || mode === 'rag') return null
        return {
          title: text,
          deadline: '',
          note: '',
          citationIndices: []
        }
      }

      const title = String(entry.title || entry.label || '').trim()
      const deadline = String(entry.deadline || entry.date || '').trim()
      const note = String(entry.note || entry.details || '').trim()
      const citationIndices = Array.isArray(entry.citationIndices)
        ? entry.citationIndices
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value >= 1)
        : []

      if (!title && !deadline) return null
      if (mode === 'rag' && citationIndices.length === 0) return null

      return {
        title: title || deadline,
        deadline,
        note,
        citationIndices
      }
    })
    .filter(Boolean)
}

/**
 * @param {unknown} raw
 * @param {'rag' | 'degraded'} mode
 */
function normalizePenaltyInterestEntries (raw, mode) {
  if (!Array.isArray(raw)) return []

  return raw
    .map((entry) => {
      if (!isObject(entry)) return null
      const description = String(entry.description || entry.penalty || entry.risk || '').trim()
      if (!description || isGenericComplianceRisk(description)) return null

      const citationIndices = Array.isArray(entry.citationIndices)
        ? entry.citationIndices
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value >= 1)
        : []

      if (mode === 'rag' && citationIndices.length === 0) return null

      return {
        description,
        citationIndices
      }
    })
    .filter(Boolean)
}

/**
 * @param {number[]} citationIndices
 * @param {Array<{ citation: Record<string, unknown>, sourceBucket?: string }>} chunks
 * @param {string | null} [basis]
 */
function enrichCitationIndicesWithSources (citationIndices, chunks, basis = null) {
  return citationIndices
    .map((index) => {
      const chunk = chunks[index - 1]
      if (!chunk?.citation) return null
      return {
        citationIndex: index,
        sourceTitle: chunk.citation.sourceTitle || 'Unknown source',
        sourceUrl: chunk.citation.sourceUrl || '',
        sectionHeading: chunk.citation.sectionHeading || undefined,
        sourceBucket: chunk.sourceBucket || chunk.citation.sourceBucket || basis || 'cra'
      }
    })
    .filter(Boolean)
}

/**
 * @param {Array<{ citationIndices: number[] }>} entries
 * @param {Array<{ citation: Record<string, unknown>, sourceBucket?: string }>} chunks
 * @param {'rag' | 'degraded'} mode
 */
function enrichEntriesWithSources (entries, chunks, mode) {
  return entries
    .map((entry) => ({
      ...entry,
      sources: enrichCitationIndicesWithSources(entry.citationIndices, chunks)
    }))
    .filter((entry) => mode !== 'rag' || entry.sources.length > 0)
}

/**
 * @param {Array<{ risk: string, citationIndices: number[], basis: string | null }>} complianceRisks
 * @param {Array<{ citation: Record<string, unknown>, sourceBucket?: string }>} chunks
 */
function enrichComplianceRisksWithSources (complianceRisks, chunks) {
  return complianceRisks.map((entry) => ({
    ...entry,
    sources: enrichCitationIndicesWithSources(entry.citationIndices, chunks, entry.basis)
  }))
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

  const complianceRisks = normalizeComplianceRiskEntries(parsed.complianceRisks, mode)
  const legacyComplianceRisks = complianceRisks.length === 0
    ? normalizeLegacyComplianceRisk(parsed.complianceRisk, mode)
    : []
  const enrichedComplianceRisks = enrichComplianceRisksWithSources(
    [...complianceRisks, ...legacyComplianceRisks],
    chunks
  ).filter((entry) => mode !== 'rag' || entry.sources.length > 0)

  const taxTips = normalizeStringList(parsed.taxTips)
  const filingDeadlines = enrichEntriesWithSources(
    normalizeFilingDeadlineEntries(parsed.filingDeadlines, mode),
    chunks,
    mode
  )
  const penaltiesAndInterest = enrichEntriesWithSources(
    normalizePenaltyInterestEntries(parsed.penaltiesAndInterest, mode),
    chunks,
    mode
  )

  const structured = {
    directAnswer: String(parsed.directAnswer || '').trim() || 'I could not generate a structured answer.',
    sourceAnalysis,
    complianceRisks: enrichedComplianceRisks,
    taxTips,
    filingDeadlines,
    penaltiesAndInterest,
    keyPoints: normalizeStringList(parsed.keyPoints),
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
    ...structured.complianceRisks.map((entry) => entry.risk),
    ...structured.taxTips,
    ...structured.filingDeadlines.map((entry) => [entry.title, entry.deadline, entry.note].filter(Boolean).join(' ')),
    ...structured.penaltiesAndInterest.map((entry) => entry.description),
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
  const sourceReferences = buildSourceReferences(chunks)
  const groupedSources = buildGroupedSources(enrichedCitations, sourceAnalysis, sourceReferences, chunks)

  return {
    structured: {
      ...structured,
      sourceReferences
    },
    citations: enrichedCitations,
    groupedSources,
    plainText: renderStructuredPlainText({ ...structured, sourceReferences }, groupedSources, mode)
  }
}

/**
 * @param {Array<Record<string, unknown>>} citations
 * @param {Array<{ citation: Record<string, unknown>, sourceBucket?: string }>} chunks
 */
function enrichCitationsWithBuckets (citations, chunks) {
  return citations.map((citation) => {
    const chunk = chunks[citation.citationIndex - 1] ||
      chunks.find((item) => item.citation.chunkId === citation.chunkId)
    const sourceBucket = chunk?.sourceBucket || chunk?.citation?.sourceBucket || 'cra'
    return {
      ...citation,
      sourceBucket,
      excerpt: normalizeExcerpt(chunk?.content)
    }
  })
}

/**
 * @param {Array<{ citation: Record<string, unknown>, sourceBucket?: string }>} chunks
 */
function buildSourceReferences (chunks) {
  return chunks.map((chunk, index) => ({
    citationIndex: index + 1,
    id: chunk.citation.id,
    chunkId: chunk.citation.chunkId,
    sourceTitle: chunk.citation.sourceTitle || 'Unknown source',
    sourceUrl: chunk.citation.sourceUrl || '',
    sectionHeading: chunk.citation.sectionHeading || undefined,
    pageNumber: chunk.citation.pageNumber ?? undefined,
    sourceBucket: chunk.sourceBucket || chunk.citation?.sourceBucket || 'cra',
    excerpt: normalizeExcerpt(chunk.content)
  }))
}

/**
 * @param {Array<Record<string, unknown>>} citations
 * @param {Record<string, Array<{ citationIndex: number, summary: string }>>} sourceAnalysis
 */
function buildGroupedSources (citations, sourceAnalysis, sourceReferences = [], chunks = []) {
  const excerptByIndex = buildChunkExcerptMap(chunks)
  const citationByIndex = new Map()
  for (const reference of sourceReferences) {
    citationByIndex.set(reference.citationIndex, reference)
  }
  for (const citation of citations) {
    if (citation.citationIndex) {
      citationByIndex.set(citation.citationIndex, citation)
    }
  }

  /** @type {Record<string, { bucket: string, label: string, entries: Array<Record<string, unknown>>, emptyMessage: string }>} */
  const grouped = {}

  for (const bucket of TAXGPT_SOURCE_BUCKETS) {
    const key = bucket === 'case_law' ? 'caseLaw' : bucket
    const analysisEntries = sourceAnalysis[key] || []
    const entries = []
    const seenCitationIndices = new Set()

    const analysisByIndex = new Map()
    for (const item of analysisEntries) {
      analysisByIndex.set(item.citationIndex, item)
    }

    for (const item of analysisEntries) {
      const citation = citationByIndex.get(item.citationIndex)
      if (!citation) continue
      if (seenCitationIndices.has(item.citationIndex)) continue
      seenCitationIndices.add(item.citationIndex)
      const excerpt = excerptByIndex.get(item.citationIndex) || citation.excerpt || ''
      const highlights = item.highlights || []
      if (highlights.length === 0 && !excerpt && !item.summary) continue
      entries.push({
        ...citation,
        citationIndex: item.citationIndex,
        excerpt,
        highlights,
        summary: item.summary || ''
      })
    }

    for (const citation of citations) {
      if (citation.sourceBucket !== bucket) continue
      if (!citation.citationIndex || seenCitationIndices.has(citation.citationIndex)) continue
      const analysisItem = analysisByIndex.get(citation.citationIndex)
      const excerpt = excerptByIndex.get(citation.citationIndex) || citation.excerpt || ''
      const highlights = analysisItem?.highlights || []
      if (highlights.length === 0 && !excerpt) continue
      seenCitationIndices.add(citation.citationIndex)
      entries.push({
        ...citation,
        excerpt,
        highlights
      })
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
        const prefix = entry.citationIndex ? `[${entry.citationIndex}] ` : ''
        lines.push(`${index + 1}. ${prefix}${entry.sourceTitle}`)
        if (entry.sectionHeading) {
          lines.push(`   ${entry.sectionHeading}`)
        }
        if (Array.isArray(entry.highlights) && entry.highlights.length > 0) {
          entry.highlights.forEach((highlight) => lines.push(`- ${highlight}`))
        } else if (entry.excerpt) {
          lines.push(`> ${entry.excerpt}`)
        } else if (entry.summary) {
          lines.push(`> ${entry.summary}`)
        }
      })
    }
    lines.push('')
  }

  if (structured.complianceRisks.length > 0) {
    lines.push('## Compliance risks')
    structured.complianceRisks.forEach((entry, index) => {
      lines.push(`${index + 1}. ${entry.risk}`)
      entry.sources.forEach((source) => {
        const heading = source.sectionHeading ? ` — ${source.sectionHeading}` : ''
        lines.push(`   Source [${source.citationIndex}]: ${source.sourceTitle}${heading}`)
      })
    })
    lines.push('')
  }

  if (structured.taxTips.length > 0) {
    lines.push('## Tax tips')
    structured.taxTips.forEach((tip) => lines.push(`- ${tip}`))
    lines.push('')
  }

  if (structured.filingDeadlines.length > 0) {
    lines.push('## Filing dates and deadlines')
    structured.filingDeadlines.forEach((entry, index) => {
      const deadline = entry.deadline ? ` — ${entry.deadline}` : ''
      lines.push(`${index + 1}. ${entry.title}${deadline}`)
      if (entry.note) lines.push(`   ${entry.note}`)
      entry.sources.forEach((source) => {
        const heading = source.sectionHeading ? ` — ${source.sectionHeading}` : ''
        lines.push(`   Source [${source.citationIndex}]: ${source.sourceTitle}${heading}`)
      })
    })
    lines.push('')
  }

  if (structured.penaltiesAndInterest.length > 0) {
    lines.push('## Penalties and interest for non-compliance')
    structured.penaltiesAndInterest.forEach((entry, index) => {
      lines.push(`${index + 1}. ${entry.description}`)
      entry.sources.forEach((source) => {
        const heading = source.sectionHeading ? ` — ${source.sectionHeading}` : ''
        lines.push(`   Source [${source.citationIndex}]: ${source.sourceTitle}${heading}`)
      })
    })
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

  if (Array.isArray(structured.sourceReferences) && structured.sourceReferences.length > 0) {
    lines.push('')
    lines.push('## References')
    structured.sourceReferences.forEach((reference) => {
      const heading = reference.sectionHeading ? ` — ${reference.sectionHeading}` : ''
      const url = reference.sourceUrl ? ` (${reference.sourceUrl})` : ''
      lines.push(`[${reference.citationIndex}] ${reference.sourceTitle}${heading}${url}`)
    })
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
    complianceRisks: [],
    taxTips: [],
    filingDeadlines: [],
    penaltiesAndInterest: [],
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
  const sourceReferences = buildSourceReferences(chunks)
  const groupedSources = buildGroupedSources(enrichedCitations, structured.sourceAnalysis, sourceReferences, chunks)

  return {
    structured: {
      ...structured,
      sourceReferences
    },
    citations: enrichedCitations,
    groupedSources,
    plainText: renderStructuredPlainText({ ...structured, sourceReferences }, groupedSources, mode)
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
