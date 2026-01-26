# Fixing "Security Defaults Policy" Error

The error message: **"user is locked by your organization's security defaults policy"**

This means Microsoft Security Defaults is blocking SMTP authentication. Here's how to fix it:

## Option 1: Disable Security Defaults (Not Recommended)

**Warning:** This reduces security for your entire organization.

1. **Go to Azure Portal:**
   - https://portal.azure.com

2. **Navigate to Azure Active Directory:**
   - Search for "Azure Active Directory" or "Microsoft Entra ID"
   - Click on it

3. **Go to Properties:**
   - Left sidebar → **Properties**

4. **Manage Security Defaults:**
   - Scroll down to **"Manage Security defaults"**
   - Click **"Yes"** to enable (or check current status)
   - Click **"No"** to disable Security Defaults
   - **Note:** You'll need to set up Conditional Access policies instead

## Option 2: Create Conditional Access Exception (Recommended)

Instead of disabling Security Defaults, create an exception:

1. **Go to Azure Portal:**
   - https://portal.azure.com

2. **Azure Active Directory → Security:**
   - Left sidebar → **Security** → **Conditional Access**

3. **Create New Policy:**
   - Click **"New policy"**
   - Name: "Allow SMTP for API Service Account"

4. **Configure Policy:**
   - **Users:** Select your account or create a service account
   - **Cloud apps:** Select "Office 365 Exchange Online"
   - **Conditions:** 
     - Client apps: Select "Exchange ActiveSync clients" and "Other clients"
   - **Access controls:**
     - Grant: Select "Grant access"
     - Uncheck "Require multi-factor authentication"
   - **Enable policy:** Yes
   - Save

## Option 3: Use Service Account (Best Practice)

Create a dedicated account for API use:

1. **Create new user:**
   - Users → Add user
   - Name: `api@rpcassociates.co`
   - No MFA required
   - Assign license (or use unlicensed if possible)

2. **Exclude from Security Defaults:**
   - Or create Conditional Access policy for this account only

## Option 4: Use SendGrid (Easiest - No Policy Issues)

Since you're hitting policy restrictions, SendGrid might be the easiest solution:

1. **Sign up:** https://sendgrid.com (free tier: 100 emails/day)
2. **Get API key**
3. **Update `.env`:**
   ```env
   SENDGRID_API_KEY=your-api-key
   # Comment out SMTP settings
   ```

No Security Defaults issues, no MFA, no policy conflicts!

## Quick Check: Security Defaults Status

To check if Security Defaults is enabled:

1. **Azure Portal → Azure AD → Properties**
2. **Look for "Security defaults"**
3. **Status will show "Enabled" or "Disabled"**

## Recommendation

**For immediate solution:** Use SendGrid (Option 4)
- No policy conflicts
- Works immediately
- Free tier available
- Production-ready

**For long-term:** Create service account with Conditional Access exception (Option 3 + Option 2)
