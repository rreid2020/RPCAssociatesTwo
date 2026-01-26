# Resend Setup Guide

## Steps to Set Up Resend

1. **Create API Key:**
   - In the "Add API Key" dialog:
   - **Name:** "RPC Associates API" (or any name you prefer)
   - **Permission:** "Full access" (or "Sending access" if available)
   - **Domain:** "All Domains" (or select your specific domain if you've verified one)
   - Click "Add"

2. **Copy the API Key:**
   - After creating, Resend will show you the API key
   - **Important:** Copy it immediately - you won't be able to see it again!
   - Format: `re_xxxxxxxxxxxxx`

3. **Update `.env` file:**
   ```env
   # Comment out or remove SMTP settings
   # SMTP_HOST=smtp.office365.com
   # SMTP_PORT=587
   # SMTP_SECURE=false
   # SMTP_USER=roger.reid@rpcassociates.co
   # SMTP_PASSWORD="Axxion#2015"
   
   # Add Resend API key
   RESEND_API_KEY=re_your_api_key_here
   ```

4. **Verify Domain (Optional but Recommended):**
   - Go to Resend dashboard → Domains
   - Add and verify `rpcassociates.co`
   - This improves deliverability
   - Without verification, emails will be sent from `onboarding@resend.dev`

5. **Test:**
   ```bash
   cd api/server
   npm run test-email
   ```

## Notes

- **Free tier:** 3,000 emails/month (100/day)
- **No credit card required**
- **Good deliverability**
- Works immediately after adding API key
