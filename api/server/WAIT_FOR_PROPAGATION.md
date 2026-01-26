# Waiting for Security Defaults Changes to Propagate

When you disable Security Defaults in Azure AD, changes can take **15-30 minutes** to fully propagate across all Microsoft services.

## What to Check

1. **Verify Security Defaults is Actually Disabled:**
   - Go to: https://portal.azure.com
   - Azure Active Directory → Properties
   - Check "Security defaults" status
   - Should show "Disabled" or "No"

2. **Check for Conditional Access Policies:**
   - Azure AD → Security → Conditional Access
   - Look for any policies that might be blocking SMTP
   - You may need to create an exception or disable conflicting policies

3. **Wait and Retry:**
   - Wait 15-30 minutes after disabling
   - Try the test email again

## Alternative: Check Conditional Access

Even with Security Defaults disabled, Conditional Access policies might still block SMTP:

1. **Go to Conditional Access:**
   - Azure Portal → Azure Active Directory → Security → Conditional Access

2. **Check Existing Policies:**
   - Look for policies that require MFA or block legacy authentication
   - These might still be blocking SMTP

3. **Create Exception Policy:**
   - Create a policy that allows SMTP for your account
   - Or exclude SMTP from existing blocking policies

## Quick Test

After waiting 15-30 minutes, test again:
```bash
cd api/server
npm run test-email
```
