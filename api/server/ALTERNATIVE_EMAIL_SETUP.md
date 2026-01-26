# Alternative Email Setup Options

If App Passwords are not available due to organizational MFA policies, here are alternative solutions:

## Option 1: Service Account (Recommended)

Create a dedicated Office 365 account for the API that doesn't have MFA enabled:

### Setup Steps:
1. **Create a new Office 365 account:**
   - Name: `api@rpcassociates.co` or `noreply@rpcassociates.co`
   - No MFA required (or MFA disabled for this account)
   - Grant access to `contacts@rpcassociates.co` shared mailbox

2. **Update `.env`:**
   ```env
   SMTP_USER=api@rpcassociates.co
   SMTP_PASSWORD=service-account-password
   SHARED_MAILBOX_ADDRESS=contacts@rpcassociates.co
   ```

3. **Benefits:**
   - No MFA/App Password issues
   - Dedicated account for automation
   - More secure (separate from personal account)

## Option 2: SendGrid (Easy Alternative)

Use SendGrid for transactional emails - no MFA required:

### Setup Steps:
1. **Sign up:** https://sendgrid.com (free tier: 100 emails/day)

2. **Create API Key:**
   - Dashboard → Settings → API Keys
   - Create key with "Mail Send" permissions
   - Copy the API key

3. **Update `.env`:**
   ```env
   # Remove SMTP settings, add:
   SENDGRID_API_KEY=your-sendgrid-api-key
   ```

4. **Update email utility:**
   The code already supports SendGrid - just set the API key!

5. **Benefits:**
   - No MFA issues
   - Reliable delivery
   - Free tier available
   - Better for production

## Option 3: OAuth2 Authentication (Advanced)

Use OAuth2 instead of password authentication:

### Requirements:
- Azure AD app registration
- IT administrator assistance
- More complex setup

### This requires:
1. Register app in Azure AD
2. Configure API permissions
3. Get client ID and secret
4. Implement OAuth2 flow

**Note:** This is complex and typically requires IT admin help.

## Option 4: Contact IT Administrator

Ask your IT admin to:
1. **Create App Password:**
   - They can create one for you in the admin portal
   - Or temporarily disable MFA for your account (not recommended)

2. **Create Service Account:**
   - Dedicated account for API use
   - No MFA required
   - Access to shared mailbox

3. **Configure OAuth2:**
   - Set up Azure AD app registration
   - Configure proper permissions

## Recommendation

**For Quick Setup:** Use SendGrid (Option 2)
- Fastest to implement
- No IT involvement needed
- Free tier available
- Production-ready

**For Long-term:** Use Service Account (Option 1)
- Best security practice
- No third-party dependency
- Full control
- Requires IT setup

## Testing SendGrid

If you choose SendGrid:

1. **Sign up and get API key**
2. **Update `.env`:**
   ```env
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   # Remove or comment out SMTP settings
   ```
3. **Test:**
   ```bash
   npm run test-email
   ```

The email utility already supports SendGrid - it will automatically use it if `SENDGRID_API_KEY` is set!
