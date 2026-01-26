# Email Troubleshooting Guide

## Authentication Failed (Error 535)

If you see: `535 5.7.139 Authentication unsuccessful, the user credentials were incorrect`

### Most Common Cause: MFA Requires App Password

Office 365 accounts with Multi-Factor Authentication (MFA) enabled **cannot** use regular passwords for SMTP authentication. You must use an **App Password**.

### Solution: Create an App Password

1. **Sign in to Microsoft Account Security:**
   - Go to: https://account.microsoft.com/security
   - Or: https://mysignins.microsoft.com/security-info

2. **Create App Password:**
   - Look for "App passwords" section
   - Click "Create app password" or "Add app password"
   - Name it: "RPC Associates API"
   - Copy the generated password (format: `xxxx-xxxx-xxxx-xxxx`)

3. **Update `.env` file:**
   ```env
   SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx  # Use the app password here
   ```

4. **Test again:**
   ```bash
   npm run test-email
   ```

### Other Possible Issues

#### Issue: "Less secure app access" blocked
- Office 365 doesn't use "less secure apps" - this is a Gmail feature
- If you see this error, it's likely an MFA/App Password issue

#### Issue: Account doesn't have SMTP enabled
- Contact your IT administrator
- Verify SMTP AUTH is enabled for your account
- Some organizations disable SMTP for security

#### Issue: Wrong SMTP host
- Try alternative hosts:
  - `smtp-mail.outlook.com` (instead of `smtp.office365.com`)
  - Your organization's specific Exchange server

#### Issue: Firewall/Network blocking
- Ensure port 587 (TLS) is not blocked
- Try from a different network to rule out firewall issues

### Testing Steps

1. **Verify credentials work in Outlook:**
   - Can you send emails from Outlook with `roger.reid@rpcassociates.co`?
   - If yes, the issue is likely MFA/App Password related

2. **Check MFA status:**
   - Go to: https://account.microsoft.com/security
   - See if "Two-step verification" is enabled
   - If yes, you MUST use an App Password

3. **Test with App Password:**
   ```bash
   cd api/server
   npm run test-email
   ```

### App Passwords Not Available?

If you don't see the "App passwords" option, your organization likely manages MFA settings. Here are your options:

#### Option 1: Contact IT Administrator (Recommended)
Ask your IT admin to:
- Create an App Password for `roger.reid@rpcassociates.co` for the API
- Or create a dedicated service account for API use (without MFA)
- Or configure OAuth2 authentication (more complex)

#### Option 2: Use a Service Account
Create a dedicated Office 365 account specifically for the API:
- No MFA required (or MFA disabled for this account)
- Used only for sending automated emails
- More secure than using your personal account

#### Option 3: Use SendGrid or Similar Service
If IT can't help, use a transactional email service:
- SendGrid (free tier: 100 emails/day)
- Mailgun
- AWS SES
- These services don't require MFA/App Passwords

#### Option 4: Check Conditional Access Policies
Your organization might have policies that:
- Block SMTP from certain locations
- Require specific authentication methods
- IT admin can check: Azure AD → Conditional Access

### Still Having Issues?

1. **Contact IT Administrator:**
   - Verify SMTP AUTH is enabled for your account
   - Check if there are any security policies blocking SMTP
   - Request App Password or service account setup

2. **Try Alternative Authentication:**
   - OAuth2 (more complex, requires app registration in Azure AD)
   - Service account (dedicated account for API use)

3. **Check Exchange Online Settings:**
   - Admin center → Users → Mail settings
   - Ensure SMTP is enabled for your account
