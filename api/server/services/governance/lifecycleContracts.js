export const ENGAGEMENT_LIFECYCLE_STATES = [
  'draft',
  'in_progress',
  'under_review',
  'review_blocked',
  'ready_for_signoff',
  'signed_off',
  'archived'
]

const ALLOWED_TRANSITIONS = {
  draft: ['in_progress', 'archived'],
  in_progress: ['under_review', 'review_blocked', 'archived'],
  under_review: ['review_blocked', 'ready_for_signoff', 'in_progress'],
  review_blocked: ['in_progress', 'under_review'],
  ready_for_signoff: ['signed_off', 'under_review'],
  signed_off: ['archived'],
  archived: []
}

export function isValidEngagementLifecycleTransition (fromState, toState) {
  return (ALLOWED_TRANSITIONS[fromState] || []).includes(toState)
}

