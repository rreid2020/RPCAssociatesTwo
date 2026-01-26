# Resend Domain Verification Guide

Resend requires domain verification to send emails from your custom domain (`rpcassociates.co`).

## Steps to Verify Domain

1. **Go to Resend Domains:**
   - https://resend.com/domains
   - Or: Dashboard → Domains

2. **Add Domain:**
   - Click "Add Domain"
   - Enter: `rpcassociates.co`
   - Click "Add"

3. **Add DNS Records:**
   Resend will provide DNS records to add. You'll need to add these to your domain's DNS settings:

   **Required Records:**
   - **SPF Record** (TXT)
   - **DKIM Records** (TXT - usually 3 records)
   - **DMARC Record** (TXT - optional but recommended)

4. **Add Records to Your DNS:**
   - Go to your domain registrar (where you manage rpcassociates.co DNS)
   - Add the TXT records provided by Resend
   - Wait for DNS propagation (usually 5-30 minutes)

5. **Verify in Resend:**
   - Go back to Resend dashboard
   - Click "Verify" on your domain
   - Resend will check the DNS records

6. **Update `.env` After Verification:**
   ```env
   EMAIL_FROM="RPC Associates <contacts@rpcassociates.co>"
   NOTIFICATION_EMAIL=contacts@rpcassociates.co
   ```

## Current Status

✅ **Resend is working!** Test email sent successfully to `roger.reid@rpcassociates.co`

⚠️ **Domain verification needed** to send to `contacts@rpcassociates.co` and other addresses

## Temporary Workaround

Until domain is verified, emails will be sent to `roger.reid@rpcassociates.co` (which forwards to your Exchange shared mailbox).

## After Verification

Once domain is verified, update `.env`:
```env
EMAIL_FROM="RPC Associates <contacts@rpcassociates.co>"
NOTIFICATION_EMAIL=contacts@rpcassociates.co
```

Then test again - it should work!
