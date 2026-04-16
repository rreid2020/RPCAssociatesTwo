/**
 * API functions for managing subscriptions
 * 
 * Note: In production, these should call your backend API
 * which then updates Clerk user metadata via Clerk's Backend API
 */

import { SubscriptionPlan } from './types'

/**
 * Assign a subscription plan to a user
 * This should be called from your backend API, not directly from the client
 */
export async function assignSubscriptionPlan(
  userId: string,
  plan: SubscriptionPlan
): Promise<void> {
  // This is a placeholder - in production, call your backend API
  // which will use Clerk's Backend API to update user metadata
  const response = await fetch('/api/subscriptions/assign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, plan }),
  })

  if (!response.ok) {
    throw new Error('Failed to assign subscription plan')
  }
}

/**
 * Get subscription plan for current user
 * This should be called from your backend API
 */
export async function getSubscriptionPlan(userId: string): Promise<SubscriptionPlan> {
  // This is a placeholder - in production, call your backend API
  const response = await fetch(`/api/subscriptions/${userId}`)

  if (!response.ok) {
    return 'free' // Default to free on error
  }

  const data = await response.json()
  return data.plan || 'free'
}
