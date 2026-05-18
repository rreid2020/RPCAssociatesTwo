export class AIReviewService {
  constructor () {
    this.enabled = process.env.ENABLE_AI_REVIEW === 'true'
  }

  assertEnabled () {
    if (!this.enabled) {
      throw new Error('AI review is not enabled yet')
    }
  }

  async generateVarianceExplanation () {
    this.assertEnabled()
    throw new Error('AI provider is not configured yet')
  }

  async suggestReviewProcedures () {
    this.assertEnabled()
    throw new Error('AI provider is not configured yet')
  }

  async identifyMissingSupport () {
    this.assertEnabled()
    throw new Error('AI provider is not configured yet')
  }

  async suggestAdjustingEntry () {
    this.assertEnabled()
    throw new Error('AI provider is not configured yet')
  }

  async summarizeEngagementRisk () {
    this.assertEnabled()
    throw new Error('AI provider is not configured yet')
  }
}

