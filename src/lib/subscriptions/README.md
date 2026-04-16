# Subscription System

This subscription system uses Clerk's `publicMetadata` to store subscription plan information.

## Quick Setup for Development

### Assign Free Plan to Users

**Option 1: Via Clerk Dashboard (Easiest for Development)**

1. Go to Clerk Dashboard → **Users**
2. Select a user
3. Click **Metadata** tab
4. In **Public metadata**, add:
   ```json
   {
     "subscriptionPlan": "free"
   }
   ```
5. Click **Save**

**Option 2: Default Behavior**

If a user doesn't have a `subscriptionPlan` set in their metadata, the system automatically defaults to `'free'`. So new users will have free access by default.

## Using Subscription Hooks

```typescript
import { useSubscription, useFeatureAccess, useSubscriptionPlan } from '@/lib/subscriptions/hooks'

function MyComponent() {
  // Get current plan ('free', 'basic', etc.)
  const plan = useSubscription()
  
  // Check if user has access to a specific feature
  const hasFileRepo = useFeatureAccess('fileRepository')
  
  // Get full plan configuration
  const planConfig = useSubscriptionPlan()
  
  if (!hasFileRepo) {
    return <UpgradePrompt feature="File Repository" />
  }
  
  return <FileRepositoryComponent />
}
```

## Available Plans

- **free**: Dashboard + TaxGPT (always free)
- **basic**: $29.99/month - Adds TaxGPT Premium + File Repository
- **professional**: $99.99/month - All features
- **enterprise**: Custom pricing - All features

## Future: Automatic Assignment

When ready for production, set up a Clerk webhook to automatically assign the free plan to new users. See `docs/clerk-subscription-setup.md` for details.
