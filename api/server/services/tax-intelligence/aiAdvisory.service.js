/**
 * AI Advisory scaffold only.
 * This intentionally avoids live model calls in this phase.
 */
export async function getAdvisorySummary (_pool, _clerkUserId, _taxReturnId) {
  return {
    status: 'SCAFFOLD_ONLY',
    recommendations: [],
    notes: [
      'AI advisory orchestration is scaffolded but not enabled.',
      'Deterministic tax calculations and rule-based risk remain the source of truth.'
    ]
  }
}
