# Checking Conditional Access Policies

Even with Security Defaults disabled, Conditional Access policies might still be blocking SMTP authentication.

## Steps to Check and Fix

### 1. Go to Conditional Access

1. **Azure Portal:** https://portal.azure.com
2. **Azure Active Directory** → **Security** → **Conditional Access**
3. Review all policies

### 2. Look for Policies Blocking SMTP

Check for policies that:
- **Block legacy authentication** (SMTP is considered legacy)
- **Require MFA for all apps**
- **Block "Other clients"** (SMTP falls under this category)
- **Block Exchange ActiveSync** (sometimes affects SMTP)

### 3. Create Exception Policy

Create a new policy to allow SMTP:

1. **Click "New policy"**
2. **Name:** "Allow SMTP for API"
3. **Users:** Select `roger.reid@rpcassociates.co` (or create a group)
4. **Cloud apps:** Select "Office 365 Exchange Online"
5. **Conditions:**
   - **Client apps:** Select "Exchange ActiveSync clients" and "Other clients"
6. **Access controls:**
   - **Grant:** Select "Grant access"
   - **Uncheck** "Require multi-factor authentication"
7. **Enable policy:** Yes
8. **Save**

### 4. Alternative: Modify Existing Policies

If you have existing blocking policies:

1. Find policies that block "Other clients" or legacy auth
2. **Exclude** your account (`roger.reid@rpcassociates.co`) from those policies
3. Or add an exception for "Office 365 Exchange Online"

### 5. Check Authentication Methods

Also check:
1. **Azure AD** → **Users** → Select your account
2. **Authentication methods**
3. Ensure no restrictions are blocking SMTP

## Quick Test

After making changes, wait 5-10 minutes, then test:
```bash
cd api/server
npm run test-email
```

## Note on SendGrid

SendGrid has a **free tier** (100 emails/day) - no cost for your use case. But if you prefer to use Exchange, fixing Conditional Access is the way to go.
