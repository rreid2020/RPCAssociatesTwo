import { parseTaxgptStructuredResponse } from './taxgptStructuredResponse.js'
import { detectTaxPlanningIntent, shouldSuppressStrategyWebRetrieval } from './taxgptStrategyWebRetrieval.js'

const strategyWebChunks = [{
  content: 'Contributing to an RRSP can defer tax until withdrawal.',
  citation: {
    sourceTitle: 'RRSP planning guide',
    sourceUrl: 'https://example.com/rrsp-planning'
  },
  publisher: 'Example'
}]

const raw = JSON.stringify({
  directAnswer: 'RRSP contributions can defer tax.',
  sourceAnalysis: { cra: [], legislation: [], caseLaw: [] },
  complianceRisks: [],
  taxTips: [],
  taxStrategies: [{
    title: 'RRSP contribution planning',
    description: 'Consider maximizing RRSP room before year-end [1].',
    citationIndices: [1]
  }],
  filingDeadlines: [],
  penaltiesAndInterest: [],
  keyPoints: [],
  whatThisMeansForYou: '',
  considerations: [],
  suggestedNextSteps: [],
  confidence: 'medium'
})

const parsed = parseTaxgptStructuredResponse(raw, [], 'degraded', strategyWebChunks)

if (parsed.structured.taxStrategies.length !== 1) {
  throw new Error('Expected one tax strategy')
}
if (parsed.strategyCitations.length !== 1) {
  throw new Error('Expected one strategy citation')
}
if (!detectTaxPlanningIntent('How should I mix RRSP and TFSA contributions?')) {
  throw new Error('Expected planning intent')
}
if (!shouldSuppressStrategyWebRetrieval('offshore trust planning')) {
  throw new Error('Expected high-risk suppression')
}

console.log('taxgpt strategies smoke test passed')
