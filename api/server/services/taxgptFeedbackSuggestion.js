/**
 * @param {string} message
 * @param {{
 *   retrievalMode: 'rag' | 'degraded',
 *   retrievalNotice?: string | null,
 *   requestedPublications?: Array<Record<string, unknown>>,
 *   confidence?: 'high' | 'medium' | 'low'
 * }} input
 */
export function buildTaxgptFeedbackSuggestion (message, input = {}) {
  const retrievalMode = input.retrievalMode === 'degraded' ? 'degraded' : 'rag'
  const requestedPublications = Array.isArray(input.requestedPublications) ? input.requestedPublications : []
  const confidence = input.confidence || 'medium'
  const trimmedMessage = String(message || '').trim()

  const unavailable = requestedPublications.filter((item) =>
    item.status === 'skipped' || item.status === 'not_indexed' || item.status === 'pending'
  )

  if (unavailable.length > 0) {
    const codes = unavailable.map((item) => item.code).filter(Boolean).join(', ')
    const detail = unavailable
      .map((item) => `${item.code}: ${item.reason || item.status}`)
      .join('; ')

    return {
      show: true,
      category: 'corpus_gap',
      reason: codes
        ? `The requested publication(s) ${codes} are not fully available in the TaxGPT corpus.`
        : 'A publication named in your question is not fully available in the TaxGPT corpus.',
      subject: codes ? `Missing or unavailable source: ${codes}` : 'Missing or unavailable CRA source',
      messageDraft: [
        'TaxGPT could not use the CRA source I expected for this question.',
        detail ? `Corpus status: ${detail}.` : '',
        trimmedMessage ? `Question: ${trimmedMessage.slice(0, 1200)}` : ''
      ].filter(Boolean).join('\n\n')
    }
  }

  if (retrievalMode === 'degraded') {
    return {
      show: true,
      category: 'corpus_gap',
      reason: input.retrievalNotice ||
        'TaxGPT could not retrieve sufficiently relevant CRA sources for this question.',
      subject: 'TaxGPT could not find relevant CRA sources',
      messageDraft: [
        input.retrievalNotice || 'No sufficiently relevant CRA sources were retrieved for my question.',
        trimmedMessage ? `Question: ${trimmedMessage.slice(0, 1200)}` : ''
      ].filter(Boolean).join('\n\n')
    }
  }

  if (confidence === 'low') {
    return {
      show: true,
      category: 'answer_quality',
      reason: 'This answer was generated with low confidence because retrieved sources were limited, indirect, or incomplete for your question.',
      subject: 'Low-confidence TaxGPT answer',
      messageDraft: [
        'TaxGPT returned a low-confidence answer and the cited sources did not fully address my question.',
        trimmedMessage ? `Question: ${trimmedMessage.slice(0, 1200)}` : ''
      ].filter(Boolean).join('\n\n')
    }
  }

  return {
    show: false,
    category: null,
    reason: null,
    subject: null,
    messageDraft: null
  }
}
