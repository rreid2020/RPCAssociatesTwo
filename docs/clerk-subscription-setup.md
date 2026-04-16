# Clerk Subscription Plan Setup

This guide explains how to set up subscription plans using Clerk's user metadata feature.

## Overview

The client portal uses Clerk's `publicMetadata` to store subscription information. Each user has a `subscriptionPlan` field that determines which features they can access.

## Subscription Plans

### Free Plan (Development)
- **ID:** `free`
- **Price:** Free
- **Features:**
  - Dashboard
  - TaxGPT (basic)

### Paid Plans (Future)
- **Basic Plan:** $29.99/month
- **Professional Plan:** $99.99/month
- **Enterprise Plan:** Custom pricing

## Setting Up Free Plan for New Users

### Option 1: Clerk Webhook (Recommended for Production)

1. **Create a Webhook in Clerk:**
   - Go to Clerk Dashboard → **Developers** → **Webhooks**
   - Create a new webhook endpoint
   - Select event: `user.created`
   - Point to your backend API: `https://your-api.com/api/webhooks/clerk`

2. **Backend Webhook Handler:**
   ```typescript
   // In your backend API
   import { Webhook } from 'svix'
   import { clerkClient } from '@clerk/clerk-sdk-node'

   export async function handleClerkWebhook(req, res) {
     const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET)
     
     const payload = webhook.verify(req.body, req.headers)
     
     if (payload.type === 'user.created') {
       const userId = payload.data.id
       
       // Assign free plan to new user
       await clerkClient.users.updateUserMetadata(userId, {
         publicMetadata: {
           subscriptionPlan: 'free'
         }
       })
     }
   }
   ```

### Option 2: Manual Assignment (Development)

For development, you can manually assign the free plan:

1. **Via Clerk Dashboard:**
   - Go to **Users** in Clerk dashboard
   - Select a user
   - Go to **Metadata** tab
   - Add to **Public metadata:**
     ```json
     {
       "subscriptionPlan": "free"
     }
     ```

2. **Via Backend API (if you have one):**
   ```typescript
   import { clerkClient } from '@clerk/clerk-sdk-node'
   
   await clerkClient.users.updateUserMetadata(userId, {
     publicMetadata: {
       subscriptionPlan: 'free'
     }
   })
   ```

### Option 3: Client-Side Assignment (Not Recommended)

You can assign the plan client-side after sign-up, but this requires the user to have permission to update their own metadata, which is not recommended for security reasons.

## Checking Subscription Status

The portal uses React hooks to check subscription status:

```typescript
import { useSubscription, useFeatureAccess } from '@/lib/subscriptions/hooks'

function MyComponent() {
  const plan = useSubscription() // Returns 'free', 'basic', etc.
  const hasTaxGPT = useFeatureAccess('taxgpt') // Returns true/false
  
  if (!hasTaxGPT) {
    return <UpgradePrompt />
  }
  
  return <TaxGPTComponent />
}
```

## Updating Subscription Plans

### For Development (Free Plan)

All new users should automatically get the free plan. If a user doesn't have a plan set, the system defaults to 'free'.

### For Production (Paid Plans)

When implementing paid plans:

1. **Set up payment processing** (Stripe, etc.)
2. **Create backend API** to handle subscription changes
3. **Update Clerk metadata** when subscription changes:
   ```typescript
   await clerkClient.users.updateUserMetadata(userId, {
     publicMetadata: {
       subscriptionPlan: 'basic' // or 'professional', 'enterprise'
     }
   })
   ```

## Portal Pages Using Subscriptions

- **Dashboard** (`/portal/dashboard`) - Always accessible
- **TaxGPT** (`/portal/taxgpt`) - Free plan has access
- **File Repository** (`/portal/files`) - Requires paid plan
- **Working Papers** (`/portal/working-papers`) - Requires paid plan
- **Integrations** (`/portal/integrations`) - Requires paid plan
- **Subscription** (`/portal/subscription`) - View and manage subscription

## Testing

1. **Create a test user** in Clerk
2. **Manually set subscription plan** in Clerk dashboard metadata
3. **Test feature access** in the portal
4. **Verify** that restricted features show upgrade prompts

## Future: Paid Subscription Integration

When ready to implement paid plans:

1. Set up Stripe (or your payment provider)
2. Create subscription management API endpoints
3. Set up webhooks from payment provider to update Clerk metadata
4. Update subscription page to show payment options
5. Add billing management features

## Security Notes

- **Never trust client-side subscription checks alone**
- **Always verify subscription status on the backend** for API calls
- **Use Clerk's Backend API** to update metadata (not client-side)
- **Validate subscription status** before granting access to premium features
